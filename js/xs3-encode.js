// prose -> XS3 runtime. Two tiers:
//   1. E0 readback (xs3-decode.js) — exact & instant on controlled-language prose (round-trip gated).
//   2. flan-t5-base via transformers.js + grammar-constrained decode — draft for free prose.
// The model is loaded on demand (~260MB). Set MODEL_ID after uploading the ONNX export to a host.
(function () {
  'use strict';
  const D = window.XS3Decode || (typeof XS3Decode !== 'undefined' && XS3Decode);

  // ---- config ----
  const MODEL_ID = 'mrbrao/xs3-flan-base-onnx'; // HF Hub repo holding the ONNX int8 export
  const TFJS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';
  const ALLOWED_URL = 'js/xs3-allowed.json';           // {allowed:[ids], struct:{id:"text"}, eos, pad}
  const PREFIX = 'to xs3: ';
  const MAX_NEW = 160, BEAMS = 4, EOS_BOOST = 10, MIN_NEW = 6;

  // ---- dom ----
  const $ = id => document.getElementById(id);
  const inEl = $('in'), outEl = $('out'), tierEl = $('tier'), statusEl = $('status');
  const runBtn = $('run'), copyBtn = $('copy'), loadBtn = $('load');
  const bar = $('bar'), barfill = $('barfill'), mstate = $('mstate'), inmeta = $('inmeta');

  const EXAMPLES = [
    '[m1] Bob tells dev-3: “dev-3 walk bob”. Lead-1 must NOT love ops-4.',
    'Rule: whenever “some x is a bug; budget ‘auth.ts’” then “ta-5 find some x”.',
    'Qc-7 guard dev-1 (strength 70%). Planner risk holmes, keyboard.',
    'Bob told dev-3 that dev-3 should walk bob.', // free prose -> neural tier
  ];

  // ---- tier 1: exact readback ----
  const norm = s => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').trim().toLowerCase();

  function encodeExact(prose) {
    // readback (E0) splits statements on '\n'; user prose uses '. ' — pre-split to one stmt/line.
    const lines = prose.trim().split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return null;
    let xs3;
    try { xs3 = D.readback(lines.join('\n')); } catch (e) { return null; }
    if (!xs3 || !xs3.trim()) return null;
    // free prose leaks as hyphen-blobs (readback joins unknown words with '-'); real ids have ≤1 hyphen
    if (/[a-z0-9]+(?:-[a-z0-9]+){3,}/i.test(xs3.replace(/"[^"]*"/g, ''))) return null;
    let back;
    try { back = D.decode(xs3); } catch (e) { return null; }
    // exact iff render(readback(prose)) reproduces the prose, per statement, order-insensitive
    const want = lines.map(norm).sort();
    const got = back.text.split('\n').map(norm).filter(Boolean).sort();
    if (want.length === got.length && want.every((w, i) => w === got[i])) {
      return { xs3: xs3.replace(/\n/g, ' ').trim(), edges: back.edges.length };
    }
    return null;
  }

  // ---- tier 2: neural (transformers.js), loaded lazily ----
  const M = { ready: false, loading: false, tok: null, model: null, allowed: null, tf: null };

  async function loadModel() {
    if (M.ready || M.loading) return;
    M.loading = true; loadBtn.disabled = true; bar.style.display = 'block';
    mstate.textContent = 'downloading transformers.js…';
    try {
      M.tf = await import(TFJS_CDN + '/dist/transformers.min.js');
      M.tf.env.allowLocalModels = false;
      M.allowed = await (await fetch(ALLOWED_URL)).json();
      mstate.textContent = 'downloading model (~260 MB)…';
      const opts = {
        quantized: true,
        progress_callback: p => {
          if (p.status === 'progress' && p.total) {
            const pct = Math.round(100 * p.loaded / p.total);
            barfill.style.width = pct + '%';
            mstate.textContent = `downloading ${p.file ? p.file.split('/').pop() : ''} ${pct}%`;
          }
        },
      };
      M.tok = await M.tf.AutoTokenizer.from_pretrained(MODEL_ID, opts);
      M.model = await M.tf.AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID, opts);
      M.ready = true;
      mstate.textContent = 'ready';
      barfill.style.width = '100%';
      statusEl.textContent = 'Neural tier ready.';
    } catch (e) {
      mstate.textContent = 'load failed — see console';
      console.error('[xs3] model load failed:', e);
      loadBtn.disabled = false;
    } finally {
      M.loading = false;
    }
  }

  // grammar-constrained logits processor: allowed-set mask + brace PDA + EOS nudge at balanced top-level '.'
  function makeConstrainer(tf, allowed) {
    const A = new Set(allowed.allowed);
    const EOS = allowed.eos, PAD = allowed.pad;
    const STRUCT = allowed.struct;                 // {id: "decoded text"} for tokens with { } [ ] < > "
    const OPEN = new Set(['{', '[', '<']), CLOSE = { '}': '{', ']': '[', '>': '<' };
    function walk(text, stack, instr) {            // returns [ok, stack, instr]
      stack = stack.slice();
      for (const c of text) {
        if (c === '"') instr = !instr;
        else if (!instr && OPEN.has(c)) stack.push(c);
        else if (!instr && CLOSE[c]) { if (!stack.length || stack[stack.length - 1] !== CLOSE[c]) return [false, stack, instr]; stack.pop(); }
      }
      return [true, stack, instr];
    }
    function state(ids) {
      let stack = [], instr = false, last = '';
      for (const id of ids) {
        const t = STRUCT[id]; if (t === undefined) continue; // non-structural: no delimiters, skip
        for (const c of t) {
          if (c === '"') instr = !instr;
          else if (!instr && OPEN.has(c)) stack.push(c);
          else if (!instr && CLOSE[c]) { if (stack.length && stack[stack.length - 1] === CLOSE[c]) stack.pop(); }
          if (!/\s/.test(c)) last = c;
        }
      }
      return [stack, instr, stack.length === 0 && !instr && last === '.'];
    }
    class XS3Constrainer extends tf.LogitsProcessor {
      _call(inputIds, logits) {
        const rows = Array.isArray(inputIds[0]) || inputIds.dims ? inputIds : [inputIds];
        const seqs = inputIds.tolist ? inputIds.tolist() : rows;
        for (let b = 0; b < seqs.length; b++) {
          const gen = seqs[b].slice(1);            // skip decoder_start (pad)
          const data = logits.data ? logits : logits[b];
          const L = logits.dims ? logits.dims[logits.dims.length - 1] : logits[b].length;
          const arr = logits.data || logits[b];
          const off = logits.dims ? b * L : 0;
          for (let i = 0; i < L; i++) if (!A.has(i)) arr[off + i] = -Infinity;   // allowed-set mask
          const [stack, instr, topDot] = state(gen);
          for (const id in STRUCT) { const [ok] = walk(STRUCT[id], stack, instr); if (!ok) arr[off + (+id)] = -Infinity; }
          if (stack.length || instr) arr[off + EOS] = -Infinity;                 // no EOS mid-structure
          else if (topDot) arr[off + EOS] += EOS_BOOST;                          // nudge stop when complete
        }
        return logits;
      }
    }
    return new XS3Constrainer();
  }

  async function encodeNeural(prose) {
    const inputs = M.tok(PREFIX + prose);
    const proc = new M.tf.LogitsProcessorList();
    proc.push(makeConstrainer(M.tf, M.allowed));
    const out = await M.model.generate({
      ...inputs, max_new_tokens: MAX_NEW, min_new_tokens: MIN_NEW,
      num_beams: BEAMS, no_repeat_ngram_size: 4, do_sample: false, logits_processor: proc,
    });
    const text = M.tok.batch_decode(out, { skip_special_tokens: true })[0];
    let edges = 0, ok = true;
    try { edges = D.decode(text, { strict: true }).edges.length; } catch (e) { ok = false; }
    return { xs3: respace(text), edges, ok };
  }

  // T5 detokenizer drops spaces around added glyphs; re-space mechanically (matches evalgraph.js)
  function respace(s) {
    let out = '', inStr = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i]; if (c === '"') inStr = !inStr; out += c;
      if (!inStr && c === '.' && s[i + 1] && '{[<#?"'.includes(s[i + 1])) out += ' ';
    }
    return out.replace(/([\p{L}\d])(?=[\u{1F6AB}\u{1F6A8}\u{1F512}\u{1F4D0}]|⚠)/gu, '$1 ')
      .replace(/((?:[\u{1F6AB}\u{1F6A8}\u{1F512}\u{1F4D0}]|⚠️?))(?=[\p{L}\d])/gu, '$1 ');
  }

  // ---- ui ----
  function setTier(kind, label) { tierEl.className = 'badge ' + kind; tierEl.textContent = label; }
  function show(xs3) { outEl.className = 'out'; outEl.textContent = xs3; copyBtn.disabled = false; copyBtn.dataset.xs3 = xs3; }

  async function run() {
    const prose = inEl.value.trim();
    if (!prose) { outEl.className = 'out empty'; outEl.textContent = '…'; setTier('off', 'idle'); return; }
    statusEl.textContent = ''; copyBtn.disabled = true;
    const exact = encodeExact(prose);
    if (exact) { show(exact.xs3); setTier('exact', `exact · ${exact.edges} edges`); return; }
    // not controlled-language -> neural tier
    if (!M.ready) {
      setTier('draft', 'needs model');
      outEl.className = 'out empty';
      outEl.textContent = "E₀ can't invert this exactly — it isn't controlled-language prose.\nLoad the neural model below to draft it.";
      return;
    }
    setTier('draft', 'drafting…'); outEl.className = 'out empty'; outEl.textContent = 'running neural model…';
    try {
      const r = await encodeNeural(prose);
      show(r.xs3);
      setTier(r.ok ? 'draft' : 'fail', r.ok ? `neural draft · ${r.edges} edges` : 'neural · unparsed');
    } catch (e) { setTier('fail', 'error'); outEl.textContent = String(e); console.error(e); }
  }

  // wire
  runBtn.addEventListener('click', run);
  inEl.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); });
  inEl.addEventListener('input', () => { inmeta.textContent = inEl.value.trim() ? inEl.value.trim().length + ' chars' : ''; });
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(copyBtn.dataset.xs3 || '').then(() => { copyBtn.textContent = 'Copied ✓'; setTimeout(() => copyBtn.textContent = 'Copy XS3', 1200); });
  });
  loadBtn.addEventListener('click', loadModel);
  const chips = $('chips');
  EXAMPLES.forEach(ex => { const c = document.createElement('span'); c.className = 'chip'; c.textContent = ex.length > 46 ? ex.slice(0, 44) + '…' : ex; c.title = ex; c.onclick = () => { inEl.value = ex; inEl.dispatchEvent(new Event('input')); run(); }; chips.appendChild(c); });
})();
