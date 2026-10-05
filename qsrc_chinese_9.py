# -*- coding: utf-8 -*-
"""ต้นฉบับคำถามภาษาจีน อายุ 9 · 165 ข้อ
ประกอบเป็น q-chinese-9.json ด้วย: python3 build_questions.py chinese 9

ระดับ: ต่อจากคลังเดิมอายุ 6-8 (คำศัพท์ราว 85 คำ ระดับเริ่มเรียน) ไม่ใช่ระดับเจ้าของภาษา
เพิ่มคำใหม่ 71 คำ (ระดับ HSK 1) ตัวเลข 11-100 วันและเดือน ประโยคสั้น คำถาม และลักษณนาม
พินอินทุกคำเขียนแยกพยางค์ในตาราง เพื่อให้สคริปต์บอกเสียงวรรณยุกต์ในคำอธิบายได้เอง
ทุกแถว: คำตอบที่ถูกอยู่ก่อน ตามด้วยตัวลวง 3 ตัว
"""
import random

ITEMS = []
ZH = {'speakLang': 'zh-CN'}

# ---------------------------------------------------------------- เสียงวรรณยุกต์จากพินอิน
MARKS = {1: 'āēīōūǖ', 2: 'áéíóúǘ', 3: 'ǎěǐǒǔǚ', 4: 'àèìòùǜ'}
TONE_TH = {1: 'เสียงที่ 1 สูงเรียบ', 2: 'เสียงที่ 2 ขึ้น', 3: 'เสียงที่ 3 ต่ำแล้วขึ้น', 4: 'เสียงที่ 4 ตก', 0: 'เสียงเบา'}
TONE_EN = {1: 'tone 1, high and flat', 2: 'tone 2, rising', 3: 'tone 3, dipping', 4: 'tone 4, falling', 0: 'light tone'}


def tone(syl):
    for t, chars in MARKS.items():
        if any(c in chars for c in syl.lower()): return t
    return 0


def tones(py, table):
    return ' + '.join(table[tone(s)] for s in py.split())


def joined(py):
    return py.replace(' ', '')


# ---------------------------------------------------------------- คำศัพท์ใหม่ 71 คำ (ตัวจีน, พินอินแยกพยางค์, ไทย, อังกฤษ)
VOCAB = {
    'people': [('他', 'tā', 'เขา (ผู้ชาย)', 'he'), ('她', 'tā', 'เธอ (ผู้หญิง)', 'she'), ('我们', 'wǒ men', 'พวกเรา', 'we'),
               ('学生', 'xué sheng', 'นักเรียน', 'student'), ('同学', 'tóng xué', 'เพื่อนร่วมชั้น', 'classmate'),
               ('医生', 'yī shēng', 'หมอ', 'doctor'), ('孩子', 'hái zi', 'เด็ก', 'child')],
    'verbs': [('吃', 'chī', 'กิน', 'eat'), ('喝', 'hē', 'ดื่ม', 'drink'), ('看', 'kàn', 'ดู', 'look'), ('听', 'tīng', 'ฟัง', 'listen'),
              ('说', 'shuō', 'พูด', 'speak'), ('读', 'dú', 'อ่าน', 'read'), ('写', 'xiě', 'เขียน', 'write'), ('去', 'qù', 'ไป', 'go'),
              ('来', 'lái', 'มา', 'come'), ('坐', 'zuò', 'นั่ง', 'sit'), ('睡觉', 'shuì jiào', 'นอนหลับ', 'sleep'),
              ('喜欢', 'xǐ huan', 'ชอบ', 'like'), ('买', 'mǎi', 'ซื้อ', 'buy'), ('有', 'yǒu', 'มี', 'have'),
              ('是', 'shì', 'เป็น คือ', 'be (am, is, are)'), ('叫', 'jiào', 'ชื่อว่า', 'be called'), ('学习', 'xué xí', 'เรียน', 'study'),
              ('开', 'kāi', 'เปิด', 'open'), ('玩', 'wán', 'เล่น', 'play'), ('跑', 'pǎo', 'วิ่ง', 'run'), ('走', 'zǒu', 'เดิน', 'walk')],
    'adjectives': [('好', 'hǎo', 'ดี', 'good'), ('多', 'duō', 'เยอะ', 'many'), ('少', 'shǎo', 'น้อย', 'few'), ('高', 'gāo', 'สูง', 'tall'),
                   ('热', 'rè', 'ร้อน', 'hot'), ('冷', 'lěng', 'หนาว', 'cold'), ('高兴', 'gāo xìng', 'ดีใจ', 'happy'),
                   ('漂亮', 'piào liang', 'สวย', 'pretty'), ('快', 'kuài', 'เร็ว', 'fast'), ('慢', 'màn', 'ช้า', 'slow'),
                   ('新', 'xīn', 'ใหม่', 'new'), ('长', 'cháng', 'ยาว', 'long')],
    'time': [('今天', 'jīn tiān', 'วันนี้', 'today'), ('明天', 'míng tiān', 'พรุ่งนี้', 'tomorrow'), ('昨天', 'zuó tiān', 'เมื่อวาน', 'yesterday'),
             ('星期', 'xīng qī', 'สัปดาห์', 'week'), ('年', 'nián', 'ปี', 'year'), ('月', 'yuè', 'เดือน', 'month'),
             ('现在', 'xiàn zài', 'ตอนนี้', 'now'), ('晚上', 'wǎn shang', 'ตอนกลางคืน', 'evening or night'), ('中午', 'zhōng wǔ', 'ตอนเที่ยง', 'noon')],
    'things': [('桌子', 'zhuō zi', 'โต๊ะ', 'table'), ('椅子', 'yǐ zi', 'เก้าอี้', 'chair'), ('门', 'mén', 'ประตู', 'door'), ('钱', 'qián', 'เงิน', 'money'),
               ('电话', 'diàn huà', 'โทรศัพท์', 'telephone'), ('电脑', 'diàn nǎo', 'คอมพิวเตอร์', 'computer'), ('衣服', 'yī fu', 'เสื้อผ้า', 'clothes'),
               ('商店', 'shāng diàn', 'ร้านค้า', 'shop'), ('医院', 'yī yuàn', 'โรงพยาบาล', 'hospital'), ('中国', 'Zhōng guó', 'ประเทศจีน', 'China'),
               ('泰国', 'Tài guó', 'ประเทศไทย', 'Thailand'), ('汉语', 'Hàn yǔ', 'ภาษาจีน', 'the Chinese language'), ('名字', 'míng zi', 'ชื่อ', 'name'),
               ('天气', 'tiān qì', 'อากาศ', 'weather'), ('水果', 'shuǐ guǒ', 'ผลไม้', 'fruit'), ('杯子', 'bēi zi', 'แก้วน้ำ', 'cup')],
    'question': [('什么', 'shén me', 'อะไร', 'what'), ('谁', 'shéi', 'ใคร', 'who'), ('哪儿', 'nǎr', 'ที่ไหน', 'where'), ('几', 'jǐ', 'กี่', 'how many'),
                 ('这', 'zhè', 'นี่', 'this'), ('那', 'nà', 'นั่น', 'that')],
}
WORDS = [(g,) + w for g, ws in VOCAB.items() for w in ws]
assert len(WORDS) == 71 and len({w[1] for w in WORDS}) == 71
rng = random.Random(909)
order = WORDS[:]
rng.shuffle(order)


def others(word, same_pinyin_ok=True):
    """ตัวลวง 3 คำจากกลุ่มเดียวกัน (สุ่มแบบคงที่) · ถ้า same_pinyin_ok=False จะไม่เอาคำที่พินอินตรงกัน"""
    pool = [w for w in WORDS if w[0] == word[0] and w[1] != word[1] and (same_pinyin_ok or joined(w[2]).lower() != joined(word[2]).lower())]
    return random.Random(word[1]).sample(pool, 3)


def explain(w):
    _, hz, py, th, en = w
    return (f'{hz} อ่านว่า {joined(py)} ({tones(py, TONE_TH)}) แปลว่า {th}', f'{hz} is read {joined(py)} ({tones(py, TONE_EN)}). It means "{en}".')


def vocab_item(kind, w):
    _, hz, py, th, en = w
    p = joined(py)
    ex_th, ex_en = explain(w)
    if kind == 'meaning':
        o = others(w)
        it = {'topic': 'meaning', 'th': (f'คำว่า {hz} ({p}) แปลว่าอะไร', [th] + [x[3] for x in o], ex_th),
              'en': (f'What does {hz} ({p}) mean?', [en] + [x[4] for x in o], ex_en)}
    elif kind == 'say-it':
        o = others(w)
        ch = [f'{hz} ({p})'] + [f'{x[1]} ({joined(x[2])})' for x in o]
        it = {'topic': 'say-it', 'th': (f'คำว่า "{th}" ภาษาจีนคือคำไหน', ch, ex_th), 'en': (f'Which Chinese word means "{en}"?', ch, ex_en)}
    elif kind == 'read-hanzi':
        o = others(w)
        it = {'topic': 'read-hanzi', 'th': (f'ตัวอักษร {hz} แปลว่าอะไร (ไม่มีพินอินช่วย)', [th] + [x[3] for x in o], ex_th),
              'en': (f'What does {hz} mean? (no pinyin)', [en] + [x[4] for x in o], ex_en)}
    else:
        o = others(w, same_pinyin_ok=False)
        ch = [hz] + [x[1] for x in o]
        it = {'topic': 'pinyin', 'th': (f'พินอิน "{p}" เขียนเป็นตัวจีนว่าอะไร', ch, ex_th), 'en': (f'Which characters are written "{p}" in pinyin?', ch, ex_en)}
    if kind in ('meaning', 'read-hanzi'): it.update(speak=hz, **ZH)      # เสียงอ่านเฉพาะแบบที่ไม่เฉลยคำตอบ
    ITEMS.append(it)


# แต่ละคำถูกถามไม่เกิน 2 แบบ: ความหมาย 30 · พูดเป็นจีน 26 · อ่านตัวจีนไม่มีพินอิน 22 · พินอินเป็นตัวจีน 18
for w in order[:30]: vocab_item('meaning', w)
for w in order[30:56]: vocab_item('say-it', w)
for w in order[56:71] + order[:7]: vocab_item('read-hanzi', w)
for w in [w for w in order[30:56] if w[1] not in ('他', '她')][:18]: vocab_item('pinyin', w)

# ---------------------------------------------------------------- ตัวเลข 11-100 (16)
def num(th_q, en_q, right, wrong, th_ex, en_ex, speak):
    ch = [right] + wrong
    it = {'topic': 'numbers', 'th': (th_q, ch, th_ex), 'en': (en_q, ch, en_ex)}
    if speak: it.update(speak=speak, **ZH)
    ITEMS.append(it)


TENS = 'หลักสิบพูดก่อน ตามด้วย 十 (shí) แล้วตามด้วยหลักหน่วย'
TENS_EN = 'Say the tens digit, then 十 (shí), then the ones digit'
for n, right, wrong, parts_th, parts_en in [
        (11, '十一', ['一十', '一一', '二十一'], '十 (10) + 一 (1)', '十 (10) + 一 (1)'),
        (15, '十五', ['五十', '一五', '二十五'], '十 (10) + 五 (5)', '十 (10) + 五 (5)'),
        (20, '二十', ['十二', '二二', '二十二'], '二 (2) × 十 (10)', '二 (2) × 十 (10)'),
        (25, '二十五', ['五十二', '二五', '十二五'], '二十 (20) + 五 (5)', '二十 (20) + 五 (5)'),
        (38, '三十八', ['八十三', '三八', '十三八'], '三十 (30) + 八 (8)', '三十 (30) + 八 (8)'),
        (47, '四十七', ['七十四', '四七', '十四七'], '四十 (40) + 七 (7)', '四十 (40) + 七 (7)'),
        (60, '六十', ['十六', '六六', '六十六'], '六 (6) × 十 (10)', '六 (6) × 十 (10)'),
        (99, '九十九', ['九九', '十九', '九十'], '九十 (90) + 九 (9)', '九十 (90) + 九 (9)')]:
    num(f'เลข {n} ภาษาจีนเขียนว่าอย่างไร', f'How do you write {n} in Chinese?', right, wrong,
        f'{TENS}: {n} = {parts_th} = {right}', f'{TENS_EN}: {n} = {parts_en} = {right}.', None)
for hz, n, wrong, parts in [
        ('十二', 12, ['20', '21', '102'], '十 (10) + 二 (2)'), ('三十', 30, ['13', '33', '3'], '三 (3) × 十 (10)'),
        ('五十六', 56, ['65', '516', '50'], '五十 (50) + 六 (6)'), ('七十四', 74, ['47', '704', '14'], '七十 (70) + 四 (4)'),
        ('八十一', 81, ['18', '801', '80'], '八十 (80) + 一 (1)'), ('九十', 90, ['19', '99', '9'], '九 (9) × 十 (10)')]:
    num(f'{hz} คือเลขอะไร', f'Which number is {hz}?', str(n), wrong, f'{parts} = {n}', f'{parts} = {n}.', hz)
num('一百 (yìbǎi) คือเลขอะไร', 'Which number is 一百 (yìbǎi)?', '100', ['10', '1,000', '110'],
    '百 (bǎi) แปลว่า ร้อย: 一百 = หนึ่งร้อย = 100', '百 (bǎi) means hundred: 一百 = one hundred = 100.', '一百')
num('零 (líng) คือเลขอะไร', 'Which number is 零 (líng)?', '0', ['10', '100', '6'],
    '零 อ่านว่า líng (เสียงที่ 2 ขึ้น) แปลว่า ศูนย์', '零 is read líng (tone 2, rising). It means zero.', '零')

# ---------------------------------------------------------------- ประโยคสั้น (22)
def sent(hz, py, th, en, th_wrong, en_wrong, th_gloss, en_gloss):
    ITEMS.append({'topic': 'sentences', 'speak': hz, **ZH,
                  'th': (f'{hz} ({py}) แปลว่าอะไร', [th] + th_wrong, th_gloss),
                  'en': (f'What does {hz} ({py}) mean?', [en] + en_wrong, en_gloss)})


sent('我是学生。', 'Wǒ shì xuésheng.', 'ฉันเป็นนักเรียน', 'I am a student.',
     ['ฉันเป็นครู', 'เขาเป็นนักเรียน', 'ฉันไม่ใช่นักเรียน'], ['I am a teacher.', 'He is a student.', 'I am not a student.'],
     '我 = ฉัน · 是 = เป็น · 学生 = นักเรียน', '我 = I · 是 = am · 学生 = student.')
sent('他是我的朋友。', 'Tā shì wǒ de péngyou.', 'เขาเป็นเพื่อนของฉัน', 'He is my friend.',
     ['เขาเป็นพี่ชายของฉัน', 'ฉันเป็นเพื่อนของเขา', 'เขาเป็นครูของฉัน'], ['He is my older brother.', 'I am his friend.', 'He is my teacher.'],
     '他 = เขา · 是 = เป็น · 我的 = ของฉัน · 朋友 = เพื่อน', '他 = he · 是 = is · 我的 = my · 朋友 = friend.')
sent('我有一只猫。', 'Wǒ yǒu yì zhī māo.', 'ฉันมีแมวหนึ่งตัว', 'I have one cat.',
     ['ฉันมีหมาหนึ่งตัว', 'ฉันมีแมวสองตัว', 'ฉันชอบแมว'], ['I have one dog.', 'I have two cats.', 'I like cats.'],
     '我 = ฉัน · 有 = มี · 一只 = หนึ่งตัว · 猫 = แมว', '我 = I · 有 = have · 一只 = one (animal) · 猫 = cat.')
sent('我喜欢吃苹果。', 'Wǒ xǐhuan chī píngguǒ.', 'ฉันชอบกินแอปเปิล', 'I like eating apples.',
     ['ฉันชอบกินกล้วย', 'ฉันไม่ชอบกินแอปเปิล', 'ฉันซื้อแอปเปิล'], ['I like eating bananas.', 'I do not like eating apples.', 'I buy apples.'],
     '我 = ฉัน · 喜欢 = ชอบ · 吃 = กิน · 苹果 = แอปเปิล', '我 = I · 喜欢 = like · 吃 = eat · 苹果 = apple.')
sent('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'คุณชื่ออะไร', 'What is your name?',
     ['คุณอายุเท่าไร', 'คุณไปไหน', 'คุณเป็นใคร'], ['How old are you?', 'Where are you going?', 'Who are you?'],
     '你 = คุณ · 叫 = ชื่อว่า · 什么 = อะไร · 名字 = ชื่อ', '你 = you · 叫 = are called · 什么 = what · 名字 = name.')
sent('我不喝茶。', 'Wǒ bù hē chá.', 'ฉันไม่ดื่มชา', 'I do not drink tea.',
     ['ฉันดื่มชา', 'ฉันไม่ดื่มนม', 'ฉันชอบดื่มชา'], ['I drink tea.', 'I do not drink milk.', 'I like drinking tea.'],
     '我 = ฉัน · 不 = ไม่ · 喝 = ดื่ม · 茶 = ชา', '我 = I · 不 = not · 喝 = drink · 茶 = tea.')
sent('今天很热。', 'Jīntiān hěn rè.', 'วันนี้ร้อนมาก', 'It is very hot today.',
     ['วันนี้หนาวมาก', 'พรุ่งนี้ร้อนมาก', 'เมื่อวานร้อนมาก'], ['It is very cold today.', 'It will be very hot tomorrow.', 'It was very hot yesterday.'],
     '今天 = วันนี้ · 很 = มาก · 热 = ร้อน', '今天 = today · 很 = very · 热 = hot.')
sent('妈妈在家。', 'Māma zài jiā.', 'แม่อยู่ที่บ้าน', 'Mum is at home.',
     ['แม่อยู่ที่โรงเรียน', 'พ่ออยู่ที่บ้าน', 'แม่ไม่อยู่บ้าน'], ['Mum is at school.', 'Dad is at home.', 'Mum is not at home.'],
     '妈妈 = แม่ · 在 = อยู่ที่ · 家 = บ้าน', '妈妈 = Mum · 在 = is at · 家 = home.')
sent('我去学校。', 'Wǒ qù xuéxiào.', 'ฉันไปโรงเรียน', 'I go to school.',
     ['ฉันไปร้านค้า', 'ฉันอยู่ที่โรงเรียน', 'ฉันชอบโรงเรียน'], ['I go to the shop.', 'I am at school.', 'I like school.'],
     '我 = ฉัน · 去 = ไป · 学校 = โรงเรียน', '我 = I · 去 = go · 学校 = school.')
sent('这是我的书。', 'Zhè shì wǒ de shū.', 'นี่คือหนังสือของฉัน', 'This is my book.',
     ['นั่นคือหนังสือของฉัน', 'นี่คือหนังสือของคุณ', 'นี่คือปากกาของฉัน'], ['That is my book.', 'This is your book.', 'This is my pen.'],
     '这 = นี่ · 是 = คือ · 我的 = ของฉัน · 书 = หนังสือ', '这 = this · 是 = is · 我的 = my · 书 = book.')
sent('你好吗？', 'Nǐ hǎo ma?', 'คุณสบายดีไหม', 'How are you?',
     ['คุณชื่ออะไร', 'คุณอยู่ที่ไหน', 'คุณเป็นใคร'], ['What is your name?', 'Where are you?', 'Who are you?'],
     '你 = คุณ · 好 = ดี · 吗 = ไหม (คำลงท้ายประโยคคำถาม)', '你 = you · 好 = good, well · 吗 turns a sentence into a yes-or-no question.')
sent('我很高兴。', 'Wǒ hěn gāoxìng.', 'ฉันดีใจมาก', 'I am very happy.',
     ['ฉันเหนื่อยมาก', 'ฉันหิวมาก', 'เขาดีใจมาก'], ['I am very tired.', 'I am very hungry.', 'He is very happy.'],
     '我 = ฉัน · 很 = มาก · 高兴 = ดีใจ', '我 = I · 很 = very · 高兴 = happy.')
sent('爸爸喝水。', 'Bàba hē shuǐ.', 'พ่อดื่มน้ำ', 'Dad drinks water.',
     ['พ่อดื่มชา', 'แม่ดื่มน้ำ', 'พ่อกินข้าว'], ['Dad drinks tea.', 'Mum drinks water.', 'Dad eats rice.'],
     '爸爸 = พ่อ · 喝 = ดื่ม · 水 = น้ำ', '爸爸 = Dad · 喝 = drinks · 水 = water.')
sent('她是老师。', 'Tā shì lǎoshī.', 'เธอเป็นครู', 'She is a teacher.',
     ['เธอเป็นหมอ', 'เธอเป็นนักเรียน', 'เธอไม่ใช่ครู'], ['She is a doctor.', 'She is a student.', 'She is not a teacher.'],
     '她 = เธอ · 是 = เป็น · 老师 = ครู', '她 = she · 是 = is · 老师 = teacher.')
sent('我们是同学。', 'Wǒmen shì tóngxué.', 'พวกเราเป็นเพื่อนร่วมชั้น', 'We are classmates.',
     ['พวกเราเป็นพี่น้อง', 'พวกเขาเป็นเพื่อนร่วมชั้น', 'พวกเราเป็นครู'], ['We are brothers and sisters.', 'They are classmates.', 'We are teachers.'],
     '我们 = พวกเรา · 是 = เป็น · 同学 = เพื่อนร่วมชั้น', '我们 = we · 是 = are · 同学 = classmates.')
sent('明天见！', 'Míngtiān jiàn!', 'พบกันพรุ่งนี้', 'See you tomorrow!',
     ['สวัสดีตอนเช้า', 'ขอบคุณ', 'ราตรีสวัสดิ์'], ['Good morning!', 'Thank you!', 'Good night!'],
     '明天 = พรุ่งนี้ · 见 = พบ เจอ ใช้บอกลาเมื่อจะเจอกันอีกในวันพรุ่งนี้', '明天 = tomorrow · 见 = see, meet. You say it when you will meet again the next day.')
sent('我会说汉语。', 'Wǒ huì shuō Hànyǔ.', 'ฉันพูดภาษาจีนได้', 'I can speak Chinese.',
     ['ฉันพูดภาษาจีนไม่ได้', 'ฉันชอบภาษาจีน', 'ฉันเรียนภาษาจีน'], ['I cannot speak Chinese.', 'I like Chinese.', 'I study Chinese.'],
     '我 = ฉัน · 会 = ทำเป็น ทำได้ · 说 = พูด · 汉语 = ภาษาจีน', '我 = I · 会 = can, know how to · 说 = speak · 汉语 = Chinese.')
sent('弟弟在睡觉。', 'Dìdi zài shuìjiào.', 'น้องชายกำลังนอน', 'My little brother is sleeping.',
     ['น้องชายกำลังกิน', 'น้องสาวกำลังนอน', 'น้องชายกำลังเล่น'], ['My little brother is eating.', 'My little sister is sleeping.', 'My little brother is playing.'],
     '弟弟 = น้องชาย · 在 หน้ากริยา = กำลัง · 睡觉 = นอน', '弟弟 = little brother · 在 before a verb = is doing now · 睡觉 = sleep.')
sent('我家有五口人。', 'Wǒ jiā yǒu wǔ kǒu rén.', 'บ้านฉันมีห้าคน', 'There are five people in my family.',
     ['บ้านฉันมีสี่คน', 'บ้านฉันมีแมวห้าตัว', 'ฉันมีเพื่อนห้าคน'], ['There are four people in my family.', 'There are five cats in my home.', 'I have five friends.'],
     '我家 = บ้านฉัน · 有 = มี · 五 = ห้า · 口 = ลักษณนามของคนในบ้าน · 人 = คน', '我家 = my family · 有 = has · 五 = five · 口 = counting word for family members · 人 = people.')
sent('我买水果。', 'Wǒ mǎi shuǐguǒ.', 'ฉันซื้อผลไม้', 'I buy fruit.',
     ['ฉันกินผลไม้', 'ฉันซื้อเสื้อผ้า', 'ฉันชอบผลไม้'], ['I eat fruit.', 'I buy clothes.', 'I like fruit.'],
     '我 = ฉัน · 买 = ซื้อ · 水果 = ผลไม้', '我 = I · 买 = buy · 水果 = fruit.')
sent('我是泰国人。', 'Wǒ shì Tàiguó rén.', 'ฉันเป็นคนไทย', 'I am Thai.',
     ['ฉันเป็นคนจีน', 'ฉันอยู่ที่ประเทศไทย', 'ฉันไปประเทศไทย'], ['I am Chinese.', 'I am in Thailand.', 'I go to Thailand.'],
     '我 = ฉัน · 是 = เป็น · 泰国 = ประเทศไทย · 人 = คน', '我 = I · 是 = am · 泰国 = Thailand · 人 = person.')
sent('这个苹果很大。', 'Zhège píngguǒ hěn dà.', 'แอปเปิลลูกนี้ใหญ่มาก', 'This apple is very big.',
     ['แอปเปิลลูกนี้เล็กมาก', 'แอปเปิลลูกนั้นใหญ่มาก', 'แตงโมลูกนี้ใหญ่มาก'], ['This apple is very small.', 'That apple is very big.', 'This watermelon is very big.'],
     '这个 = อันนี้ · 苹果 = แอปเปิล · 很 = มาก · 大 = ใหญ่', '这个 = this one · 苹果 = apple · 很 = very · 大 = big.')

# ---------------------------------------------------------------- เติมคำในประโยค (13)
PY = {'什么': 'shénme', '谁': 'shéi', '哪儿': 'nǎr', '几': 'jǐ', '吗': 'ma', '不': 'bù', '很': 'hěn', '的': 'de', '和': 'hé', '在': 'zài',
      '也': 'yě', '有': 'yǒu', '都': 'dōu', '叫': 'jiào', '去': 'qù', '吃': 'chī'}


def blank(sentence, th, en, right, wrong, th_ex, en_ex):
    ch = [f'{c} ({PY[c]})' for c in [right] + wrong]
    done = sentence.replace('___', right)
    ITEMS.append({'topic': 'fill-blank',
                  'th': (f'เติมคำให้ประโยคแปลว่า "{th}": {sentence}', ch, f'{th_ex} → {done}'),
                  'en': (f'Fill the gap so the sentence means "{en}": {sentence}', ch, f'{en_ex} → {done}')})


blank('你叫___名字？', 'คุณชื่ออะไร', 'What is your name?', '什么', ['谁', '哪儿', '几'], '什么 แปลว่า อะไร ใช้ถามถึงสิ่งของหรือชื่อ', '什么 means "what". Use it to ask about a thing or a name.')
blank('他是___？', 'เขาเป็นใคร', 'Who is he?', '谁', ['哪儿', '几', '吗'], '谁 แปลว่า ใคร ใช้ถามถึงคน', '谁 means "who". Use it to ask about a person.')
blank('你去___？', 'คุณไปไหน', 'Where are you going?', '哪儿', ['谁', '几', '吗'], '哪儿 แปลว่า ที่ไหน ใช้ถามถึงสถานที่', '哪儿 means "where". Use it to ask about a place.')
blank('你___岁？', 'คุณอายุกี่ขวบ', 'How old are you?', '几', ['谁', '哪儿', '吗'], '几 แปลว่า กี่ ใช้ถามจำนวนน้อย ๆ เช่น อายุของเด็ก', '几 means "how many". Use it for small numbers, such as a child\'s age.')
blank('你是学生___？', 'คุณเป็นนักเรียนไหม', 'Are you a student?', '吗', ['几', '谁', '哪儿'], '吗 วางท้ายประโยคเพื่อเปลี่ยนเป็นคำถามที่ตอบว่าใช่หรือไม่ใช่', 'Put 吗 at the end to turn a sentence into a yes-or-no question.')
blank('我___吃鱼。', 'ฉันไม่กินปลา', 'I do not eat fish.', '不', ['很', '也', '和'], '不 แปลว่า ไม่ วางหน้ากริยา', '不 means "not". It goes before the verb.')
blank('今天___冷。', 'วันนี้หนาวมาก', 'It is very cold today.', '很', ['吗', '的', '和'], '很 แปลว่า มาก วางหน้าคำบอกลักษณะ', '很 means "very". It goes before a describing word.')
blank('这是我___书。', 'นี่คือหนังสือของฉัน', 'This is my book.', '的', ['吗', '很', '不'], '的 แปลว่า ของ วางหลังเจ้าของ: 我的 = ของฉัน', '的 shows who owns something. It follows the owner: 我的 = my.')
blank('爸爸___妈妈', 'พ่อและแม่', 'Dad and Mum', '和', ['的', '很', '吗'], '和 แปลว่า และ ใช้เชื่อมคำนามสองคำ', '和 means "and". It joins two nouns.')
blank('我___学校。', 'ฉันอยู่ที่โรงเรียน', 'I am at school.', '在', ['的', '和', '吗'], '在 แปลว่า อยู่ที่ ตามด้วยสถานที่', '在 means "to be at". A place comes after it.')
blank('我___喜欢猫。', 'ฉันก็ชอบแมวเหมือนกัน', 'I like cats too.', '也', ['的', '吗', '和'], '也 แปลว่า ก็...เหมือนกัน วางหน้ากริยา', '也 means "also, too". It goes before the verb.')
blank('我___一个哥哥。', 'ฉันมีพี่ชายหนึ่งคน', 'I have one older brother.', '有', ['叫', '去', '吃'], '有 แปลว่า มี', '有 means "have".')
blank('我们___是学生。', 'พวกเราทุกคนเป็นนักเรียน', 'We are all students.', '都', ['的', '吗', '和'], '都 แปลว่า ทั้งหมด ทุกคน วางหน้ากริยา', '都 means "all". It goes before the verb.')

# ---------------------------------------------------------------- ลักษณนาม (8)
MW = {'个': 'gè', '只': 'zhī', '本': 'běn', '杯': 'bēi', '张': 'zhāng', '条': 'tiáo', '辆': 'liàng'}
for noun, th, en, right, wrong, use_th, use_en in [
        ('书', 'หนังสือหนึ่งเล่ม', 'one book', '本', ['只', '杯', '辆'], '本 ใช้กับหนังสือและสมุด', '本 is used for books.'),
        ('猫', 'แมวหนึ่งตัว', 'one cat', '只', ['本', '杯', '张'], '只 ใช้กับสัตว์ตัวเล็ก', '只 is used for small animals.'),
        ('水', 'น้ำหนึ่งแก้ว', 'one cup of water', '杯', ['本', '只', '辆'], '杯 แปลว่า แก้ว ใช้กับเครื่องดื่ม', '杯 means a cup. It is used for drinks.'),
        ('人', 'คนหนึ่งคน', 'one person', '个', ['只', '本', '杯'], '个 ใช้กับคน และเป็นลักษณนามที่ใช้บ่อยที่สุด', '个 is used for people. It is the most common counting word.'),
        ('鱼', 'ปลาหนึ่งตัว', 'one fish', '条', ['本', '杯', '辆'], '条 ใช้กับสิ่งที่ยาว เช่น ปลา แม่น้ำ', '条 is used for long things, such as fish and rivers.'),
        ('桌子', 'โต๊ะหนึ่งตัว', 'one table', '张', ['只', '杯', '本'], '张 ใช้กับของที่มีหน้าแบน เช่น โต๊ะ กระดาษ', '张 is used for flat things, such as tables and paper.'),
        ('车', 'รถหนึ่งคัน', 'one car', '辆', ['本', '杯', '只'], '辆 ใช้กับรถ', '辆 is used for vehicles.'),
        ('狗', 'หมาหนึ่งตัว', 'one dog', '只', ['本', '杯', '辆'], '只 ใช้กับสัตว์ตัวเล็ก', '只 is used for small animals.')]:
    ch = [f'{c} ({MW[c]})' for c in [right] + wrong]
    done = f'一{right}{noun}'
    ITEMS.append({'topic': 'measure-words',
                  'th': (f'"{th}" ต้องเติมลักษณนามตัวไหน: 一___{noun}', ch, f'{use_th}: {done}'),
                  'en': (f'Which counting word completes "{en}": 一___{noun}', ch, f'{use_en} {done} = {en}.')})

# ---------------------------------------------------------------- วัน เดือน (10)
def day(th_q, en_q, th_ch, en_ch, th_ex, en_ex, speak):
    it = {'topic': 'days-months', 'th': (th_q, th_ch, th_ex), 'en': (en_q, en_ch, en_ex)}
    if speak: it.update(speak=speak, **ZH)
    ITEMS.append(it)


WK_TH = 'วันในสัปดาห์ใช้ 星期 (xīngqī) ตามด้วยเลข 1 ถึง 6 นับจากวันจันทร์'
WK_EN = 'Days use 星期 (xīngqī) plus a number from 1 to 6, counting from Monday'
day('星期一 (xīngqīyī) คือวันอะไร', 'Which day is 星期一 (xīngqīyī)?', ['วันจันทร์', 'วันอังคาร', 'วันอาทิตย์', 'วันเสาร์'], ['Monday', 'Tuesday', 'Sunday', 'Saturday'],
    f'{WK_TH}: 一 = 1 จึงเป็นวันจันทร์', f'{WK_EN}: 一 = 1, so it is Monday.', '星期一')
day('星期三 (xīngqīsān) คือวันอะไร', 'Which day is 星期三 (xīngqīsān)?', ['วันพุธ', 'วันจันทร์', 'วันศุกร์', 'วันพฤหัสบดี'], ['Wednesday', 'Monday', 'Friday', 'Thursday'],
    f'{WK_TH}: 三 = 3 จึงเป็นวันพุธ', f'{WK_EN}: 三 = 3, so it is Wednesday.', '星期三')
day('星期五 (xīngqīwǔ) คือวันอะไร', 'Which day is 星期五 (xīngqīwǔ)?', ['วันศุกร์', 'วันพุธ', 'วันเสาร์', 'วันพฤหัสบดี'], ['Friday', 'Wednesday', 'Saturday', 'Thursday'],
    f'{WK_TH}: 五 = 5 จึงเป็นวันศุกร์', f'{WK_EN}: 五 = 5, so it is Friday.', '星期五')
day('星期天 (xīngqītiān) คือวันอะไร', 'Which day is 星期天 (xīngqītiān)?', ['วันอาทิตย์', 'วันจันทร์', 'วันเสาร์', 'วันศุกร์'], ['Sunday', 'Monday', 'Saturday', 'Friday'],
    'วันอาทิตย์ไม่ใช้ตัวเลข แต่ใช้ 天 (tiān) ที่แปลว่า วัน หรือ ฟ้า: 星期天', 'Sunday does not use a number. It uses 天 (tiān), "day" or "sky": 星期天.', '星期天')
day('"วันเสาร์" ภาษาจีนคือคำไหน', 'Which is "Saturday" in Chinese?', ['星期六', '星期五', '星期四', '星期天'], ['星期六', '星期五', '星期四', '星期天'],
    f'{WK_TH}: วันเสาร์เป็นวันที่ 6 จึงเป็น 星期六', f'{WK_EN}: Saturday is day 6, so it is 星期六.', None)
MO_TH = 'เดือนใช้ตัวเลข 1 ถึง 12 ตามด้วย 月 (yuè)'
MO_EN = 'Months use a number from 1 to 12 plus 月 (yuè)'
day('三月 (sānyuè) คือเดือนอะไร', 'Which month is 三月 (sānyuè)?', ['เดือนมีนาคม', 'เดือนมกราคม', 'เดือนพฤษภาคม', 'เดือนกุมภาพันธ์'], ['March', 'January', 'May', 'February'],
    f'{MO_TH}: 三 = 3 จึงเป็นเดือนที่ 3 คือมีนาคม', f'{MO_EN}: 三 = 3, so it is the third month, March.', '三月')
day('十二月 (shí\'èryuè) คือเดือนอะไร', 'Which month is 十二月 (shí\'èryuè)?', ['เดือนธันวาคม', 'เดือนตุลาคม', 'เดือนกุมภาพันธ์', 'เดือนพฤศจิกายน'], ['December', 'October', 'February', 'November'],
    f'{MO_TH}: 十二 = 12 จึงเป็นเดือนที่ 12 คือธันวาคม', f'{MO_EN}: 十二 = 12, so it is the twelfth month, December.', '十二月')
day('八月 (bāyuè) คือเดือนอะไร', 'Which month is 八月 (bāyuè)?', ['เดือนสิงหาคม', 'เดือนมิถุนายน', 'เดือนกันยายน', 'เดือนกรกฎาคม'], ['August', 'June', 'September', 'July'],
    f'{MO_TH}: 八 = 8 จึงเป็นเดือนที่ 8 คือสิงหาคม', f'{MO_EN}: 八 = 8, so it is the eighth month, August.', '八月')
day('今天是星期二 (วันนี้วันอังคาร) 明天 (พรุ่งนี้) คือวันอะไร', 'If 今天是星期二 (today is Tuesday), which day is 明天 (tomorrow)?',
    ['星期三', '星期一', '星期二', '星期四'], ['星期三', '星期一', '星期二', '星期四'],
    '明天 แปลว่า พรุ่งนี้ ถัดจากวันอังคาร (星期二) คือวันพุธ (星期三)', '明天 means tomorrow. After Tuesday (星期二) comes Wednesday (星期三).', '今天是星期二')
day('今天是星期五 (วันนี้วันศุกร์) 昨天 (เมื่อวาน) คือวันอะไร', 'If 今天是星期五 (today is Friday), which day was 昨天 (yesterday)?',
    ['星期四', '星期六', '星期五', '星期三'], ['星期四', '星期六', '星期五', '星期三'],
    '昨天 แปลว่า เมื่อวาน ก่อนวันศุกร์ (星期五) คือวันพฤหัสบดี (星期四)', '昨天 means yesterday. Before Friday (星期五) comes Thursday (星期四).', '今天是星期五')

assert len(ITEMS) == 165, len(ITEMS)
