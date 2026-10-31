# Independent review: G2.4 S6 scene Pilot (`pilot-g2-scene.html`, `test_g2_scene.py`, `trees.py`)
Reviewer: Claude (independent pass) · 31 Oct 2569 · branch `claude/g2-pilot` @ `4ac0038` · served at 127.0.0.1:8766
Method: I read all 3 files and the spec sections, then checked each finding in Chromium with Playwright (probe scripts in `scratchpad/s6/p1.py`–`p15.py`, screenshots in `scratchpad/s6/out/`).
Every finding was checked on the page unless it is marked "unverified". Line numbers are for `pilot-g2-scene.html` (P) and `test_g2_scene.py` (T).

## Checked and fine (no finding)
- The placement numbers match the spec: hut TL (96,32) and sort 287 · cave mouth TL (448,−48) · gate (448,384) and sort 446 · `LAMP_POOL.R` 144 = 4.5 tiles · slime zone 47 cells.
- Walk-behind cells = 24 (the limit) with 0 in the slime zone. Running `trees.py` (0.5 s) gives the same `TREES` and the same 24 cells as the page's own check (S4c).
- Fade: 0.55 within 200 ms, measured at 208 ms with the frame step.
- Door: when standing at x 224, kid pixels hidden by the door frame = **0** for 8 directions × (4 idle + 6 walk frames) × feet y 264/268/280.
- Tap-to-walk from **off-centre** starts (the suite only starts from cell centres): 600 random pairs gave 597 arrivals + 3 door taps that end in the next door cell by design · 0 stuck · 0 accidental warps.
- Tap → world mapping (tap on the drawn feet → that cell): 7/7 at 844×390@2.625, 390×844@3, 667×375@2, 1920×1080@1 and 1180×820@2 (the one miss was my own tap on a `T` cell).
- Signal colours: 0 px with dE00 < 10 even with the night layer off (the suite checks only with night on).
- Touch: holding the ↑ pad for 0.7 s by real CDP touch walks 35 px · a ground tap made while the pad is held walks to the tapped cell.
- A slow frame (`dt` is capped at 100 ms, so a step is at most 4.8 px) cannot skip through a 32 px cell · JS errors 0 in normal runs.

## A. Bugs in the page
**A1 · high · P:218–220 + P:287 — the kid shakes 1 art px (3 screen px) while the camera follows (on the main phone sizes).**
The camera is `X=Math.round(pos.x - vw/2)` and the kid is `Math.round(pos.x - 48 + dx) - X`. When `vw/2` is not a whole number, the two roundings flip at different moments.
Measured over 150 frames walking E on row 11 (the kid's screen x changed direction this many times):

| Screen | Times the kid's screen x changed direction |
|---|---|
| 844×390@2.625 (`vw` 738.67) | 68 (e.g. 325,325,324,324,324,325,324…) |
| 667×375@3 | 68 |
| Walking S on the 844 phone | 3 |
| 1180×820@2 and 1920×1080@1 (whole-number `vw/2`) | 0 |

So the iPad screenshots would not show it. The lantern, the light hole and the name tag shake with the kid. This works against the owner's main art demand ("เนียน").
Fix: round once, `px=Math.round(pos.x)`, `py=Math.round(pos.y)`, and use `px`/`py` both in `cam()` (`X=Math.round(px-vw/2)` with integer `vw/2`, or `Math.floor`) and in `drawKid`. Add a test: walking with the camera following → the kid's screen x changes direction 0 times.

**A2 · medium · P:212 — a phone held upright is zoomed in to about 5 tiles wide.** `baseScale()` uses only `cv.height/384`.
- 390×844@3 → s = 7, view 167×362 world px = **5.2 × 11.3 tiles**. The kid is about half the screen width. The hut, the slimes and the cave are off-screen (`out/view-390x844@3.png`).
- 360×740@3 → s = 6, 5.6 tiles wide · 820×1180@2 (iPad upright) → s = 6, 8.5 tiles wide.
- Zoom-out only takes away 1 step.

Fix: `Math.max(1,Math.round(Math.min(cv.width,cv.height)/384))` (390×844 → s = 3, 12×26 tiles), or fit both axes. Add a portrait viewport to S3c.

**A3 · medium · P:225–226, P:267–269, P:326–327 — walking into the door with the pad: the kid sinks into the wall and the whole hut flashes.**
`doorPull` moves x toward 224 at only 96 px/s while the feet are already inside the `D` cell. Walking ↑ from row 9 at x0 = 192…255:

| What I measured (per entry) | Result |
|---|---|
| Frames inside the door cell with x ≠ 224 | up to **20** (max offset 30.5 px) |
| Kid px hidden behind the door post | up to **1,655 of ~2,741** |
| Hut alpha (whole hut fades) | drops to **0.57–0.75** for x0 ≤ 200 or ≥ 248 |
| Frames with feet y in [287,288), kid drawn **over** the hut (sort tie `kid.y ≥ 287`) | 1 |

Screenshot: `out/door-entry.png`. This breaks spec 10 §4 "ในช่อง D จับเท้า x = 224" and QG-4 item 2 "ไหล่/ผมทับขอบประตู 0 px".
Fix: pull x to 224 while the feet are still in row 9 under the door columns (cells 6–7, y < 300), or snap x on entering `D`. Also make the hut not fade for a kid inside `D`, and treat `y ≥ 287` in `D` as behind the hut. Add a pad-entry test with assertions on x, hidden px and hut alpha.

**A4 · medium · P:60, P:78, P:191, P:330 — slimes do look lamp-lit.**
- The zone is computed by cell centre (`lampDist > 4.5`).
- The pool is centred under the paper lantern (−24,+8 from the cell centre). It is cut out of a flat night layer that is drawn after all sprites.
- A 54 px slime whose feet are just outside the pool has its body drawn inside it.

3 slimes × 180 s: **34.7 % of frames** have slime pixels inside a lamp pool. Night alpha on the slime goes down to 44/148, i.e. about 70 % lit. Example: slime at (18,9) under lamp (19,4) (`out/slime-lit.png`, the top of the left slime is lighter).
Fix: shrink the zone so that body top ≥ 144 px from every pool centre, or apply the night to sprites by their feet position (draw slimes after the night layer with their own dimming). Measure slime pixels against the drawn pool.

**A5 · low · P:243, P:256 — cave room: tap-to-walk crosses the return ring and warps back.**
The rule "do not walk through the exit unless it is the goal" exists only for the field. In the cave, a tap from (2,8) to (10,8) took an 8-step path and warped to the field at (6,8).
Fix: apply the same `ok()` exclusion for `CAVE_ROOM.ring`.

**A6 · low · P:95–107, P:101, P:169 — a JSON with missing keys leaves a black page.**
A well-formed JSON with missing keys throws inside `boot()`, so `ready` never becomes true and the page stays black with only the buttons (`out/malformed-json.png`). Measured:
- `g24-tiles.json` without `.tiles` → `Cannot read properties of undefined (reading 'grass,grass,grass,grass')`
- `c2-pilot-anchors.json` without `frames` → same kind of error.

Also, an exception in `step`/`draw` stops the rAF loop for good. Missing files are handled; half-written files are not.
Fix: wrap each JSON use in a guard (`?.`), and put `try/catch` around `boot` (fall back to drawn shapes) and inside `loop`.

**A7 · low · P:280–281 — a slime sheet with only the S cell makes the slime invisible in 7 of 8 directions.**
Spec 11 §5 asks for "ไฟล์มีแค่ช่อง S → ใช้ S ทุกทิศ". With a 64×64 sheet, the slime is invisible in SE…SW (the centre pixel showed ground colour).
Fix: `di = img.width>=512 ? di : 0`.

**A8 · low · P:239, P:272 — pushing against the gate rebuilds the message every frame.** This gave 89 DOM mutations/s on an `aria-live` region.
Fix: if the same message id is already showing, only reset its timer.

**A9 · low · P:366–368, P:365 — control edge cases.**
- If the window loses focus with an arrow key held, `held` is never cleared and the kid keeps walking at 48 px/s (no `blur`/`visibilitychange` handler).
- Pad, two fingers: hold ↑, add →, lift ↑ → the kid stops while → is still held.
- Sliding a finger from ↑ to ↗ does not change direction, because touch pointer capture keeps the first button.

Fix:
- clear `held` and `stop()` on `blur` and when the page is hidden
- keep a set of pressed pad buttons
- pick the pad button from `elementFromPoint` on `pointermove`

**A10 · low · P:142–144 — with the lantern file missing, the cave room is 86 % dark with no light hole.** The kid area brightness is 17 vs 67 with the lantern, so the kid is barely visible (`out/cave-lantern-missing.png`). It is not a white screen, but the fallback is hard to play.
Fix: when `!holdOn()`, cut a small default light around the kid in the cave.

## B. Tests that can pass while the requirement is not met
- **B1 · medium · T:111 (S2b)** asserts only `clip['kid'] > 0`. `underFrame` (kid px hidden by the frame) is only reported, so the "0 px" criterion is never checked. It also covers 1 pose (N, idle, x = 224). Assert `underFrame == 0` over all directions and frames, including pad entry (see A3).
- **B2 · medium · T:98–110 (S2a)** drives only `goto()`, whose last waypoint is hard-coded to (224,268) (P:245), so "feet x = 224" holds by construction. The fuzz (T:45) checks only y. Pad and keyboard entry (A3) are not tested.
- **B3 · medium · T:141–144 (S6b)** checks the slime's feet cell with the same `lampDist`/`ZONE` the page uses to build the paths, so it holds by construction. It never looks at the drawn light (A4 shows 34.7 % of frames lit).
- **B4 · medium · T:216–235 (S8h)** passes only because it compares against the slowest mode of the old page.
  - Old page in cave mode: 19.0 fps · old page dark grid: 46.6 fps · scene: 27.9 fps (4× CPU).
  - Against the dark grid the scene reaches 60 % (README says so).
  - The plan says "≥ 90 % ของหน้าเดิม", so the owner should choose the baseline; the test should not pick it.
- **B5 · low:** these checks pass by construction.
  - S4a (T:123–129) puts the kid at `o.sort ± 6`, so it can only test the sort function, never wrong `sort` values.
  - In S1c (T:85–94), "A* refuses 17 solid targets" and "feet never in solid" use the same `solidAt` as the movement code (only "reached 0" means anything).
  - S3c (T:120–121) checks `Number.isInteger(Math.round(..))`, on the landscape phone only, so A2 is missed.
  - S8c (T:155–157) builds the tap with the inverse of the handler's own formula. I re-checked it independently: OK.
- **B6 · low · T:197–206 (S8g)** passes on "> 20 colours, mean brightness < 200, walked".
  - It does not check that each fallback shape is actually drawn.
  - It does not cover the cave room with art missing, half-written JSON (A6), the 1-cell slime sheet (A7) or the lantern-only case (A10).
- **B7 · low:** the suite has no check for camera smoothness (A1), portrait screens (A2) or real touch input. S8d uses mouse events; the AGENTS.md rule asks for CDP touch.

## C. Differences from the plan/spec numbers
- **C1 · medium:** door x = 224 is not held while entering (A3).
- **C2 · low · P:54:** 8 of the 16 trees are moved away from the §4 rule "image bottom = cell bottom, TL = (col×32−48, (row+1)×32−128)".
  - 5 trees are moved +12 px x and 1 tree −20 px x.
  - (21,13) and (25,13) are moved +20 px y. Their trunks end at y 468, below the 448 px map edge, so they are never visible.
  - (0,10) has its trunk at x −4.
  - These moves are deliberate in `trees.py`, but the spec does not cover them. Write them into spec 10 or ask the owner.
- **C3 · low · P:163–165:** props are placed by their opaque bbox (bottom at cell + 28), not by the spec anchor (16,30) "ตรงช่อง". Measured dy: crate +1 · boulder +2 · rope/fence/bush +3 · crystal +7. Fence dx is +1, so the fence overlaps the gate by 1 px.
- **C4 · info · P:178:** the cave mouth is drawn into the ground layer, not y-sorted with `sort_y = 132` (spec 1.2). The kid at y 128–131 is drawn over the rock's bottom 4 px. This looks right visually; record the choice in the spec.
- **C5 · low:** spec 11 §5 "S only → S for all directions" is not implemented (A7).

## D. Child-facing UX (brief)
- **D1 · medium · P:244, P:369:** tapping a solid thing does nothing and gives no feedback (`goto` gets `null`). Measured with no walk on:
  - the dark cave opening (C cells, where a child will tap to "go in")
  - the upper part of the hut door (H)
  - trees and the crate

  Fix: send the tap to the nearest walkable cell (map C → X and the door columns → D), the same way the gate already does.
- **D2 · low · P:350:** the name tag is `5*s` canvas px, i.e. **5.7 CSS px** on 844×390@2.625 and 5 px on 667×375@2, which a child cannot read. It also says "ลีอา Leah", but CLAUDE.md says the player is their own character, not Leah (the label is copied from the motion page). Make it ≥ 11 CSS px, or drop it here.
- **D3 · low · CSS P:10:** the 140×140 px pad covers 36 % of the screen height in the bottom-right corner, which is where the dark field and the slimes are on the phone (`phone-field.png`). The buttons are 44 px, which is fine for 7–10-year-olds.
- **D4 · info:** the texts are Thai + English everywhere and are gentle. "ถ้ำ (ลองเดิน)" is fine for a test page. The `bZoom` label shows the current state, not what pressing it will do.

## Suite re-run
`python3 -I test_g2_scene.py 8766 <scratch>` → **27/27 PASS** here as well (log: `scratchpad/s6/suite.log`).
- FPS medians: scene 29.3 · old page cave mode 20.2 · old page dark grid 49.5.
- So the suite is green, and none of A1–A4 or B1–B3 is caught by it.
