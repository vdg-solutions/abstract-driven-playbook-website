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

  // có biến ? bên trong không -> phân biệt PATTERN (luật phổ quát) với INSTANCE (sự việc cụ thể)
  function termHasVar(t) {
    if (!t || typeof t !== 'object') return false;
    if (t.t === 'var') return true;
    if (t.t === 'phrase' || t.t === 'seq') return t.items.some(termHasVar);
    if (t.t === 'graph') return t.stmts.some(stmtHasVar);
    if (t.t === 'edge') return termHasVar(t.s) || termHasVar(t.p) || termHasVar(t.o);
    return false;
  }
  function stmtHasVar(st) {
    if (termHasVar(st.subj)) return true;
    return st.chains.some(c => c.objs.some(termHasVar)
      || c.quals.some(q => q.v && typeof q.v === 'object' && termHasVar(q.v)));
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
    of: 'of', feel: 'feels', dur: 'lasts', then: 'then comes', cause: 'causes',
    become: 'becomes', begin: 'begins', end: 'ends', await: 'then await', until: 'until',
  };
  // predicate quan hệ/cấu trúc: không lên được mệnh lệnh ("must NOT before X" gãy) -> dùng frame FORBIDDEN
  const REL_PRED = new Set(['a', 'sub', '=', 'of', 'in', 'part', 'before', 'after', 'during', 'meets', 'starts', 'ends', 'then', 'dur', 'until']);

  // ---- lexicalize: natural transformation trên lexeme, áp MỌI vị trí atom ----
  // atom toàn chữ nối hyphen -> cụm từ space (shared-understanding -> shared understanding);
  // định danh có số là rigid (dev-3, story-90) -> identity. Chỉ áp cho prose — bảng cạnh giữ atom thô.
  const humanize = v => (/^[\p{L}]+(?:-[\p{L}]+)+$/u.test(v) ? v.replace(/-/g, ' ') : v);

  function rTerm(t) {
    switch (t.t) {
      case 'name': return t.implicit ? '' : humanize(t.v);
      case 'str': return `‘${t.v}’`; // string literal dùng ‘ ’ — “ ” dành riêng cho graph/edge để readback phân biệt được
      case 'anchor': return t.local ? 'that' : '#' + t.v; // anchor phải nhìn thấy được — vô hình là mất ý; slot template tự hàm ý ([m1], replying to) thì dùng raw v
      case 'var': return `some ${t.v.replace(/^[?]/, '')}`;
      case 'phrase': return t.items.map(rTerm).join(' ');
      case 'seq': return t.items.map(rTerm).join(' → ') + ' (in order)';
      case 'graph': return '“' + rGraph(t.stmts) + '”';
      case 'edge': return `“${rTermRigid(t.s)} ${rTermRigid(t.p)} ${rTerm(t.o)}”`.replace(/\s+”/, '”');
    }
  }

  // slot rigid: subject/predicate không humanize — humanize ở đây phá đơn ánh của readback
  // (biên subject/pred không có marker để phục hồi). Faithfulness chứng trên từng generator.
  const rTermRigid = t =>
    t.t === 'name' ? (t.implicit ? '' : t.v)
      : t.t === 'anchor' ? (t.local ? 'that' : '#' + t.v)
        : rTerm(t);

  // trả về CORE không ngoặc; ở vị trí tail của clause, caller bọc ngoặc — mọi qualifier tail
  // đều có ngoặc để readback tách được khỏi object humanize (tránh time-marker cắn vào object)
  function rTime(v) {
    const s = v.t === 'name' ? v.v : rTerm(v);
    if (v.t === 'name') {
      if (s === 'past') return 'in the past';
      if (s === 'now') return 'right now';
      if (s === 'future') return 'in the future';
      if (s.endsWith('..')) return `since ${s.slice(0, -2)}, ongoing`;
      if (s.includes('..')) { const parts = s.split('..'); return `from ${parts[0]} to ${parts[1]}`; }
      if (s.startsWith('+')) return `in ${s.slice(1)}`;
      if (s.startsWith('-')) return `${s.slice(1)} ago`;
      // giới từ theo độ mịn thời gian: năm/tháng -> in, ngày -> on, có giờ -> at
      if (/^\d{4}(-\d{2})?$/.test(s)) return `in ${s}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `on ${s}`;
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
    const predTxt = pred || ''; // slot pred rigid — humanize pred phá đơn ánh (look-up vs look + up-*)
    let core;
    if (!pred) core = oTxt; // bare mention
    else if (pred === 'a') core = `is ${an(oTxt)} ${oTxt}`;
    else if (PRED_EN[pred]) core = `${PRED_EN[pred]}${oTxt ? ' ' + oTxt : ''}`;
    else core = `${predTxt}${oTxt ? ' ' + oTxt : ''}`;
    if (neg) core = `does NOT ${predTxt}${oTxt ? ' ' + oTxt : ''}`;
    const tail = [];
    if (time) tail.push(`(${time.t === 'name' || time.t === 'str' ? rTime(time) : 'at ' + rTerm(time)})`);
    if (deg != null) tail.push(`(strength ${deg}%)`);
    for (const a of affs) {
      // affect dạng tính từ, không cường độ -> trạng từ: ~relentless => "relentlessly"
      const w = a.v.t === 'name' ? a.v.v : null;
      if (a.deg == null && w && /(less|ful|ous|ish|ive|ent|ant)$/.test(w)) tail.push(`${w}ly`);
      else tail.push(`(mood: ${rTerm(a.v)}${a.deg != null ? ` ${a.deg}%` : ''})`);
    }
    // mark là tail của ĐÚNG clause mang nó — prefix cả câu làm mất thông tin mark thuộc chain nào
    for (const m of marks) {
      const mv = m.t === 'name' ? m.v : rTerm(m);
      tail.push(`— ${MARK_EN[mv] || mv}`);
    }
    return core + (tail.length ? ' ' + tail.join(' ') : '');
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
    const idPrefix = st.subj.local ? '' : `[${st.subj.v}] `; // slot id: template tự hàm ý anchor, dùng raw v
    const used = new Set(['a']);
    let sent;
    if (isMsg) {
      const from = get('from'), to = get('to'), body = get('body'), re = get('re'), at = get('at'), hash = get('hash');
      ['from', 'to', 'body', 're', 'at', 'hash'].forEach(k => used.add(k));
      sent = `${idPrefix}${from ? rTermRigid(from) : 'someone'} ${SPEECH[typName]}${to ? ' ' + rTermRigid(to) : ''}`;
      if (re) sent += ` (replying to ${re.t === 'anchor' ? re.v : rTermRigid(re)})`;
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
      if (ch.pred === 'at') { rest.push(`(${rTime(ch.objs[0])})`); continue; }
      rest.push(rClause(ch.pred, ch.objs, ch.quals));
    }
    return sent + (rest.length ? '; ' + rest.join('; ') : '') + '.';
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
    // deontic trên graph term: {G} mark <m>. PATTERN (có ?) -> luật phổ quát;
    // INSTANCE một-cạnh -> mệnh lệnh cụ thể (sir-henry must NOT walk moor …); còn lại -> frame FORBIDDEN: “…”
    if (st.subj.t === 'graph' && st.chains.length === 1 && st.chains[0].pred === 'mark') {
      const marks = st.chains[0].objs;
      const m = marks.map(t => (t.t === 'name' && MARK_EN[t.v]) || rTerm(t)).join(', ');
      const stmts = st.subj.stmts;
      if (stmts.some(stmtHasVar)) return `${m}, in every matching case: “${rGraph(stmts)}”.`;
      const single = stmts.length === 1 && stmts[0].chains.length === 1 ? stmts[0] : null;
      const markName = marks.length === 1 && marks[0].t === 'name' ? marks[0].v : null;
      const IMP = { '🚫': 'must NOT', must: 'MUST', may: 'MAY' };
      if (single && IMP[markName] && single.subj.t === 'name' && !single.subj.implicit
          && single.chains[0].pred && !REL_PRED.has(single.chains[0].pred)) {
        const ch = single.chains[0];
        return `${rTermRigid(single.subj)} ${IMP[markName]} ${rClause(ch.pred, ch.objs, ch.quals)}.`;
      }
      return `${m}: “${rGraph(stmts)}”.`;
    }
    const ev = rEventStmt(st);
    if (ev) return ev;
    // edge-term subject: statements ABOUT an edge
    if (st.subj.t === 'edge') {
      const inner = `${rTermRigid(st.subj.s)} ${rTermRigid(st.subj.p)}${rTerm(st.subj.o) ? ' ' + rTerm(st.subj.o) : ''}`;
      const parts = [];
      for (const ch of st.chains) {
        if (ch.pred === 'conf') { parts.push(`(speaker is ${rTerm(ch.objs[0])}% sure)`); continue; }
        if (ch.pred === 'why') { parts.push(`because ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'at') { parts.push(`(${rTime(ch.objs[0])})`); continue; }
        if (ch.pred === 'after') { parts.push(`— and that happens after ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'before') { parts.push(`— and that happens before ${ch.objs.map(rTerm).join(', ')}`); continue; }
        if (ch.pred === 'deg' && Number(ch.objs[0] && ch.objs[0].v) === 0) { parts.push('— which is NOT the case'); continue; }
        parts.push(rClause(ch.pred, ch.objs, ch.quals));
      }
      return `“${inner}” ${parts.join(', ')}.`;
    }
    const subjText = rTermRigid(st.subj);
    const clauses = st.chains.map(ch => rClause(ch.pred, ch.objs, ch.quals));
    return (subjText + ' ' + clauses.filter(Boolean).join('; ')).trim() + '.';
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
    // giữ '.' giữa các statement (biên statement phải phục hồi được); bỏ dấu chấm cuối cùng
    return stmts.map(rStmt).join(' ').replace(/\.$/, '');
  }

  // ---- readback E0: nghịch đảo cơ khí của R trên ảnh Im(R) ----
  // Im(R) là controlled language do template sinh ra nên có retraction: E0 ∘ R = Id trên canon.
  // "Giữ toàn bộ ý" = decode(readback(R(d))).edges == decode(d).edges — kiểm bằng property test
  // (roundtrip.js), đẳng thức trong thương q: relabel #_x, case chữ đầu câu, space<->hyphen slot humanize.
  const MARK_BACK = Object.fromEntries(Object.entries(MARK_EN).map(([k, v]) => [v, k]));
  const SPEECH_BACK = Object.fromEntries(Object.entries(SPEECH).map(([k, v]) => [v, k]));
  const PRED_BACK = Object.entries(PRED_EN).map(([k, v]) => [v, k]).sort((a, b) => b[0].length - a[0].length);
  const qJoin = s => s.trim().split(/\s+/).join('-');
  const lowerFirst = s => s.replace(/\p{L}/u, c => c.toLowerCase());

  // tách ngoài “ ” (graph, lồng được) và ‘ ’ (string)
  function splitTop(s, sep) {
    const out = [];
    let depth = 0, instr = false, cur = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '“') depth++;
      else if (c === '”') depth--;
      else if (c === '‘') instr = true;
      else if (c === '’') instr = false;
      if (!depth && !instr && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }

  // string literal là term mờ đục — mask thành placeholder TRƯỚC mọi parse để tokenizer/
  // time-regex không cắn vào trong chuỗi có khoảng trắng
  let STRS = [];
  const maskStrings = text => text.replace(/‘([^’]*)’/g, (m, x) => { STRS.push(x); return `⟦${STRS.length - 1}⟧`; });

  function backTerm(s) {
    s = s.trim();
    const ph = s.match(/^⟦(\d+)⟧$/);
    if (ph) return `"${STRS[+ph[1]]}"`;
    if (s.startsWith('“') && s.endsWith('”')) return `{${backGraph(s.slice(1, -1))}}`;
    const v = s.match(/^some (\S+)$/);
    if (v) return '?' + v[1];
    return qJoin(s);
  }

  const TIME_BACK = [
    [/ \(in the past\)$/, () => '@past'],
    [/ \(right now\)$/, () => '@now'],
    [/ \(in the future\)$/, () => '@future'],
    [/ \(since (\S+), ongoing\)$/, m => '@' + m[1] + '..'],
    [/ \(from (\S+) to (\S+)\)$/, m => '@' + m[1] + '..' + m[2]],
    [/ \((\S+) ago\)$/, m => '@-' + m[1]],
    [/ \(on (\S+)\)$/, m => '@' + m[1]],
    [/ \(in (\S+)\)$/, m => (/^\d{4}(-\d{2})?$/.test(m[1]) ? '@' + m[1] : '@+' + m[1])],
    [/ \(at (\S+)\)$/, m => '@' + m[1]],
  ];

  // gỡ tail của clause từ cuối: mark, mood/adverb, strength, time — trả về [phần còn lại, quals]
  function backTails(cl) {
    let quals = '';
    for (;;) {
      let m;
      if ((m = cl.match(/ — ([^—]+)$/)) && MARK_BACK[m[1]]) { quals = ' !' + MARK_BACK[m[1]] + quals; cl = cl.slice(0, m.index); continue; }
      if ((m = cl.match(/ \(mood: ([^)]+?)(?: (\d+)%)?\)$/))) { quals = ' ~' + qJoin(m[1]) + (m[2] ? '%' + m[2] : '') + quals; cl = cl.slice(0, m.index); continue; }
      if ((m = cl.match(/ (\S+?(?:less|ful|ous|ish|ive|ent|ant))ly$/))) { quals = ' ~' + m[1] + quals; cl = cl.slice(0, m.index); continue; }
      if ((m = cl.match(/ \(strength (\d+)%\)$/))) { quals = ' %' + m[1] + quals; cl = cl.slice(0, m.index); continue; }
      let hit = false;
      for (const [re, fn] of TIME_BACK) {
        const t = cl.match(re);
        if (t) { quals = ' ' + fn(t) + quals; cl = cl.slice(0, t.index); hit = true; break; }
      }
      if (hit) continue;
      break;
    }
    return [cl, quals];
  }

  function backClause(cl) {
    let quals;
    [cl, quals] = backTails(cl.trim());
    let neg = '';
    if (/^do(es)? NOT /.test(cl)) { neg = ' %0'; cl = cl.replace(/^do(es)? NOT /, ''); }
    // inverse của realize (agreement) — E0 ∘ realize = E0: đưa dạng chia theo you về dạng gốc
    cl = cl.replace(/^are\b/, 'is').replace(/^feel\b/, 'feels');
    let pred = null, rest = '';
    for (const [en, key] of PRED_BACK) {
      if (cl === en) { pred = key; break; }
      if (cl.startsWith(en + ' ')) { pred = key; rest = cl.slice(en.length + 1); break; }
    }
    if (!pred) {
      const art = cl.match(/^is an? ([\s\S]+)$/);
      if (art) { pred = 'a'; rest = art[1]; }
    }
    if (!pred) {
      const m = cl.match(/^(\S+)(?: ([\s\S]+))?$/);
      pred = m[1]; rest = m[2] || '';
    }
    const objs = rest ? splitTop(rest, ', ').map(backTerm) : [];
    return pred + (objs.length ? ' ' + objs.join(', ') : '') + neg + quals;
  }

  function backStmt(line) {
    line = line.trim().replace(/\.$/, '');
    let m;
    // rule
    if ((m = line.match(/^[Rr]ule: whenever “([\s\S]+?)” then “([\s\S]+?)”([\s\S]*)$/))) {
      const [, tq] = backTails('x' + m[3].replace(/ \(holds (\d+)% of the time\)/, ' (strength $1%)'));
      return `{${backGraph(m[1])}} => {${backGraph(m[2])}}${tq}`;
    }
    // deontic trên pattern
    if ((m = line.match(/^([\s\S]+?), in every matching case: “([\s\S]+)”$/))) {
      const key = m[1].charAt(0).toUpperCase() + m[1].slice(1);
      const mk = MARK_BACK[key] || MARK_BACK[m[1]];
      if (mk) return `{${backGraph(m[2])}} mark ${mk}`;
    }
    // deontic instance một cạnh, đọc như mệnh lệnh: "s must NOT / MUST / MAY <clause>"
    const IMP_BACK = [[/^(\S+) must NOT ([\s\S]+)$/, '🚫'], [/^(\S+) MUST ([\s\S]+)$/, 'must'], [/^(\S+) MAY ([\s\S]+)$/, 'may']];
    for (const [re, mk] of IMP_BACK) {
      if ((m = line.match(re))) return `{${lowerFirst(m[1])} ${backClause(m[2])}} mark ${mk}`;
    }
    // message
    if ((m = line.match(/^\[(\S+)\] (\S+) (asks|tells|confirms|demands|offers|promises)(?: (\S+))?(?: \(replying to (\S+)\))?(?:, (?:at|in|on) (\S+))?(?:: ([\s\S]+?))?(?: — meaning receipt: hash (\S+))?$/))) {
      const [, id, from, verb, to, re, at, body, hash] = m;
      let out = `#${id} a ${SPEECH_BACK[verb]}; from ${lowerFirst(from)}`;
      if (to) out += `; to ${to}`;
      if (re) out += `; re #${re}`;
      if (at) out += `; at ${at}`;
      if (body) out += `; body ${backTerm(body)}`;
      if (hash) out += `; hash ${backTerm(hash)}`;
      return out;
    }
    // deontic instance nhiều mệnh đề: "<MARK>: “…”"
    if ((m = line.match(/^([\s\S]+?): “([\s\S]+)”$/))) {
      const mk = MARK_BACK[m[1]] || MARK_BACK[m[1].charAt(0).toUpperCase() + m[1].slice(1)];
      if (mk) return `{${backGraph(m[2])}} mark ${mk}`;
    }
    // statement về một cạnh: “s p o” ...
    if ((m = line.match(/^“([\s\S]+?)” ([\s\S]+)$/))) {
      const toks = m[1].trim().split(/\s+/);
      const s = lowerFirst(toks[0]), p = toks[1] || '', o = toks.slice(2).length ? backTerm(toks.slice(2).join(' ')) : '';
      const chains = splitTop(m[2], ', ').map(part => {
        part = part.trim();
        let mm;
        if ((mm = part.match(/^\(speaker is (\d+)% sure\)$/))) return `conf ${mm[1]}`;
        if ((mm = part.match(/^because ([\s\S]+)$/))) return `why ${backTerm(mm[1])}`;
        if ((mm = part.match(/^— and that happens after ([\s\S]+)$/))) return `after ${backTerm(mm[1])}`;
        if ((mm = part.match(/^— and that happens before ([\s\S]+)$/))) return `before ${backTerm(mm[1])}`;
        if (part === '— which is NOT the case') return 'deg 0';
        return backClause(part);
      });
      return `[${s} ${p}${o ? ' ' + o : ''}] ${chains.join('; ')}`;
    }
    // chain thường: subject = token đầu (rigid), các clause nối ';'
    const segs = splitTop(line, '; ');
    let head = segs[0].trim(), subj;
    if ((m = head.match(/^some (\S+) ([\s\S]+)$/))) { subj = '?' + m[1]; head = m[2]; }
    else { m = head.match(/^(\S+) ([\s\S]+)$/); subj = lowerFirst(m[1]); head = m[2]; }
    const clauses = [head, ...segs.slice(1)].map(backClause);
    return `${subj} ${clauses.join('; ')}`;
  }

  function backGraph(s) {
    return splitTop(s.trim(), '. ').map(backStmt).join('. ');
  }

  function readback(text) {
    STRS = [];
    return maskStrings(text).split('\n').filter(l => l.trim()).map(l => backStmt(l) + '.').join('\n');
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
    // typography: câu (statement top-level) viết hoa đầu; statement trong { } là mệnh đề, không áp;
    // tag định danh [m1] đầu câu là rigid — nhảy qua, viết hoa chữ đầu sau tag
    const capFirst = s => {
      const start = s.startsWith('[') ? s.indexOf(']') + 1 : 0;
      return s.slice(0, start) + s.slice(start).replace(/\p{L}/u, c => c.toUpperCase());
    };
    return {
      text: doc.map(st => capFirst(rStmt(st))).join('\n'),
      edges: edges.map(e => [termKey(e.s), e.p, termKey(e.o)]),
      stmts: doc.length,
      looseness: chains ? loose / chains : 1,
    };
  }

  return { decode, readback };
})();

if (typeof module !== 'undefined') module.exports = XS3Decode;
