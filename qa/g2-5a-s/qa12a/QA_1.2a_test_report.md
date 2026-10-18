# QA 1.2a test report (expected vs actual) · locked = qa_asset13.py @6b71b62 · 1.2a = qa_asset13.py in this commit

## Sets (mode 1.2 with FIX1_DIR) · locked = qa_asset13.py @6b71b62 · 1.2a = proposal

| set | expected 1.2a | actual 1.2a | locked | match |
|---|---|---|---|---|
| fix2 ca3d75b (Codex real) | 24/24 fail - | 24/24 fail - | 24/24 | yes |
| B2 mock | 22/24 fail 6 10' | 22/24 fail 6 10' | 23/24 | yes |
| B mock | 20/24 fail 6 10' V5a V5b | 20/24 fail 6 10' V5a V5b | 21/24 | yes |
| A mock | 19/24 fail 6 10' C2b V5a V5b | 19/24 fail 6 10' C2b V5a V5b | 20/24 | yes |
| fix1 12948e2 | 16/24 fail 10' C1 C3 C2 C2b C4a V5a V5b | 16/24 fail 10' C1 C3 C2 C2b C4a V5a V5b | 16/24 | yes |
| ea1dccc | 15/24 fail 5 8d 10' C1 C3 C2 C2b V5a V5b | 15/24 fail 5 8d 10' C1 C3 C2 C2b V5a V5b | 15/24 | yes |

## Negative tests (mode 1.2a) · must fail the listed gates, never crash, always 24 gates

| case | must fail | must NOT fail | actual fails | total | locked | ok |
|---|---|---|---|---|---|---|
| frame 12 px wide | 2 | - | 2 6 10' | 21/24 | 23/24 fail 10' | yes |
| body shifted 1 px left | 2 C2b | - | 2 6 6b 10' C2b G3 | 18/24 | 21/24 fail 6b 10' G3 | yes |
| rib in crystal centre column | C2 | - | 6 10' C2 C2b C4a C4b | 18/24 | 21/24 fail 10' C4a C4b | yes |
| rib 2 px wide | C2 C2b | - | 6 10' C2 C2b C4a | 19/24 | 20/24 fail 10' C2 C2b C4a | yes |
| copper under light beside rib | 5 C2 | - | 5 6 8c 10' C2 C2b C4a | 17/24 | 18/24 fail 5 8c 10' C2 C2b C4a | yes |
| crystal moved down 1 px | C4a | - | 6 10' C4a | 21/24 | 22/24 fail 10' C4a | yes |
| third rib column | C2 | - | 6 10' C2 C2b | 20/24 | 21/24 fail 10' C2 C2b | yes |
| ribs #67413A | C2 | - | 6 10' C2 | 21/24 | 22/24 fail 10' C2 | yes |
| #3D292C on inner rim | V5a | - | 6 10' V5a | 21/24 | 22/24 fail 10' V5a | yes |
| row 7 recoloured | G2 | - | 6 10' G2 | 21/24 | 22/24 fail 10' G2 | yes |
| row 7 px made transparent (shape) | G2 | - | 6 6b G2 | 21/24 | 22/24 fail 6 G2 | yes |
| row 5 px made opaque (shape) | G2 | - | 1d 2 6 6b 10' G2 G3 | 17/24 | 17/24 fail 1d 2 6 6b 10' G2 G3 | yes |
| x8: 1 off-centre px in a block | 6b | - | 6b | 23/24 | 24/24 fail - | yes |
| x8: 1 background px | 6b | - | 6b | 23/24 | 24/24 fail - | yes |
| transparent px saved as white (no shape change) | - | G2 | 6 10' | 22/24 | 22/24 fail 10' G2 | yes |
| no crystal | 5 8d | - | 5 6 8d 10' C4a C4b G2 G3 V5a V5b | 14/24 | CRASH | yes |
| no light layer | 5 | - | 5 6 8c 8d 10' C2 C2b C4a C4b G2 G3 V5a V5b | 11/24 | CRASH | yes |
| lantern at the right edge | 2 | - | 2 3 6 10' C2b G2 G3 | 17/24 | CRASH | yes |
| light file missing | 1a | - | 1a 1b 1c 1d 2 3 4 5 6 6b 7a 8c 8d 10' C1 C3 C2 C2b C4a C4b G2 G3 V5a V5b | 0/24 | CRASH | yes |

## Missing FIX1_DIR

- 1.2a: exit 1, message "needs FIX1_DIR", no TOTAL printed → ok
- locked: 21/21 PASS (G2/G3/10' silently skipped)

## Regression (modes 1 and 1.1 unchanged)

| mode | set | locked | 1.2a | same |
|---|---|---|---|---|
| 1 | delivery-12948e2 | 10/11 | 10/11 | yes |
| 1.1 | delivery-12948e2 | 17/17 | 17/17 | yes |
| 1 | delivery-ea1dccc | 11/11 | 11/11 | yes |
| 1.1 | delivery-ca3d75b | 15/17 | 15/17 | yes |

**ALL EXPECTATIONS MET: YES**
