// XS3 -> human words. Deterministic render: lex O(n) -> parse LL(1) -> desugar -> template fold.
// No LLM anywhere — same document always decodes to the same words.
// Tolerant where real-world XS3 is loose: bare mentions, uncomma'd object phrases, n-term [ ].

const XS3Decode = (function () {
  const GLYPHS = new Set([';', ',', '{', '}', '[', ']', '<', '>', '"', '#', '?', '^', '@', '~', '%', '!']);

  function lex(src) {
    const toks = [];
    let i = 0;
    const n = src.length;
    const peek = (k = 1) => src[i + k];
    const isWs = c => c === undefined || /\s/.test(c);
    while (i < n) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && peek() === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '"') {
        i++; let s = '';
        while (i < n && src[i] !== '"') s += src[i++];
        i++; toks.push({ t: 'str', v: s }); continue;
      }
      if (c === '=' && peek() === '>') { toks.push({ t: 'atom', v: '=>' }); i += 2; continue; }
      if (c === '.') {
        // '.' only ends a statement when followed by whitespace/EOF/}
        if (isWs(peek()) || peek() === '}') { toks.push({ t: 'end' }); i++; continue; }
      }
      if (GLYPHS.has(c)) { toks.push({ t: c }); i++; continue; }
      let s = '';
      while (i < n) {
        const ch = src[i];
        if (isWs(ch) || GLYPHS.has(ch)) break;
        if (ch === '/' && peek() === '/') break;
        if (ch === '.') {
          if (peek() === '.') { s += '..'; i += 2; continue; } // interval: 2026-01..
          if (isWs(peek()) || peek() === '}') break;           // end of statement
        }
        s += ch; i++;
      }
      toks.push({ t: 'atom', v: s });
    }
    return toks;
  }

  // ---- parse ----
  function parse(toks, strict) {
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];
    const expect = t => {
      const k = next();
      if (!k || k.t !== t) throw new Error(`expected '${t}', got '${k ? (k.v || k.t) : 'end of input'}'`);
      return k;
    };
    const atDelim = () => {
      const k = peek();
      return !k || ['end', ';', ',', '}', ']', '>', '@', '~', '%', '!'].includes(k.t);
    };

    function parseTerm() {
      const k = next();
      if (!k) throw new Error('unexpected end of input');
      switch (k.t) {
        case 'atom': return { t: 'name', v: k.v };
        case 'str': return { t: 'str', v: k.v };
        case '#': { const a = expect('atom'); return { t: 'anchor', v: a.v, local: a.v.startsWith('_') }; }
        case '?': { const a = expect('atom'); return { t: 'var', v: a.v }; }
        case '{': {
          const stmts = [];
          while (peek() && peek().t !== '}') stmts.push(parseStmt(true));
          expect('}');
          return { t: 'graph', stmts };
        }
        case '[': {
          const items = [];
          while (peek() && peek().t !== ']') items.push(parseTerm());
          expect(']');
          if (strict && items.length !== 3) throw new Error(`[ ] must hold exactly s p o, got ${items.length} terms`);
          if (items.length < 2) throw new Error('[ ] needs at least s p');
          const o = items.length === 2 ? { t: 'name', v: '', implicit: true }
            : items.length === 3 ? items[2]
              : { t: 'phrase', items: items.slice(2) };
          return { t: 'edge', s: items[0], p: items[1], o };
        }
        case '<': {
          const items = [];
          while (peek() && peek().t !== '>') items.push(parseTerm());
          expect('>');
          return { t: 'seq', items };
        }
        default: throw new Error(`unexpected '${k.v || k.t}'`);
      }
    }

    function parseQuals() {
      const quals = [];
      for (;;) {
        const k = peek();
        if (!k) break;
        if (k.t === '@') { next(); quals.push({ k: 'at', v: parseTerm() }); }
        else if (k.t === '~') {
          next(); const e = parseTerm();
          let deg = null;
          if (peek() && peek().t === '%') { next(); deg = expect('atom').v; }
          quals.push({ k: 'aff', v: e, deg });
        }
        else if (k.t === '%') { next(); quals.push({ k: 'deg', v: expect('atom').v }); }
        else if (k.t === '!') { next(); quals.push({ k: 'mark', v: parseTerm() }); }
        else break;
      }
      return quals;
    }

    function parseObj() {
      const items = [parseTerm()];
      if (strict) return { term: items[0], quals: parseQuals() };
      // tolerant: consecutive terms without commas fold into one phrase
      while (!atDelim()) items.push(parseTerm());
      const term = items.length === 1 ? items[0] : { t: 'phrase', items };
      return { term, quals: parseQuals() };
    }

    function parseStmt(inGraph) {
      const subj = parseTerm();
      const subjQuals = strict ? [] : parseQuals(); // tolerant: quals right after a bare subject
      const coMentions = [];
      while (!strict && peek() && peek().t === ',') { // tolerant: "{act, ~x}" — bare mention list
        next();
        if (!atDelim()) coMentions.push(parseTerm());
        subjQuals.push(...parseQuals());
      }
      const chains = [];
      while (peek() && !['end', '}'].includes(peek().t)) {
        if (peek().t === ';') { next(); continue; }
        let rev = false;
        if (peek().t === '^') { next(); rev = true; }
        const pk = next();
        if (!pk || (pk.t !== 'atom' && pk.t !== 'str')) throw new Error(`expected a predicate, got '${pk ? (pk.v || pk.t) : 'end of input'}'`);
        const objs = [];
        if (!atDelim()) {
          do { objs.push(parseObj()); } while (peek() && peek().t === ',' && next());
        } else if (!strict) {
          objs.push({ term: { t: 'name', v: '', implicit: true }, quals: parseQuals() }); // bare "s p."
        } else {
          throw new Error(`predicate '${pk.v}' has no object`);
        }
        const groupQuals = objs.flatMap(o => o.quals); // qualifier distributes over the , group
        chains.push({ pred: pk.v, rev, objs: objs.map(o => o.term), quals: groupQuals });
        if (peek() && peek().t === ';') { next(); continue; }
        break;
      }
      if (chains.length === 0) {
        if (strict) throw new Error(`statement about '${peekTermName(subj)}' has no predicate`);
        chains.push({ pred: null, rev: false, objs: coMentions, quals: subjQuals }); // bare mention
      }
      if (peek() && peek().t === 'end') next();
      else if (!(inGraph && peek() && peek().t === '}') && peek()) throw new Error(`expected '.', got '${peek().v || peek().t}'`);
      return { subj, chains };
    }

    const doc = [];
    while (p < toks.length) doc.push(parseStmt(false));
    return doc;
  }

  function peekTermName(t) { return t.v || t.t; }

  // ---- desugar -> 3-column table ----
  function termKey(t) {
    switch (t.t) {
      case 'name': return t.implicit ? '—' : t.v;
      case 'str': return `"${t.v}"`;
      case 'anchor': return '#' + t.v;
      case 'var': return '?' + t.v;
      case 'phrase': return t.items.map(termKey).join(' ');
      case 'seq': return '<' + t.items.map(termKey).join(' ') + '>';
      case 'graph': return '{' + t.stmts.map(stmtKey).join(' ') + '}';
      case 'edge': return `[${termKey(t.s)} ${termKey(t.p)} ${termKey(t.o)}]`;
    }
  }
  function stmtKey(st) {
    return st.chains.map(c =>
      `${termKey(st.subj)}${c.pred ? ` ${c.rev ? '^' : ''}${c.pred}` : ''}${c.objs.length ? ' ' + c.objs.map(termKey).join(', ') : ''}`
    ).join('; ') + '.';
  }

  function desugar(doc) {
    const edges = [];
    let blank = 0;
    const emit = (s, p, o) => edges.push({ s, p, o });
    for (const st of doc) {
      for (const ch of st.chains) {
        const objs = ch.objs.length ? ch.objs : [{ t: 'name', v: '', implicit: true }];
        for (const objTerm of objs) {
          let s = st.subj, o = objTerm;
          if (ch.rev) { const tmp = s; s = o; o = tmp; } // ^p flips the edge
          const pred = ch.pred || '—';
          emit(s, pred, o);
          const ref = { t: 'edge', s, p: { t: 'name', v: pred }, o };
          for (const q of ch.quals) {
            if (q.k === 'at') emit(ref, 'at', q.v);
            else if (q.k === 'deg') emit(ref, 'deg', { t: 'name', v: q.v });
            else if (q.k === 'mark') emit(ref, 'mark', q.v);
            else if (q.k === 'aff') {
              if (q.deg != null) {
                const f = { t: 'anchor', v: '_f' + (++blank), local: true };
                emit(ref, 'aff', f);
                emit(f, 'a', q.v);
                emit(f, 'deg', { t: 'name', v: q.deg });
              } else emit(ref, 'aff', q.v);
            }
          }
        }
      }
    }
    return edges;
  }

  // ---- render templates, style en ----
  const ROLE_EN = { to: 'to', from: 'from', by: 'by', with: 'with', where: 'at', how: 'via' };
  const MARK_EN = {
    '🚫': 'FORBIDDEN', must: 'MANDATORY', may: 'ALLOWED',
    '⚠️': '⚠️ fragile', '🚨': '🚨 incident', '🔒': '🔒 invariant', '📐': '📐 contract',
  };
  const SPEECH = { ask: 'asks', tell: 'tells', confirm: 'confirms', demand: 'demands', offer: 'offers', promise: 'promises' };
  const an = w => (/^([aeiou]|heir|hour|honest|honou?r)/i.test(w) ? 'an' : 'a');
  const PRED_EN = {
    '=': 'is the same as', sub: 'is a kind of', in: 'is in', part: 'is part of',
    of: 'belongs to', feel: 'feels', dur: 'lasts', then: 'then comes', cause: 'causes',
    become: 'becomes', begin: 'begins', end: 'ends', await: 'then await', until: 'until',
  };

  // ---- lexicalize: natural transformation trên lexeme, áp MỌI vị trí atom ----
  // atom toàn chữ nối hyphen -> cụm từ space (shared-understanding -> shared understanding);
  // định danh có số là rigid (dev-3, story-90) -> identity. Chỉ áp cho prose — bảng cạnh giữ atom thô.
  const humanize = v => (/^[\p{L}]+(?:-[\p{L}]+)+$/u.test(v) ? v.replace(/-/g, ' ') : v);

  function rTerm(t) {
    switch (t.t) {
      case 'name': return t.implicit ? '' : humanize(t.v);
      case 'str': return `“${t.v}”`;
      case 'anchor': return t.local ? 'that' : humanize(t.v);
      case 'var': return `some ${t.v.replace(/^[?]/, '')}`;
      case 'phrase': return t.items.map(rTerm).join(' ');
      case 'seq': return t.items.map(rTerm).join(' → ') + ' (in order)';
      case 'graph': return '“' + rGraph(t.stmts) + '”';
      case 'edge': return `“${rTerm(t.s)} ${rTerm(t.p)} ${rTerm(t.o)}”`.replace(/\s+”/, '”');
    }
  }

  function rTime(v) {
    const s = v.t === 'name' ? v.v : rTerm(v);
    if (v.t === 'name') {
      if (s === 'past') return '(in the past)';
      if (s === 'now') return '(now)';
      if (s === 'future') return '(in the future)';
      if (s.endsWith('..')) return `since ${s.slice(0, -2)} (ongoing)`;
      if (s.includes('..')) { const parts = s.split('..'); return `from ${parts[0]} to ${parts[1]}`; }
      if (s.startsWith('+')) return `in ${s.slice(1)}`;
      if (s.startsWith('-')) return `${s.slice(1)} ago`;
    }
    return `at ${s}`;
  }

  function rClause(pred, objs, quals) {
    let neg = false; const marks = []; let time = null; const affs = []; let deg = null;
    for (const q of quals || []) {
      if (q.k === 'deg') { if (Number(q.v) === 0) neg = true; else deg = q.v; }
      else if (q.k === 'mark') marks.push(q.v);
      else if (q.k === 'at') time = q.v;
      else if (q.k === 'aff') affs.push(q);
    }
    const oTxt = objs.map(rTerm).filter(Boolean).join(', ');
    const predTxt = pred ? humanize(pred) : '';
    let core;
    if (!pred) core = oTxt; // bare mention
    else if (pred === 'a') core = `is ${an(oTxt)} ${oTxt}`;
    else if (PRED_EN[pred]) core = `${PRED_EN[pred]}${oTxt ? ' ' + oTxt : ''}`;
    else core = `${predTxt}${oTxt ? ' ' + oTxt : ''}`;
    if (neg) core = `does NOT ${predTxt}${oTxt ? ' ' + oTxt : ''}`;
    const tail = [];
    if (time) tail.push(time.t === 'name' || time.t === 'str' ? rTime(time) : 'at ' + rTerm(time));
    if (deg != null) tail.push(`(strength ${deg}%)`);
    for (const a of affs) {
      // affect dạng tính từ, không cường độ -> trạng từ: ~relentless => "relentlessly"
      const w = a.v.t === 'name' ? a.v.v : null;
      if (a.deg == null && w && /(less|ful|ous|ish|ive|ent|ant)$/.test(w)) tail.push(`${w}ly`);
      else tail.push(`(mood: ${rTerm(a.v)}${a.deg != null ? ` ${a.deg}%` : ''})`);
    }
    const out = core + (tail.length ? ' ' + tail.join(' ') : '');
    return { text: out, marks };
  }

  function rEventStmt(st) {
    if (st.subj.t !== 'anchor') return null;
    const get = p => { const c = st.chains.find(c => c.pred === p); return c ? c.objs[0] : null; };
    const typ = get('a');
    if (!typ || typ.t !== 'name') return null;
    const typName = typ.v;
    const roles = ['who', 'what', 'to', 'from', 'by', 'with', 'where', 'how'];
    const hasRole = st.chains.some(c => roles.includes(c.pred));
    const isMsg = !!SPEECH[typName];
    if (!hasRole && !isMsg) return null;
    const idPrefix = st.subj.local ? '' : `[${rTerm(st.subj)}] `;
    const used = new Set(['a']);
    let sent;
    if (isMsg) {
      const from = get('from'), to = get('to'), body = get('body'), re = get('re'), at = get('at'), hash = get('hash');
      ['from', 'to', 'body', 're', 'at', 'hash'].forEach(k => used.add(k));
      sent = `${idPrefix}${from ? rTerm(from) : 'someone'} ${SPEECH[typName]}${to ? ' ' + rTerm(to) : ''}`;
      if (re) sent += ` (replying to ${rTerm(re)})`;
      if (at) sent += `, ${rTime(at)}`;
      if (body) sent += `: ${rTerm(body)}`;
      if (hash) sent += ` — meaning receipt: hash ${rTerm(hash)}`;
    } else {
      const who = get('who'), what = get('what');
      used.add('who'); used.add('what');
      sent = `${idPrefix}${who ? rTerm(who) : 'someone'} does ${an(typName)} ${typName}`;
      if (what) sent += ` on ${rTerm(what)}`;
      for (const r of ['to', 'from', 'by', 'with', 'where', 'how']) {
        const v = get(r);
        if (v) { sent += ` ${ROLE_EN[r]} ${rTerm(v)}`; used.add(r); }
      }
    }
    const rest = [];
    for (const ch of st.chains) {
      if (used.has(ch.pred)) continue;
      if (ch.pred === 'at') { rest.push(rTime(ch.objs[0])); continue; }
      rest.push(rClause(ch.pred, ch.objs, ch.quals).text);
    }
    return sent + (rest.length ? '; ' + rest.join('; ') : '') + '.';
  }

  function applyMarks(text, marks) {
    for (const m of marks) {
      const mv = m.t === 'name' ? m.v : rTerm(m);
      text = `${MARK_EN[mv] || mv}: ${text}`;
    }
    return text;
  }

  // R = realize ∘ template: realize áp đồng nhất lên MỌI nhánh template, không chọn lọc
  const rStmt = st => realize(rStmtTemplate(st));

  function rStmtTemplate(st) {
    // rule {A} => {B}
    if (st.chains.length === 1 && st.chains[0].pred === '=>' && st.subj.t === 'graph') {
      const A = rGraph(st.subj.stmts);
      const B = st.chains[0].objs.map(o => o.t === 'graph' ? rGraph(o.stmts) : rTerm(o)).join(', ');
      const q = st.chains[0].quals.find(q => q.k === 'deg');
      const af = st.chains[0].quals.filter(q => q.k === 'aff')
        .map(a => ` (mood: ${rTerm(a.v)}${a.deg != null ? ` ${a.deg}%` : ''})`).join('');
      return `Rule: whenever “${A}” then “${B}”${q ? ` (holds ${q.v}% of the time)` : ''}${af}.`;
    }
    // deontic on a pattern: {P} mark 🚫
    if (st.subj.t === 'graph' && st.chains.length === 1 && st.chains[0].pred === 'mark') {
      const m = st.chains[0].objs.map(t => (t.t === 'name' && MARK_EN[t.v]) || rTerm(t)).join(', ');
      return `${m}, in every matching case: “${rGraph(st.subj.stmts)}”.`;
    }
    const ev = rEventStmt(st);
    if (ev) return ev;
    // edge-term subject: statements ABOUT an edge
    if (st.subj.t === 'edge') {
      const inner = `${rTerm(st.subj.s)} ${rTerm(st.subj.p)}${rTerm(st.subj.o) ? ' ' + rTerm(st.subj.o) : ''}`;
      const parts = [];
      for (const ch of st.chains) {
        if (ch.pred === 'conf') { parts.push(`(speaker is ${rTerm(ch.objs[0])}% sure)`); continue; }
        if (ch.pred === 'why') { parts.push(`because ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'at') { parts.push(rTime(ch.objs[0])); continue; }
        if (ch.pred === 'after') { parts.push(`— and that happens after ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'before') { parts.push(`— and that happens before ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'deg' && Number(ch.objs[0] && ch.objs[0].v) === 0) { parts.push('— which is NOT the case'); continue; }
        const c = rClause(ch.pred, ch.objs, ch.quals);
        parts.push(applyMarks(c.text, c.marks));
      }
      return `“${inner}” ${parts.join(', ')}.`;
    }
    const subjText = rTerm(st.subj);
    const clauses = st.chains.map(ch => rClause(ch.pred, ch.objs, ch.quals));
    const allMarks = st.chains.flatMap(ch => ch.quals.filter(q => q.k === 'mark').map(q => q.v));
    let out = (subjText + ' ' + clauses.map(c => c.text).filter(Boolean).join('; ')).trim();
    if (allMarks.length) out = applyMarks(out, allMarks);
    return out + '.';
  }

  // ---- realize: TẦNG DUY NHẤT chứa luật ngữ pháp bề mặt tiếng Anh (agreement, spacing) ----
  // template không được vá luật tiếng đích; lỗi "đọc không tự nhiên" sửa ở đây, lỗi cạnh sửa ở template.
  function realize(s) {
    s = s.replace(/ {2,}/g, ' ');
    // subject-verb agreement cho ngôi 2: mệnh đề trong câu chủ ngữ "you" chia theo you
    s = s.replace(/\byou is\b/g, 'you are').replace(/\byou feels\b/g, 'you feel').replace(/\byou does\b/g, 'you do');
    if (/^you /.test(s)) s = s.replace(/\bdoes NOT\b/g, 'do NOT');
    return s;
  }

  function rGraph(stmts) {
    return stmts.map(st => rStmt(st).replace(/\.$/, '')).join('; ');
  }

  function decode(src, opts) {
    const strict = !!(opts && opts.strict);
    const doc = parse(lex(src), strict);
    const edges = desugar(doc);
    // đo "độ lỏng" để UI phân biệt XS3 thật với văn xuôi lọt qua tolerant mode
    let chains = 0, loose = 0;
    for (const st of doc) for (const ch of st.chains) {
      chains++;
      if (ch.pred === null) loose++;
      else if (ch.objs.some(o => o.t === 'phrase')) loose++;
    }
    return {
      text: doc.map(rStmt).join('\n'),
      edges: edges.map(e => [termKey(e.s), e.p, termKey(e.o)]),
      stmts: doc.length,
      looseness: chains ? loose / chains : 1,
    };
  }

  return { decode };
})();

if (typeof module !== 'undefined') module.exports = XS3Decode;
