#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_math.py - สร้างคลังคำถามคณิต q-math-<อายุ>.json (DESIGN_CRYSTAL_JOB.md ข้อ 4.7)

  python3 gen_math.py 9        เขียน q-math-9.json (165 ข้อ ป.3-ป.4)

หลักการ: สคริปต์คำนวณคำตอบเอง แล้ว "ตรวจซ้ำอีกทาง" ทุกข้อ (เช่น คูณ → ตรวจด้วยการบวกซ้ำ,
ลบ → ตรวจด้วยการบวกกลับทีละหลัก, เวลา → ตรวจด้วย datetime) ถ้าสองทางไม่ตรงกันจะหยุดทันที ไม่เขียนไฟล์
ใช้เมล็ดสุ่มคงที่ต่ออายุ รันกี่ครั้งได้ไฟล์เดิม · หลังสร้างให้รัน check_questions.py เสมอ
ตอนนี้มีแผนของอายุ 9 เท่านั้น อายุอื่นเพิ่มใน PLANS
"""
import json, random, sys, datetime
from fractions import Fraction
from decimal import Decimal, ROUND_HALF_UP
from math import gcd

VERIFIED = 0


def n(x):
    return f'{x:,}'


def col_add(a, b):
    """บวกแบบตั้งหลักทีละหลัก (ใช้เป็นทางตรวจที่ไม่พึ่งเครื่องหมาย + ของจำนวนเต็มทั้งก้อน)"""
    da, db = [int(c) for c in str(a)][::-1], [int(c) for c in str(b)][::-1]
    out, carry = [], 0
    for i in range(max(len(da), len(db))):
        s = (da[i] if i < len(da) else 0) + (db[i] if i < len(db) else 0) + carry
        out.append(s % 10); carry = s // 10
    if carry: out.append(carry)
    return int(''.join(map(str, out[::-1])))


def rep_add(a, times):
    t = 0
    for _ in range(times): t = col_add(t, a) if t else a
    return t


def make(topic, thq, enq, ans, wrong, thex, enex, verified):
    """ans และ wrong เป็นคู่ (ข้อความไทย, ข้อความอังกฤษ) · verified = ผลของการตรวจซ้ำอีกทาง ต้องเป็น True"""
    global VERIFIED
    if verified is not True:
        raise AssertionError(f'ตรวจซ้ำไม่ผ่าน: {thq} → {ans}')
    VERIFIED += 1
    seen, ws = {ans}, []
    for w in wrong:
        if w not in seen and w[0] not in {s[0] for s in seen} and w[1] not in {s[1] for s in seen}:
            seen.add(w); ws.append(w)
    if len(ws) < 3:
        raise ValueError(f'ตัวลวงไม่พอ: {thq} {ans} {wrong}')
    return {'topic': topic, 'thq': thq, 'enq': enq, 'ans': ans, 'wrong': ws[:3], 'thex': thex, 'enex': enex}


def nums(ans, cands, rng, lo=1):
    """ตัวลวงที่เป็นจำนวนเต็ม: เอาค่าที่เกิดจากความผิดพลาดที่พบบ่อยก่อน แล้วเติมค่าใกล้เคียงถ้าไม่พอ"""
    out = []
    for c in cands:
        if isinstance(c, int) and c >= lo and c != ans and c not in out: out.append(c)
    first = out[:3]
    rng.shuffle(first)
    pad = [ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, ans + 100]
    for c in pad:
        if len(first) >= 3: break
        if c >= lo and c != ans and c not in first: first.append(c)
    return [(n(c), n(c)) for c in first]


def P(x): return (n(x), n(x))
def S(s): return (s, s)


# ====================== หัวข้อของอายุ 9 (ป.3-ป.4) ======================
def g_add(rng):
    if rng.random() < .5: a, b = rng.randint(1200, 8999), rng.randint(1200, 8999)
    else: a, b = rng.randint(12000, 58999), rng.randint(1200, 9899)
    if a % 1000 == 0 or b % 1000 == 0 or (a % 1000 + b % 1000) < 1000: return None   # ต้องมีการทด
    ans = a + b
    a1, a2, b1, b2 = a // 1000 * 1000, a % 1000, b // 1000 * 1000, b % 1000
    return make('add', f'{n(a)} + {n(b)} = ?', f'{n(a)} + {n(b)} = ?', P(ans),
                nums(ans, [ans - 1000, ans - 100, ans + 100, ans - 10, ans + 1000], rng),
                f'แยกบวก: {n(a1)} + {n(b1)} = {n(a1 + b1)} · {n(a2)} + {n(b2)} = {n(a2 + b2)} · รวมกันได้ {n(ans)}',
                f'Split it: {n(a1)} + {n(b1)} = {n(a1 + b1)} · {n(a2)} + {n(b2)} = {n(a2 + b2)} · together {n(ans)}.',
                col_add(a, b) == ans)


def g_sub(rng):
    if rng.random() < .5: a = rng.randint(3000, 9999)
    else: a = rng.randint(12000, 60999)
    b = rng.randint(1100, min(a - 500, 9899))
    if a % 10 >= b % 10 and (a // 10) % 10 >= (b // 10) % 10: return None             # ต้องมีการกระจาย (ยืม)
    ans = a - b
    steps_th, steps_en, cur = [], [], a
    for p in (1000, 100, 10, 1):
        part = (b // p % 10) * p if p < 1000 else b // 1000 * 1000
        if part:
            cur -= part
            steps_th.append(f'ลบ {n(part)} เหลือ {n(cur)}'); steps_en.append(f'take away {n(part)} to get {n(cur)}')
    return make('subtract', f'{n(a)} − {n(b)} = ?', f'{n(a)} − {n(b)} = ?', P(ans),
                nums(ans, [ans + 10, ans + 100, ans - 10, ans + 1000, ans - 100], rng),
                'ลบทีละส่วน: ' + ' · '.join(steps_th), 'Subtract in parts: ' + ', '.join(steps_en) + '.',
                cur == ans and col_add(ans, b) == a)


def g_mul(rng, kind):
    if kind == '21': a, b = rng.randint(23, 98), rng.randint(3, 9)
    elif kind == '31': a, b = rng.randint(112, 896), rng.randint(3, 9)
    else: a, b = rng.randint(12, 49), rng.randint(11, 29)
    if a % 10 == 0 or b % 10 == 0: return None
    ans = a * b
    if kind == '22':
        t, o = b // 10 * 10, b % 10
        thex = f'แยก {b} เป็น {t} กับ {o}: {a} × {t} = {n(a * t)} · {a} × {o} = {n(a * o)} · รวม {n(ans)}'
        enex = f'Split {b} into {t} and {o}: {a} × {t} = {n(a * t)} · {a} × {o} = {n(a * o)} · total {n(ans)}.'
        cands = [ans - a, ans + a, a * t + o, ans + 10, ans - 10]
    else:
        parts = [int(c) * 10 ** i for i, c in enumerate(str(a)[::-1]) if c != '0'][::-1]
        body = ' · '.join(f'{n(p)} × {b} = {n(p * b)}' for p in parts)
        thex = f'แยกคูณทีละหลัก: {body} · รวม {n(ans)}'
        enex = f'Multiply each part: {body} · total {n(ans)}.'
        cands = [ans - b, ans + b, ans + 10, ans - 10, ans + 100]
    return make('multiply', f'{n(a)} × {b} = ?', f'{n(a)} × {b} = ?', P(ans), nums(ans, cands, rng), thex, enex,
                rep_add(a, b) == ans)


def g_div(rng, kind):
    d = rng.randint(3, 9)
    if kind == 'rem':
        q, r = rng.randint(6, 12), rng.randint(1, d - 1)
        num = q * d + r
        if num > 99: return None
        wrong = []
        for qq, rr in [(q + 1, r), (q - 1, r), (q, r + 1 if r + 1 < d else r - 1), (q + 1, max(1, r - 1)), (q - 1, min(d - 1, r + 1))]:
            if rr >= 1 and (qq, rr) != (q, r) and qq * d + rr != num:
                wrong.append((f'{qq} เศษ {rr}', f'{qq} remainder {rr}'))
        left, steps = num, 0
        while left >= d: left -= d; steps += 1                                       # ตรวจด้วยการลบซ้ำ
        return make('divide', f'{num} ÷ {d} ได้เท่าไร เศษเท่าไร', f'What is {num} ÷ {d}, with its remainder?',
                    (f'{q} เศษ {r}', f'{q} remainder {r}'), wrong,
                    f'{d} × {q} = {d * q} ใกล้ {num} ที่สุดโดยไม่เกิน · เหลือ {num} − {d * q} = {r} จึงได้ {q} เศษ {r}',
                    f'{d} × {q} = {d * q} is the closest without going over {num}. {num} − {d * q} = {r} left, so {q} remainder {r}.',
                    (steps, left) == (q, r))
    q = rng.randint(13, 999 // d)
    if q % 10 == 0: return None
    num = q * d
    if num < 100: return None
    cands = [q + 1, q - 1, q + 10, q - 10, q + 2]
    ok = rep_add(d, q) == num
    if kind == 'missing':
        return make('divide', f'เลขอะไรคูณกับ {d} แล้วได้ {n(num)}', f'What number times {d} makes {n(num)}?', P(q), nums(q, cands, rng),
                    f'ใช้การหารย้อนกลับ: {n(num)} ÷ {d} = {q} ตรวจได้จาก {q} × {d} = {n(num)}',
                    f'Work backwards with division: {n(num)} ÷ {d} = {q}. Check: {q} × {d} = {n(num)}.', ok)
    parts = [int(c) * 10 ** i for i, c in enumerate(str(q)[::-1]) if c != '0'][::-1]
    body = ' · '.join(f'{n(p * d)} ÷ {d} = {p}' for p in parts)
    return make('divide', f'{n(num)} ÷ {d} = ?', f'{n(num)} ÷ {d} = ?', P(q), nums(q, cands, rng),
                f'แบ่งทีละส่วน: {body} · รวม {q}', f'Divide in parts: {body} · total {q}.', ok and sum(parts) == q)


TH_PLACE = ['หน่วย', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
EN_PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands']
TH_D = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
EN_1 = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
        'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
EN_10 = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']


def th_words(x):
    s = str(x); out = ''
    for i, ch in enumerate(s):
        d, p = int(ch), len(s) - 1 - i
        if d == 0: continue
        if p == 1: out += 'สิบ' if d == 1 else ('ยี่สิบ' if d == 2 else TH_D[d] + 'สิบ')
        elif p == 0: out += 'เอ็ด' if (d == 1 and len(s) > 1) else TH_D[d]
        else: out += TH_D[d] + TH_PLACE[p]
    return out


def en_words(x):
    def two(v): return EN_1[v] if v < 20 else EN_10[v // 10] + ('-' + EN_1[v % 10] if v % 10 else '')
    def three(v):
        h, r = divmod(v, 100)
        return ' and '.join(([EN_1[h] + ' hundred'] if h else []) + ([two(r)] if r else []))
    t, r = divmod(x, 1000)
    out = three(t) + ' thousand'
    if r: out += (', ' if r >= 100 else ' and ') + three(r)
    return out


assert th_words(35208) == 'สามหมื่นห้าพันสองร้อยแปด' and th_words(42020) == 'สี่หมื่นสองพันยี่สิบ' and th_words(60315) == 'หกหมื่นสามร้อยสิบห้า'
assert en_words(35208) == 'thirty-five thousand, two hundred and eight' and en_words(42020) == 'forty-two thousand and twenty'
assert en_words(60315) == 'sixty thousand, three hundred and fifteen' and en_words(17406) == 'seventeen thousand, four hundred and six'


def g_place_digit(rng):
    L = rng.choice([5, 5, 6])
    ds = rng.sample(range(1, 10), L)
    num = int(''.join(map(str, ds)))
    k = rng.randint(1, L - 1)                       # ตำแหน่งนับจากขวา
    d = ds[L - 1 - k]
    ans = d * 10 ** k
    zeroed = int(''.join('0' if i == L - 1 - k else str(x) for i, x in enumerate(ds)))
    cands = [d * 10 ** j for j in range(0, L) if j != k]
    rng.shuffle(cands)
    return make('place-value', f'เลขโดด {d} ใน {n(num)} มีค่าเท่าไร', f'What is the value of the digit {d} in {n(num)}?', P(ans),
                nums(ans, cands, rng),
                f'{d} อยู่ในหลัก{TH_PLACE[k]} จึงมีค่า {d} × {n(10 ** k)} = {n(ans)}',
                f'{d} is in the {EN_PLACE[k]} place, so it is worth {d} × {n(10 ** k)} = {n(ans)}.',
                num - zeroed == ans)


def _five_with_zero(rng):
    ds = rng.sample(range(2, 10), 5)
    z = rng.choice([1, 2, 3])                       # ใส่ 0 ที่หลักกลาง
    ds[z] = 0
    return ds, z


def g_place_expand(rng):
    ds, z = _five_with_zero(rng)
    num = int(''.join(map(str, ds)))
    parts = [d * 10 ** (4 - i) for i, d in enumerate(ds) if d]
    nz = [d for d in ds if d]
    w1 = int(''.join(map(str, nz)))                                   # ลืมใส่ 0
    sw = ds[:]; j = z + 1 if z < 4 else z - 1; sw[z], sw[j] = sw[j], sw[z]
    w2 = int(''.join(map(str, sw)))                                   # ใส่ 0 ผิดหลัก
    sw2 = ds[:]; j2 = z - 1; sw2[z], sw2[j2] = sw2[j2], sw2[z]
    w3 = int(''.join(map(str, sw2)))
    expr = ' + '.join(n(p) for p in parts)
    return make('place-value', f'{expr} เท่ากับจำนวนใด', f'Which number is {expr}?', P(num),
                nums(num, [w1, w2, w3, num + 1000], rng, lo=1000),
                f'ไม่มีหลัก{TH_PLACE[4 - z]} ต้องใส่ 0 ไว้ที่หลัก{TH_PLACE[4 - z]}: {n(num)}',
                f'There are no {EN_PLACE[4 - z]}, so put a 0 in the {EN_PLACE[4 - z]} place: {n(num)}.',
                sum(parts) == num and int(''.join(str(d) for d in ds)) == num and len(parts) == 4)


def g_place_words(rng):
    ds, z = _five_with_zero(rng)
    if ds[4] == 1 or ds[4] == 0: return None
    num = int(''.join(map(str, ds)))
    nz = [d for d in ds if d]
    w1 = int(''.join(map(str, nz)))
    sw = ds[:]; j = z + 1; sw[z], sw[j] = sw[j], sw[z]
    w2 = int(''.join(map(str, sw)))
    sw2 = ds[:]; sw2[z], sw2[z - 1] = sw2[z - 1], sw2[z]
    w3 = int(''.join(map(str, sw2)))
    tw, ew = th_words(num), en_words(num)
    parts = [d * 10 ** (4 - i) for i, d in enumerate(ds) if d]
    back = 0
    for p in parts: back = col_add(back, p)
    return make('place-value', f'"{tw}" เขียนเป็นตัวเลขได้อย่างไร', f'How do you write "{ew}" in digits?', P(num),
                nums(num, [w1, w2, w3, num + 1000], rng, lo=1000),
                'แยกทีละหลัก: ' + ' + '.join(n(p) for p in parts) + f' = {n(num)} หลักที่ไม่มีให้ใส่ 0',
                'Build it place by place: ' + ' + '.join(n(p) for p in parts) + f' = {n(num)}. Put 0 in any empty place.',
                back == num and th_words(num) == tw)


def g_place_compare(rng):
    ds = rng.sample(range(1, 10), 5)
    opts = set()
    while len(opts) < 4:
        p = ds[:2] + rng.sample(ds[2:], 3) if rng.random() < .7 else [ds[1], ds[0]] + rng.sample(ds[2:], 3)
        opts.add(int(''.join(map(str, p))))
    opts = sorted(opts)
    big = rng.random() < .5
    ans = opts[-1] if big else opts[0]
    best = opts[0]
    for o in opts:                                   # ตรวจด้วยการเทียบข้อความทีละหลัก (ทุกตัวยาว 5 หลักเท่ากัน)
        if (str(o) > str(best)) == big and o != best: best = o
    return make('place-value', 'จำนวนใดมากที่สุด' if big else 'จำนวนใดน้อยที่สุด',
                'Which number is the largest?' if big else 'Which number is the smallest?', P(ans),
                [P(o) for o in opts if o != ans],
                f'เทียบทีละหลักจากซ้ายไปขวา หลักแรกที่ต่างกันเป็นตัวตัดสิน: {n(ans)} {"มาก" if big else "น้อย"}ที่สุด',
                f'Compare digit by digit from the left. The first different digit decides: {n(ans)} is the {"largest" if big else "smallest"}.',
                best == ans)


def g_round(rng, unit):
    num = rng.randint(*{10: (123, 4999), 100: (1234, 9899), 1000: (2345, 58999)}[unit])
    if num % unit == 0 or num % (unit * 10) > unit * 9: return None
    lo = num // unit * unit; hi = lo + unit
    ans = hi if num - lo >= unit // 2 else lo
    k = {10: 0, 100: 1, 1000: 2}[unit]
    dd = num // 10 ** k % 10
    tu, eu = {10: ('สิบ', 'ten'), 100: ('ร้อย', 'hundred'), 1000: ('พัน', 'thousand')}[unit]
    other = lo if ans == hi else hi
    alt = int((Decimal(num) / unit).quantize(Decimal(1), rounding=ROUND_HALF_UP) * unit)
    up = dd >= 5
    return make('rounding', f'ค่าประมาณเป็นจำนวนเต็ม{tu}ของ {n(num)} คือเท่าไร', f'Round {n(num)} to the nearest {eu}.', P(ans),
                nums(ans, [other, num // (unit * 10) * unit * 10 if unit < 1000 else lo - unit, hi + unit, lo - unit, num // 10 * 10 if unit > 10 else num + 10], rng, lo=10),
                f'{n(num)} อยู่ระหว่าง {n(lo)} กับ {n(hi)} · หลัก{TH_PLACE[k]}คือ {dd} ({"5 ขึ้นไปปัดขึ้น" if up else "น้อยกว่า 5 ปัดลง"}) จึงได้ {n(ans)}',
                f'{n(num)} is between {n(lo)} and {n(hi)}. The {EN_PLACE[k]} digit is {dd} ({"5 or more rounds up" if up else "less than 5 rounds down"}), so it is {n(ans)}.',
                alt == ans)


def fr(a, b): return S(f'{a}/{b}')


def g_frac_addsub(rng, add):
    d = rng.randint(5, 12)
    if add:
        a, b = rng.randint(2, d - 2), rng.randint(1, d - 2)
        r = a + b
        if r >= d or a < b: return None
    else:
        a = rng.randint(3, d - 1); b = rng.randint(1, a - 1); r = a - b
    if gcd(r, d) != 1 or a == b: return None
    op = '+' if add else '−'
    wrong = [fr(r, 2 * d) if add else fr(r, 1), fr(r + 1, d), fr(max(1, r - 1), d), fr(a * b, d), fr(a + b if not add else abs(a - b), d)]
    wrong = [w for w in wrong if w[0].split('/')[1] != '1' and Fraction(*map(int, w[0].split('/'))) != Fraction(r, d)]
    exact = Fraction(a, d) + Fraction(b, d) if add else Fraction(a, d) - Fraction(b, d)
    return make('fractions', f'{a}/{d} {op} {b}/{d} = ?', f'{a}/{d} {op} {b}/{d} = ?', fr(r, d), wrong,
                f'ตัวส่วนเท่ากัน ให้{"บวก" if add else "ลบ"}เฉพาะตัวเศษ: {a} {op} {b} = {r} ตัวส่วนยังเป็น {d} จึงได้ {r}/{d}',
                f'The denominators match, so {"add" if add else "subtract"} only the numerators: {a} {op} {b} = {r}. The denominator stays {d}: {r}/{d}.',
                exact == Fraction(r, d) and exact.denominator == d)


def g_frac_compare(rng, kind):
    same_den, big = kind
    if same_den:
        d = rng.randint(7, 12); tops = sorted(rng.sample(range(1, d), 4))
        fs = [(t, d) for t in tops]
    else:
        t = rng.randint(1, 5); dens = sorted(rng.sample(range(t + 1, 13), 4))
        fs = [(t, d) for d in dens]
    vals = [Fraction(a, b) for a, b in fs]
    ans = fs[vals.index(max(vals) if big else min(vals))]
    best = fs[0]
    for f in fs:                                     # ตรวจด้วยการคูณไขว้ ไม่ใช้ Fraction
        if (f[0] * best[1] > best[0] * f[1]) == big and f[0] * best[1] != best[0] * f[1]: best = f
    word_th, word_en = ('มาก', 'largest') if big else ('น้อย', 'smallest')
    if same_den:
        thex = f'ตัวส่วนเท่ากัน ดูที่ตัวเศษ ตัวเศษ{"มาก" if big else "น้อย"}กว่าคือ{word_th}กว่า: {ans[0]}/{ans[1]} {word_th}ที่สุด'
        enex = f'The denominators match, so compare numerators. The {"biggest" if big else "smallest"} numerator wins: {ans[0]}/{ans[1]} is the {word_en}.'
    else:
        if big:
            thex = f'ตัวเศษเท่ากัน ตัวส่วนยิ่งน้อย แต่ละส่วนยิ่งใหญ่: {ans[0]}/{ans[1]} มีตัวส่วนน้อยที่สุด จึงมากที่สุด'
            enex = f'The numerators match. A smaller denominator means bigger pieces. {ans[0]}/{ans[1]} has the smallest denominator, so it is the largest.'
        else:
            thex = f'ตัวเศษเท่ากัน ตัวส่วนยิ่งมาก แต่ละส่วนยิ่งเล็ก: {ans[0]}/{ans[1]} มีตัวส่วนมากที่สุด จึงน้อยที่สุด'
            enex = f'The numerators match. A bigger denominator means smaller pieces. {ans[0]}/{ans[1]} has the biggest denominator, so it is the smallest.'
    return make('fractions', f'เศษส่วนใด{word_th}ที่สุด', f'Which fraction is the {word_en}?', fr(*ans), [fr(*f) for f in fs if f != ans],
                thex, enex, best == ans)


def g_frac_of(rng):
    d = rng.randint(3, 10); k = rng.randint(2, d - 1)
    if gcd(k, d) != 1: return None
    m = rng.randint(3, 12); N = d * m; ans = k * m
    return make('fractions', f'{k}/{d} ของ {N} คือเท่าไร', f'What is {k}/{d} of {N}?', P(ans),
                nums(ans, [m, N - ans, ans + m, ans - m, N // k if N % k == 0 else N + k], rng),
                f'แบ่ง {N} เป็น {d} ส่วนเท่า ๆ กัน: {N} ÷ {d} = {m} แล้วเอา {k} ส่วน: {m} × {k} = {ans}',
                f'Split {N} into {d} equal parts: {N} ÷ {d} = {m}. Take {k} parts: {m} × {k} = {ans}.',
                Fraction(k, d) * N == ans)


def g_frac_equiv(rng):
    a, b = rng.choice([(1, 2), (1, 3), (2, 3), (1, 4), (3, 4), (2, 5), (3, 5), (1, 5), (1, 6), (5, 6)])
    m = rng.randint(2, 5)
    A, B = a * m, b * m
    wrong = [(A + 1, B), (A, B + 1), (a + m, b + m), (A - 1, B) if A > 1 else (A + 2, B), (A, B - 1)]
    wrong = [w for w in wrong if w[0] * b != w[1] * a and w[1] > w[0] > 0]
    return make('fractions', f'เศษส่วนใดมีค่าเท่ากับ {a}/{b}', f'Which fraction is equal to {a}/{b}?', fr(A, B), [fr(*w) for w in wrong],
                f'คูณตัวเศษและตัวส่วนด้วยจำนวนเดียวกัน: {a} × {m} = {A} และ {b} × {m} = {B} จึงได้ {A}/{B}',
                f'Multiply the top and the bottom by the same number: {a} × {m} = {A} and {b} × {m} = {B}, so {A}/{B}.',
                Fraction(A, B) == Fraction(a, b) and A * b == B * a)


def t1(t): return f'{t // 10}.{t % 10}'            # จำนวนส่วนสิบ → ทศนิยม 1 ตำแหน่ง
def h2(h): return f'{h // 100}.{h % 100:02d}'       # จำนวนส่วนร้อย → ทศนิยม 2 ตำแหน่ง


def g_dec_addsub(rng, add):
    x, y = rng.randint(12, 89), rng.randint(12, 89)
    if add:
        if x % 10 + y % 10 < 10: return None
        r = x + y; op = '+'
        naive = f'{x // 10 + y // 10}.{x % 10 + y % 10}'                # ไม่ทด: 2.5 + 1.8 → 3.13
    else:
        if x <= y or x % 10 >= y % 10: return None
        r = x - y; op = '−'
        naive = f'{x // 10 - y // 10}.{y % 10 - x % 10}'                # ลบกลับด้าน
    if r % 10 == 0: return None
    wrong = [S(naive), S(t1(r + 10)), S(t1(r - 10)) if r > 10 else S(t1(r + 20)), S(t1(r + 1)), S(t1(r - 1))]
    exact = Decimal(t1(x)) + Decimal(t1(y)) if add else Decimal(t1(x)) - Decimal(t1(y))
    wrong = [w for w in wrong if Decimal(w[0]) != exact]
    return make('decimals', f'{t1(x)} {op} {t1(y)} = ?', f'{t1(x)} {op} {t1(y)} = ?', S(t1(r)), wrong,
                f'คิดเป็นส่วนสิบ: {x} {op} {y} = {r} ส่วนสิบ เขียนเป็น {t1(r)} (ตั้งจุดทศนิยมให้ตรงกัน)',
                f'Think in tenths: {x} {op} {y} = {r} tenths, which is {t1(r)}. Keep the decimal points lined up.',
                exact == Decimal(t1(r)))


def g_dec_compare(rng, big):
    base = rng.randint(1, 8)
    hs = set()
    while len(hs) < 4:
        c = rng.choice([base * 10, base * 10 + rng.randint(1, 9), base + rng.randint(1, 9) * 10, base * 10 + 10, base])
        if 0 < c < 100: hs.add(c)
    hs = sorted(hs)
    def show(h): return t1(h // 10) if h % 10 == 0 else h2(h)
    ans = hs[-1] if big else hs[0]
    shown = [show(h) for h in hs]
    if all('.' in s and len(s.split('.')[1]) == len(shown[0].split('.')[1]) for s in shown): return None   # ต้องมีจำนวนตำแหน่งต่างกัน
    decs = [Decimal(s) for s in shown]
    alt = shown[decs.index(max(decs) if big else min(decs))]
    padded = ', '.join(h2(h) for h in hs)
    w = ('มาก', 'largest') if big else ('น้อย', 'smallest')
    return make('decimals', f'ทศนิยมใด{w[0]}ที่สุด', f'Which decimal is the {w[1]}?', S(show(ans)), [S(show(h)) for h in hs if h != ans],
                f'เติม 0 ให้มีทศนิยม 2 ตำแหน่งเท่ากัน: {padded} แล้วเทียบ ได้ {show(ans)} {w[0]}ที่สุด',
                f'Write them all with 2 decimal places: {padded}. Then compare: {show(ans)} is the {w[1]}.',
                alt == show(ans))


def g_dec_fraction(rng, kind):
    if kind == 't':
        k = rng.randint(1, 9); ans = f'0.{k}'; den = 10
        wrong = [f'0.0{k}', f'{k}.0', f'{k}.10', f'1.{k}']
        thex = f'ส่วน 10 คือทศนิยม 1 ตำแหน่ง: {k}/10 = 0.{k} (อ่านว่า ศูนย์จุด{TH_D[k]})'
        enex = f'Tenths use 1 decimal place: {k}/10 = 0.{k} (say "zero point {EN_1[k]}").'
    elif kind == 'h':
        k = rng.randint(11, 99)
        if k % 10 == 0: return None
        ans = f'0.{k}'; den = 100
        wrong = [f'{k // 10}.{k % 10}', f'0.0{k}', f'{k}.0', f'{k}.100']
        thex = f'ส่วน 100 คือทศนิยม 2 ตำแหน่ง: {k}/100 = 0.{k}'
        enex = f'Hundredths use 2 decimal places: {k}/100 = 0.{k}.'
    else:
        k = rng.randint(2, 9); ans = f'0.0{k}'; den = 100
        wrong = [f'0.{k}', f'{k}.0', f'0.00{k}', f'{k}.100']
        thex = f'ส่วน 100 ต้องมีทศนิยม 2 ตำแหน่ง จึงเติม 0 ข้างหน้า: {k}/100 = 0.0{k}'
        enex = f'Hundredths need 2 decimal places, so put a 0 first: {k}/100 = 0.0{k}.'
    wrong = [S(w) for w in wrong if Decimal(w) != Decimal(ans)]
    rng.shuffle(wrong)
    return make('decimals', f'{k}/{den} เขียนเป็นทศนิยมได้อย่างไร', f'How do you write {k}/{den} as a decimal?', S(ans), wrong, thex, enex,
                Fraction(Decimal(ans)) == Fraction(k, den))


def g_dec_money(rng):
    b = rng.randint(2, 48); s = rng.choice([25, 50, 75])
    ans = f'{b}.{s}'
    wrong = [S(f'{b}{s // 10}.{s % 10}'), S(f'{b}.0{s}'), S(f'{s}.{b:02d}'), S(f'{b + 1}.{s}')]
    return make('decimals', f'{b} บาท {s} สตางค์ เขียนเป็นทศนิยมได้กี่บาท', f'How do you write {b} baht {s} satang in baht as a decimal?', S(ans), wrong,
                f'100 สตางค์ = 1 บาท ดังนั้น {s} สตางค์ = 0.{s} บาท รวมเป็น {ans} บาท',
                f'100 satang = 1 baht, so {s} satang = 0.{s} baht. Altogether {ans} baht.',
                Decimal(ans) * 100 == b * 100 + s)


UNITS = [('กิโลเมตร', 'เมตร', 'กม.', 'ม.', 'km', 'm', 1000), ('กิโลกรัม', 'กรัม', 'กก.', 'ก.', 'kg', 'g', 1000),
         ('ลิตร', 'มิลลิลิตร', 'ล.', 'มล.', 'litres', 'ml', 1000), ('เมตร', 'เซนติเมตร', 'ม.', 'ซม.', 'm', 'cm', 100),
         ('เซนติเมตร', 'มิลลิเมตร', 'ซม.', 'มม.', 'cm', 'mm', 10)]


def g_measure(rng, to_small):
    tb, ts, ab, as_, eb, es, f = rng.choice(UNITS)
    big = rng.randint(2, 9 if f > 10 else 25)
    small = rng.choice([5, 20, 45, 50, 75, 125, 250, 300, 450, 650, 800, 905]) if f == 1000 else rng.randint(2, f - 1)
    if small >= f: return None
    total = big * f + small
    eb1 = 'litre' if eb == 'litres' else eb
    ok = divmod(total, f) == (big, small) and rep_add(f, big) + small == total
    if to_small:
        concat = int(f'{big}{small}')
        return make('measure', f'{big} {tb} {small} {ts} เท่ากับกี่{ts}', f'How many {es} are in {big} {eb} {small} {es}?', P(total),
                    nums(total, [concat, big * (f // 10 if f > 10 else f * 10) + small, big + small, total + f, total - small], rng),
                    f'1 {tb} = {n(f)} {ts} ดังนั้น {big} {tb} = {n(big * f)} {ts} รวมกับ {small} {ts} ได้ {n(total)} {ts}',
                    f'1 {eb1} = {n(f)} {es}, so {big} {eb} = {n(big * f)} {es}. Add {small} {es} to get {n(total)} {es}.', ok)
    def pair(B, s): return (f'{B} {ab} {s} {as_}', f'{B} {eb} {s} {es}')
    cands = [(big + 1, small), (big, small // 10 if small >= 10 else small * 10), (big * 10, small), (big - 1, small), (big, small + 1)]
    wrong = [pair(B, s) for B, s in cands if B > 0 and 0 < s and (B, s) != (big, small) and B * f + s != total]
    return make('measure', f'{n(total)} {ts} เท่ากับเท่าไร', f'What is {n(total)} {es} the same as?', pair(big, small), wrong,
                f'{n(f)} {ts} = 1 {tb} · {n(total)} มี {n(f)} อยู่ {big} ครั้ง เหลือ {small} จึงเป็น {big} {tb} {small} {ts}',
                f'{n(f)} {es} = 1 {eb1}. {n(total)} holds {big} lots of {n(f)} with {small} left, so {big} {eb} {small} {es}.', ok)


EVENTS = [('หนังเริ่มฉาย', 'จบ', 'A film starts at', 'and ends at', 'How long is the film?', 'ฉายนานเท่าไร'),
          ('เรียนว่ายน้ำเริ่ม', 'เลิก', 'A swimming lesson starts at', 'and ends at', 'How long is the lesson?', 'เรียนนานเท่าไร'),
          ('รถไฟออก', 'ถึงปลายทาง', 'A train leaves at', 'and arrives at', 'How long is the journey?', 'เดินทางนานเท่าไร'),
          ('ซ้อมดนตรีเริ่ม', 'เลิก', 'Music practice starts at', 'and ends at', 'How long is the practice?', 'ซ้อมนานเท่าไร'),
          ('เริ่มเดินป่า', 'กลับถึงที่พัก', 'A hike starts at', 'and ends at', 'How long is the hike?', 'เดินนานเท่าไร')]


def hm(h, m): return (f'{h} ชม. {m} นาที', f'{h} h {m} min')
def hrs(h): return f'{h} hour' + ('' if h == 1 else 's')
def clock(t): return f'{t // 60}:{t % 60:02d}'


def g_time(rng, kind):
    if kind == 'dur':
        start = rng.randint(7, 16) * 60 + rng.choice(range(5, 60, 5))
        dur = rng.choice(range(65, 180, 5))
        if dur % 60 == 0 or (start % 60 + dur % 60) < 60: return None            # ต้องข้ามชั่วโมง
        end = start + dur
        ev = rng.choice(EVENTS)
        first = 60 - start % 60; nexth = start + first; rest = end - nexth
        h, m = divmod(dur, 60)
        d0 = datetime.datetime(2026, 1, 5)
        alt = (d0 + datetime.timedelta(minutes=end)) - (d0 + datetime.timedelta(minutes=start))
        cands = [(end // 60 - start // 60, abs(end % 60 - start % 60)), (h + 1, m), (h, m + 10 if m + 10 < 60 else m - 10), (h - 1, m) if h > 1 else (h + 2, m), (h, 60 - m)]
        wrong = [hm(*c) for c in cands if c != (h, m) and 0 < c[1] < 60 and c[0] >= 0]
        rest_th = f'{rest // 60} ชม. {rest % 60} นาที' if rest >= 60 and rest % 60 else (f'{rest // 60} ชม.' if rest >= 60 else f'{rest} นาที')
        rest_en = f'{rest // 60} h {rest % 60} min' if rest >= 60 and rest % 60 else (f'{rest // 60} h' if rest >= 60 else f'{rest} min')
        return make('time', f'{ev[0]} {clock(start)} {ev[1]} {clock(end)} {ev[5]}', f'{ev[2]} {clock(start)} {ev[3]} {clock(end)}. {ev[4]}', hm(h, m), wrong,
                    f'นับต่อ: {clock(start)} → {clock(nexth)} คือ {first} นาที · {clock(nexth)} → {clock(end)} คือ {rest_th} · รวม {h} ชม. {m} นาที',
                    f'Count on: {clock(start)} → {clock(nexth)} is {first} min · {clock(nexth)} → {clock(end)} is {rest_en} · total {h} h {m} min.',
                    alt == datetime.timedelta(hours=h, minutes=m))
    mins = rng.choice([x for x in range(75, 240, 5) if x % 60])
    h, m = divmod(mins, 60)
    ok = datetime.timedelta(minutes=mins) == datetime.timedelta(hours=h, minutes=m)
    if kind == 'to_hm':
        cands = [(mins // 100, mins % 100), (h + 1, m), (h, m + 10 if m + 10 < 60 else m - 10), (h - 1, m), (h, m + 5 if m + 5 < 60 else m - 5)]
        wrong = [hm(*c) for c in cands if c != (h, m) and c[0] > 0 and 0 < c[1] and c[0] * 60 + c[1] != mins]
        return make('time', f'{mins} นาที เท่ากับกี่ชั่วโมง กี่นาที', f'How many hours and minutes is {mins} minutes?', hm(h, m), wrong,
                    f'1 ชั่วโมง = 60 นาที · {mins} ÷ 60 ได้ {h} เศษ {m} จึงเป็น {h} ชั่วโมง {m} นาที',
                    f'1 hour = 60 minutes. {mins} ÷ 60 = {h} remainder {m}, so {hrs(h)} {m} minutes.', ok)
    return make('time', f'{h} ชั่วโมง {m} นาที เท่ากับกี่นาที', f'How many minutes is {hrs(h)} {m} minutes?', P(mins),
                nums(mins, [h * 100 + m, mins + 60, mins - 60, h + m, mins + 10], rng),
                f'1 ชั่วโมง = 60 นาที · {h} × 60 = {h * 60} แล้วบวก {m} ได้ {mins} นาที',
                f'1 hour = 60 minutes. {h} × 60 = {h * 60}, then add {m} to get {mins} minutes.', ok)


LEN = [('ซม.', 'ตารางเซนติเมตร', 'cm', 'square centimetres'), ('ม.', 'ตารางเมตร', 'm', 'square metres')]


def g_area(rng, kind):
    tu, tsq, eu, esq = rng.choice(LEN)
    if kind == 'rect':
        w = rng.randint(4, 12); l = rng.randint(w + 1, 16); A = w * l
        return make('area', f'สี่เหลี่ยมผืนผ้ากว้าง {w} {tu} ยาว {l} {tu} มีพื้นที่กี่{tsq}', f'A rectangle is {w} {eu} wide and {l} {eu} long. What is its area in {esq}?', P(A),
                    nums(A, [2 * (w + l), w + l, A + w, A - w, 2 * A], rng),
                    f'พื้นที่สี่เหลี่ยมผืนผ้า = กว้าง × ยาว = {w} × {l} = {A} {tsq} (ไม่ใช่เส้นรอบรูป)',
                    f'Area of a rectangle = width × length = {w} × {l} = {A} {esq} (not the perimeter).',
                    sum(1 for _ in range(w) for _ in range(l)) == A)
    if kind == 'square':
        s = rng.randint(6, 15); A = s * s
        return make('area', f'สี่เหลี่ยมจัตุรัสยาวด้านละ {s} {tu} มีพื้นที่กี่{tsq}', f'A square has sides of {s} {eu}. What is its area in {esq}?', P(A),
                    nums(A, [4 * s, 2 * s, A + s, A - s], rng),
                    f'พื้นที่สี่เหลี่ยมจัตุรัส = ด้าน × ด้าน = {s} × {s} = {A} {tsq}',
                    f'Area of a square = side × side = {s} × {s} = {A} {esq}.',
                    sum(1 for _ in range(s) for _ in range(s)) == A)
    if kind == 'side':
        s = rng.randint(7, 25); Pm = 4 * s
        return make('perimeter', f'สี่เหลี่ยมจัตุรัสมีเส้นรอบรูป {Pm} {tu} แต่ละด้านยาวกี่ {tu}', f'A square has a perimeter of {Pm} {eu}. How long is each side in {eu}?', P(s),
                    nums(s, [Pm // 2, s + 1, s - 1, Pm - 4, s + 4], rng),
                    f'สี่เหลี่ยมจัตุรัสมี 4 ด้านยาวเท่ากัน: {Pm} ÷ 4 = {s} {tu}',
                    f'A square has 4 equal sides: {Pm} ÷ 4 = {s} {eu}.', s + s + s + s == Pm)
    if kind == 'missing':
        w = rng.randint(4, 9); l = rng.randint(w + 2, 15); A = w * l
        return make('area', f'สี่เหลี่ยมผืนผ้ามีพื้นที่ {A} {tsq} กว้าง {w} {tu} ยาวกี่ {tu}', f'A rectangle has an area of {A} {esq} and is {w} {eu} wide. How long is it in {eu}?', P(l),
                    nums(l, [A - w, l + 1, l - 1, l + w, A // 2 if A % 2 == 0 else l + 2], rng),
                    f'พื้นที่ = กว้าง × ยาว ดังนั้น ยาว = {A} ÷ {w} = {l} {tu} ตรวจได้จาก {w} × {l} = {A}',
                    f'Area = width × length, so length = {A} ÷ {w} = {l} {eu}. Check: {w} × {l} = {A}.', rep_add(w, l) == A)
    w = rng.randint(12, 35); l = rng.randint(w + 5, 60); Pm = 2 * (w + l)
    return make('perimeter', f'สนามกว้าง {w} ม. ยาว {l} ม. เดินรอบสนาม 1 รอบ ได้ระยะทางกี่เมตร', f'A field is {w} m wide and {l} m long. How far is 1 lap around the field, in metres?', P(Pm),
                nums(Pm, [w + l, 2 * w + l, w + 2 * l, Pm + 10, Pm - 10], rng),
                f'เส้นรอบรูป = กว้าง + ยาว + กว้าง + ยาว = {w} + {l} + {w} + {l} = {Pm} เมตร',
                f'Perimeter = width + length + width + length = {w} + {l} + {w} + {l} = {Pm} m.', w + l + w + l == Pm)


def g_pattern(rng, kind):
    if kind == 'times':
        r = rng.choice([2, 2, 3]); a = rng.randint(2, 9)
        seq = [a * r ** i for i in range(5)]
    else:
        step = rng.choice([15, 25, 35, 45, 75, 125])
        if kind == 'up': a = rng.randint(4, 19) * 25; seq = [a + step * i for i in range(5)]
        else: a = rng.randint(24, 39) * 25; seq = [a - step * i for i in range(5)]
        if min(seq) <= 0 or max(seq) >= 1000: return None
    k = rng.choice([2, 3])
    ans = seq[k]
    shown = ', '.join('?' if i == k else n(v) for i, v in enumerate(seq))
    if kind == 'times':
        ok = all(seq[i + 1] == rep_add(seq[i], r) for i in range(4))
        cands = [seq[k - 1] + seq[k - 1] // r if k else ans + 1, seq[k - 1] + r, ans + r, ans - r, seq[k - 1] * (r + 1)]
        thex = f'คูณ {r} ทุกครั้ง: {n(seq[k - 1])} × {r} = {n(ans)} และ {n(ans)} × {r} = {n(seq[k + 1])}'
        enex = f'Multiply by {r} each time: {n(seq[k - 1])} × {r} = {n(ans)}, and {n(ans)} × {r} = {n(seq[k + 1])}.'
    else:
        ok = len({seq[i + 1] - seq[i] for i in range(4)}) == 1
        cands = [ans + 10, ans - 10, ans + 5, ans - 5, ans + step // 5 * 2]
        if kind == 'up':
            thex = f'เพิ่มขึ้นทีละ {step}: {n(seq[k - 1])} + {step} = {n(ans)}'
            enex = f'The numbers go up by {step} each time: {n(seq[k - 1])} + {step} = {n(ans)}.'
        else:
            thex = f'ลดลงทีละ {step}: {n(seq[k - 1])} − {step} = {n(ans)}'
            enex = f'The numbers go down by {step} each time: {n(seq[k - 1])} − {step} = {n(ans)}.'
    return make('patterns', f'เลขที่หายไปคืออะไร: {shown}', f'What is the missing number: {shown}?', P(ans), nums(ans, cands, rng), thex, enex, ok)


SHOP = [('สมุด', 'เล่ม', 'notebooks'), ('ปากกา', 'ด้าม', 'pens'), ('ขนมปัง', 'ก้อน', 'loaves of bread'), ('นม', 'กล่อง', 'cartons of milk'), ('ไม้บรรทัด', 'อัน', 'rulers')]
CRATE = [('ส้ม', 'ลัง', 'ผล', 'crates', 'oranges'), ('ไข่', 'ถาด', 'ฟอง', 'trays', 'eggs'), ('ดินสอ', 'กล่อง', 'แท่ง', 'boxes', 'pencils'), ('มะม่วง', 'เข่ง', 'ผล', 'baskets', 'mangoes')]
KIDS = [('ลีอา', 'Leah'), ('มะลิ', 'Mali'), ('ภูมิ', 'Poom'), ('นีน่า', 'Nina'), ('เบน', 'Ben'), ('ข้าวหอม', 'Khaohom')]
THINGS = [('ลูกปัด', 'เม็ด', 'beads'), ('สติกเกอร์', 'ดวง', 'stickers'), ('ลูกแก้ว', 'ลูก', 'marbles'), ('การ์ด', 'ใบ', 'cards')]


def g_word(rng, kind):
    if kind == 'change':
        it, cl, en = rng.choice(SHOP); k = rng.randint(3, 8); p = rng.choice([15, 25, 35, 45, 65])
        note = 500 if k * p > 90 else 100
        if k * p >= note: return None
        ans = note - k * p
        left = note
        for _ in range(k): left -= p
        return make('word-problem', f'ซื้อ{it} {k} {cl} {cl}ละ {p} บาท จ่ายธนบัตร {note} บาท ได้เงินทอนกี่บาท',
                    f'You buy {k} {en} at {p} baht each and pay with a {note}-baht note. How much change do you get?', P(ans),
                    nums(ans, [note - p, k * p, ans + 10, ans - 10, note - (k + p)], rng),
                    f'ราคารวม {k} × {p} = {k * p} บาท · เงินทอน {note} − {k * p} = {ans} บาท',
                    f'Total cost: {k} × {p} = {k * p} baht. Change: {note} − {k * p} = {ans} baht.', left == ans)
    if kind == 'crate':
        it, box, cl, eb, ei = rng.choice(CRATE); k = rng.randint(4, 9); each = rng.choice([24, 30, 36, 48])
        sold = rng.randint(4, 12) * 10; tot = k * each
        if sold >= tot: return None
        ans = tot - sold
        return make('word-problem', f'มี{it} {k} {box} {box}ละ {each} {cl} ขายไป {sold} {cl} เหลือกี่{cl}',
                    f'There are {k} {eb} with {each} {ei} in each. {sold} {ei} are sold. How many are left?', P(ans),
                    nums(ans, [tot, each - k, tot + sold, ans + 10, ans - each], rng),
                    f'ทั้งหมด {k} × {each} = {tot} {cl} · ขายไป {sold} เหลือ {tot} − {sold} = {ans} {cl}',
                    f'Altogether: {k} × {each} = {tot}. After selling {sold}: {tot} − {sold} = {ans} left.', rep_add(each, k) - sold == ans)
    if kind == 'share':
        (a_th, a_en), (b_th, b_en) = rng.sample(KIDS, 2); it, cl, en = rng.choice(THINGS)
        k = rng.randint(4, 9); each = rng.randint(12, 35); tot = k * each
        a = rng.randint(tot // 3, tot // 2); b = tot - a
        if a == b: return None
        return make('word-problem', f'{a_th}มี{it} {a} {cl} {b_th}มี {b} {cl} รวมกันแล้วแบ่งใส่ถุง {k} ถุงเท่า ๆ กัน ได้ถุงละกี่{cl}',
                    f'{a_en} has {a} {en} and {b_en} has {b}. They share them all equally into {k} bags. How many go in each bag?', P(each),
                    nums(each, [a // k, tot, each + 1, each - 1, each + k], rng),
                    f'รวมกัน {a} + {b} = {tot} {cl} · แบ่ง {k} ถุง: {tot} ÷ {k} = {each} {cl}',
                    f'Together: {a} + {b} = {tot}. Shared into {k} bags: {tot} ÷ {k} = {each}.', rep_add(each, k) == col_add(a, b))
    if kind == 'save':
        per = rng.choice([12, 15, 20, 25]); days = rng.choice([14, 20, 30]); tot = per * days
        cost = rng.randint(tot // 4 // 5, tot * 3 // 4 // 5) * 5
        ans = tot - cost
        return make('word-problem', f'ออมเงินวันละ {per} บาท เป็นเวลา {days} วัน แล้วซื้อหนังสือ {cost} บาท เหลือเงินกี่บาท',
                    f'You save {per} baht a day for {days} days, then buy a book for {cost} baht. How much money is left?', P(ans),
                    nums(ans, [tot, tot + cost, ans + 10, ans - 10, cost - per], rng),
                    f'ออมได้ {per} × {days} = {tot} บาท · ซื้อหนังสือแล้วเหลือ {tot} − {cost} = {ans} บาท',
                    f'Saved: {per} × {days} = {tot} baht. After the book: {tot} − {cost} = {ans} baht.', col_add(ans, cost) == rep_add(per, days))
    if kind == 'times':
        (a_th, a_en), (b_th, b_en) = rng.sample(KIDS, 2); it, cl, en = rng.choice(THINGS)
        a = rng.randint(18, 65); k = rng.randint(3, 6); ans = a + a * k
        return make('word-problem', f'{a_th}มี{it} {a} {cl} {b_th}มีเป็น {k} เท่าของ{a_th} สองคนมีรวมกันกี่{cl}',
                    f'{a_en} has {a} {en}. {b_en} has {k} times as many. How many do they have altogether?', P(ans),
                    nums(ans, [a * k, a + k, ans - a * 2, ans + a, a * k - a], rng),
                    f'{b_th}มี {a} × {k} = {a * k} {cl} · รวมสองคน {a} + {a * k} = {ans} {cl}',
                    f'{b_en} has {a} × {k} = {a * k}. Altogether: {a} + {a * k} = {ans}.', rep_add(a, k + 1) == ans)
    rows = rng.randint(8, 15); per = rng.randint(12, 24); tot = rows * per
    used = rng.randint(tot // 3, tot * 4 // 5)
    ans = tot - used
    return make('word-problem', f'โรงหนังมีที่นั่ง {rows} แถว แถวละ {per} ที่ มีคนนั่งแล้ว {used} ที่ เหลือที่ว่างกี่ที่',
                f'A cinema has {rows} rows of {per} seats. {used} seats are taken. How many seats are empty?', P(ans),
                nums(ans, [tot, used - per, ans + 10, ans - 10, tot + used], rng),
                f'ที่นั่งทั้งหมด {rows} × {per} = {tot} ที่ · ว่าง {tot} − {used} = {ans} ที่',
                f'All seats: {rows} × {per} = {tot}. Empty: {tot} − {used} = {ans}.', col_add(ans, used) == rep_add(per, rows))


ANGLE_NAMES = [(('มุมแหลม', 'an acute angle'), lambda d: d < 90), (('มุมฉาก', 'a right angle'), lambda d: d == 90),
               (('มุมป้าน', 'an obtuse angle'), lambda d: 90 < d < 180), (('มุมตรง', 'a straight angle'), lambda d: d == 180)]
ANGLE_QUEUE = []


def g_angle(rng):
    global ANGLE_QUEUE
    if not ANGLE_QUEUE: ANGLE_QUEUE = [rng.choice(range(20, 85, 5)), 90, rng.choice(range(100, 175, 5)), 180]
    d = ANGLE_QUEUE.pop(0)
    right = [nm for nm, f in ANGLE_NAMES if f(d)]
    kind = 0 if d < 90 else 1 if d == 90 else 2 if d < 180 else 3
    return make('angles', f'มุมขนาด {d}° เป็นมุมชนิดใด', f'What kind of angle is {d}°?', right[0], [nm for nm, f in ANGLE_NAMES if not f(d)],
                f'{d}° {["เล็กกว่า 90°", "เท่ากับ 90° พอดี", "มากกว่า 90° แต่ไม่ถึง 180°", "เท่ากับ 180° พอดี"][kind]} จึงเป็น{right[0][0]} · มุมแหลม < 90° · มุมฉาก = 90° · มุมป้าน 90°–180° · มุมตรง = 180°',
                f'{d}° is {["less than 90°", "exactly 90°", "more than 90° but less than 180°", "exactly 180°"][kind]}, so it is {right[0][1]}. Acute < 90° · right = 90° · obtuse 90°–180° · straight = 180°.',
                len(right) == 1 and ANGLE_NAMES[kind][0] == right[0])


# แผนของแต่ละอายุ: (ตัวสร้าง, จำนวนข้อ) หรือ K(ตัวสร้าง, ชนิดย่อย, จำนวนข้อ) · level = อายุ − 5 ตามแบบคลังเดิม (6→1, 7→2, 8→3)
def K(fn, kind, count):
    def gen(rng): return fn(rng, kind)
    gen.__name__ = f'{fn.__name__}[{kind}]'
    return (gen, count)


PLANS = {
    9: [(g_add, 8), (g_sub, 8),
        K(g_mul, '21', 4), K(g_mul, '31', 6), K(g_mul, '22', 6),
        K(g_div, 'exact', 8), K(g_div, 'rem', 5), K(g_div, 'missing', 3),
        (g_place_digit, 4), (g_place_expand, 3), (g_place_words, 3), (g_place_compare, 2),
        K(g_round, 10, 4), K(g_round, 100, 4), K(g_round, 1000, 4),
        K(g_frac_addsub, True, 4), K(g_frac_addsub, False, 3),
        K(g_frac_compare, (True, True), 1), K(g_frac_compare, (True, False), 1), K(g_frac_compare, (False, True), 1), K(g_frac_compare, (False, False), 1),
        (g_frac_of, 5), (g_frac_equiv, 4),
        K(g_dec_addsub, True, 3), K(g_dec_addsub, False, 3), K(g_dec_compare, True, 2), K(g_dec_compare, False, 1),
        K(g_dec_fraction, 't', 1), K(g_dec_fraction, 'h', 1), K(g_dec_fraction, 's', 1), (g_dec_money, 2),
        K(g_measure, True, 6), K(g_measure, False, 6),
        K(g_time, 'dur', 4), K(g_time, 'to_hm', 3), K(g_time, 'to_min', 3),
        K(g_area, 'rect', 4), K(g_area, 'square', 2), K(g_area, 'side', 2), K(g_area, 'missing', 2), K(g_area, 'peri', 2),
        K(g_pattern, 'up', 3), K(g_pattern, 'down', 3), K(g_pattern, 'times', 3),
        K(g_word, 'change', 2), K(g_word, 'crate', 2), K(g_word, 'share', 2), K(g_word, 'save', 2), K(g_word, 'times', 2), K(g_word, 'seats', 2),
        (g_angle, 4)],
}
UNIQUE_Q = {'g_frac_equiv'}        # ตัวสร้างที่ข้อความโจทย์ต้องไม่ซ้ำเลย (แม้เฉลยต่างกัน)


def build(age):
    rng = random.Random(20261005 + age)
    items, seen = [], set()
    for gen, want in PLANS[age]:
        got, tries = 0, 0
        while got < want:
            tries += 1
            if tries > 5000: raise RuntimeError(f'{gen.__name__}: สร้างไม่ครบ {want} ข้อ')
            try: it = gen(rng)
            except ValueError: it = None            # ตัวลวงไม่พอ ทิ้งแล้วสุ่มใหม่ (ตรวจซ้ำไม่ผ่านเป็น AssertionError จะหยุดทั้งโปรแกรม)
            if it is None: continue
            key = (it['thq'], it['ans'][0])
            if key in seen or (it['enq'], it['ans'][1]) in seen: continue
            if gen.__name__ in UNIQUE_Q and it['thq'] in seen: continue
            seen.add(it['thq'])
            seen.add(key); seen.add((it['enq'], it['ans'][1]))
            items.append(it); got += 1
    rng.shuffle(items)
    slots = [i % 4 for i in range(len(items))]
    rng.shuffle(slots)
    out = []
    for i, (it, pos) in enumerate(zip(items, slots)):
        wrong = it['wrong'][:]; rng.shuffle(wrong)
        ch = wrong[:pos] + [it['ans']] + wrong[pos:]
        out.append({'age': age, 'subject': 'math', 'topic': it['topic'], 'level': age - 5, 'answer': pos,
                    'th': {'q': it['thq'], 'choices': [c[0] for c in ch], 'explain': it['thex']},
                    'en': {'q': it['enq'], 'choices': [c[1] for c in ch], 'explain': it['enex']},
                    'id': f'ma-{age}-{i + 1:04d}'})
    return out


if __name__ == '__main__':
    age = int(sys.argv[1]) if len(sys.argv) > 1 else 9
    if age not in PLANS: sys.exit(f'ยังไม่มีแผนของอายุ {age} (มี: {sorted(PLANS)})')
    qs = build(age)
    name = f'q-math-{age}.json'
    with open(name, 'w', encoding='utf-8') as fh:
        json.dump({'version': 1, 'subject': 'math', 'age': age, 'count': len(qs), 'questions': qs}, fh, ensure_ascii=False, separators=(',', ':'))
    import collections
    print(f'{name}: {len(qs)} ข้อ · ตรวจซ้ำอีกทางผ่าน {VERIFIED} ครั้ง (รวมข้อที่สุ่มซ้ำแล้วทิ้ง) · ไม่ผ่าน 0')
    print('หัวข้อ:', dict(collections.Counter(q['topic'] for q in qs)))
