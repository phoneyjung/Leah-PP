# Independent review of test v2.3 (subagent, did not write the test) - 26 Oct 2569

## Round 1 (draft v2.3 = code/test_v2_3_draft.py)
1. ISSUE - G18 pixel part blind to a C dimmed through Glow / cave-light values (reference made by forcing GM_POW[100].glow/hole = 0 is dimmed the same way). Reviewer mutant mutA (= MUT-12) passed the draft 25/25 exit 0.
2. ISSUE - G13 base/json cases cannot catch a fault in the hold-target term: when base png or json fails, gmLantern() returns before lanternLight is set, so lit=false keeps C off anyway. MUT-10 (now MUT-10a) passed the draft 25/25 exit 0. Fix: add a case with the light layer loaded but no hold target (hold anchors json / walk-hold png missing). Minor: G13 cave only.
3. OK - G8 tests what was asked; MUT-11 caught. Minor: flags only, no pixel check on the turn frame.
4. MINOR - pool10 read moved the canvas-colour measurement onto a power-10 frame; read after ncol instead.
5. OK - no v2.2 condition loosened.
6. MINOR - G11 frame-rate check is noisy.
7. MINOR - no assertion on how many checks ran; G18 zoom 100 % / one position only.

## Round 2 (final v2.3 = code/test_g2_lantern_gm_v2_3.py)
(a) Findings 1, 2, 4 closed: MUT-12 caught by the G18 draw-call part (alpha 0.35); MUT-10a caught by the new hold_json / walkhold_png cases; pools read after the screenshot and ncol.
(b1) OK - hook restored by try/finally; C drawn another way / another image -> 0 calls -> G18 fails.
(b2) MINOR (open) - an extra dimming draw on top of an unchanged C draw, keyed to Glow / cave light = 0, passes both G18 parts (mutB: dark floor 1 call, alpha 1, ratio 1, mismatch 0, real C ~87 %). v2.3: 24/25 exit 1 via G4d (cave half only). Possible fix: compare the whole canvas call log at power 10 vs 100, allowing only Glow / cave light / light-layer calls to differ.
   Claude added: test_cpool.py matrix (vs original page A) catches mutB in all 28 power-10 states (dark + cave), exit 1 - see mutation/runs23f/cpool_mutB.*
(b3) MINOR - the hook records no transforms (scale/translate/transform), shadows or smoothing.
(c) OK - nothing loosened.
(d) MINOR - MUT-10a note in mutations.json was out of date (fixed); G11 noise again (A, MUT-2).
