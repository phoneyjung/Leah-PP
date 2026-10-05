#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_questions.py - ประกอบไฟล์คลังคำถามจากไฟล์ต้นฉบับที่เขียนด้วยมือ (DESIGN_CRYSTAL_JOB.md ข้อ 4.7)

  python3 build_questions.py english 9      อ่าน qsrc_english_9.py แล้วเขียน q-english-9.json

ไฟล์ต้นฉบับ qsrc_<วิชา>_<อายุ>.py ต้องมีตัวแปร ITEMS เป็นรายการของ
  {'topic','th':(โจทย์,[ตัวเลือก 4],คำอธิบาย),'en':(...),+ช่องเสริม speak/speakLang/audioFirst/needs}
โดย "ตัวเลือกแรกคือเฉลยเสมอ" สคริปต์นี้จะสลับตำแหน่งเฉลยให้กระจายเท่ากัน ใส่ id และ level ให้เอง
สุ่มด้วยเมล็ดคงที่ รันกี่ครั้งได้ไฟล์เดิม · หลังสร้างให้รัน check_questions.py เสมอ
"""
import importlib, json, random, sys, zlib

PREFIX = {'math': 'ma', 'english': 'en', 'thai': 'th', 'chinese': 'zh', 'general': 'gk'}
EXTRA = ('speak', 'speakLang', 'audioFirst', 'needs')


def build(subject, age):
    items = list(importlib.import_module(f'qsrc_{subject}_{age}').ITEMS)
    rng = random.Random(zlib.crc32(f'{subject}-{age}'.encode()))
    rng.shuffle(items)
    slots = [i % 4 for i in range(len(items))]
    rng.shuffle(slots)
    out = []
    for i, (it, pos) in enumerate(zip(items, slots)):
        order = [1, 2, 3]; rng.shuffle(order); order.insert(pos, 0)      # ตำแหน่งเดียวกันทั้งสองภาษา
        q = {'age': age, 'subject': subject, 'topic': it['topic'], 'level': age - 5, 'answer': pos}
        for L in ('th', 'en'):
            text, choices, explain = it[L]
            if len(choices) != 4: raise ValueError(f'ตัวเลือกไม่ครบ 4: {text} {choices}')
            q[L] = {'q': text, 'choices': [choices[k] for k in order], 'explain': explain}
        for k in EXTRA:
            if k in it: q[k] = it[k]
        q['id'] = f'{PREFIX[subject]}-{age}-{i + 1:04d}'
        out.append(q)
    return out


if __name__ == '__main__':
    subject, age = sys.argv[1], int(sys.argv[2])
    qs = build(subject, age)
    name = f'q-{subject}-{age}.json'
    with open(name, 'w', encoding='utf-8') as fh:
        json.dump({'version': 1, 'subject': subject, 'age': age, 'count': len(qs), 'questions': qs}, fh, ensure_ascii=False, separators=(',', ':'))
    import collections
    print(f'{name}: {len(qs)} ข้อ · หัวข้อ:', dict(collections.Counter(q['topic'] for q in qs)))
