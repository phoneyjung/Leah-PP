#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_questions.py - ตัวตรวจคลังคำถามของ Lantern Academy (DESIGN_CRYSTAL_JOB.md ข้อ 4.7)

ใช้งาน (รันในโฟลเดอร์ที่มีไฟล์ q-*.json):
  python3 check_questions.py                   ตรวจทั้งคลัง + questions-index.json + sw.js
  python3 check_questions.py q-math-9.json     แสดงผลเฉพาะไฟล์นี้ (ยังเทียบ id และโจทย์ซ้ำกับทั้งคลัง)
  python3 check_questions.py --review q-thai-9.json   พิมพ์ใบสุ่มตรวจ 10% ให้คนตรวจ
  python3 check_questions.py --write-index     เขียน questions-index.json ใหม่จากไฟล์จริง และเติมชื่อไฟล์ที่ขาดใน sw.js
  python3 check_questions.py --selftest        ทดสอบตัวตรวจเองด้วยไฟล์ที่จงใจทำผิด

ผล: ERROR = ต้องแก้ก่อนปล่อย (โปรแกรมจบด้วยรหัส 1) · WARN = ควรดู ไม่บังคับ
ไม่ใช้ไลบรารีนอก Python มาตรฐาน
"""
import json, re, sys, os, glob, math, random, unicodedata, collections, datetime
from fractions import Fraction
from decimal import Decimal

SUBJECTS = {'math': 'ma', 'english': 'en', 'thai': 'th', 'chinese': 'zh', 'general': 'gk'}
REQUIRED = {'age', 'subject', 'topic', 'level', 'answer', 'th', 'en', 'id'}
OPTIONAL = {'speak', 'speakLang', 'audioFirst', 'needs'}
SPEAK_LANGS = {'zh-CN', 'en-US', 'en-GB', 'th-TH'}
NEW_AGE = 9                      # ไฟล์อายุ 9 ขึ้นไปใช้เกณฑ์เต็ม · ไฟล์เดิม (6-8) ข้อบกพร่องบางชนิดเป็นแค่คำเตือน
COUNT_RANGE = (160, 170)         # "ราว 165 ข้อต่อไฟล์"
LEN_WARN = {'q': 140, 'choice': 45, 'explain': 200}
BAD_TOKENS = ['undefined', 'NaN', '[object', 'TODO', 'FIXME', '\ufffd', '{', '}']
TH = re.compile(r'[\u0E00-\u0E7F]')
LATIN = re.compile(r'[A-Za-z]{3,}')
FNAME = re.compile(r'^q-([a-z]+)-(\d+)\.json$')


def norm(s):
    """ทำให้เทียบข้อความได้: รวมรูปยูนิโคด ตัดช่องว่างซ้ำ ตัวพิมพ์เล็ก"""
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', str(s))).strip().lower()


def digits(s):
    return re.findall(r'\d+(?:\.\d+)?', str(s).replace(',', ''))


class Report:
    def __init__(self):
        self.items = []          # (sev, code, file, id, msg)

    def add(self, sev, code, f, qid, msg):
        self.items.append((sev, code, f, qid or '-', msg))

    def err(self, code, f, qid, msg): self.add('ERROR', code, f, qid, msg)
    def warn(self, code, f, qid, msg): self.add('WARN', code, f, qid, msg)
    def count(self, sev, f=None): return sum(1 for i in self.items if i[0] == sev and (f is None or i[2] == f))


# ---------- คำนวณซ้ำอีกทางสำหรับโจทย์คณิตที่อ่านรูปแบบได้ ----------
_NUM = r'(\d[\d,]*(?:\.\d+)?)'
_ARITH = re.compile(r'^' + _NUM + r' ([+\-−×÷]) ' + _NUM + r' = \?$')
_FRAC = re.compile(r'^(\d+)/(\d+) ([+\-−]) (\d+)/(\d+) = \?$')


def recompute(qtext):
    """คืนค่าที่ถูก (Fraction) ถ้าอ่านโจทย์ออก ไม่งั้นคืน None"""
    m = _FRAC.match(qtext)
    if m:
        a, b = Fraction(int(m[1]), int(m[2])), Fraction(int(m[4]), int(m[5]))
        return a + b if m[3] == '+' else a - b
    m = _ARITH.match(qtext)
    if m:
        a, b = Fraction(Decimal(m[1].replace(',', ''))), Fraction(Decimal(m[3].replace(',', '')))
        op = m[2]
        if op == '+': return a + b
        if op in '-−': return a - b
        if op == '×': return a * b
        if op == '÷' and b != 0: return a / b
    return None


def as_number(choice):
    c = str(choice).replace(',', '').strip()
    if re.fullmatch(r'\d+/\d+', c):
        n, d = c.split('/')
        return Fraction(int(n), int(d)) if int(d) else None
    if re.fullmatch(r'\d+(\.\d+)?', c):
        return Fraction(Decimal(c))
    return None


# ---------- ตรวจหนึ่งข้อ ----------
def check_question(q, fname, subject, age, R):
    qid = q.get('id') if isinstance(q, dict) else None
    if not isinstance(q, dict):
        R.err('E03', fname, None, 'ข้อนี้ไม่ใช่ object'); return False
    strict = age >= NEW_AGE
    soft = R.err if strict else R.warn
    missing, extra = REQUIRED - q.keys(), q.keys() - REQUIRED - OPTIONAL
    if missing: R.err('E03', fname, qid, 'ขาดช่อง: ' + ', '.join(sorted(missing)))
    if extra: R.err('E03', fname, qid, 'มีช่องที่เกมไม่รู้จัก: ' + ', '.join(sorted(extra)))
    if missing: return False
    if q['age'] != age or q['subject'] != subject:
        R.err('E04', fname, qid, f"age/subject ในข้อ ({q['age']}/{q['subject']}) ไม่ตรงกับไฟล์ ({age}/{subject})")
    if not (isinstance(q['topic'], str) and re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', q['topic'])):
        R.err('E05', fname, qid, f"topic ต้องเป็นตัวพิมพ์เล็กคั่นด้วยขีด: {q['topic']!r}")
    lv = q['level']
    if not (isinstance(lv, int) and not isinstance(lv, bool) and 1 <= lv <= 12):
        R.err('E06', fname, qid, f'level ต้องเป็นจำนวนเต็ม 1-12: {lv!r}')
    elif abs(lv - (age - 5)) > 1:
        R.warn('W04', fname, qid, f'level {lv} ห่างจากค่าปกติของอายุ {age} (คือ {age - 5}) เกิน 1')
    ans = q['answer']
    ans_ok = isinstance(ans, int) and not isinstance(ans, bool) and 0 <= ans <= 3
    if not ans_ok: R.err('E07', fname, qid, f'answer ต้องเป็น 0-3: {ans!r}')
    # id
    pre = SUBJECTS.get(subject, '??')
    pat = rf'{pre}-{age}-\d{{4}}' if strict else rf'{pre}-(\d{{4}}|{age}-\d{{4}})'
    if not (isinstance(qid, str) and re.fullmatch(pat, qid)):
        R.err('E10', fname, qid, f"id ผิดรูปแบบ ต้องเป็น {pre}-{age}-0001" if strict else f'id ผิดรูปแบบ: {qid!r}')
    # สองภาษา
    lang_ok = True
    for L in ('th', 'en'):
        b = q[L]
        if not isinstance(b, dict) or set(b.keys()) != {'q', 'choices', 'explain'}:
            R.err('E08', fname, qid, f'{L}: ต้องมี q, choices, explain เท่านั้น'); lang_ok = False; continue
        ch = b['choices']
        if not (isinstance(ch, list) and len(ch) == 4 and all(isinstance(c, str) and c.strip() for c in ch)):
            R.err('E08', fname, qid, f'{L}: ตัวเลือกต้องมี 4 ข้อ เป็นข้อความที่ไม่ว่าง'); lang_ok = False; continue
        for k in ('q', 'explain'):
            if not (isinstance(b[k], str) and b[k].strip()):
                R.err('E08', fname, qid, f'{L}.{k} ว่าง'); lang_ok = False
        if not lang_ok: continue
        if len({norm(c) for c in ch}) < 4:
            R.err('E09', fname, qid, f'{L}: ตัวเลือกซ้ำกัน {ch}')
        for k, texts in (('q', [b['q']]), ('choice', ch), ('explain', [b['explain']])):
            for s in texts:
                if s != s.strip() or '  ' in s or any(ord(c) < 32 for c in s):
                    R.err('E17', fname, qid, f'{L}.{k}: มีช่องว่างเกินหรืออักขระควบคุม: {s!r}')
                for tok in BAD_TOKENS:
                    if tok in s:
                        R.err('E17', fname, qid, f'{L}.{k}: มีข้อความที่ดูเป็นเศษโค้ด {tok!r}: {s!r}')
                if len(s) > LEN_WARN[k]:
                    R.warn('W03', fname, qid, f'{L}.{k} ยาว {len(s)} ตัวอักษร อาจล้นจอ')
        if ans_ok:
            right, ex = norm(ch[ans]), norm(b['explain'])
            if ex == right or ex == norm(b['q']):
                soft('E13', fname, qid, f'{L}.explain แค่ทวนคำตอบหรือทวนโจทย์ ไม่ได้สอน: {b["explain"]!r}')
            elif len(b['explain']) < (8 if L == 'th' else 10):
                soft('E13', fname, qid, f'{L}.explain สั้นเกินจะสอนได้: {b["explain"]!r}')
    if not lang_ok: return False
    th, en = q['th'], q['en']
    # ภาษาไม่ตรงช่อง
    if TH.search(en['q']) and q.get('needs') != 'th':
        R.err('E18', fname, qid, 'โจทย์ฝั่งอังกฤษมีตัวอักษรไทย ต้องใส่ "needs":"th"')
    if subject == 'thai' and q.get('needs') != 'th':
        R.err('E18', fname, qid, 'วิชาไทยต้องมี "needs":"th"')
    if not re.search(r'[A-Za-z]', en['q']) and TH.search(en['q']):
        R.err('E18', fname, qid, 'en.q เป็นภาษาไทยล้วน ยังไม่ได้แปล')
    if subject not in ('english',) and LATIN.search(th['q']) and not TH.search(th['q']):
        R.warn('W07', fname, qid, f'th.q ไม่มีตัวอักษรไทยเลย อาจยังไม่ได้แปล: {th["q"]!r}')
    # ช่องเสริม
    if 'speak' in q and not (isinstance(q['speak'], str) and q['speak'].strip()):
        R.err('E16', fname, qid, 'speak ต้องเป็นข้อความที่ไม่ว่าง')
    if 'speakLang' in q and q['speakLang'] not in SPEAK_LANGS:
        R.err('E16', fname, qid, f"speakLang ไม่รู้จัก: {q['speakLang']!r}")
    if 'speakLang' in q and 'speak' not in q:
        R.err('E16', fname, qid, 'มี speakLang แต่ไม่มี speak')
    if 'audioFirst' in q and not isinstance(q['audioFirst'], bool):
        R.err('E16', fname, qid, 'audioFirst ต้องเป็น true/false')
    if 'audioFirst' in q and 'speak' not in q:
        R.err('E16', fname, qid, 'audioFirst ต้องมี speak ด้วย')
    if 'needs' in q and q['needs'] not in ('th', 'en'):
        R.err('E16', fname, qid, f"needs ต้องเป็น th หรือ en: {q['needs']!r}")
    # คณิต: ตัวเลขสองภาษาต้องตรงกัน + คำนวณซ้ำ
    if subject == 'math' and ans_ok:
        for i in range(4):
            if digits(th['choices'][i]) != digits(en['choices'][i]):
                R.err('E14', fname, qid, f"ตัวเลือกที่ {i} ตัวเลขไทย-อังกฤษไม่ตรงกัน: {th['choices'][i]!r} / {en['choices'][i]!r}")
        if sorted(digits(th['q'])) != sorted(digits(en['q'])):
            R.warn('W08', fname, qid, f"ตัวเลขในโจทย์ไทย-อังกฤษไม่ตรงกัน: {th['q']!r} / {en['q']!r}")
        want = recompute(th['q'])
        if want is not None:
            got = as_number(th['choices'][ans])
            if got is None or got != want:
                R.err('E15', fname, qid, f"เฉลยผิด: {th['q']} ควรได้ {want} แต่เฉลยคือ {th['choices'][ans]!r}")
            others = [as_number(c) for i, c in enumerate(th['choices']) if i != ans]
            if any(o is not None and o == want for o in others):
                R.err('E15', fname, qid, f"มีตัวเลือกอื่นที่ถูกด้วย (ค่าเท่ากับเฉลย): {th['choices']}")
    return ans_ok


# ---------- ตรวจหนึ่งไฟล์ ----------
def load_file(path, R):
    fname = os.path.basename(path)
    m = FNAME.match(fname)
    if not m or m[1] not in SUBJECTS:
        R.err('E02', fname, None, 'ชื่อไฟล์ต้องเป็น q-<วิชา>-<อายุ>.json'); return None
    subject, age = m[1], int(m[2])
    try:
        with open(path, encoding='utf-8') as fh:
            d = json.load(fh)
    except Exception as e:
        R.err('E01', fname, None, f'อ่าน JSON ไม่ได้: {e}'); return None
    if not (isinstance(d, dict) and isinstance(d.get('questions'), list)):
        R.err('E01', fname, None, 'ไฟล์ต้องเป็น {"version","subject","age","count","questions":[...]}'); return None
    qs = d['questions']
    if d.get('subject') != subject or d.get('age') != age:
        R.err('E02', fname, None, f"subject/age ที่หัวไฟล์ ({d.get('subject')}/{d.get('age')}) ไม่ตรงกับชื่อไฟล์")
    if d.get('count') != len(qs):
        R.err('E02', fname, None, f"count ที่หัวไฟล์ = {d.get('count')} แต่มีจริง {len(qs)} ข้อ")
    good = [q for q in qs if check_question(q, fname, subject, age, R)]
    n = len(qs)
    if not (COUNT_RANGE[0] <= n <= COUNT_RANGE[1]):
        R.warn('W01', fname, None, f'มี {n} ข้อ นอกช่วงเป้า {COUNT_RANGE[0]}-{COUNT_RANGE[1]}')
    if good:
        pos = collections.Counter(q['answer'] for q in good)
        for i in range(4):
            share = pos[i] / len(good)
            if share < .15 or share > .35:
                R.warn('W02', fname, None, f'เฉลยอยู่ตำแหน่ง {i} ถึง {share:.0%} ของไฟล์ (ควรใกล้ 25%) เด็กเดาตำแหน่งได้')
        longest = sum(1 for q in good if all(len(q['th']['choices'][q['answer']]) > len(c)
                      for i, c in enumerate(q['th']['choices']) if i != q['answer']))
        if longest / len(good) > .45:
            R.warn('W05', fname, None, f'ข้อที่เฉลยยาวที่สุดในตัวเลือกมี {longest / len(good):.0%} (สุ่มควรราว 25%) เดาจากความยาวได้')
        top = collections.Counter(q['topic'] for q in good).most_common(1)[0]
        if top[1] / len(good) > .40:
            R.warn('W06', fname, None, f'หัวข้อ {top[0]} กินถึง {top[1] / len(good):.0%} ของไฟล์')
    return {'file': fname, 'subject': subject, 'age': age, 'questions': qs}


def check_bank(folder, R):
    files = [f for f in (load_file(p, R) for p in sorted(glob.glob(os.path.join(folder, 'q-*.json')))) if f]
    seen_id, seen_q = {}, {}
    for f in files:
        strict = f['age'] >= NEW_AGE
        for q in f['questions']:
            if not isinstance(q, dict) or 'id' not in q: continue
            qid = q['id']
            if qid in seen_id:
                R.err('E11', f['file'], qid, f'id ซ้ำกับไฟล์ {seen_id[qid]}')
            seen_id[qid] = f['file']
            try:
                for L in ('th', 'en'):
                    key = (f['subject'], L, norm(q[L]['q']), norm(q[L]['choices'][q['answer']]))
                    if key in seen_q and seen_q[key][1] != qid:
                        of, oid = seen_q[key]
                        msg = f'โจทย์ซ้ำกับ {oid} ({of}): {q[L]["q"]!r} → {q[L]["choices"][q["answer"]]!r}'
                        (R.err if strict else R.warn)('E12', f['file'], qid, msg)
                        break
                    seen_q.setdefault(key, (f['file'], qid))
            except Exception:
                pass
    return files


def check_index(folder, files, R):
    ipath, spath = os.path.join(folder, 'questions-index.json'), os.path.join(folder, 'sw.js')
    names = {f['file']: f for f in files}
    if os.path.exists(ipath):
        try:
            idx = json.load(open(ipath, encoding='utf-8'))
            listed = {e.get('file'): e for e in idx.get('files', [])}
            for n, f in names.items():
                if n not in listed:
                    R.err('E19', n, None, 'ยังไม่ได้เพิ่มใน questions-index.json เกมจะไม่โหลดไฟล์นี้')
                elif listed[n].get('count') != len(f['questions']) or listed[n].get('age') != f['age'] or listed[n].get('subject') != f['subject']:
                    R.err('E19', n, None, f"ข้อมูลใน questions-index.json ไม่ตรงกับไฟล์จริง: {listed[n]}")
            for n in listed:
                if n not in names: R.err('E19', str(n), None, 'มีชื่อใน questions-index.json แต่ไม่มีไฟล์ (หรือไฟล์เสีย)')
            ages = sorted({f['age'] for f in files})
            if idx.get('ages') != ages: R.err('E19', 'questions-index.json', None, f"ages = {idx.get('ages')} แต่ไฟล์จริงมีอายุ {ages}")
        except Exception as e:
            R.err('E19', 'questions-index.json', None, f'อ่านไม่ได้: {e}')
    else:
        R.warn('W09', 'questions-index.json', None, 'ไม่พบไฟล์ ข้ามการตรวจดัชนี')
    if os.path.exists(spath):
        sw = open(spath, encoding='utf-8').read()
        for n in names:
            if f"'{n}'" not in sw and f'"{n}"' not in sw:
                R.err('E19', n, None, 'ยังไม่ได้เพิ่มชื่อในรายการ FILES ของ sw.js')
    else:
        R.warn('W09', 'sw.js', None, 'ไม่พบไฟล์ ข้ามการตรวจ sw.js')


def write_index(folder):
    R = Report()
    files = [f for f in (load_file(p, R) for p in sorted(glob.glob(os.path.join(folder, 'q-*.json')))) if f]
    ipath, spath = os.path.join(folder, 'questions-index.json'), os.path.join(folder, 'sw.js')
    idx = json.load(open(ipath, encoding='utf-8'))
    order = list(idx.get('subjects', SUBJECTS).keys())
    files.sort(key=lambda f: (order.index(f['subject']) if f['subject'] in order else 99, f['age']))
    idx['ages'] = sorted({f['age'] for f in files})
    idx['generated'] = datetime.date.today().isoformat()
    idx['files'] = [{'file': f['file'], 'subject': f['subject'], 'age': f['age'], 'count': len(f['questions'])} for f in files]
    with open(ipath, 'w', encoding='utf-8') as fh:
        json.dump(idx, fh, ensure_ascii=False, indent=1); fh.write('\n')
    print(f'questions-index.json: {len(files)} ไฟล์ · อายุ {idx["ages"]} · รวม {sum(e["count"] for e in idx["files"])} ข้อ')
    if os.path.exists(spath):
        sw = open(spath, encoding='utf-8').read()
        add = [f['file'] for f in files if f"'{f['file']}'" not in sw]
        if add:
            anchor = "'questions-index.json'"
            if anchor not in sw:
                print('sw.js: หาจุดแทรกไม่เจอ ต้องเพิ่มเอง:', add); return
            sw = sw.replace(anchor, anchor + ''.join(f",'{n}'" for n in add), 1)
            open(spath, 'w', encoding='utf-8').write(sw)
        print(f'sw.js: เพิ่มชื่อ {len(add)} ไฟล์ {add} · อย่าลืมขึ้นเลข CACHE (lantern-vNNN) เอง')


def review_sheet(path, pct=10):
    R = Report(); f = load_file(path, R)
    if not f: sys.exit('อ่านไฟล์ไม่ได้')
    qs = f['questions']; n = max(1, math.ceil(len(qs) * pct / 100))
    pick = random.Random(f['file']).sample(qs, n)     # สุ่มแบบคงที่ต่อชื่อไฟล์ รันกี่ครั้งได้ชุดเดิม
    print(f"# ใบสุ่มตรวจ {f['file']} · {n} จาก {len(qs)} ข้อ ({pct}%)\n")
    print('ผู้ตรวจ: ____________ · วันที่: ____________ · ติ๊กถูกเมื่อ โจทย์ชัด เฉลยถูก ตัวเลือกอื่นผิดจริง คำอธิบายสอนได้\n')
    for q in pick:
        for L in ('th', 'en'):
            b = q[L]
            print(f"- [ ] **{q['id']}** ({L} · {q['topic']}) {b['q']}")
            print('  ' + ' · '.join(('**✔ ' + c + '**') if i == q['answer'] else c for i, c in enumerate(b['choices'])))
            print(f"  อธิบาย: {b['explain']}")
        print()


def print_report(R, files, only=None):
    by_file = collections.defaultdict(list)
    for it in R.items: by_file[it[2]].append(it)
    names = [f['file'] for f in files] + [n for n in by_file if n not in {f['file'] for f in files}]
    shown = [n for n in names if only is None or n in only]
    print(f"{'ไฟล์':<22}{'ข้อ':>5}{'ERROR':>7}{'WARN':>6}")
    counts = {f['file']: len(f['questions']) for f in files}
    for n in shown:
        e, w = R.count('ERROR', n), R.count('WARN', n)
        print(f"{n:<22}{counts.get(n, 0):>5}{e:>7}{w:>6}  {'ผ่าน' if e == 0 else 'ไม่ผ่าน'}")
    for n in shown:
        its = by_file.get(n, [])
        if not its: continue
        print(f'\n== {n}')
        per = collections.Counter()
        for sev, code, _, qid, msg in its:
            per[(sev, code)] += 1
            if per[(sev, code)] <= 8: print(f'  {sev} {code} [{qid}] {msg}')
        for (sev, code), c in per.items():
            if c > 8: print(f'  ... {sev} {code} มีอีก {c - 8} รายการ')
    te = sum(R.count('ERROR', n) for n in shown); tw = sum(R.count('WARN', n) for n in shown)
    tq = sum(counts.get(n, 0) for n in shown)
    print(f'\nสรุป: {len([n for n in shown if n in counts])} ไฟล์ · {tq} ข้อ · ERROR {te} · WARN {tw}')
    return te


# ---------- ทดสอบตัวตรวจเอง ----------
def selftest():
    import tempfile, copy, shutil

    def base(i, **kw):
        q = {'age': 9, 'subject': 'math', 'topic': 'add', 'level': 4, 'answer': i % 4,
             'th': {'q': f'{100 + i} + 1 = ?', 'choices': ['0', '0', '0', '0'], 'explain': 'บวกเพิ่มทีละ 1 จากจำนวนเดิม'},
             'en': {'q': f'{100 + i} + 1 = ?', 'choices': ['0', '0', '0', '0'], 'explain': 'Add 1 to the starting number.'},
             'id': f'ma-9-{i:04d}'}
        ch = [str(101 + i + k + 1) for k in range(4)]; ch[i % 4] = str(101 + i)
        q['th']['choices'] = list(ch); q['en']['choices'] = list(ch)
        q.update(kw); return q

    def run(qs, extra_files=None, name='q-math-9.json', head=None):
        d = tempfile.mkdtemp()
        try:
            h = {'version': 1, 'subject': 'math', 'age': 9, 'count': len(qs), 'questions': qs}
            if head: h.update(head)
            json.dump(h, open(os.path.join(d, name), 'w', encoding='utf-8'), ensure_ascii=False)
            for n, body in (extra_files or {}).items():
                open(os.path.join(d, n), 'w', encoding='utf-8').write(body)
            R = Report(); files = check_bank(d, R); check_index(d, files, R)
            return {(i[0], i[1]) for i in R.items}
        finally:
            shutil.rmtree(d)

    good = [base(i) for i in range(165)]
    cases = []

    def case(label, code, mutate, sev='ERROR', **kw):
        qs = copy.deepcopy(good); r = mutate(qs); qs = r if r is not None else qs
        cases.append((label, (sev, code), run(qs, **kw)))

    def setk(path, val):
        def m(qs):
            o = qs[5]
            for k in path[:-1]: o = o[k]
            o[path[-1]] = val
        return m

    def delk(k):
        def m(qs): del qs[5][k]
        return m
    case('ขาดช่อง explain ฝั่งอังกฤษ', 'E08', lambda qs: qs[5]['en'].pop('explain') and None)
    case('ขาดช่อง topic', 'E03', delk('topic'))
    case('ขาดภาษาอังกฤษทั้งก้อน', 'E03', delk('en'))
    case('มีช่องแปลกปลอม', 'E03', setk(['hint'], 'x'))
    case('ตัวเลือกมี 3 ข้อ', 'E08', lambda qs: qs[5]['th']['choices'].pop() and None)
    case('ตัวเลือกซ้ำกัน', 'E09', lambda qs: qs[5]['en']['choices'].__setitem__(0, qs[5]['en']['choices'][2]))
    case('ตัวเลือกซ้ำต่างแค่ช่องว่าง/ตัวพิมพ์', 'E09', lambda qs: [b.update(choices=['A b', 'a b', 'c', 'd']) for b in (qs[6]['th'], qs[6]['en'])] and None)
    case('answer = 4', 'E07', setk(['answer'], 4))
    case('answer เป็นข้อความ', 'E07', setk(['answer'], '1'))
    case('answer ติดลบ', 'E07', setk(['answer'], -1))
    case('id ซ้ำ', 'E11', lambda qs: qs[7].__setitem__('id', qs[8]['id']))
    case('id ผิดรูปแบบ', 'E10', setk(['id'], 'ma-0005'))
    case('id ผิดวิชา', 'E10', setk(['id'], 'en-9-0005'))
    case('โจทย์ซ้ำ', 'E12', lambda qs: (qs[9].__setitem__('th', copy.deepcopy(qs[10]['th'])), qs[9].__setitem__('en', copy.deepcopy(qs[10]['en'])), qs[9].__setitem__('answer', qs[10]['answer'])) and None)
    case('เฉลยคณิตผิด', 'E15', lambda qs: (qs[5]['th']['choices'].__setitem__(qs[5]['answer'], '999'), qs[5]['en']['choices'].__setitem__(qs[5]['answer'], '999')) and None)
    case('ตัวเลือกอื่นถูกด้วย', 'E15', lambda qs: [b['choices'].__setitem__((qs[5]['answer'] + 1) % 4, b['choices'][qs[5]['answer']] + '.0') for b in (qs[5]['th'], qs[5]['en'])] and None)
    case('ตัวเลขไทย-อังกฤษไม่ตรง', 'E14', lambda qs: qs[5]['en']['choices'].__setitem__((qs[5]['answer'] + 1) % 4, '77777'))
    case('explain แค่ทวนคำตอบ', 'E13', lambda qs: qs[5]['th'].__setitem__('explain', qs[5]['th']['choices'][qs[5]['answer']]))
    case('explain ว่าง', 'E08', setk(['th', 'explain'], ' '))
    case('explain สั้นเกิน', 'E13', setk(['en', 'explain'], 'It is 6.'))
    case('ฝั่งอังกฤษยังเป็นไทย', 'E18', setk(['en', 'q'], 'หนึ่งบวกหนึ่งได้เท่าไร'))
    case('ช่องว่างท้ายข้อความ', 'E17', setk(['th', 'q'], '105 + 1 = ? '))
    case('เศษโค้ด undefined', 'E17', setk(['en', 'explain'], 'The answer is undefined here.'))
    case('age ในข้อไม่ตรงไฟล์', 'E04', setk(['age'], 10))
    case('subject ในข้อไม่ตรงไฟล์', 'E04', setk(['subject'], 'thai'))
    case('level เป็นทศนิยม', 'E06', setk(['level'], 4.5))
    case('topic มีช่องว่าง', 'E05', setk(['topic'], 'Add Numbers'))
    case('speakLang ไม่รู้จัก', 'E16', lambda qs: qs[5].update(speak='x', speakLang='jp'))
    case('needs ผิดค่า', 'E16', setk(['needs'], 'zh'))
    case('count หัวไฟล์ไม่ตรง', 'E02', lambda qs: None, head={'count': 3})
    case('ชื่อไฟล์ไม่ตรงอายุ', 'E02', lambda qs: None, name='q-math-10.json')
    case('ไฟล์ JSON เสีย', 'E01', lambda qs: None, extra_files={'q-thai-9.json': '{"questions": [oops'})
    case('ไม่อยู่ในดัชนี', 'E19', lambda qs: None, extra_files={'questions-index.json': '{"ages":[9],"files":[]}'})
    case('ไม่อยู่ใน sw.js', 'E19', lambda qs: None, extra_files={'sw.js': "const FILES=['index.html'];"})
    case('จำนวนข้อน้อยเกิน', 'W01', lambda qs: qs[:50], sev='WARN')
    case('เฉลยกองอยู่ตำแหน่งเดียว', 'W02', lambda qs: [dict(q, answer=0, th=dict(q['th'], choices=[q['th']['choices'][q['answer']]] + [c for i, c in enumerate(q['th']['choices']) if i != q['answer']]), en=dict(q['en'], choices=[q['en']['choices'][q['answer']]] + [c for i, c in enumerate(q['en']['choices']) if i != q['answer']])) for q in qs], sev='WARN')
    case('level ห่างจากอายุ', 'W04', setk(['level'], 1), sev='WARN')
    clean = run(copy.deepcopy(good))
    ok = 0
    for label, want, got in cases:
        hit = want in got; ok += hit
        print(f"  {'จับได้ ' if hit else 'หลุด!  '} {want[1]}  {label}")
    clean_err = {c for c in clean if c[0] == 'ERROR'}
    print(f"  {'ผ่าน   ' if not clean_err else 'ผิด!   '} ไฟล์ดี 165 ข้อ ต้องไม่มี ERROR (พบ {sorted(clean_err)})")
    print(f'\nselftest: จับความผิดได้ {ok} จาก {len(cases)} แบบ · ไฟล์ดีแจ้งผิดพลาด {len(clean_err)} รายการ')
    return 0 if ok == len(cases) and not clean_err else 1


def main(argv):
    if '--selftest' in argv: return selftest()
    folder = '.'
    if '--write-index' in argv: write_index(folder); return 0
    if '--review' in argv:
        review_sheet(argv[argv.index('--review') + 1]); return 0
    only = {os.path.basename(a) for a in argv if a.endswith('.json')} or None
    R = Report(); files = check_bank(folder, R); check_index(folder, files, R)
    if not files: print('ไม่พบไฟล์ q-*.json ในโฟลเดอร์นี้'); return 1
    return 1 if print_report(R, files, only) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
