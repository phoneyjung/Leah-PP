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
```
Set `CHROME_EXE` if puppeteer should use a specific Chrome. The suites from `test_112` on are portable; 11 older ones still name paths of the machine they were written on. A change is not done until the suites it touches print `errors 0` and you have looked at a screenshot.
Write a new `test_NNN_name.js` for each release; drive the game the way a player does (real clicks/taps), because calling functions directly has hidden bugs before.

## Pictures and the asset pipeline
- Game pictures are **built by scripts from the `art-*.png` sources. Do not hand-edit the built files.**
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

## Where the history is
- `HANDOFF_S13.md`: everything decided and built, newest entries first in its "done" list, with measurements. Read the top entries before changing the house or farm.
- `GDD.md`, `STORY.md`, `ART_DIRECTION.md`, `MAP_PIPELINE.md`, `MAP_SPEC_G9.md`, `MAP_SPEC_H9.md`, `WORLD_ATLAS.md`, `GM_GUIDE.md`, `DEV_GUIDE.md`, `CLAUDE.md`: design and rules written earlier.

## Open items (4 Oct 2026, version 1.48)
- Waiting for the owner's answer: remove the Auto (auto-attack) button entirely or keep it on desktop only · what house levels 4-9 give.
- Fine furniture exists for 9 pieces; toilet, washstand, plant, round table, rug, wash tub, bookshelf, armchair, double bed have no fine version yet.
- Skill-slot screen (3 slots round the big button): needs a design first; today there is one weapon skill and two job-skill slots, no pool to choose from.
- Sitting pose on the slide and on benches, fishing cast pose (PixelLab art). Robot helper: the north-east walk frames are a mirrored stand-in.
- Village H9 scene, strawberry and corn crops, game icons (5 style prompts sent, no choice yet), 5 world-map pictures (purpose not decided).
- Not cleaned: 11 requests for optional pictures that do not exist yet (6 are slots for future scene art), a duplicate `rollFish`.
- **Leah has not play-tested.** That is the most useful next step.

## Never
- Never commit tokens or passwords. Never delete `art-*.png` sources or the guide scripts. Never ship without running the suites.
