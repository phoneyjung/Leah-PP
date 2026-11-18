// qa/frames.js (Claude, 19 Nov 2569 · owner: "แก้ชุดทดสอบที่ตก 3 ชุด"): "a frame over 50 ms" for test_risk_monthly.js and test_213_labels.js,
// told apart by cause. RISK_CHECKLIST item 7: no frame over 50 ms in 4 s of walking.
//
// Why: both suites failed now and then on main as well (Codex T52: one frame of 52–58 ms in a 3–4 s walk, main and 2.44 alike). On Claude's
// machine none in 30+ windows, also with 6 busy programs beside it. A frame can be late because the PAGE worked ≥ 50 ms, or because the MACHINE
// did not let it run (another program, the test runner, a busy computer). Wall time cannot tell them apart: the page process stopped from outside
// for 80 ms showed up as one 87 ms "long task". CPU time can: a thread that waits uses none.
//
// Rule: a gap > 50 ms between two frames is the page's OWN when one thread of the page's drawing chain — the page's main thread, its compositor
// thread, the GPU process's main thread and its viz compositor thread — used ≥ 33.3 ms of CPU inside the gap (two frames' work: that alone makes
// a gap > 50 ms). The CPU time is read from a trace of the window (tdur of each top-level task, shared out by how much of the task is inside the gap;
// a task with no CPU time recorded counts its wall time, so an unknown counts against the page).
// What the suites do with it (walk() below):
//   · a window with an OWN gap stops there: no second try, the suite fails;
//   · a window whose gaps are all outside the page is measured again, at most 3 windows in all;
//   · passing needs a CLEAN window (no gap > 50 ms of any cause) — a gap that comes back every time fails, whatever its cause;
//   · no marker in the trace (cannot tell) → every gap of that window counts as own.
// The 50 ms line, the 4 s / 3 s walks and the moves (one step every 700 ms, as both suites did before) are unchanged.
// Proof: qa/frames_selftest.js (a 70 ms planted job in the game's frame → own, no retry · the page process stopped 80 ms → outside, measured again
// and clean · stopped in every window → fails · made-up traces for the arithmetic).
'use strict';
const CATS = ['toplevel', 'devtools.timeline'], GAP = 50, OWN = 100 / 3, MARK = 'frames-t0';

// in the page (as the suites walked before): a move every 700 ms, every frame timed; the gaps over 50 ms in ms from t0, where the marker is written
async function inPage(ms) {
  const t0 = performance.now(); console.timeStamp('frames-t0');
  const pts = [[1, 0], [0, 1], [-1, 0], [0, -1]], gaps = []; let k = 0, last = t0, n = 0, worst = 0;
  const iv = setInterval(() => { const q = pts[k++ % 4]; P.path = [[P.x + q[0] * 96, P.y + q[1] * 96]] }, 700);
  await new Promise((res) => { const f = () => { const t = performance.now(), d = t - last; if (d > 50) gaps.push([last - t0, t - t0]); if (d > worst) worst = d; last = t; n++; if (t - t0 < ms) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) });
  clearInterval(iv); return { fps: +(n / (ms / 1000)).toFixed(1), worst: Math.round(worst), gaps };
}

// trace events + the window → each gap with the most CPU one thread of the chain used inside it
function attribute(events, w) {
  const mark = events.find((e) => e.name === 'TimeStamp' && e.args && e.args.data && e.args.data.message === MARK);
  if (!mark) return { error: 'no marker in the trace', gaps: w.gaps.map(([a, b]) => ({ at: Math.round(a), gap: Math.round(b - a), cpu: null, by: null, own: true })) };
  const pname = {}, tname = {};
  for (const e of events) if (e.ph === 'M') { if (e.name === 'process_name') pname[e.pid] = e.args && e.args.name; if (e.name === 'thread_name') tname[e.pid + ':' + e.tid] = e.args && e.args.name; }
  const chain = [['main', mark.pid, mark.tid]], tidOf = (pid, name) => { for (const [k, v] of Object.entries(tname)) if (v === name && +k.split(':')[0] === pid) return +k.split(':')[1]; return null; };
  { const c = tidOf(mark.pid, 'Compositor'); if (c != null) chain.push(['compositor', mark.pid, c]); }
  for (const pid of Object.keys(pname).filter((p) => pname[p] === 'GPU Process').map(Number)) for (const [k, n] of [['gpu', 'CrGpuMain'], ['viz', 'VizCompositorThread']]) { const t = tidOf(pid, n); if (t != null) chain.push([k, pid, t]); }
  // top-level tasks only (a task inside another one is not counted twice)
  const tasks = chain.map(([k, pid, tid]) => { const l = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X' && /RunTask$/.test(e.name) && e.dur > 0).sort((a, b) => a.ts - b.ts), top = []; let end = -Infinity;
    for (const t of l) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; } return [k, top]; });
  return { threads: chain.map((c) => c[0]), gaps: w.gaps.map(([from, to]) => { const a = mark.ts + from * 1000, b = mark.ts + to * 1000; let cpu = 0, by = null;
    for (const [k, top] of tasks) { let c = 0; for (const t of top) { const o = Math.min(b, t.ts + t.dur) - Math.max(a, t.ts); if (o > 0) c += (t.tdur != null ? t.tdur : t.dur) * o / t.dur; } if (c > cpu) { cpu = c; by = k; } }
    return { at: Math.round(from), gap: Math.round(to - from), cpu: Math.round(cpu / 100) / 10, by, own: cpu / 1000 >= OWN }; }) };
}

// one measured walk of `ms`: up to `tries` windows (see the rule above). `during(i)` (selftest only) runs beside window i.
async function walk(page, ms, opt = {}) {
  const tries = opt.tries || 3, windows = [];
  for (let i = 0; i < tries; i++) {
    await page.tracing.start({ categories: CATS }); let w, buf;
    try { const run = page.evaluate(inPage, ms); if (opt.during) await opt.during(i); w = await run; } finally { buf = await page.tracing.stop(); }
    let events = []; try { events = JSON.parse(Buffer.from(buf || []).toString()).traceEvents || []; } catch (e) {}
    const a = attribute(events, w), own = a.gaps.filter((g) => g.own).length;
    windows.push({ fps: w.fps, worst: w.worst, own, outside: a.gaps.length - own, gaps: a.gaps.map((g) => [g.at, g.gap, g.cpu, g.by]), error: a.error });
    if (own || !a.gaps.length) break;
  }
  const last = windows[windows.length - 1];
  return { fps: last.fps, worst: last.worst, hitch: last.own + last.outside, own: windows.reduce((s, x) => s + x.own, 0), tries: windows.length, windows };
}

module.exports = { walk, attribute, inPage, CATS, GAP, OWN, MARK };
