# Set08 lantern continuation — specs14/15

L2 passed. L3 is delivered as raw/review only: its8-connected main component
is12×23 in every direction, one pixel above the13×22 cap. The raw bounds are
[10,4,22,27], exclusive maximum. There are no disconnected pixels to remove.
Production stopped, with no resize, cropping, repaint or repeat generation.

L2: job11da5596-0d57-465c-87a8-d8dceb8d105f,6 credits,3,029→3,023.
L3: jobe77acfb1-f8a2-4b81-9c47-97cd98868122,6 credits,3,023→3,017.
New spend12; including prior OF2v2/L1,24/25. Final3,017≥3,016.
One create call per level; same job IDs polled until completion. No timeouts
or resubmissions. Prompts match spec13 exactly (728/738 characters, hashes in
QA). Both use the unscaled32×32 S frame of L0 as style_image.

Raw `kid-lantern-l2-raw.png` and `kid-lantern-l3-raw.png`:256×32,8 directions
S SE E NE N NW W SW. All16 raw frames match the downloaded ZIP pixels exactly.
L2:12–13×22, disconnected pixels0, partial alpha0, blue/cyan0.
L3:12×23, disconnected pixels0, partial alpha0, blue/cyan0. Both retain the
warm lantern family without an external glow halo; art approval stays with
owner. The remaining issue is L3 height, not an image-download failure.

`kid-lantern.png`:256×128, L0–L2 usable, L3 row transparent pending a revised
acceptance decision. `kid-lantern.json` has four level records; rejected L3
includes8 raw-frame bounds/grips/hashes under `rejected_raw_frames`, and an
empty game `frames` list. `production_complete=false`, `size_pass=false`,
`runtime_size_pass=true`, `usable_levels=[0,1,2]`, `unavailable_rows=[3]`.
Consumers must not treat the reserved fourth row as a completed L3.
Only the previously authorized two L1 E stray pixels are removed from the
game sheet; all raw files remain intact. Every game grip and integer shift
is recorded. No runtime sprite is resampled.

`kid-lantern-review-6x.png`: all4 generated levels,8 directions, enlarged6×,
L3 clearly marked FAIL12×23. `kid-lantern-6x.png`:6× copy of the game sheet.
`kid-lantern-v15-qa.json`: billing, job IDs, raw hashes, size gates, ZIP pixel
checks and integrity validation. Assembly and checks are repeatable with
`assemble_asset08_lantern_v15.py`, `preview_asset08_lantern_review.py` and
`validate_asset08_lantern.py` (no API calls).

Owner/Claude decision outstanding: revised L3 size acceptance or instructions
for pixel-level alteration. The current spec does not authorize either.
