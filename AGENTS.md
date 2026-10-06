# AGENTS.md — Lantern Academy (repo: Leah-PP)

A 2D pixel-art RPG / farm / home game for the owner's 7-year-old daughter Leah (and adults who like Ragnarok-style games).
Live: https://phoneyjung.github.io/Leah-PP/ (add `?gm` for the game-master mode used in every test). GitHub Pages serves the `main` branch root.

## The owner, and how to talk to him
- Reply in **Thai**. He is not a programmer and works mostly from an Android phone; he also play-tests on a Windows PC with a mouse.
- When something is unclear or a decision is his (design, prices, what a thing should do): **ask before doing**. Offer 2-3 short options.
- Report with numbers, not adjectives ("walked to 38 of 38 spots", not "should work"). Say plainly what you did not check.
- Say which files changed. Never rename a file (no `index(1).html`): the game asks for files by exact name.
- Warn him when: the total download grows a lot (it is about 19 MB now), a feature is too complex for a 7-year-old, or more is being added while Leah has still not play-tested.

## What the code is
- **One file: `index.html`** (about 935 KB, vanilla JS + canvas, no build step, no framework). `sw.js` is the offline cache.
- New work is appended as blocks headed `// ================= 1.NN ...`. Later blocks often **wrap earlier functions** (`const _old=fn; fn=function(){...}`).
  Consequence, learned the hard way: a handler bound early (`el.onclick=fn`) keeps the OLD function. Bind through an arrow (`el.onclick=()=>fn()`), and test through the real button.
- Change surgically. Do not refactor or reorder working code.
- **Every feature that loads a file must have a fallback**: with the file missing the game must still run (no white screen). The suites test this.
- Release checklist: bump `VERSION` in `index.html`; in `sw.js` bump the cache name (`lantern-vNNN`) and the version text; add every new file name to the list in `sw.js`.

## Main globals (search for these)
`M` current map · `P` player · `S` save slot · `HOME` farm+house save (`localStorage['leahpp2d-home']`) · `IMG` loaded pictures · `T`=32 px tile ·
`MAPS` builders · `CACHE` built maps · `goMap(id,exitId)` · `walkable(m,tx,ty)` · `anyNear()` + `g9bButton()` the big context button ·
farm: `G9`, `g9b*` functions · house inside: `ROOM2` (data from `furn-plain.json`), `room2Build`, `room2Place`, `DECO2` (arranging), `F2PRICE` (shop), `pitTick` (ball pit), `slideGo`, `pianoOpen`, `bathAct`.

## Running and testing
```
npm install            # only for puppeteer
python3 -m http.server 8775 &
PORT=8775 node test_148_rings.js      # every suite prints one JSON line, then "errors N"
npm run test:house     # the house suites        npm run test:farm   # the farm suites
npm run test:ui        # PC/touch layouts, purple-gold menus, inventory scrolling, sounds, missing icons and BUG-11 book tabs, equipment previews and consumables
npm run test:bugs      # BUG-1–6 regressions: entrance, resize, requests/fallbacks, fishing, sitting and portable launch settings
```
Set `CHROME_EXE` if puppeteer should use a specific Chrome. All browser suites use the installed puppeteer package, and the 11 older Chrome paths now use CHROME_EXE. All URLs honor PORT; demo suites keep their original default ports. Older suites may still describe earlier scene behavior; checking their launch configuration does not check all their gameplay expectations. A change is not done until the suites it touches print `errors 0` and you have looked at a screenshot.
Write a new `test_NNN_name.js` for each release; drive the game the way a player does (real clicks/taps), because calling functions directly has hidden bugs before.

## Pictures and the asset pipeline
- Game pictures are **built by scripts from the `art-*.png` sources. Do not hand-edit the built files.**
  - Expanded equipment 1.57: `python3 build_equipment_157.py` builds `equipment-157.webp`, `outfit-157.webp`, `equipment-157.json` from `art-equipment-157.png` and `art-outfit-157.png`. Requires Pillow. Connected alpha shapes are grouped by source cell and packed so diagonal weapons never pick up a neighbor. 36 paintings, 253,705 runtime bytes; independent local fallbacks.
  - Quiet Gold UI: `python3 build_quietgold_art.py` builds `ui-quietgold-icons.webp`, `ui-quietgold-frames.webp` and `ui-quietgold-art.json` from `art-ui-quietgold-icons.png` / `art-ui-quietgold-frames.png`. Requires Pillow. Measured crop windows preserve the painter's uneven rows. These three runtime files total 179,580 bytes; original paintings are not downloaded by the game. Missing or invalid art keeps the procedural icons/CSS skin.
  - House inside: `python3 build_room_assets.py <folder with art-*.png> <folder with the guide scripts and json> <out>` writes
    `room-L1.jpg room-L2.jpg room-L3b.jpg furn-plain.png furn-plain.json furn-fine.png`. Needs pillow, numpy, opencv-python.
  - Farm scene: `compose_g9_full.py`, `build_g9_game.py` (see `MAP_PIPELINE.md`).
- The owner generates pictures himself in ChatGPT. Give him copy-paste prompts, each starting
  `Make 5 separate images, one after another. Each one must be a brand-new painting, not an edit or a copy of the previous image.`
  with the files to attach listed above the prompt. Never use the words scary, evil, demonic, blood. Enemies may look strong, never frightening.
- What worked for house furniture: a **paint-over guide**. Model the piece from small blocks, draw it in the room's own projection
  (`furniture_guides.py`, `house_step23_guides.py`), have the painter repaint the shapes. The floor is seen from straight above and upright sides at full height,
  so each piece shows its whole top and the one side facing the viewer. Plain two-tone boxes did NOT work; a guide must already look like the real thing.
- His pass mark for art is **9.5 / 10** on: camera angle matches the scene · the four views agree · looks good and real · other. Below that: write a new prompt. Measure (overlap with the guide), then look.

## Who owns which file (Claude and Codex work at the same time · owner's decision, 5 Oct 2026)
The whole game is one file, so the split is by **file ownership**, not by feature. Two agents never edit the same file.

| Files | Owner | The other agent may only |
|---|---|---|
| `index.html` | **Codex** | read it and test it |
| `sw.js`, `questions-index.json` | **Codex** | ask for a change through a written instruction |
| `q-*.json`, `qsrc_*.py`, `gen_math.py`, `build_questions.py`, `check_questions.py` | **Claude** | run them, never edit them |
| a new `test_*.js` | whoever wrote it | run it, never edit it (report a wrong test to the owner) |
| `BUG_REPORT.md`, `DESIGN_*.md`, `QUESTION_REVIEW_LOG.md` | **Claude** | read; Codex updates only the status table in `BUG_REPORT.md` |
| pictures, picture prompts, map/layout scripts | **Claude** | use them |

How the two work together:
- **Claude writes the spec and a test suite first** (a new file, so it collides with nothing). **Codex changes `index.html` until that suite passes.** Claude then re-runs the suites as an independent check.
- **Claude hunts bugs** by driving the game with puppeteer and writes them into `BUG_REPORT.md` with steps, measured evidence and a pass criterion. **Codex fixes them.**
- New things that can live in their own file (for example the three 18+ mini-games) Claude builds as a standalone trial page first; Codex moves them into the game.

Four rules that prevent collisions:
1. Fetch the newest `main` before every push. Never force-push.
2. Each agent pushes only files it owns. When Claude adds a data file, Codex adds its name to `sw.js` (for question files: `python3 check_questions.py --write-index`, then bump the cache name).
3. Claude edits `index.html` only if the owner says so, while Codex has no task running or queued.
4. Every task handed to Codex states a pass criterion as a number and names the suite to run.

Question bank status: **paused at age 9 by the owner (5 Oct 2026)**. Age 9 has all 5 subjects (825 questions, automatic checks pass, human spot-check still pending); ages 10–17 are not written. The launch condition in `DESIGN_CRYSTAL_JOB.md` (all of ages 9–17 before the crystal/job system opens to players) still stands until the owner changes it.

## Planned system (not built yet)
- `DESIGN_CRYSTAL_JOB.md`: the owner's plan for barriers round crystals, a second (job) experience value, and unlocking every activity with job points. Build it only when the owner says so, one step of its section 6 at a time. Its section 9 lists questions only the owner can answer.

## Bugs waiting to be fixed
- `BUG_REPORT.md`: bugs found by Claude's checks, each with steps to reproduce, measured evidence, a suggested fix and a pass criterion. Fix from there; update the status table in that file; write what you did at the top of the list in `HANDOFF_S13.md`.

## Where the history is
- `HANDOFF_S13.md`: everything decided and built, newest entries first in its "done" list, with measurements. Read the top entries before changing the house or farm.
- `GDD.md`, `STORY.md`, `ART_DIRECTION.md`, `MAP_PIPELINE.md`, `MAP_SPEC_G9.md`, `MAP_SPEC_H9.md`, `WORLD_ATLAS.md`, `GM_GUIDE.md`, `DEV_GUIDE.md`, `CLAUDE.md`: design and rules written earlier.

## Open items (5 Oct 2026, version 1.57)
- Waiting for the owner's answer: remove the Auto (auto-attack) button entirely or keep it on desktop only · what house levels 4-9 give.
- Fine furniture exists for 9 pieces; toilet, washstand, plant, round table, rug, wash tub, bookshelf, armchair, double bed have no fine version yet.
- Skill-slot screen (3 slots round the big button): needs a design first; today there is one weapon skill and two job-skill slots, no pool to choose from.
- Sitting pose on the slide and on benches, fishing cast pose (PixelLab art). Robot helper: the north-east walk frames are a mirrored stand-in.
- Village H9 scene, strawberry and corn crops, remaining game icons (1.50 adds 32px HUD/action artwork; 1.53 adds 12 matching menu pictures and readable toggle states), 5 world-map pictures (purpose not decided).
- BUG-3: 5 obsolete picture requests were removed in 1.51; 1.52 pauses the 6 future scene-art slots by default. When supplying their files, set `window.ENABLED_FUTURE_ART=['map-north.jpg', ...]` before the game script and add the supplied files to the service-worker cache list. `EMBED_ASSETS` images load without this opt-in. Missing enabled images still use the existing fallbacks. `test_152_future_art.js` is part of `npm run test:bugs`; see BUG_REPORT.md for measured results. BUG-4/5/6 are fixed.
- Farm report round 2 on main adds BUG-7–10: house-sign wording, upgrades above level 3, upgrade messages and shed level summary. Their original statuses are retained; BUG-8 requires the owner's decision. The menu-tab bug is BUG-11.
- **Leah has not play-tested.** That is the most useful next step.
- The owner chose the purple-and-gold UI. Version 1.53 has been checked in desktop/touch Chromium at 1366×768, 812×330 and 667×375; the 9.5+ visual/sound target still needs the owner's review and a real-phone play test. BUG-11 (book tabs disappearing after grid-bag actions) is fixed and covered by test_153_menu_icons.js in test:ui.

- Version 1.54 adds the adult equipment wardrobe: the existing 3 slots, a front-facing character with locally drawn type/rarity gear, equipment/consumables/collections tabs and 48 px touch grid cells. The world sprite and child tools bag retain their existing behavior. `test_154_equipment.js` checks real equip taps/clicks, a mouse drag, rendered pixel changes, inventory/save preservation, a touch scroll slider, potions, books and missing character sheets. The wardrobe can be viewed in portrait; gameplay still uses its existing rotation prompt.

- The owner selected proposal **05 Quiet Gold**. Version 1.55 uses thin gold frames and calmer plum surfaces across the HUD, menus, wardrobe and decorating/shop panels. Settings move the original seven toggle buttons into labeled cards; furniture-shop cards keep F2PRICE and f2Buy. Larger type-specific weapon pictures are generated locally; dragged canvas items copy their bitmap into the drag preview. `test_155_quiet_gold.js` covers real clicks/taps, settings redraws, English, nine original shop prices and a purchase, wardrobe illustrations, a visible drag preview/drop and portrait inventory. Keep gameplay behavior and the existing sounds when extending this theme.

- Version 1.56 adds original painted UI art: 24 icons plus four reusable frame/button skins. UI art loads asynchronously and keeps the existing menu nodes, equipment illustrations and sounds; missing icons and frames fall back independently. `test_156_art.js` checks PC/touch, missing assets, corrupt image bytes, invalid crop metadata and art arriving while a muted settings panel is open. Painted icons are 64px; procedural fallback icons remain 32px. `test:ui` now includes six suites. Real-phone play testing and the owner's 9.5+ art assessment are still pending.

- Version 1.57 adds 12 equipment slots: original eq/eqA/eqC + offhand, necklace, two rings, boots, bottoms, gloves, glasses, mouth decor. New slots use stable item UIDs in S.equipment157. One-handed weapons can use either hand; two-handed weapons occupy both slots. Existing bows/staves are treated as two-handed when resolving offhand conflicts; original save/item identities remain intact. Equip/unequip transactions roll back if displaced items cannot fit, and worn items cannot be sold/deposited. S.outfit157 selects masculine/feminine cuts on the same shirt/bottoms/boots with unchanged names, identities and stats. Mouth decor contributes no stats or cards.
- The owner chose **GM samples first**, with drops/prices/balance to decide later. `GM → อุปกรณ์ใหม่` / the bag header button opens 25 sample types and a full-outfit preset. Normal loot and prices are unchanged. Dual-weapon damage preview averages the weapon ATK; existing attacks/skills follow the right-hand type, or the left when the right is empty. This does not add simultaneous two-projectile attacks or walking-sprite outfits. Test the actual give/full-outfit/equip/style/deposit/withdraw buttons, both rings, full-bag rollback, reload and missing/delayed art. `test_157_equipment.js` joins test:ui (seven suites). Current wardrobe pictures are painted item icons plus locally drawn wearable overlays on the game's character. Real-phone testing and the owner's 9.5+ visual score remain pending.

- Version 1.58 keeps the explanation open after two wrong answers until the player presses the full-width 52 px Close button. Disable all four choices when finished to prevent duplicate rewards; crystal waking and rewards retain their original timing. `npm run test:questions` includes `test_158_quiz_close.js` (real ten-second waits and mouse/touch closing) and `test_questions_9.js`. Claude fixed the original whitespace errors; check_questions.py reports ERROR 0 / WARN 92.

- Version 1.61 fixes BUG-16: load only the question-age range supported by questionAgePolicy (currently 6–8 for every player, 15 files). pickQuestion uses that same policy with its original accuracy/level formulas. Boot before player selection uses the existing 60 embedded questions; start/save reload on age or slot changes, with epoch guards against stale results. Missing/corrupt files retain embedded fallback groups. Service-worker installation excludes q-*.json; files are cached when actually requested. test_159_question_loading.js counts real page/worker requests for all seven player ages, changes age/save through buttons, and tests a delayed missing-file response racing a complete newer load. Claude's test_questions_9.js loads its own age-9 fixtures and must not be edited. The three whitespace errors were fixed by Claude; check_questions.py now reports ERROR 0 / WARN 92.

## Never
- Never commit tokens or passwords. Never delete `art-*.png` sources or the guide scripts. Never ship without running the suites.
