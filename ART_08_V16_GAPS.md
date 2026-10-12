# Set08 spec16 — small-gap repair and accepted L3

The independently reproduced initial count is3,128 enclosed transparent pixels
in1,024 hair/body/direction compositions: head1,100, body2,028. Components use
4-connectivity and the entire component must contain1–3 pixels. The head/body
classification uses the component's top row (min y<=27), matching Claude's
per-hair counts. The previous pixel-by-pixel classification would assign14
pixels differently at row27/28 and give1,086/2,042; it does not change the total.

Repair converged in three passes, adding498 unique native pixels: the shared
layers mean one repair can resolve several compositions. Every addition was
transparent beforehand; existing opaque RGBA pixels changed0. Surrounding
visible hair supplies native hair colour in hairback/region hair; surrounding
body supplies native fixed cloth colour, with house region only when the
surrounding boundary is entirely scarf. No skin is added to hair. All34 face,
eyes, mouths and front-hair PNGs are byte-identical to main. Raw stays intact.

After repair: small enclosed groups1–3px0 across1,024 frames; spec14 head holes0;
all previous numerical acceptance checks pass. Height60–62, foot62, maximum
center error1.7976. JSON113,346 bytes; all58 layer PNGs plus three review PNGs
724,038 bytes. Owner art review of C2 eyes/mouths remains pending.

L3 accepted12×23 is now present in game row3, unscaled. Four usable levels,
32 game frames; raw preserved; grips and integer translations recorded in
kid-lantern.json. The historical v15 QA correctly keeps its original failed
size gate; spec16 acceptance is recorded separately in the live manifest.

Rebuild: build_kid8.py includes polish_kid8_tiny_gaps.py after C2 extraction.
Checks: validate_kid8.py includes the1–3px component criterion;
validate_kid8_c2.py and validate_asset08_lantern.py retain previous checks.
Credit cost0, read-only balance3,017. Trial128 production follows this commit.
