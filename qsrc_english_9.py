# -*- coding: utf-8 -*-
"""ต้นฉบับคำถามภาษาอังกฤษ อายุ 9 (ป.3-ป.4) · 165 ข้อ · เขียนด้วยมือ
ประกอบเป็น q-english-9.json ด้วย: python3 build_questions.py english 9
ทุกแถว: คำตอบที่ถูกอยู่ก่อน ตามด้วยตัวลวง 3 ตัว · สะกดแบบอังกฤษ (British) ตามเสียงอ่าน en-GB ของเกม
"""
ITEMS = []


def fill(topic, sentence, right, wrong, th_rule, en_rule, th_lead='เติมคำให้ถูก', en_lead='Choose the word'):
    """โจทย์เติมคำในประโยค · คำอธิบาย = กฎ + ประโยคที่เติมแล้ว"""
    done = sentence.replace('___', right)
    ch = [right] + wrong
    ITEMS.append({'topic': topic,
                  'th': (f'{th_lead}: {sentence}', ch, f'{th_rule} → {done}'),
                  'en': (f'{en_lead}: {sentence}', ch, f'{en_rule} → {done}')})


def word(topic, th_q, en_q, right, wrong, th_ex, en_ex, speak):
    ch = [right] + wrong
    ITEMS.append({'topic': topic, 'th': (th_q, ch, th_ex), 'en': (en_q, ch, en_ex), 'speak': speak})


# ---------------------------------------------------------------- grammar (30)
G = 'grammar'
fill(G, 'My sister ___ to school by bus every day.', 'goes', ['go', 'going', 'gone'],
     'ประธานคนเดียว (my sister) กริยาปัจจุบันต้องเติม -s หรือ -es', 'With one person (my sister), the verb takes -s or -es.')
fill(G, 'Tom and Ben ___ football after school.', 'play', ['plays', 'playing', 'is play'],
     'ประธานสองคนขึ้นไป กริยาปัจจุบันไม่เติม s', 'With two or more people, the verb has no -s.')
fill(G, 'She ___ like spicy food.', "doesn't", ["don't", "isn't", "aren't"],
     "ประโยคปฏิเสธกับ he, she, it ใช้ doesn't + กริยาช่อง 1", "With he, she or it, the negative is doesn't + the plain verb.")
fill(G, '___ your father work in a hospital?', 'Does', ['Do', 'Is', 'Are'],
     'คำถามกับประธานคนเดียว (your father) ขึ้นต้นด้วย Does', 'A question about one person (your father) starts with Does.')
fill(G, 'We ___ live near the sea.', "don't", ["doesn't", "isn't", 'not'],
     "ประโยคปฏิเสธกับ I, you, we, they ใช้ don't", "With I, you, we or they, the negative is don't.")
fill(G, 'The sun ___ in the east.', 'rises', ['rise', 'rising', 'is rise'],
     'เรื่องจริงเสมอใช้ปัจจุบันกาล และ the sun เป็นเอกพจน์จึงเติม -s', 'A fact that is always true uses the present tense, and "the sun" is one thing, so add -s.')
fill(G, 'My cat ___ a lot in the afternoon.', 'sleeps', ['sleep', 'sleeping', 'are sleep'],
     'my cat มีตัวเดียว กริยาปัจจุบันเติม -s', '"My cat" is one animal, so the verb takes -s.')
fill(G, '___ they speak English at home?', 'Do', ['Does', 'Is', 'Are'],
     'คำถามกับ they ขึ้นต้นด้วย Do', 'A question with "they" starts with Do.')
fill(G, 'Look! The baby ___.', 'is sleeping', ['are sleeping', 'sleep', 'sleeping'],
     'สิ่งที่กำลังเกิดตอนนี้ใช้ is/am/are + กริยาเติม -ing และ the baby ใช้ is', 'Something happening now uses is/am/are + -ing, and "the baby" takes is.')
fill(G, 'Be quiet. I ___ my homework now.', 'am doing', ['is doing', 'doing', 'does'],
     'กำลังทำอยู่ตอนนี้ และประธาน I ใช้ am + กริยาเติม -ing', 'It is happening now, and "I" takes am + -ing.')
fill(G, 'The children ___ in the garden at the moment.', 'are playing', ['is playing', 'plays', 'playing'],
     'at the moment แปลว่าตอนนี้ และ the children มีหลายคนจึงใช้ are + -ing', '"At the moment" means now, and "the children" are many, so use are + -ing.')
fill(G, 'What ___ you doing right now?', 'are', ['is', 'do', 'does'],
     'กับ you ใช้ are เสมอ: are you doing', 'With "you" always use are: are you doing.')
fill(G, 'Mum is ___ dinner in the kitchen.', 'cooking', ['cook', 'cooks', 'cooked'],
     'หลัง is ที่บอกว่ากำลังทำ ต้องใช้กริยาเติม -ing', 'After "is" for an action happening now, use the -ing form.')
fill(G, 'I ___ nine years old.', 'am', ['is', 'are', 'be'],
     'ประธาน I ใช้ am เสมอ', '"I" always takes am.')
fill(G, 'My friends ___ very kind.', 'are', ['is', 'am', 'be'],
     'my friends มีหลายคน ใช้ are', '"My friends" are more than one, so use are.')
fill(G, 'Yesterday it ___ very hot.', 'was', ['were', 'is', 'are'],
     'yesterday เป็นอดีต และ it ใช้ was', '"Yesterday" is the past, and "it" takes was.')
fill(G, 'We ___ at the zoo last Sunday.', 'were', ['was', 'are', 'is'],
     'last Sunday เป็นอดีต และ we ใช้ were', '"Last Sunday" is the past, and "we" takes were.')
fill(G, '___ you at home last night?', 'Were', ['Was', 'Did', 'Are'],
     'last night เป็นอดีต และ you ใช้ were', '"Last night" is the past, and "you" takes were.')
fill(G, 'There ___ a big tree in front of my house.', 'is', ['are', 'am', 'be'],
     'มีสิ่งเดียว (a big tree) ใช้ There is', 'For one thing (a big tree), use "There is".')
fill(G, 'There ___ five books on the desk.', 'are', ['is', 'am', 'be'],
     'มีหลายสิ่ง (five books) ใช้ There are', 'For more than one thing (five books), use "There are".')
fill(G, '___ there any milk in the fridge?', 'Is', ['Are', 'Do', 'Does'],
     'milk เป็นคำนามนับไม่ได้ ใช้ Is there', 'Milk cannot be counted, so ask "Is there".')
fill(G, 'Birds can ___.', 'fly', ['flies', 'flying', 'flew'],
     'หลัง can ใช้กริยาช่อง 1 ไม่เติมอะไร', 'After "can" use the plain verb with nothing added.')
fill(G, 'You must ___ quiet in the library.', 'be', ['is', 'are', 'being'],
     'หลัง must ใช้กริยาช่อง 1 และ is/am/are รูปเดิมคือ be', 'After "must" use the plain verb, and the plain form of is/am/are is "be".')
fill(G, "She can't ___ because she is too young.", 'drive', ['drives', 'driving', 'drove'],
     "หลัง can't ใช้กริยาช่อง 1 ไม่เติม s", 'After "can\'t" use the plain verb with no -s.')
fill(G, '___ I borrow your pencil, please?', 'Can', ['Am', 'Is', 'Does'],
     'ขออนุญาตอย่างสุภาพใช้ Can I ...?', 'To ask politely for something, use "Can I ...?"')
fill(G, 'Tomorrow we ___ visit Grandma.', 'will', ['did', 'was', 'are'],
     'tomorrow เป็นอนาคต ใช้ will + กริยาช่อง 1', '"Tomorrow" is the future, so use will + the plain verb.')
fill(G, 'I am going ___ a book tonight.', 'to read', ['read', 'reading', 'reads'],
     'บอกแผนในอนาคตใช้ am/is/are going to + กริยาช่อง 1', 'For a future plan, use am/is/are going to + the plain verb.')
fill(G, 'Last week I ___ a new bike.', 'bought', ['buy', 'buys', 'buying'],
     'last week เป็นอดีต และอดีตของ buy คือ bought', '"Last week" is the past, and the past of buy is bought.')
fill(G, 'She ___ TV last night. She read a book.', "didn't watch", ["doesn't watch", "don't watch", 'not watched'],
     "ประโยคปฏิเสธในอดีตใช้ didn't + กริยาช่อง 1", "The negative in the past is didn't + the plain verb.")
fill(G, 'Did you ___ your teeth this morning?', 'brush', ['brushed', 'brushes', 'brushing'],
     'หลัง Did ใช้กริยาช่อง 1 เพราะ Did บอกอดีตให้แล้ว', 'After "Did" use the plain verb, because "Did" already shows the past.')

# ---------------------------------------------------------------- past-tense (14)
IRR_TH = 'กริยานี้ไม่เติม -ed ต้องจำรูปอดีต'
IRR_EN = 'This verb does not take -ed. You have to learn its past form'
for base, past, wrong, th in [
        ('see', 'saw', ['seed', 'seen', 'sawed'], 'เห็น'), ('eat', 'ate', ['eated', 'eaten', 'eats'], 'กิน'),
        ('run', 'ran', ['runned', 'runs', 'running'], 'วิ่ง'), ('write', 'wrote', ['writed', 'written', 'writes'], 'เขียน'),
        ('swim', 'swam', ['swimmed', 'swum', 'swims'], 'ว่ายน้ำ'), ('take', 'took', ['taked', 'taken', 'tooked'], 'เอาไป'),
        ('come', 'came', ['comed', 'coming', 'cames'], 'มา'), ('make', 'made', ['maked', 'makes', 'maded'], 'ทำ'),
        ('give', 'gave', ['gived', 'given', 'gaved'], 'ให้'), ('drink', 'drank', ['drinked', 'drunk', 'drinks'], 'ดื่ม'),
        ('buy', 'bought', ['buyed', 'boughted', 'buys'], 'ซื้อ'), ('teach', 'taught', ['teached', 'taughted', 'teaches'], 'สอน')]:
    word('past-tense', f'รูปอดีต (past tense) ของ "{base}" คือคำไหน', f'What is the past tense of "{base}"?', past, wrong,
         f'{IRR_TH}: {base} ({th}) → {past}', f'{IRR_EN}: {base} → {past}.', base)
word('past-tense', 'รูปอดีต (past tense) ของ "stop" คือคำไหน', 'What is the past tense of "stop"?', 'stopped', ['stoped', 'stopt', 'stoping'],
     'คำสั้นที่ลงท้ายด้วยสระ 1 ตัว + พยัญชนะ 1 ตัว ให้ซ้ำพยัญชนะท้ายก่อนเติม -ed: stop (หยุด) → stopped',
     'A short word ending in one vowel + one consonant doubles the last letter before -ed: stop → stopped.', 'stop')
word('past-tense', 'รูปอดีต (past tense) ของ "study" คือคำไหน', 'What is the past tense of "study"?', 'studied', ['studyed', 'studed', 'studies'],
     'คำที่ลงท้ายด้วยพยัญชนะ + y ให้เปลี่ยน y เป็น i แล้วเติม -ed: study (เรียน) → studied',
     'When a word ends in a consonant + y, change y to i and add -ed: study → studied.', 'study')

# ---------------------------------------------------------------- prepositions (16)
P = 'prepositions'
fill(P, 'My birthday is ___ May.', 'in', ['on', 'at', 'to'], 'หน้าชื่อเดือนใช้ in', 'Use "in" before a month.')
fill(P, "School starts ___ 8 o'clock.", 'at', ['in', 'on', 'of'], 'บอกเวลาตามนาฬิกาใช้ at', 'Use "at" with a clock time.')
fill(P, "We don't go to school ___ Sunday.", 'on', ['in', 'at', 'of'], 'หน้าชื่อวันใช้ on', 'Use "on" before a day of the week.')
fill(P, 'I brush my teeth ___ the morning.', 'in', ['on', 'at', 'to'], 'ช่วงของวันใช้ in: in the morning, in the afternoon, in the evening', 'Parts of the day take "in": in the morning, in the afternoon, in the evening.')
fill(P, 'It is cold ___ night.', 'at', ['in', 'on', 'of'], 'night เป็นข้อยกเว้น ใช้ at night', '"Night" is special: we say "at night".')
fill(P, 'She was born ___ 2017.', 'in', ['on', 'at', 'by'], 'หน้าปีใช้ in', 'Use "in" before a year.')
fill(P, 'The party is ___ 5 December.', 'on', ['in', 'at', 'to'], 'วันที่ที่มีตัวเลขวันใช้ on', 'Use "on" with a date that has a day number.')
fill(P, 'I live ___ Thailand.', 'in', ['on', 'at', 'to'], 'อยู่ในประเทศหรือเมืองใช้ in', 'Use "in" for a country or a city.')
fill(P, 'The picture is ___ the wall.', 'on', ['of', 'to', 'between'], 'ของที่ติดอยู่บนผิวใช้ on', 'Use "on" for something fixed to a surface.')
fill(P, 'B is ___ A and C in the alphabet.', 'between', ['under', 'behind', 'on'], 'อยู่ตรงกลางของสองสิ่งใช้ between ... and ...', 'In the middle of two things is "between ... and ...".')
fill(P, 'Fish live ___ water.', 'in', ['on', 'at', 'to'], 'อยู่ข้างในสิ่งใดใช้ in', 'Use "in" when something is inside.')
fill(P, 'He is waiting ___ the bus stop.', 'at', ['of', 'into', 'between'], 'อยู่ ณ จุดใดจุดหนึ่งใช้ at', 'Use "at" for a point or place where you wait.')
fill(P, 'We go to school ___ bus.', 'by', ['in', 'at', 'with'], 'เดินทางด้วยพาหนะใช้ by: by bus, by car, by train', 'Travelling with a vehicle takes "by": by bus, by car, by train.')
fill(P, 'The cat jumped ___ the box and hid inside.', 'into', ['of', 'at', 'between'], 'เคลื่อนที่เข้าไปข้างในใช้ into', 'Moving to the inside of something is "into".')
fill(P, 'My house is next ___ the school.', 'to', ['of', 'at', 'on'], 'next to แปลว่า ติดกับ ต้องมี to เสมอ', '"Next to" means beside. It always needs "to".')
fill(P, 'This present is ___ you. Happy birthday!', 'for', ['at', 'of', 'in'], 'ของที่ให้ใครใช้ for', 'Something you give to a person is "for" them.')

# ---------------------------------------------------------------- comparatives (14)
C = 'comparatives'
ER_TH, ER_EN = 'เทียบสองสิ่งด้วยคำสั้น ให้เติม -er แล้วตามด้วย than', 'To compare two things with a short word, add -er and use "than".'
EST_TH, EST_EN = 'ที่สุดในกลุ่ม ใช้ the + คำเติม -est', 'For the top one in a group, use the + -est.'
fill(C, 'An elephant is ___ than a mouse.', 'bigger', ['big', 'biggest', 'more big'], ER_TH + ' (big ซ้ำ g เป็น bigger)', ER_EN + ' Big doubles the g.')
fill(C, 'This is the ___ mountain in Thailand.', 'highest', ['higher', 'high', 'most high'], EST_TH, EST_EN)
fill(C, 'Today is ___ than yesterday.', 'hotter', ['hot', 'hottest', 'more hot'], ER_TH + ' (hot ซ้ำ t เป็น hotter)', ER_EN + ' Hot doubles the t.')
fill(C, 'This book is ___ than that one.', 'more interesting', ['interestinger', 'most interesting', 'interesting'],
     'คำยาวไม่เติม -er ให้ใช้ more นำหน้า', 'A long word does not take -er. Put "more" in front.')
fill(C, 'My bag is ___ than yours.', 'heavier', ['heavyer', 'heaviest', 'more heavy'],
     'คำที่ลงท้ายด้วย y เปลี่ยน y เป็น i แล้วเติม -er', 'When a word ends in y, change y to i and add -er.')
fill(C, 'She is the ___ student in the class.', 'tallest', ['taller', 'tall', 'most tall'], EST_TH, EST_EN)
fill(C, 'Your drawing is ___ than mine.', 'better', ['gooder', 'best', 'more good'],
     'good เป็นคำพิเศษ: good → better → best', 'Good is special: good → better → best.')
fill(C, 'This is the ___ day of my life!', 'best', ['better', 'goodest', 'most good'],
     'good เป็นคำพิเศษ ขั้นสูงสุดคือ the best', 'Good is special. Its top form is "the best".')
fill(C, 'A snail is ___ than a rabbit.', 'slower', ['slow', 'slowest', 'more slow'], ER_TH, ER_EN)
fill(C, "The weather today is ___ than yesterday. I don't like it.", 'worse', ['badder', 'worst', 'more bad'],
     'bad เป็นคำพิเศษ: bad → worse → worst', 'Bad is special: bad → worse → worst.')
fill(C, 'A plane is ___ than a car.', 'faster', ['fast', 'fastest', 'more fast'], ER_TH, ER_EN)
fill(C, 'The blue dress is the most ___ in the shop.', 'beautiful', ['beautifuler', 'beautifulest', 'more beautiful'],
     'คำยาวใช้ the most + คำเดิม ไม่เติมอะไรท้ายคำ', 'A long word uses the most + the word itself, with nothing added.')
fill(C, 'A tiger is ___ than a cat.', 'stronger', ['strong', 'strongest', 'more strong'], ER_TH, ER_EN)
fill(C, 'Winter is the ___ season of the year.', 'coldest', ['colder', 'cold', 'most cold'], EST_TH, EST_EN)

# ---------------------------------------------------------------- question-words (14)
Q = 'question-words'
QL = dict(th_lead='เติมคำถามให้ถูก', en_lead='Choose the question word')
fill(Q, '___ is your teacher? — Miss Anna.', 'Who', ['Where', 'When', 'Why'], 'ถามถึงคนใช้ Who', 'Ask about a person with Who.', **QL)
fill(Q, '___ do you live? — In Chiang Mai.', 'Where', ['Who', 'When', 'What'], 'ถามถึงสถานที่ใช้ Where', 'Ask about a place with Where.', **QL)
fill(Q, '___ is your birthday? — In June.', 'When', ['Where', 'Who', 'How many'], 'ถามถึงเวลาใช้ When', 'Ask about a time with When.', **QL)
fill(Q, '___ are you crying? — Because I fell down.', 'Why', ['Who', 'Where', 'When'], 'ถามเหตุผลใช้ Why และตอบด้วย Because', 'Ask for a reason with Why. The answer starts with Because.', **QL)
fill(Q, '___ apples are there? — Six.', 'How many', ['How much', 'How old', 'How long'], 'ถามจำนวนของที่นับได้ใช้ How many', 'Ask for the number of things you can count with How many.', **QL)
fill(Q, '___ is this toy? — 200 baht.', 'How much', ['How many', 'How old', 'Who'], 'ถามราคาใช้ How much', 'Ask about a price with How much.', **QL)
fill(Q, '___ are you? — I am nine.', 'How old', ['How many', 'How much', 'Where'], 'ถามอายุใช้ How old', 'Ask about age with How old.', **QL)
fill(Q, '___ do you go to school? — By bus.', 'How', ['Who', 'What', 'Why'], 'ถามวิธีการใช้ How', 'Ask about the way you do something with How.', **QL)
fill(Q, "___ bag is this? — It's mine.", 'Whose', ['Who', 'Where', 'When'], 'ถามว่าของใครใช้ Whose', 'Ask who owns something with Whose.', **QL)
fill(Q, '___ colour is your bike? — Red.', 'What', ['Who', 'Where', 'Why'], 'ถามสีใช้ What colour', 'Ask about a colour with "What colour".', **QL)
fill(Q, '___ one do you want, the red one or the blue one?', 'Which', ['Who', 'Where', 'When'], 'ให้เลือกจากของที่มีให้ใช้ Which', 'To choose from a small set, use Which.', **QL)
fill(Q, "___ is the weather like today? — It's sunny.", 'What', ['How', 'Who', 'Where'], 'ถามว่าเป็นอย่างไรด้วยสำนวน What is ... like?', 'To ask for a description, use "What is ... like?"', **QL)
fill(Q, '___ often do you play football? — Twice a week.', 'How', ['What', 'Who', 'Which'], 'ถามความถี่ใช้ How often', 'Ask how many times with "How often".', **QL)
fill(Q, '___ tall is your brother? — 150 centimetres.', 'How', ['What', 'Who', 'Which'], 'ถามความสูงใช้ How tall', 'Ask about height with "How tall".', **QL)

# ---------------------------------------------------------------- pronouns (12)
R = 'pronouns'
fill(R, 'This is my brother. ___ is ten.', 'He', ['She', 'It', 'They'], 'แทนผู้ชายหนึ่งคนด้วย He', 'Use He for one boy or man.')
fill(R, 'I have two dogs. ___ are very friendly.', 'They', ['It', 'He', 'Them'], 'แทนหลายตัวที่เป็นประธานด้วย They', 'Use They for more than one when it is the subject.')
fill(R, 'Mali is my friend. I like ___.', 'her', ['she', 'hers', 'he'], 'หลังกริยาใช้รูปกรรม: she → her', 'After a verb use the object form: she → her.')
fill(R, 'Can you help ___? We are lost.', 'us', ['we', 'our', 'ours'], 'หลังกริยาใช้รูปกรรม: we → us', 'After a verb use the object form: we → us.')
fill(R, 'That book is not yours. It is ___.', 'mine', ['my', 'me', 'I'], 'บอกว่าเป็นของฉันโดยไม่มีคำนามตามหลังใช้ mine', 'To say it belongs to me with no noun after it, use mine.')
fill(R, 'The dog is wagging ___ tail.', 'its', ["it's", 'it', 'them'], "its แปลว่า ของมัน ส่วน it's ย่อมาจาก it is", '"Its" means belonging to it. "It\'s" is short for "it is".')
fill(R, 'Tom and I are friends. ___ play together every day.', 'We', ['They', 'Us', 'Our'], 'คนอื่นรวมกับฉันที่เป็นประธานใช้ We', 'Another person plus me, as the subject, is We.')
fill(R, "Is this ___ pencil? — Yes, it's mine.", 'your', ['you', 'yours', "you're"], 'หน้าคำนามใช้ your (ของคุณ)', 'Before a noun use "your".')
fill(R, 'My parents love ___ children.', 'their', ['they', 'them', 'theirs'], 'หน้าคำนามใช้ their (ของพวกเขา)', 'Before a noun use "their".')
fill(R, 'Give the ball to ___. He wants to play.', 'him', ['he', 'his', 'her'], 'หลังบุพบท to ใช้รูปกรรม: he → him', 'After "to" use the object form: he → him.')
fill(R, 'She made this cake ___.', 'herself', ['himself', 'myself', 'themselves'], 'ทำด้วยตัวเองและประธานเป็น she ใช้ herself', 'She did it alone, so the word that matches "she" is herself.')
fill(R, 'These shoes are ___. We bought them yesterday.', 'ours', ['our', 'us', 'we'], 'บอกว่าเป็นของพวกเราโดยไม่มีคำนามตามหลังใช้ ours', 'To say it belongs to us with no noun after it, use ours.')

# ---------------------------------------------------------------- articles (12)
A = 'articles'
fill(A, 'I eat ___ apple every day.', 'an', ['a', 'any', 'many'], 'คำที่ขึ้นต้นด้วยเสียงสระ (a, e, i, o, u) ใช้ an', 'Use "an" before a vowel sound (a, e, i, o, u).')
fill(A, 'She has ___ umbrella.', 'an', ['a', 'any', 'much'], 'umbrella ขึ้นต้นด้วยเสียงสระ ใช้ an', '"Umbrella" starts with a vowel sound, so use "an".')
fill(A, 'He is ___ honest boy.', 'an', ['a', 'any', 'many'], 'honest ไม่ออกเสียง h จึงขึ้นต้นด้วยเสียงสระ ใช้ an', 'The h in "honest" is silent, so it starts with a vowel sound: use "an".')
fill(A, 'My dad works at ___ university.', 'a', ['an', 'any', 'many'], 'university ออกเสียงขึ้นต้นว่า "ยู" ซึ่งเป็นเสียงพยัญชนะ ใช้ a', '"University" starts with a "you" sound, which is a consonant sound, so use "a".')
fill(A, "There isn't ___ water in the bottle.", 'any', ['some', 'many', 'a'], 'ประโยคปฏิเสธใช้ any', 'Use "any" in a negative sentence.')
fill(A, 'How ___ sugar do you want?', 'much', ['many', 'a', 'an'], 'sugar นับไม่ได้ ใช้ How much', 'Sugar cannot be counted, so use "How much".')
fill(A, 'How ___ students are in your class?', 'many', ['much', 'any', 'a'], 'students นับได้ ใช้ How many', 'Students can be counted, so use "How many".')
fill(A, 'I have ___ friends at school. I am never lonely.', 'a lot of', ['much', 'any', 'a'], 'a lot of แปลว่า มาก ใช้กับคำนามพหูพจน์ได้', '"A lot of" means many and works with plural nouns.')
fill(A, 'Would you like ___ rice?', 'some', ['many', 'a', 'an'], 'เสนอของให้ใครใช้ some แม้เป็นประโยคคำถาม', 'When you offer something, use "some", even in a question.')
fill(A, '___ sun is very hot today.', 'The', ['A', 'An', 'Some'], 'สิ่งที่มีอยู่อย่างเดียวในโลกใช้ the', 'Use "the" for something there is only one of.')
fill(A, 'I saw a dog. ___ dog was very big.', 'The', ['A', 'An', 'Any'], 'พูดถึงครั้งแรกใช้ a พูดถึงซ้ำตัวเดิมใช้ the', 'The first time say "a". When you mean the same one again, say "the".')
fill(A, "We don't have ___ eggs. Let's buy some.", 'any', ['much', 'a', 'an'], 'ประโยคปฏิเสธกับคำนามพหูพจน์ใช้ any', 'Use "any" with a plural noun in a negative sentence.')

# ---------------------------------------------------------------- conjunctions (8)
J = 'conjunctions'
JL = dict(th_lead='เติมคำเชื่อมให้ถูก', en_lead='Choose the joining word')
fill(J, "I like cats ___ I don't like dogs.", 'but', ['because', 'so', 'or'], 'สองส่วนขัดแย้งกันใช้ but (แต่)', 'Use "but" when the two parts are different or opposite.', **JL)
fill(J, 'I stayed at home ___ it was raining.', 'because', ['but', 'so', 'or'], 'ส่วนหลังเป็นเหตุผลใช้ because (เพราะ)', 'Use "because" when the second part is the reason.', **JL)
fill(J, 'It was raining, ___ I took an umbrella.', 'so', ['because', 'but', 'or'], 'ส่วนหลังเป็นผลที่ตามมาใช้ so (ดังนั้น)', 'Use "so" when the second part is the result.', **JL)
fill(J, 'Do you want tea ___ milk?', 'or', ['so', 'because', 'but'], 'ให้เลือกอย่างใดอย่างหนึ่งใช้ or (หรือ)', 'Use "or" for a choice between things.', **JL)
fill(J, 'She can sing ___ dance very well.', 'and', ['but', 'so', 'because'], 'เพิ่มสิ่งที่ไปทางเดียวกันใช้ and (และ)', 'Use "and" to add one more thing of the same kind.', **JL)
fill(J, 'He was tired, ___ he went to bed early.', 'so', ['but', 'or', 'because'], 'ส่วนหลังเป็นผลที่ตามมาใช้ so (ดังนั้น)', 'Use "so" when the second part is the result.', **JL)
fill(J, "I can't buy it ___ I don't have any money.", 'because', ['so', 'but', 'or'], 'ส่วนหลังเป็นเหตุผลใช้ because (เพราะ)', 'Use "because" when the second part is the reason.', **JL)
fill(J, 'The test was hard, ___ I passed it.', 'but', ['so', 'because', 'or'], 'ผลออกมาตรงข้ามกับที่คาดใช้ but (แต่)', 'Use "but" when the result is a surprise.', **JL)

# ---------------------------------------------------------------- vocabulary (18)
# ตัวลวงเป็นความหมายของคำอื่นในกลุ่มเดียวกัน (ทุกความหมายไม่ซ้อนกัน)
VOCAB = {
    'places': [('library', 'ที่อ่านและยืมหนังสือ', 'a place to read and borrow books'),
               ('hospital', 'ที่รักษาคนป่วย', 'a place where sick people get care'),
               ('kitchen', 'ห้องสำหรับทำอาหาร', 'a room for cooking'),
               ('island', 'แผ่นดินที่มีน้ำล้อมรอบ', 'land with water all around it'),
               ('village', 'ชุมชนเล็ก ๆ ในชนบท', 'a small group of houses in the country'),
               ('bridge', 'ทางข้ามแม่น้ำหรือถนน', 'a way to cross over a river or road')],
    'people': [('farmer', 'คนปลูกพืชและเลี้ยงสัตว์', 'a person who grows food and keeps animals'),
               ('dentist', 'หมอรักษาฟัน', 'a doctor who looks after teeth'),
               ('pilot', 'คนขับเครื่องบิน', 'a person who flies a plane'),
               ('neighbour', 'คนที่อยู่บ้านใกล้กัน', 'a person who lives near you')],
    'feelings': [('hungry', 'อยากกินอาหาร', 'wanting to eat'), ('thirsty', 'อยากดื่มน้ำ', 'wanting to drink'),
                 ('tired', 'เหนื่อย อยากพัก', 'needing rest or sleep'), ('angry', 'โกรธ', 'feeling mad at someone')],
    'time': [('breakfast', 'อาหารมื้อเช้า', 'the first meal of the day'), ('weekend', 'วันเสาร์และวันอาทิตย์', 'Saturday and Sunday'),
             ('autumn', 'ฤดูใบไม้ร่วง', 'the season when leaves fall'), ('midnight', 'เที่ยงคืน', "12 o'clock at night")],
}
for group in VOCAB.values():
    for i, (w, th, en) in enumerate(group):
        others = [group[(i + k) % len(group)] for k in (1, 2, 3)]
        ITEMS.append({'topic': 'vocabulary', 'speak': w,
                      'th': (f'คำว่า "{w}" หมายถึงอะไร', [th] + [o[1] for o in others], f'{w} = {th} (ภาษาอังกฤษอธิบายว่า {en})'),
                      'en': (f'What does "{w}" mean?', [en] + [o[2] for o in others], f'"{w}" means {en}.')})

# ---------------------------------------------------------------- synonyms (7)
for w, th, right, rth, wrong in [
        ('big', 'ใหญ่', 'large', 'ใหญ่', ['small', 'thin', 'short']), ('happy', 'มีความสุข', 'glad', 'ดีใจ', ['sad', 'angry', 'tired']),
        ('begin', 'เริ่ม', 'start', 'เริ่ม', ['stop', 'end', 'finish']), ('quick', 'เร็ว', 'fast', 'เร็ว', ['slow', 'late', 'quiet']),
        ('small', 'เล็ก', 'tiny', 'เล็กมาก', ['huge', 'tall', 'heavy']), ('shout', 'ตะโกน', 'yell', 'ตะโกน', ['whisper', 'sleep', 'listen']),
        ('pretty', 'สวย', 'beautiful', 'สวยงาม', ['ugly', 'dirty', 'noisy'])]:
    word('synonyms', f'คำไหนมีความหมายเหมือน "{w}" ({th})', f'Which word means the same as "{w}"?', right, wrong,
         f'{w} ({th}) กับ {right} ({rth}) มีความหมายใกล้เคียงกัน ใช้แทนกันได้', f'"{w}" and "{right}" mean almost the same thing, so one can replace the other.', w)

# ---------------------------------------------------------------- opposites (8)
for w, th, right, rth, wrong in [
        ('buy', 'ซื้อ', 'sell', 'ขาย', ['pay', 'shop', 'bring']), ('remember', 'จำได้', 'forget', 'ลืม', ['think', 'know', 'learn']),
        ('strong', 'แข็งแรง', 'weak', 'อ่อนแอ', ['brave', 'big', 'tall']), ('cheap', 'ราคาถูก', 'expensive', 'ราคาแพง', ['free', 'small', 'easy']),
        ('arrive', 'มาถึง', 'leave', 'ออกไป', ['come', 'stay', 'reach']), ('safe', 'ปลอดภัย', 'dangerous', 'อันตราย', ['careful', 'quiet', 'strong']),
        ('easy', 'ง่าย', 'difficult', 'ยาก', ['simple', 'quick', 'cheap']), ('always', 'เสมอ', 'never', 'ไม่เคยเลย', ['often', 'sometimes', 'usually'])]:
    word('opposites', f'คำตรงข้ามของ "{w}" ({th}) คือคำไหน', f'What is the opposite of "{w}"?', right, wrong,
         f'{w} ({th}) ตรงข้ามกับ {right} ({rth})', f'The opposite of "{w}" is "{right}". One is the reverse of the other.', w)

# ---------------------------------------------------------------- spelling (12)
for right, wrong, th_tip, en_tip in [
        ('beautiful', ['beutiful', 'beautifull', 'beatiful'], 'ขึ้นต้นด้วย b-e-a-u และลงท้ายด้วย -ful ที่มี l ตัวเดียว', 'It starts b-e-a-u and ends in -ful with one l.'),
        ('different', ['diffrent', 'diferent', 'differant'], 'แบ่งพยางค์ dif-fer-ent: มี f สองตัว และลงท้ายด้วย -ent', 'Say it in parts, dif-fer-ent: two f, and it ends in -ent.'),
        ('tomorrow', ['tommorow', 'tomorow', 'tommorrow'], 'แบ่งพยางค์ to-mor-row: m ตัวเดียว r สองตัว', 'Say it in parts, to-mor-row: one m, two r.'),
        ('Wednesday', ['Wensday', 'Wednsday', 'Wendesday'], 'แบ่งเป็น Wed-nes-day: มี d ที่ไม่ออกเสียงอยู่หน้า n', 'Split it as Wed-nes-day: there is a silent d before the n.'),
        ('vegetable', ['vegtable', 'vegetible', 'vejetable'], 'แบ่งพยางค์ veg-e-ta-ble: มี e หลัง g และลงท้ายด้วย -able', 'Say it in parts, veg-e-ta-ble: an e after the g, and it ends in -able.'),
        ('elephant', ['elefant', 'eliphant', 'elephent'], 'เสียง ฟ ในคำนี้สะกดด้วย ph และลงท้ายด้วย -ant', 'The f sound here is spelt ph, and it ends in -ant.'),
        ('hospital', ['hospitle', 'hosptial', 'hospitel'], 'แบ่งพยางค์ hos-pi-tal: ลงท้ายด้วย -tal', 'Say it in parts, hos-pi-tal: it ends in -tal.'),
        ('together', ['togather', 'togeter', 'toogether'], 'จำว่า to + get + her รวมกันเป็น together', 'Remember: to + get + her makes together.'),
        ('question', ['qestion', 'queschun', 'questoin'], 'หลัง q ต้องมี u เสมอ และลงท้ายด้วย -tion', 'After q there is always a u, and it ends in -tion.'),
        ('answer', ['anser', 'answar', 'ansewr'], 'มี w ที่ไม่ออกเสียงอยู่หลัง s และลงท้ายด้วย -er', 'There is a silent w after the s, and it ends in -er.'),
        ('favourite', ['favrite', 'favourit', 'faverite'], 'แบบอังกฤษแบ่งเป็น fa-vour-ite: มี our ตรงกลาง และลงท้ายด้วย -ite', 'In British spelling it is fa-vour-ite: "our" in the middle, and it ends in -ite.'),
        ('library', ['libary', 'librery', 'liberry'], 'แบ่งพยางค์ li-brar-y: มี r สองตัว คือ b-r-a-r-y', 'Say it in parts, li-brar-y: two r, in b-r-a-r-y.')]:
    word('spelling', 'คำไหนสะกดถูก', 'Which spelling is correct?', right, wrong,
         f'สะกดที่ถูกคือ "{right}" · {th_tip}', f'The correct spelling is "{right}". {en_tip}', right)

assert len(ITEMS) == 165, len(ITEMS)
