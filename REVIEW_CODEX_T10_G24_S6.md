# T10 — ตรวจซ้ำ G2.4 S6 v1.2

**ผ่าน R1–R7 ทั้ง 7 ข้อ** · ชุดหลัก **38/38, exit 0** · บังคับ S0 ตกหนึ่งข้อแล้วรันทั้งชุด **37/38, exit 1** · ไม่พบบั๊ก runtime ใหม่ในขอบเขตที่ตรวจ (0 ข้อ) · มีข้อเสนอเพิ่มความครอบคลุม S8q ด้านล่าง ซึ่งไม่ใช่บั๊ก runtime ที่ยืนยัน

ฐาน `claude/g2-pilot @56d3d8cbd402f6ce9f6fb385ce0b14005b06548e` · วันที่ 1 พ.ย. 2569 (UTC+7) · เริ่มหลังส่ง T9 `da0aaffb6b7bf86fb310c5b02ae073dc3f07bf59` แล้ว · อ่าน RESPONSE_T7.md และ diff ทั้งสามไฟล์จาก f3ec512 · เครดิต 0

## วิธีตรวจและขอบเขต

ทดสอบสำเนาไฟล์ฐานที่แยกไว้; ต้นฉบับของ Claude ไม่เปลี่ยน Git blob ของสามไฟล์ที่ทดสอบตรงฐาน:

| ไฟล์ | Git blob |
|---|---|
| pilot-g2-scene.html | 2a1700093489d7098493f78ace5157f20e4337f6 |
| test_g2_scene.py | b7a0de98a7c59bfdf9b5a5978c33d77aaa764022 |
| qa/g2-4-scene/tools/trees.py | dd95632b960d8a726e80826d3bfe91d285164c90 |

Chromium 151.0.7922.173 · Python /tmp/t7-venv (Pillow/NumPy/scikit-image/Playwright) · phone 844×390 DPR 2.625 และ iPad 1180×820 DPR 2 ตามชุดทดสอบ · local HTTP server เท่านั้น · ผล/สคริปต์ probe อยู่ /tmp ไม่ส่งลง branch

```sh
# ทำงานที่ root สำเนาฐาน; server เปิดอีก process
python3 -m http.server 8780 --bind 127.0.0.1
python3 -I test_g2_scene.py 8780 /tmp/t10-out
# 38/38; exit 0
python3 -I qa/g2-4-scene/tools/trees.py
# exit 0
```

ตั้ง PATH ให้ python3 เป็น /tmp/t7-venv/bin/python3 และ PLAYWRIGHT_BROWSERS_PATH=/tmp/t7-browser; ใช้ system Chromium ผ่าน path ของ Playwright ไม่มีการแก้ test เพื่อให้ชุดหลักผ่าน

## R1–R7

| ข้อ | ผล | หลักฐานที่ลองซ้ำ / ตำแหน่งแก้ |
|---|---|---|
| R1 เมาส์ปล่อยนอกแผง | ผ่าน | pilot-g2-scene.html:386–388 จับ pointer และปล่อยที่ window. Probe กด N 250 ms ลาก 10 steps ไป (400,150), mouse.up แล้วอ่านทันที: moving=false, PADP=0; ตำแหน่ง [522.3420143796578,350.34201437965766] ก่อน/หลังรอ 550 ms ตรงทุกค่า (Δx=Δy=0). ขณะกด moving=true/PADP=1; pageerror=0. การลากผ่านปุ่มข้างเปลี่ยนทิศได้ตามเจตนา แต่ปล่อยแล้วหยุด |
| R2 บ้านสำรองบังเด็กในประตู | ผ่าน | pilot-g2-scene.html:296 วาดกำแพงรอบช่อง ไม่เติมช่องทับเด็ก. Probe block เฉพาะ g24-hut.png, เดินจริง (9,10)→(7,8): path=3, done=true, feet=[224,268], inDoor=true. ปิด hold และ GM overlay เพื่อกันตะเกียง/ข้อความนับแทนเด็ก แล้วเปรียบเทียบภาพมีเด็กกับ canvas เปล่าขนาดเท่า idle sheet: ต่าง **24,669 canvas pixels** (scale=3; canvas 2216×1024), hutLoaded=false, errors=0. เปิดภาพ probe แล้วเห็นเด็กในช่องจริง ตัวเลขนี้ไม่ใช่จำนวนพิกเซล sprite ต้นทาง |
| R3 anchor/fist เสียรายเฟรม | ผ่าน | pilot-g2-scene.html:146–152 ตรวจรูปแบบก่อน buildFists/lanternTarget. Route JSON เปลี่ยน idle_hold.S[0].anchor เป็น object และ walk_hold.E[2].fist=[[1,'a']]. S idle0: target/lpos=null, lan=false; E walk2: target/lpos=[54,75], finite=true, fist=false; S idle1: target/lpos=[34,76], lan=true, fist=true. ทั้งสามอ่าน curFrame ยืนยันตรง 0/2/1; เข้า cave แล้วเฟรมเสียยังวาดได้, lum=41.533, loopErr=null/pageerror=0. **fist เสียอย่างเดียวไม่ต้องซ่อนตะเกียง** เพราะ anchor ยังถูก; ตรง RESPONSE_T7 ข้อ 1 แม้ชื่อ S8q จะย่อจนชวนเข้าใจผิด |
| R4 S8g teleport ทำให้ผ่านลวง | ผ่าน | test_g2_scene.py:232 เก็บ walked/autoOk ก่อน teleport: 7/7 กรณีได้ [20,9], autoOk=true, steps=4 และ buildErrors/js_errors/loopErr=0. Negative probe ปิด `PS.goto=()=>null` ในหน้า browser ที่ block g24-* แล้วรัน JS ของ S8g: walked=[16,11], autoOk=false, steps=null; assertion การเดิน **ไม่ผ่าน** แม้ภายหลังยัง teleport ไปถ่ายรูปอยู่ |
| R5 S8k ไม่ได้ยกนิ้วจริง | ผ่าน | test_g2_scene.py:257–264 ใช้ touchEnd พร้อม assert d2 และจำนวน pointer. Probe CDP แยก has_touch=true พร้อม event log: pointerdown N(id2), pointerdown E(id3), **pointerup N(id2)** แล้ว pointerup E(id3); state N/true/1 → E/true/2 → E/true/1 → E/false/0. จึงพิสูจน์ว่ามียกนิ้ว ไม่ใช่แค่ touchMove |
| R6 FAIL แต่ exit 0 | ผ่าน | test_g2_scene.py:336 คืน sys.exit ตามยอดจริง. รันชุดปกติได้ 38/38 exit 0. ทำ mutation ใน AST ในหน่วยความจำของสำเนา execution: เปลี่ยน condition ของ `ok()` ข้อแรก (S0) เป็น False เพียงจุดเดียว แล้วรัน **ทั้ง runner** ต่อด้วยไฟล์เกมและ assets เดิม: **37/38 exit 1**; FAIL เดียวคือ S0 ที่จงใจทำให้ตก. ไม่ใช่เพียงเรียก sys.exit(1) แยก และไม่ได้แก้ไฟล์ test ของ Claude |
| R7 trees.py วางของไม่ตรงหน้า | ผ่าน | trees.py:22–23 คืน TL=(cx×32,cy×32), sort=cy×32+30 ตรง pilot-g2-scene.html:172. รันจริง: TREES 16/ bushes 42/ walk_behind 24/ in_slime_zone=[]; TREES ตรง constant หน้า 16/16 และตรง output เดิม f3ec512 ทุกค่า; ชุด 24 ช่องบังตรงเดิมทุกช่อง. S4d วัด runtime placement แล้ว bad=[] |

## S8o / S8p / S8q วัดของจริงหรือไม่

- **S8o (test:265–267): วัดปัญหาเดิมจริง** — ส่ง mouse down/move/up ผ่าน browser, assert moving=false, pointer=0 และตำแหน่งหยุด; probe ข้างต้นตรวจทั้ง x/y ทันทีหลังปล่อยเพิ่ม ไม่พึ่งแค่ค่าปัดหนึ่งตำแหน่งและช่วงรอ 100 ms ของชุดหลัก
- **S8p (test:286–291): วัดภาพที่วาดจริง** — block asset, เดินเข้าประตู, อ่าน canvas ก่อน/หลังซ่อน sprite. ไม่ใช่ assert ลำดับ sort อย่างเดียว; probe ปิด hold/GM ยืนยันว่าความต่าง 24,669 มาจากภาพตัวละคร ไม่ใช่ตะเกียง. ยังเป็นตัวแทนทิศ N หนึ่งตำแหน่งในบ้านสำรอง ไม่ใช่ตรวจ pixel-perfect ทุก pose (S2b 400 poses ครอบคลุมบ้านภาพจริงแยกต่างหาก)
- **S8q (test:292–301): จับ invalid anchor + การกลับมาเฟรมปกติจริง** — route เปลี่ยน JSON ก่อน boot, วาดจริงและ assert finite/no-lan ของ S0 แล้วมี lantern S1; error รวมถูกตรวจท้าย S8i. ข้อความ “that frame draws no lantern” ใช้กับ anchor เสีย ไม่ใช่ fist เสีย: ผล walkE2.lan=true ถูกต้อง. **ข้อเสนอเพิ่ม coverage:** assert FIST.walk.E[2] เป็น null โดยตรง และ assert cave mode/ความสว่างในเฟรม anchor เสีย; ปัจจุบัน S8q เก็บ cave ไว้แต่ไม่ assert และไม่วัดแสงสำรอง จึงไม่ควรอ้างว่า PASS นี้พิสูจน์แสงสำรองด้วยตัวเอง. Probe T10 วัดจริงแล้ว lum 41.533 และ fist=false. ยังไม่ได้ทำ mutation ครอบคลุมทุกเส้นทางของ fallback

## ตัวเลขอื่นจากชุดหลัก

- เส้นทางเดิน 60/60; เดินซ้ำ trace ตรง 60/60; เข้าประตู 10/10; 400 poses บังส่วนหัว/ตัว/ขา 0
- y-sort ทุก 75 objects + 1 slime × 16 = **1,216/1,216** รวม rope; ตรง placement spec, bad=[]
- สไลม์ 3 ตัว × 180 s วัดทุก 16 ms: drawnLitPx=0, drawnLitFrames=0, outOfZone=0, ครบ 8 ทิศ, bob 0–3 จำนวนเต็ม. เขต layout=47 ช่อง; ช่องที่สไลม์เดินได้จริง=36 ตามผลแยกคนละนิยาม
- S8g 7/7 และ S8g2 พบภาพ fallback; S8k ยกนิ้วจริงผ่าน; S8o/p/q ผ่าน; S8i page/console errors=0
- median FPS CPU4×: scene **60.3**, cave **52.0**, dark **60.3**; scene/cave **1.160** ≥0.9; draw CPU1× **2.57 ms**. ตัวเลขขึ้นกับเครื่องและติดเพดาน refresh ~60 Hz; ไม่ใช้แทน FPS มือถือจริง

## พบใหม่ / สิ่งที่ยังไม่รับแทนเจ้าของ

ไม่พบบั๊ก runtime ใหม่ที่ยืนยันได้ในขอบเขต T10; ข้อเสนอ S8q ข้างต้นเป็นขอบเขตการพิสูจน์ของชุดทดสอบ ไม่ใช่การอ้างว่าหน้าปัจจุบันวาดผิด. ไม่ได้ตรวจความปลอดภัย/ข้อมูลเสียทุกชนิดหรือ benchmark มือถือจริง. คะแนน QG-4 ข้อ 7 และลีอาลองเล่นยังรอเจ้าของตาม RESPONSE_T7; ไม่ได้ปิด gate หรือแก้โค้ดให้เอง

## วิธีทำซ้ำ negative run ของ R6 โดยไม่แก้ไฟล์ Claude

เปิด server ของ checkout เดิมที่ port 8782 แล้วรันสคริปต์ชั่วคราวนอก repo นี้ (ใช้ environment Playwright เดียวกับชุดหลัก):

```python
import ast, sys
from pathlib import Path
p = Path('/absolute/path/to/checkout/test_g2_scene.py')
tree = ast.parse(p.read_text(), filename=str(p))
for node in tree.body:
    if (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
        and isinstance(node.value.func, ast.Name) and node.value.func.id == 'ok'):
        node.value.args[1] = ast.Constant(False)
        break
ast.fix_missing_locations(tree)
sys.argv = [str(p), '8782', '/tmp/t10-negative-out']
exec(compile(tree, str(p), 'exec'), {'__name__': '__main__', '__file__': str(p)})
# FAIL S0 page source: ...
# ข้ออื่น PASS 37 ข้อ
# 37/38 ; process exit 1
```

## หลักฐานผลที่เก็บในรอบนี้

### ชุดหลัก

```text
PASS S8q a bad entry in the hold-anchor file (one anchor an object, one fist point text): that frame draws no lantern and no NaN, the next frame draws it again, no error | {"idleS0": {"hold": true, "lpos": null, "lan": false, "finite": true}, "walkE2": {"lan": true, "finite": true}, "idleS1": {"lan": true}, "cave": "cave", "loopErr": null}
PASS S8h FPS of the scene >= 90 % of the Pilot motion page in its cave view (the existing view with the same work: floor art + darkness + held lantern) · 4x CPU · rAF 2 s · walking · median of 5 · the empty dark grid view and draw ms reported | {"cave": [50.2, 52.8, 52.4, 52.0, 47.4], "dark": [60.3, 60.3, 60.3, 60.3, 60.3], "scene": [60.3, 60.3, 60.3, 60.3, 60.3], "median": {"cave": 52.0, "dark": 60.3, "scene": 60.3}, "scene_vs_cave": 1.16, "scene_vs_empty_dark_grid": 1.0, "draw_ms_cpu1x": 2.57}
PASS S8i JS errors 0 across every page load (page errors + console errors; blocked-file loads count page errors only) | []
38/38
process exit 0
```

results.json SHA-256: `8f27d4fc968b00155a33e594f2c792815d18b42d8a7051c257ce5bce7cdcd940`

### Negative R6

```text
PASS S8q a bad entry in the hold-anchor file (one anchor an object, one fist point text): that frame draws no lantern and no NaN, the next frame draws it again, no error | {"idleS0": {"hold": true, "lpos": null, "lan": false, "finite": true}, "walkE2": {"lan": true, "finite": true}, "idleS1": {"lan": true}, "cave": "cave", "loopErr": null}
PASS S8h FPS of the scene >= 90 % of the Pilot motion page in its cave view (the existing view with the same work: floor art + darkness + held lantern) · 4x CPU · rAF 2 s · walking · median of 5 · the empty dark grid view and draw ms reported | {"cave": [45.4, 45.2, 49.4, 45.3, 49.5], "dark": [60.3, 59.8, 60.4, 60.4, 60.4], "scene": [59.5, 60.3, 60.4, 60.3, 60.3], "median": {"cave": 45.4, "dark": 60.4, "scene": 60.3}, "scene_vs_cave": 1.328, "scene_vs_empty_dark_grid": 0.999, "draw_ms_cpu1x": 2.5}
PASS S8i JS errors 0 across every page load (page errors + console errors; blocked-file loads count page errors only) | []
37/38
process exit 1
```

results.json SHA-256: `8353085bd00ac4a33efa836b88273f127efa74765b99bde93af6bbaa0c2bfffd`

ผล probe ที่บันทึก (ไม่มี token/secret):

```json
{
  "R1": {
    "held": {
      "moving": true,
      "pointers": 1
    },
    "immediately_after_release": {
      "moving": false,
      "pos": [
        522.3420143796578,
        350.34201437965766
      ],
      "pointers": 0
    },
    "after_550ms": {
      "moving": false,
      "pos": [
        522.3420143796578,
        350.34201437965766
      ],
      "pointers": 0
    },
    "errors": []
  },
  "R2": {
    "path": 3,
    "pos": [
      224,
      268
    ],
    "inDoor": true,
    "done": true,
    "hutLoaded": false,
    "hold": false,
    "changedCanvasPixels": 24669,
    "scale": 3,
    "canvas": [
      2216,
      1024
    ],
    "errors": []
  },
  "R3": {
    "frames": [
      {
        "dir": "S",
        "anim": "idle",
        "fi": 0,
        "cur": 0,
        "anchor": null,
        "lpos": null,
        "lan": false,
        "finite": true,
        "fist": true
      },
      {
        "dir": "E",
        "anim": "walk",
        "fi": 2,
        "cur": 2,
        "anchor": [
          54,
          75
        ],
        "lpos": [
          54,
          75
        ],
        "lan": true,
        "finite": true,
        "fist": false
      },
      {
        "dir": "S",
        "anim": "idle",
        "fi": 1,
        "cur": 1,
        "anchor": [
          34,
          76
        ],
        "lpos": [
          34,
          76
        ],
        "lan": true,
        "finite": true,
        "fist": true
      }
    ],
    "cave": {
      "mode": "cave",
      "lan": false,
      "lum": 41.532999355555916
    },
    "loopErr": null,
    "errors": []
  },
  "R4_negative": {
    "walked": [
      16,
      11
    ],
    "autoOk": false,
    "steps": null,
    "accepted_by_walk_assertion": false
  },
  "R5": {
    "states": [
      {
        "dir": "N",
        "moving": true,
        "pointers": 1,
        "events": [
          [
            "pointerdown",
            2,
            "N"
          ]
        ]
      },
      {
        "dir": "E",
        "moving": true,
        "pointers": 2,
        "events": [
          [
            "pointerdown",
            2,
            "N"
          ],
          [
            "pointerdown",
            3,
            "E"
          ]
        ]
      },
      {
        "dir": "E",
        "moving": true,
        "pointers": 1,
        "events": [
          [
            "pointerdown",
            2,
            "N"
          ],
          [
            "pointerdown",
            3,
            "E"
          ],
          [
            "pointerup",
            2,
            "N"
          ]
        ]
      },
      {
        "dir": "E",
        "moving": false,
        "pointers": 0,
        "events": [
          [
            "pointerdown",
            2,
            "N"
          ],
          [
            "pointerdown",
            3,
            "E"
          ],
          [
            "pointerup",
            2,
            "N"
          ],
          [
            "pointerup",
            3,
            "E"
          ]
        ]
      }
    ],
    "errors": []
  }
}
```

ต่างจากสเปก: ไม่มี · ส่งเฉพาะรายงานนี้ + CODEX_STATUS 1 บรรทัด; ไม่ commit logs/probe/test mutation
