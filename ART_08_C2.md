# Set 08 C2 — spec 15

Replaces the rejected C1 eyes/mouths with native PixelLab features from the
owner-selected heads. Files remain 512×64, eight64×64 cells, S SE E NE N NW W SW.
Face, body, hair and repaired hairback pixels are unchanged from stage A.

Eyes1–9: H-F1, H-F2, H-F4, H-F5, H-F7, H-M2, H-M3, H-M4, H-M6.
Mouths1–8: H-F1, H-F2, H-F4, H-F5, H-F7, H-F8v2, H-M6, H-M8.
All native transfers use the same raw direction and integer translations.
Skin borders use the common face ramp by source brightness rank. Mouth pigment,
iris/eye pixels and skin have separate, non-overlapping RLE regions. Native RGB
may occur in more than one group; recolouring must use regions, not global RGB.

The owner explicitly approved additional frontal eye reflection and redrawing
side mouths to retain the frontal expression in this chat. All nine frontal
pairs use a native eye and its reflection; eyes1/2 place their original glint
in the upper-left of both irises. Eye7 remains the native closed-smile curve.
Toothy mouths1/6/8 receive missing side teeth, and mouth2 retains a small open
mouth in side/diagonal views. No source image or runtime piece was resampled.
Every native pixel and authorized redraw is listed in `kid8-c2-qa.json`;
selection masks and source SHA256 values make the extraction reviewable.

Validation: 58 layers; 464 native layer frames. All1024 hair/body/direction
composites retain height60–62, foot62, center error≤2 and zero head holes.
Eyes/mouths stay inside the face; mouth-edge and all360 expression-pair overlap
counts are zero. Every mouth is one8-connected component. Frontal symmetry
mask differences0; far eyes≥2px; E/W height difference≤1; rear expressions0;
partial alpha0; region off-palette pixels0. Defaults f=eyes1/mouth1,
m=eyes6/mouth8. Numeric checks do not assign an owner art score.

Frontal near-duplicates (RGBA difference≤6 pixels), retained as requested:
mouth2/5=6; 3/4=4; 3/5=4; 3/6=6; 3/7=5; 4/5=3; 4/6=6;
4/7=4; 5/6=6; 5/7=4. No eye pair meets that threshold. Silhouette-only
comparisons are also recorded separately in the C2 QA file.

Review: `kid8-eyes-c2.png`, `kid8-mouth-c2.png`, each row numbered, S SE E W SW,
5× nearest-neighbour on face1 + double-bun hair6. `kid8-preview.png` is4×.
Lossless PNG encoding preserves decoded RGB exactly; all58 runtime PNGs plus
all three review PNGs total723,183 bytes; `kid8.json`112,782 bytes.

Rebuild: `python build_kid8.py` now runs base extraction, spec14 hole repair,
C2 feature extraction, then the current overview. Validation:
`python validate_kid8.py` and `python validate_kid8_c2.py`.
A full rebuild reproduced all58 layer PNGs, metadata and three previews byte
for byte. Zero credits used; read-only balance3,029 before the L2/L3 stage.
