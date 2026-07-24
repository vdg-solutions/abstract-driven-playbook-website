// XS3 running memory with edge aging / generational compaction.
// State is an addressable EDGE SET, so eviction/pin/tiering are DETERMINISTIC
// operations — impossible to do cleanly on prose without a lossy rewrite.

class XS3Memory {
  constructor({ budget = 14, ttl = 2 } = {}) {
    this.edges = [];       // {s,p,o,turn,pinned}
    this.clusters = [];    // {id,count,subjects,digest}
    this.fullLog = [];     // every unique edge ever added (the "no-aging" baseline)
    this.cold = new Map(); // cold archive tier: clusterId -> exact original edges (off-context, recoverable)
    this.budget = budget;  // max (edges + clusters) kept live
    this.ttl = ttl;        // turns an unpinned edge may go untouched
    this.turn = 0;
    this._cid = 0;
  }
  _k(e) { return `${e.s}|${e.p}|${e.o}`; }

  // add or, if the exact edge exists, TOUCH it (refresh) and upgrade pin — dedup is trivial on atomic edges
  add(s, p, o, { pin = false } = {}) {
    const k = `${s}|${p}|${o}`;
    if (!this.fullLog.some(e => this._k(e) === k)) this.fullLog.push({ s, p, o, turn: this.turn, pinned: pin });
    const ex = this.edges.find(e => this._k(e) === k);
    if (ex) { ex.turn = this.turn; ex.pinned = ex.pinned || pin; return; }
    this.edges.push({ s, p, o, turn: this.turn, pinned: pin });
  }
  renderFull() { return this.fullLog.map(e => `${e.s} ${e.p} ${e.o}${e.pinned ? ' !🔒' : ''} @t${e.turn}`).join('\n'); }
  tick() { this.turn++; }

  compact() {
    const age = e => this.turn - e.turn;
    // (1) recency eviction: unpinned edges untouched for > ttl turns leave the live set
    const stale = this.edges.filter(e => !e.pinned && age(e) > this.ttl);
    this.edges = this.edges.filter(e => e.pinned || age(e) <= this.ttl);
    if (stale.length) this._reify(stale);
    // (2) budget pressure: pack oldest unpinned edges into a summary node; when no unpinned
    //     edges remain, MERGE oldest summary nodes (generational: cluster-of-clusters) so the
    //     live set stays bounded. PINNED edges (DOIs, invariants) are never packed or merged —
    //     they always survive exact; they are the irreducible floor.
    while (this.edges.length + this.clusters.length > this.budget) {
      const unpinned = this.edges.filter(e => !e.pinned).sort((a, b) => a.turn - b.turn);
      if (unpinned.length) {
        const take = unpinned.slice(0, Math.max(1, Math.ceil(unpinned.length / 2)));
        const tk = new Set(take.map(e => this._k(e)));
        this.edges = this.edges.filter(e => !tk.has(this._k(e)));
        this._reify(take);
      } else if (this.clusters.length >= 2) {
        this._mergeOldestClusters();
      } else {
        break; // only pinned edges (+ at most one cluster) remain — the floor
      }
    }
  }

  _mergeOldestClusters() {
    const [a, b] = this.clusters.splice(0, 2);
    const subjects = [...new Set([...a.subjects, ...b.subjects])];
    const count = a.count + b.count;
    // fold b's cold archive into a's — the merged summary still points to ALL exact edges
    this.cold.set(a.id, [...this.recover(a.id), ...this.recover(b.id)]);
    this.cold.delete(b.id);
    this.clusters.unshift({
      id: a.id, count, subjects,
      digest: `${count} aged facts on ${subjects.slice(0, 4).join(', ')}${subjects.length > 4 ? '…' : ''}`,
    });
  }

  // tiered/generational compaction: a cluster of aged edges becomes ONE summary node
  // that keeps a pointer (covers-count) to what it replaced — recoverable, not silently lost
  _reify(edges) {
    const subs = [...new Set(edges.map(e => e.s))];
    const id = `#c${++this._cid}`;
    const digest = `${edges.length} aged facts on ${subs.slice(0, 4).join(', ')}${subs.length > 4 ? '…' : ''}`;
    // (a summary node's text can be this deterministic digest OR an LLM-generated gist;
    //  either way the EXACT edges go to the cold tier, keyed by id, so nothing is lost)
    this.cold.set(id, edges.slice());
    this.clusters.push({ id, count: edges.length, subjects: subs, digest });
  }
  // recover the exact original edges of a summary node from the cold tier
  recover(id) { return this.cold.get(id) || []; }
  // recall on demand: search hot + cold for edges matching a keyword — the addressable payoff.
  // On an edge set this is a clean filter; on prose you would have to re-read and re-interpret.
  recall(q) {
    const hit = e => [e.s, e.p, e.o].some(x => String(x).includes(q));
    return { hot: this.edges.filter(hit), cold: [...this.cold.values()].flat().filter(hit) };
  }
  // persist the whole store (hot + summaries + cold) so nothing is lost across sessions
  persist(path) {
    require('fs').writeFileSync(path, JSON.stringify(
      { edges: this.edges, clusters: this.clusters, cold: [...this.cold] }));
  }

  render() {
    const el = this.edges.map(e => `${e.s} ${e.p} ${e.o}${e.pinned ? ' !🔒' : ''} @t${e.turn}`);
    const cl = this.clusters.map(c => `${c.id} summary "${c.digest}"; covers-count ${c.count}`);
    return [...el, ...cl].join('\n');
  }
  stats() {
    return {
      liveEdges: this.edges.length,
      pinned: this.edges.filter(e => e.pinned).length,
      clusters: this.clusters.length,
      packed: this.clusters.reduce((n, c) => n + c.count, 0),
      liveSlots: this.edges.length + this.clusters.length,
    };
  }
}

// ---- scenario: a realistic session — each turn adds 1 durable (pinned) fact + several ephemera ----
const m = new XS3Memory({ budget: 14, ttl: 2 });
const P = { pin: true };
const CRIT = [
  ['negation', 'is', '¬'], ['¬', 'desugars', '[s_p_o]_mark_not'],
  ['zenodo', 'concept-doi', '10.5281/zenodo.21425813'], ['zenodo', 'version-doi', '10.5281/zenodo.21525263'],
  ['gate', 'result', '5000/5000'], ['card', 'single-source', 'llms-language.txt'],
  ['¬', 'negates', 'one-edge'], ['¬{...}', 'is', 'forbidden'],
  ['commit', 'decoder-card', 'f928f15'], ['commit', 'citation', 'c4fb4ce'],
];
const EPH_V = ['checked', 'ran', 'read', 'grepped', 'edited', 'measured', 'diffed', 'opened', 'listed', 'probed'];
const EPH_O = ['decoder-negation', 'card-tilde', 'gate', 'token-count', 'card-diff', 'spec-selfref', 'glyph-table', 'zenodo-files', 'llms-txt', 'haiku-tests'];
const TURNS = 12, EPH_PER_TURN = 5;
for (let t = 1; t <= TURNS; t++) {
  m.tick();
  if (CRIT[t - 1]) m.add(...CRIT[t - 1], P);                       // one durable fact this turn
  for (let e = 0; e < EPH_PER_TURN; e++)                           // transient checks (not pinned)
    m.add('agent', EPH_V[(t * 7 + e) % EPH_V.length], `${EPH_O[(t * 3 + e) % EPH_O.length]}-t${t}`);
  m.compact();
}

const fs = require('fs');
fs.writeFileSync('full.txt', m.renderFull());   // baseline: everything ever seen, no aging
fs.writeFileSync('aged.txt', m.render());        // aged state after generational compaction

console.log('===== FINAL AGED STATE =====');
console.log(m.render());
console.log('\n===== AUDIT =====');
const live = new Set(m.edges.map(e => `${e.s} ${e.p} ${e.o}`));
let kept = 0;
for (const c of CRIT) { const s = `${c[0]} ${c[1]} ${c[2]}`; const ok = live.has(s); kept += ok ? 1 : 0; if (!ok) console.log('  LOST critical:', s); }
const st = m.stats();
console.log(`critical facts surviving EXACT: ${kept}/${CRIT.length}`);
console.log(`full-history unique edges (no aging): ${m.fullLog.length}  |  aged live slots: ${st.liveSlots} (budget ${m.budget})`);
console.log(`ephemera packed: ${st.packed} edges into ${st.clusters} summary node(s)`);

// ---- cold-tier recovery: summaries are lossy IN-CONTEXT, but the exact edges are recoverable ----
const cid = m.clusters[0].id;
const rec = m.recover(cid);
console.log(`\n===== COLD-TIER RECOVERY (${cid}) =====`);
console.log(`hot context carries only the summary line; the ${rec.length} original edges are byte-exact in cold storage:`);
console.log(rec.slice(0, 3).map(e => `  ${e.s} ${e.p} ${e.o} @t${e.turn}`).join('\n') + (rec.length > 3 ? `\n  … (+${rec.length - 3} more, all exact)` : ''));
const totalCold = [...m.cold.values()].reduce((n, a) => n + a.length, 0);
console.log(`cold archive total: ${totalCold} edges across ${m.cold.size} node(s) — off-context yet LOSSLESS-recoverable`);

// ---- persist to disk + recall on demand by content query (pull old facts back anytime) ----
m.persist('cold-store.json');
console.log(`\n===== PULL BACK ON DEMAND (persisted to cold-store.json) =====`);
for (const q of ['gate', 'zenodo', 'token-count']) {
  const r = m.recall(q);
  const ex = r.cold[0] ? `  e.g. "${r.cold[0].s} ${r.cold[0].p} ${r.cold[0].o} @t${r.cold[0].turn}"` : '';
  console.log(`recall("${q}"): ${r.hot.length} in hot context, ${r.cold.length} pulled EXACT from cold${ex}`);
}
console.log('cold store persisted — survives across sessions; recall is a clean edge filter, not a re-read');

console.log('\ntoken comparison written to full.txt vs aged.txt');
