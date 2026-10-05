# -*- coding: utf-8 -*-
"""ต้นฉบับคำถามวิทยาศาสตร์และความรู้รอบตัว อายุ 9 (ป.3-ป.4) · 165 ข้อ · เขียนด้วยมือ
ประกอบเป็น q-general-9.json ด้วย: python3 build_questions.py general 9
ทุกแถว: หัวข้อ · โจทย์ไทย · โจทย์อังกฤษ · ตัวเลือกไทย · ตัวเลือกอังกฤษ · คำอธิบายไทย · คำอธิบายอังกฤษ
ตัวเลือกคั่นด้วย | และ "ตัวแรกคือเฉลยเสมอ" (ไทยกับอังกฤษเรียงลำดับเดียวกัน)
เลี่ยงข้อเท็จจริงที่ยังเถียงกันหรือเปลี่ยนได้ (เช่น แม่น้ำที่ยาวที่สุด จำนวนมหาสมุทร จำนวนสมาชิกอาเซียน)
"""
ITEMS = []


def Q(topic, th_q, en_q, th_ch, en_ch, th_ex, en_ex):
    ITEMS.append({'topic': topic, 'th': (th_q, th_ch.split('|'), th_ex), 'en': (en_q, en_ch.split('|'), en_ex)})


# ---------------------------------------------------------------- ร่างกายของเรา (20)
T = 'body'
Q(T, 'อวัยวะใดสูบฉีดเลือดไปทั่วร่างกาย', 'Which organ pumps blood around the body?', 'หัวใจ|ปอด|กระเพาะอาหาร|สมอง', 'the heart|the lungs|the stomach|the brain',
  'หัวใจบีบตัวส่งเลือดไปตามหลอดเลือดตลอดเวลา แม้ตอนเราหลับ', 'The heart squeezes to push blood through the blood vessels all the time, even when we sleep.')
Q(T, 'อวัยวะใดรับออกซิเจนเข้าสู่เลือดเมื่อเราหายใจ', 'Which organs take oxygen into the blood when we breathe?', 'ปอด|หัวใจ|ตับ|ไต', 'the lungs|the heart|the liver|the kidneys',
  'ปอดรับออกซิเจนจากอากาศเข้าสู่เลือด และปล่อยคาร์บอนไดออกไซด์ออกไป', 'The lungs pass oxygen from the air into the blood and let carbon dioxide out.')
Q(T, 'อวัยวะใดควบคุมการทำงานของทั้งร่างกาย', 'Which organ controls the whole body?', 'สมอง|หัวใจ|กระเพาะอาหาร|ปอด', 'the brain|the heart|the stomach|the lungs',
  'สมองรับข้อมูลจากประสาทสัมผัส แล้วสั่งงานไปทั่วร่างกายผ่านเส้นประสาท', 'The brain takes in messages from the senses and sends orders through the nerves.')
Q(T, 'ผู้ใหญ่มีกระดูกทั้งหมดกี่ชิ้น', 'How many bones does an adult have?', '206|106|306|26', '206|106|306|26',
  'ทารกมีกระดูกราว 300 ชิ้น เมื่อโตขึ้นบางชิ้นเชื่อมติดกันจนเหลือ 206 ชิ้น', 'A baby has about 300 bones. Some join together as we grow, leaving 206.')
Q(T, 'กระดูกส่วนใดปกป้องสมอง', 'Which bones protect the brain?', 'กะโหลกศีรษะ|ซี่โครง|กระดูกสันหลัง|กระดูกเชิงกราน', 'the skull|the ribs|the backbone|the hip bones',
  'กะโหลกศีรษะเป็นกล่องกระดูกแข็งที่หุ้มสมองไว้', 'The skull is a hard case of bone around the brain.')
Q(T, 'กระดูกซี่โครงปกป้องอวัยวะใดเป็นหลัก', 'What do the ribs mainly protect?', 'หัวใจและปอด|สมอง|กระเพาะปัสสาวะ|ดวงตา', 'the heart and lungs|the brain|the bladder|the eyes',
  'ซี่โครงโค้งเป็นกรงล้อมรอบหัวใจและปอด', 'The ribs curve into a cage around the heart and lungs.')
Q(T, 'สารอาหารส่วนใหญ่ถูกดูดซึมเข้าสู่เลือดที่อวัยวะใด', 'Where does most food pass into the blood?', 'ลำไส้เล็ก|หลอดอาหาร|ปาก|ลำไส้ใหญ่', 'the small intestine|the food pipe|the mouth|the large intestine',
  'ลำไส้เล็กยาวหลายเมตร ดูดซึมสารอาหารเข้าสู่เลือด ส่วนลำไส้ใหญ่ดูดน้ำกลับ', 'The small intestine is several metres long and takes food into the blood. The large intestine takes back water.')
Q(T, 'ฟันน้ำนมมีทั้งหมดกี่ซี่', 'How many milk teeth do children have?', '20|32|28|12', '20|32|28|12',
  'ฟันน้ำนมมี 20 ซี่ เมื่อหลุดแล้วฟันแท้จะขึ้นแทนจนครบ 32 ซี่', 'There are 20 milk teeth. Adult teeth replace them, up to 32 in all.')
Q(T, 'ฟันแท้ของผู้ใหญ่มีครบทั้งหมดกี่ซี่', 'How many teeth are in a full adult set?', '32|20|24|40', '32|20|24|40',
  'ฟันแท้ครบชุดมี 32 ซี่ รวมฟันกรามซี่ในสุด 4 ซี่ที่ขึ้นช้าที่สุด', 'A full adult set has 32 teeth, counting the 4 back teeth that come in last.')
Q(T, 'ประสาทสัมผัสหลักของคนมีกี่อย่าง', 'How many main senses do people have?', '5|3|4|7', '5|3|4|7',
  'มี 5 อย่าง คือ การมองเห็น การได้ยิน การได้กลิ่น การรับรส และการสัมผัส', 'There are 5: sight, hearing, smell, taste and touch.')
Q(T, 'อวัยวะใดรับรสอาหาร', 'Which part of the body tastes food?', 'ลิ้น|จมูก|หู|ผิวหนัง', 'the tongue|the nose|the ears|the skin',
  'บนลิ้นมีปุ่มรับรสจำนวนมาก ส่งสัญญาณรสไปยังสมอง', 'The tongue is covered in taste buds that send taste signals to the brain.')
Q(T, 'อวัยวะใดกรองของเสียออกจากเลือดเป็นปัสสาวะ', 'Which organs clean waste from the blood and make urine?', 'ไต|ตับ|ปอด|หัวใจ', 'the kidneys|the liver|the lungs|the heart',
  'ไตมี 2 ข้าง ทำหน้าที่กรองของเสียและน้ำส่วนเกินออกจากเลือด', 'We have 2 kidneys. They filter waste and spare water out of the blood.')
Q(T, 'อะไรทำให้เลือดมีสีแดง', 'What makes blood red?', 'เซลล์เม็ดเลือดแดง|เซลล์เม็ดเลือดขาว|น้ำ|เกล็ดเลือด', 'red blood cells|white blood cells|water|platelets',
  'เซลล์เม็ดเลือดแดงมีสารสีแดงที่จับออกซิเจนไปส่งทั่วร่างกาย', 'Red blood cells hold a red substance that carries oxygen around the body.')
Q(T, 'เซลล์เม็ดเลือดขาวทำหน้าที่อะไร', 'What do white blood cells do?', 'ต่อสู้กับเชื้อโรค|ขนส่งออกซิเจน|ย่อยอาหาร|ทำให้เลือดเป็นสีแดง', 'fight germs|carry oxygen|digest food|make blood red',
  'เซลล์เม็ดเลือดขาวคอยจับและทำลายเชื้อโรคที่เข้าสู่ร่างกาย', 'White blood cells find and destroy germs that get into the body.')
Q(T, 'อวัยวะที่ใหญ่ที่สุดของร่างกายคืออะไร', 'What is the biggest organ of the body?', 'ผิวหนัง|ตับ|สมอง|ปอด', 'the skin|the liver|the brain|the lungs',
  'ผิวหนังคลุมทั้งตัว จึงเป็นอวัยวะที่ใหญ่ที่สุด ช่วยกันเชื้อโรคและรักษาอุณหภูมิ', 'Skin covers the whole body, so it is the biggest organ. It keeps germs out and helps control body heat.')
Q(T, 'กล้ามเนื้อทำให้ร่างกายเคลื่อนไหวได้อย่างไร', 'How do muscles move the body?', 'หดและคลายตัวเพื่อดึงกระดูก|ดันกระดูกออกไป|เปลี่ยนเป็นกระดูก|สูบลมเข้าออก', 'by tightening and relaxing to pull bones|by pushing bones away|by turning into bone|by pumping air',
  'กล้ามเนื้อดึงได้อย่างเดียว ดันไม่ได้ จึงทำงานเป็นคู่ ข้างหนึ่งหด อีกข้างคลาย', 'Muscles can only pull, never push. So they work in pairs: one tightens while the other relaxes.')
Q(T, 'สารอาหารใดช่วยให้กระดูกและฟันแข็งแรง', 'Which nutrient makes bones and teeth strong?', 'แคลเซียม|น้ำตาล|ไขมัน|เกลือ', 'calcium|sugar|fat|salt',
  'แคลเซียมพบมากในนม ปลาเล็กปลาน้อย และผักใบเขียว', 'Calcium is found in milk, small fish eaten whole and green leafy vegetables.')
Q(T, 'อาหารจำพวกข้าวและขนมปังให้สารอาหารใดเป็นหลัก', 'Which nutrient do rice and bread mainly give us?', 'คาร์โบไฮเดรต|วิตามิน|เกลือแร่|ใยอาหาร', 'carbohydrate|vitamins|minerals|fibre',
  'คาร์โบไฮเดรตเป็นแหล่งพลังงานหลักของร่างกาย', 'Carbohydrate is the body\'s main source of energy.')
Q(T, 'โปรตีนจากเนื้อ นม ไข่ และถั่ว ช่วยร่างกายอย่างไรเป็นหลัก', 'What is the main job of protein from meat, milk, eggs and beans?', 'สร้างและซ่อมแซมร่างกาย|ทำให้มองเห็นในที่มืด|ทำให้อาหารมีรสหวาน|ทำให้กระดูกงอได้', 'building and repairing the body|helping us see in the dark|making food taste sweet|making bones bend',
  'โปรตีนใช้สร้างกล้ามเนื้อ ผิวหนัง และซ่อมแซมส่วนที่สึกหรอ เด็กที่กำลังโตจึงต้องการมาก', 'Protein builds muscle and skin and repairs worn parts, so growing children need plenty.')
Q(T, 'ชีพจรที่จับได้ตรงข้อมือเกิดจากอะไร', 'What causes the pulse you can feel in your wrist?', 'การเต้นของหัวใจ|การหายใจ|การย่อยอาหาร|การกะพริบตา', 'the heart beating|breathing|digesting food|blinking',
  'ทุกครั้งที่หัวใจบีบตัว เลือดจะพุ่งไปตามหลอดเลือด เราจึงรู้สึกเป็นจังหวะ', 'Each time the heart squeezes, blood surges along the blood vessels and we feel a beat.')

# ---------------------------------------------------------------- พืช (16)
T = 'plants'
Q(T, 'พืชสร้างอาหารเองด้วยกระบวนการใด', 'How do plants make their own food?', 'การสังเคราะห์ด้วยแสง|การหายใจ|การคายน้ำ|การย่อยอาหาร', 'photosynthesis|breathing|losing water|digestion',
  'พืชใช้แสง น้ำ และคาร์บอนไดออกไซด์ สร้างน้ำตาลเป็นอาหาร เรียกว่าการสังเคราะห์ด้วยแสง', 'Plants use light, water and carbon dioxide to make sugar. This is called photosynthesis.')
Q(T, 'การสังเคราะห์ด้วยแสงเกิดที่ส่วนใดของพืชเป็นหลัก', 'Where does a plant mainly make its food?', 'ใบ|ราก|ดอก|เมล็ด', 'the leaves|the roots|the flowers|the seeds',
  'ใบแผ่กว้างเพื่อรับแสง และมีสารสีเขียวที่ใช้จับพลังงานแสง', 'Leaves spread out to catch light and hold the green substance that traps light energy.')
Q(T, 'สารสีเขียวในใบพืชที่ใช้จับแสงเรียกว่าอะไร', 'What is the green substance in leaves that traps light?', 'คลอโรฟิลล์|ออกซิเจน|แป้ง|น้ำตาล', 'chlorophyll|oxygen|starch|sugar',
  'คลอโรฟิลล์ทำให้ใบมีสีเขียว และดูดพลังงานแสงมาใช้สร้างอาหาร', 'Chlorophyll makes leaves green and soaks up light energy to make food.')
Q(T, 'พืชใช้แก๊สใดในการสร้างอาหาร', 'Which gas do plants use to make food?', 'คาร์บอนไดออกไซด์|ไนโตรเจน|ฮีเลียม|ออกซิเจน', 'carbon dioxide|nitrogen|helium|oxygen',
  'พืชรับคาร์บอนไดออกไซด์เข้าทางใบเพื่อสร้างอาหาร แล้วปล่อยออกซิเจนออกมา', 'Plants take in carbon dioxide through their leaves to make food, and give out oxygen.')
Q(T, 'รากของพืชทำหน้าที่อะไร', 'What do roots do?', 'ดูดน้ำและแร่ธาตุ และยึดลำต้น|สร้างเมล็ด|จับแสงแดด|ล่อแมลง', 'take in water and hold the plant|make seeds|catch sunlight|attract insects',
  'รากดูดน้ำและแร่ธาตุจากดิน และยึดต้นไว้ไม่ให้ล้ม', 'Roots take in water and minerals from the soil and hold the plant firmly in place.')
Q(T, 'ลำต้นของพืชทำหน้าที่อะไรเป็นหลัก', 'What is the main job of a plant\'s stem?', 'ลำเลียงน้ำและอาหาร และชูใบ|ดูดน้ำจากดิน|สร้างเมล็ด|ล่อแมลง', 'carry water and food and hold up leaves|take water from the soil|make seeds|attract insects',
  'ลำต้นมีท่อลำเลียงน้ำจากรากขึ้นไปยังใบ และลำเลียงอาหารจากใบไปทั่วต้น', 'The stem has tubes that carry water up from the roots and food from the leaves to the rest of the plant.')
Q(T, 'ส่วนใดของดอกที่เจริญไปเป็นผล', 'Which part of a flower grows into the fruit?', 'รังไข่|กลีบดอก|กลีบเลี้ยง|ก้านดอก', 'the ovary|the petals|the sepals|the stalk',
  'หลังการผสมเกสร รังไข่จะเจริญเป็นผล และไข่อ่อนข้างในเจริญเป็นเมล็ด', 'After pollination the ovary swells into a fruit, and the tiny eggs inside become seeds.')
Q(T, 'การถ่ายละอองเรณูคืออะไร', 'What is pollination?', 'ละอองเรณูไปตกบนเกสรเพศเมีย|เมล็ดงอกเป็นต้นอ่อน|ใบร่วงจากต้น|รากดูดน้ำ', 'pollen landing on the female part|a seed starting to grow|leaves falling off|roots taking in water',
  'ละอองเรณูจากเกสรเพศผู้ต้องไปตกบนเกสรเพศเมีย ดอกจึงจะสร้างเมล็ดได้', 'Pollen from the male part must reach the female part before a flower can make seeds.')
Q(T, 'สัตว์ใดช่วยถ่ายละอองเรณูให้ดอกไม้', 'Which animal helps to pollinate flowers?', 'ผึ้ง|ไส้เดือน|กบ|ปลา', 'a bee|an earthworm|a frog|a fish',
  'ผึ้งมาดูดน้ำหวาน ละอองเรณูจึงติดตัวไปยังดอกอื่น', 'Bees come for nectar, and pollen sticks to them and rides to the next flower.')
Q(T, 'เมล็ดต้องการอะไรจึงจะงอก', 'What does a seed need to start growing?', 'น้ำ อากาศ และอุณหภูมิที่เหมาะ|แสงแดดจัดและปุ๋ย|ดินและลมแรง|ความมืดและเกลือ', 'water, air and the right warmth|strong sunlight and fertiliser|soil and strong wind|darkness and salt',
  'เมล็ดมีอาหารสะสมอยู่แล้ว จึงยังไม่ต้องใช้แสงหรือปุ๋ยตอนเริ่มงอก', 'A seed carries its own food store, so it needs no light or fertiliser to sprout.')
Q(T, 'เมล็ดที่มีปีกหรือมีขนฟูเบา ๆ กระจายพันธุ์ด้วยวิธีใด', 'How do seeds with wings or fluffy hairs travel?', 'ลม|น้ำ|สัตว์กิน|ดีดตัวเอง', 'on the wind|on water|by being eaten|by popping out',
  'ปีกและขนฟูช่วยให้เมล็ดลอยในอากาศได้นาน ลมจึงพาไปได้ไกล', 'Wings and fluff keep a seed in the air longer, so the wind can carry it far.')
Q(T, 'ผลมะพร้าวเดินทางไปงอกบนเกาะไกล ๆ ได้ด้วยวิธีใด', 'How can a coconut travel to a far-off island?', 'ลอยไปกับน้ำ|ปลิวไปกับลม|ติดขนสัตว์|ดีดตัวจากฝัก', 'by floating on water|by blowing in the wind|by sticking to fur|by popping from a pod',
  'เปลือกมะพร้าวเป็นเส้นใยเบาและกันน้ำ ผลจึงลอยในทะเลได้นาน', 'A coconut\'s husk is light and waterproof, so it can float at sea for a long time.')
Q(T, 'พืชคายน้ำออกทางใดเป็นส่วนใหญ่', 'Where does most water leave a plant?', 'ปากใบ|ราก|เปลือกลำต้น|กลีบดอก', 'tiny holes in the leaves|the roots|the bark|the petals',
  'ใบมีรูเล็ก ๆ เรียกว่าปากใบ น้ำระเหยออกทางนี้ และแก๊สก็ผ่านเข้าออกทางนี้', 'Leaves have tiny holes called stomata. Water escapes through them, and gases go in and out.')
Q(T, 'เมื่อกินแครอต เรากินส่วนใดของพืช', 'Which part of the plant do we eat when we eat a carrot?', 'ราก|ลำต้น|ใบ|ผล', 'the root|the stem|the leaf|the fruit',
  'แครอตเป็นรากที่พืชใช้สะสมอาหาร จึงอวบและมีรสหวาน', 'A carrot is a root where the plant stores food, so it is fat and sweet.')
Q(T, 'เมื่อกินผักกาดหอม เรากินส่วนใดของพืช', 'Which part of the plant do we eat when we eat lettuce?', 'ใบ|ราก|ผล|เมล็ด', 'the leaves|the root|the fruit|the seeds',
  'ผักกาดหอม คะน้า และผักบุ้ง เป็นผักที่เรากินใบ', 'Lettuce, kale and morning glory are vegetables whose leaves we eat.')
Q(T, 'ต้นกระบองเพชรเก็บน้ำไว้ที่ส่วนใด', 'Where does a cactus store its water?', 'ลำต้น|หนาม|ดอก|เมล็ด', 'the stem|the spines|the flowers|the seeds',
  'ลำต้นกระบองเพชรอวบน้ำ ส่วนใบลดรูปเป็นหนามเพื่อลดการเสียน้ำ', 'A cactus has a thick, juicy stem. Its leaves have become spines so that it loses less water.')

# ---------------------------------------------------------------- สิ่งมีชีวิต (14)
T = 'living-things'
Q(T, 'สัตว์มีกระดูกสันหลังแบ่งเป็นกี่กลุ่ม', 'How many groups of animals with backbones are there?', '5 กลุ่ม|3 กลุ่ม|4 กลุ่ม|7 กลุ่ม', '5 groups|3 groups|4 groups|7 groups',
  'มี 5 กลุ่ม คือ ปลา สัตว์สะเทินน้ำสะเทินบก สัตว์เลื้อยคลาน นก และสัตว์เลี้ยงลูกด้วยนม', 'There are 5: fish, amphibians, reptiles, birds and mammals.')
Q(T, 'สัตว์ใดไม่มีกระดูกสันหลัง', 'Which animal has no backbone?', 'หมึก|ปลาทอง|กบ|งู', 'a squid|a goldfish|a frog|a snake',
  'หมึกมีลำตัวอ่อนนิ่ม ไม่มีกระดูกสันหลัง ส่วนปลา กบ และงู มีกระดูกสันหลัง', 'A squid has a soft body with no backbone. Fish, frogs and snakes all have backbones.')
Q(T, 'วัฏจักรชีวิตของผีเสื้อเรียงลำดับอย่างไร', 'What is the order of a butterfly\'s life cycle?', 'ไข่ → หนอน → ดักแด้ → ผีเสื้อ|ไข่ → ดักแด้ → หนอน → ผีเสื้อ|หนอน → ไข่ → ดักแด้ → ผีเสื้อ|ไข่ → หนอน → ผีเสื้อ → ดักแด้',
  'egg → caterpillar → pupa → butterfly|egg → pupa → caterpillar → butterfly|caterpillar → egg → pupa → butterfly|egg → caterpillar → butterfly → pupa',
  'ไข่ฟักเป็นหนอน หนอนกินใบไม้จนโตแล้วเข้าดักแด้ จากนั้นจึงออกมาเป็นผีเสื้อ', 'The egg hatches into a caterpillar. It eats and grows, becomes a pupa, and comes out as a butterfly.')
Q(T, 'ในวัฏจักรชีวิตของกบ ไข่ฟักออกมาเป็นอะไร', 'In a frog\'s life cycle, what hatches from the egg?', 'ลูกอ๊อด|ดักแด้|หนอน|ตัวอ่อนมีปีก', 'a tadpole|a pupa|a caterpillar|a winged baby',
  'ลูกอ๊อดอยู่ในน้ำ หายใจด้วยเหงือก แล้วค่อย ๆ งอกขาและหางหดจนเป็นกบ', 'A tadpole lives in water and breathes with gills. It slowly grows legs and loses its tail to become a frog.')
Q(T, 'ในห่วงโซ่อาหาร พืชมีบทบาทเป็นอะไร', 'What is a plant\'s role in a food chain?', 'ผู้ผลิต|ผู้บริโภค|ผู้ย่อยสลาย|ผู้ล่า', 'producer|consumer|decomposer|predator',
  'พืชสร้างอาหารเองจากแสง จึงเป็นผู้ผลิต และเป็นจุดเริ่มต้นของห่วงโซ่อาหาร', 'Plants make their own food from light, so they are producers and start every food chain.')
Q(T, 'ห่วงโซ่อาหาร: หญ้า → ตั๊กแตน → กบ → งู สัตว์ตัวใดกินพืช', 'Food chain: grass → grasshopper → frog → snake. Which animal eats plants?', 'ตั๊กแตน|กบ|งู|ไม่มีสัตว์ตัวใดเลย', 'the grasshopper|the frog|the snake|none of them',
  'ลูกศรชี้จากสิ่งที่ถูกกินไปยังผู้กิน ตั๊กแตนอยู่ถัดจากหญ้า จึงเป็นผู้กินพืช', 'Each arrow points from the food to the eater. The grasshopper comes right after the grass, so it eats plants.')
Q(T, 'เห็ดราและแบคทีเรียมีบทบาทอะไรในธรรมชาติ', 'What job do fungi and bacteria do in nature?', 'ย่อยสลายซากพืชซากสัตว์|สร้างอาหารจากแสง|ล่าสัตว์อื่น|ถ่ายละอองเรณู', 'break down dead plants and animals|make food from light|hunt other animals|carry pollen',
  'ผู้ย่อยสลายเปลี่ยนซากพืชซากสัตว์ให้เป็นแร่ธาตุกลับคืนสู่ดิน พืชจึงนำไปใช้ต่อได้', 'Decomposers turn dead things back into minerals in the soil, which plants can use again.')
Q(T, 'สัตว์ใดออกหากินเวลากลางคืน', 'Which animal is active at night?', 'ค้างคาว|ไก่|ผีเสื้อ|นกพิราบ', 'a bat|a chicken|a butterfly|a pigeon',
  'ค้างคาวนอนกลางวันและออกหากินตอนกลางคืน โดยใช้เสียงสะท้อนช่วยหาทาง', 'Bats sleep by day and feed at night, using echoes to find their way.')
Q(T, 'การจำศีลในฤดูหนาวมีประโยชน์ต่อสัตว์อย่างไร', 'How does sleeping through winter (hibernation) help an animal?', 'ประหยัดพลังงานเมื่ออาหารหายาก|ทำให้ตัวโตเร็ว|ช่วยให้บินได้ไกล|ทำให้ขนเปลี่ยนสี', 'it saves energy when food is scarce|it makes them grow fast|it helps them fly far|it changes their fur colour',
  'ขณะจำศีล หัวใจเต้นช้าลงและอุณหภูมิร่างกายลดลง สัตว์จึงอยู่ได้นานโดยไม่ต้องกิน', 'In hibernation the heart slows and the body cools, so the animal can last a long time without eating.')
Q(T, 'ทำไมนกบางชนิดจึงอพยพย้ายถิ่นทุกปี', 'Why do some birds migrate every year?', 'เพื่อหาอาหารและอากาศที่เหมาะ|เพื่อหนีแรงโน้มถ่วง|เพื่อตามดวงจันทร์|เพื่อเปลี่ยนสีขน', 'to find food and better weather|to escape gravity|to follow the Moon|to change feather colour',
  'เมื่อถิ่นเดิมหนาวและอาหารน้อยลง นกจะบินไปที่ที่อุ่นกว่าและมีอาหารมากกว่า', 'When home turns cold and food runs short, the birds fly to warmer places with more to eat.')
Q(T, 'อูฐเก็บอะไรไว้ในหนอก', 'What does a camel store in its hump?', 'ไขมัน|น้ำ|อากาศ|กระดูก', 'fat|water|air|bone',
  'หนอกอูฐเป็นไขมันสะสม ร่างกายนำมาใช้เป็นพลังงานเมื่อไม่มีอาหาร ไม่ใช่ถังน้ำ', 'The hump is a store of fat that the camel uses for energy when food is short. It is not a water tank.')
Q(T, 'ปลาหายใจในน้ำด้วยอวัยวะใด', 'What do fish use to breathe under water?', 'เหงือก|ปอด|ครีบ|เกล็ด', 'gills|lungs|fins|scales',
  'เหงือกดึงออกซิเจนที่ละลายอยู่ในน้ำเข้าสู่เลือด', 'Gills take oxygen that is dissolved in the water into the blood.')
Q(T, 'วาฬและโลมาหายใจด้วยอวัยวะใด', 'What do whales and dolphins breathe with?', 'ปอด|เหงือก|ผิวหนัง|ครีบ', 'lungs|gills|skin|fins',
  'วาฬและโลมาเป็นสัตว์เลี้ยงลูกด้วยนม ต้องขึ้นมาหายใจที่ผิวน้ำ', 'Whales and dolphins are mammals, so they must come to the surface to breathe air.')
Q(T, 'สัตว์กลุ่มใดเป็นสัตว์เลือดอุ่น', 'Which animals are warm-blooded?', 'นกและสัตว์เลี้ยงลูกด้วยนม|ปลาและกบ|งูและจระเข้|แมลงและแมงมุม', 'birds and mammals|fish and frogs|snakes and crocodiles|insects and spiders',
  'สัตว์เลือดอุ่นรักษาอุณหภูมิร่างกายให้คงที่ได้เอง แม้อากาศรอบตัวจะเปลี่ยน', 'Warm-blooded animals keep their body temperature steady even when the air around them changes.')

# ---------------------------------------------------------------- สสารและการเปลี่ยนแปลง (16)
T = 'matter'
Q(T, 'สสารรอบตัวเรามีสถานะหลัก 3 สถานะ คืออะไรบ้าง', 'What are the three main states of matter?', 'ของแข็ง ของเหลว แก๊ส|ร้อน อุ่น เย็น|ใหญ่ กลาง เล็ก|ดิน น้ำ ลม', 'solid, liquid, gas|hot, warm, cold|big, medium, small|earth, water, wind',
  'ตัวอย่างเช่น น้ำแข็งเป็นของแข็ง น้ำเป็นของเหลว และไอน้ำเป็นแก๊ส', 'For example, ice is a solid, water is a liquid and steam is a gas.')
Q(T, 'สถานะใดมีรูปร่างคงที่', 'Which state of matter keeps its own shape?', 'ของแข็ง|ของเหลว|แก๊ส|ทั้งของเหลวและแก๊ส', 'solid|liquid|gas|both liquid and gas',
  'อนุภาคของของแข็งเรียงชิดกันแน่น จึงคงรูปร่างเดิมไม่ว่าจะวางที่ใด', 'The particles in a solid are packed tightly, so it keeps its shape wherever you put it.')
Q(T, 'สถานะใดเปลี่ยนรูปร่างตามภาชนะ แต่ปริมาตรเท่าเดิม', 'Which state takes the shape of its container but keeps the same volume?', 'ของเหลว|ของแข็ง|แก๊ส|ไม่มีสถานะใด', 'liquid|solid|gas|none of them',
  'น้ำ 1 แก้วเทใส่ชามก็ยังมีปริมาณเท่าเดิม แค่รูปร่างเปลี่ยน ส่วนแก๊สจะฟุ้งจนเต็มภาชนะ', 'A cup of water poured into a bowl is still the same amount in a new shape. A gas would spread to fill the whole container.')
Q(T, 'น้ำกลายเป็นไอน้ำ เรียกว่าอะไร', 'What do we call water turning into water vapour?', 'การระเหย|การควบแน่น|การแข็งตัว|การหลอมเหลว', 'evaporation|condensation|freezing|melting',
  'ของเหลวได้รับความร้อนแล้วกลายเป็นแก๊ส เรียกว่าการระเหย เช่น ผ้าเปียกตากแดดแล้วแห้ง', 'A liquid warming up and becoming a gas is evaporation, like wet clothes drying in the sun.')
Q(T, 'ไอน้ำกลายเป็นหยดน้ำ เรียกว่าอะไร', 'What do we call water vapour turning into drops of water?', 'การควบแน่น|การระเหย|การหลอมเหลว|การแข็งตัว', 'condensation|evaporation|melting|freezing',
  'แก๊สเย็นลงแล้วกลายเป็นของเหลว เรียกว่าการควบแน่น เช่น ฝ้าบนกระจกห้องน้ำ', 'A gas cooling and becoming a liquid is condensation, like mist on a bathroom mirror.')
Q(T, 'น้ำกลายเป็นน้ำแข็ง เรียกว่าอะไร', 'What do we call water turning into ice?', 'การแข็งตัว|การหลอมเหลว|การระเหย|การควบแน่น', 'freezing|melting|evaporation|condensation',
  'ของเหลวเย็นลงจนกลายเป็นของแข็ง เรียกว่าการแข็งตัว', 'A liquid cooling until it becomes a solid is called freezing.')
Q(T, 'ที่ระดับน้ำทะเล น้ำเดือดที่อุณหภูมิกี่องศาเซลเซียส', 'At sea level, at what temperature does water boil?', '100 °C|0 °C|50 °C|37 °C', '100 °C|0 °C|50 °C|37 °C',
  'น้ำเดือดที่ 100 °C ส่วน 37 °C คืออุณหภูมิปกติของร่างกายคน', 'Water boils at 100 °C. 37 °C is the normal temperature of the human body.')
Q(T, 'น้ำแข็งตัวที่อุณหภูมิกี่องศาเซลเซียส', 'At what temperature does water freeze?', '0 °C|100 °C|32 °C|10 °C', '0 °C|100 °C|32 °C|10 °C',
  'น้ำกลายเป็นน้ำแข็งที่ 0 °C (เลข 32 เป็นจุดเยือกแข็งในหน่วยฟาเรนไฮต์)', 'Water turns to ice at 0 °C. (32 is the freezing point in Fahrenheit.)')
Q(T, 'หยดน้ำที่เกาะข้างแก้วน้ำเย็นมาจากไหน', 'Where do the drops on the outside of a cold glass come from?', 'ไอน้ำในอากาศควบแน่น|น้ำซึมผ่านแก้ว|น้ำแข็งละลายทะลุแก้ว|แก้วมีเหงื่อ', 'water vapour in the air condensing|water leaking through the glass|ice melting through the glass|the glass sweating',
  'ไอน้ำในอากาศมากระทบผิวแก้วที่เย็น จึงควบแน่นเป็นหยดน้ำ', 'Water vapour in the air touches the cold glass and condenses into drops.')
Q(T, 'เมื่อเกลือละลายในน้ำจนมองไม่เห็น เราเรียกของผสมนี้ว่าอะไร', 'When salt dissolves in water until you cannot see it, what is the mixture called?', 'สารละลาย|ของแข็ง|แก๊ส|ตะกอน', 'a solution|a solid|a gas|a sediment',
  'เกลือยังอยู่ในน้ำ แต่แตกตัวเล็กมากจนมองไม่เห็น ชิมแล้วยังเค็ม', 'The salt is still there, broken into pieces too small to see. The water still tastes salty.')
Q(T, 'สิ่งใดไม่ละลายในน้ำ', 'Which of these does not dissolve in water?', 'ทราย|เกลือ|น้ำตาล|น้ำผึ้ง', 'sand|salt|sugar|honey',
  'ทรายไม่ละลาย จึงตกลงก้นแก้ว ส่วนเกลือ น้ำตาล และน้ำผึ้งละลายในน้ำได้', 'Sand does not dissolve, so it sinks to the bottom. Salt, sugar and honey all dissolve.')
Q(T, 'วิธีใดแยกทรายออกจากน้ำได้ง่ายที่สุด', 'What is the easiest way to separate sand from water?', 'การกรอง|การใช้แม่เหล็ก|การแช่แข็ง|การเขย่า', 'filtering|using a magnet|freezing|shaking',
  'กระดาษกรองมีรูเล็กมาก น้ำไหลผ่านได้ แต่เม็ดทรายติดค้างอยู่', 'Filter paper has tiny holes. Water goes through, but the grains of sand are held back.')
Q(T, 'วิธีใดแยกเกลือออกจากน้ำเกลือได้', 'How can you get the salt back out of salty water?', 'ระเหยน้ำออก|กรองด้วยกระดาษ|ใช้แม่เหล็กดูด|ร่อนด้วยตะแกรง', 'evaporate the water|filter it with paper|use a magnet|sieve it',
  'เกลือที่ละลายแล้วเล็กเกินกว่าจะกรองได้ ต้องให้น้ำระเหยไป เกลือจึงเหลืออยู่ เหมือนการทำนาเกลือ', 'Dissolved salt is too small to filter. Let the water evaporate and the salt is left behind, as in a salt farm.')
Q(T, 'วิธีใดแยกผงเหล็กออกจากทรายได้ง่ายที่สุด', 'What is the easiest way to separate iron filings from sand?', 'ใช้แม่เหล็กดูด|กรองด้วยกระดาษ|ระเหยด้วยความร้อน|เติมน้ำตาล', 'use a magnet|filter with paper|heat it|add sugar',
  'แม่เหล็กดูดเหล็กแต่ไม่ดูดทราย ผงเหล็กจึงติดขึ้นมากับแม่เหล็ก', 'A magnet pulls iron but not sand, so the iron filings come away on the magnet.')
Q(T, 'การเปลี่ยนแปลงใดเปลี่ยนกลับเป็นของเดิมไม่ได้', 'Which change cannot be undone?', 'เผากระดาษ|น้ำแข็งละลาย|น้ำเดือด|ช็อกโกแลตละลาย', 'burning paper|ice melting|water boiling|chocolate melting',
  'การเผาทำให้เกิดสารใหม่ คือขี้เถ้าและควัน ส่วนอีก 3 อย่างเป็นแค่การเปลี่ยนสถานะ ทำให้เย็นแล้วกลับเป็นเหมือนเดิมได้', 'Burning makes new substances, ash and smoke. The other three only change state and go back when cooled.')
Q(T, 'วัสดุใดนำความร้อนได้ดี', 'Which material carries heat well?', 'โลหะ|ไม้|พลาสติก|ผ้า', 'metal|wood|plastic|cloth',
  'โลหะนำความร้อนได้ดี กระทะจึงทำจากโลหะ ส่วนด้ามจับทำจากไม้หรือพลาสติกเพื่อไม่ให้ร้อนมือ', 'Metal carries heat well, so pans are metal. Handles are wood or plastic so they stay cool.')

# ---------------------------------------------------------------- แรงและพลังงาน (14)
T = 'forces'
Q(T, 'แรงเสียดทานคืออะไร', 'What is friction?', 'แรงต้านการเคลื่อนที่ระหว่างผิวสัมผัส|แรงที่ดึงของลงพื้น|แรงดูดของแม่เหล็ก|แรงที่ทำให้ของลอย', 'a force that slows things that rub|the force that pulls things down|the pull of a magnet|a force that makes things float',
  'เมื่อผิวสองผิวถูกัน จะเกิดแรงต้านไม่ให้เลื่อนไปง่าย ๆ ลูกบอลที่กลิ้งบนพื้นจึงค่อย ๆ หยุด', 'When two surfaces rub, a force resists the sliding. That is why a rolling ball slowly stops.')
Q(T, 'พื้นแบบใดมีแรงเสียดทานมากที่สุด', 'Which surface has the most friction?', 'พื้นขรุขระ|พื้นน้ำแข็ง|พื้นกระเบื้องเปียก|พื้นกระจก', 'a rough floor|ice|wet tiles|glass',
  'ผิวยิ่งขรุขระ แรงเสียดทานยิ่งมาก ผิวที่เรียบหรือเปียกจึงลื่น', 'The rougher the surface, the more friction. Smooth or wet surfaces are slippery.')
Q(T, 'ทำไมพื้นรองเท้าจึงมีลวดลายนูน', 'Why do the soles of shoes have a raised pattern?', 'เพิ่มแรงเสียดทานไม่ให้ลื่น|ทำให้รองเท้าเบา|ทำให้เดินเสียงดัง|ลดแรงโน้มถ่วง', 'to add friction and stop slipping|to make shoes lighter|to make walking louder|to reduce gravity',
  'ลวดลายทำให้พื้นรองเท้าขรุขระ จึงยึดเกาะพื้นได้ดีขึ้น', 'The pattern makes the sole rougher, so it grips the ground better.')
Q(T, 'หน่วยของแรงคืออะไร', 'What is the unit of force?', 'นิวตัน|กิโลกรัม|เมตร|ลิตร', 'the newton|the kilogram|the metre|the litre',
  'แรงวัดเป็นนิวตัน ตั้งชื่อตามเซอร์ไอแซก นิวตัน ส่วนกิโลกรัมใช้วัดมวล', 'Force is measured in newtons, named after Sir Isaac Newton. Kilograms measure mass.')
Q(T, 'เครื่องมือใดใช้วัดแรง', 'Which tool measures force?', 'เครื่องชั่งสปริง|เทอร์โมมิเตอร์|ไม้บรรทัด|นาฬิกาจับเวลา', 'a spring balance|a thermometer|a ruler|a stopwatch',
  'ยิ่งออกแรงดึงมาก สปริงยิ่งยืดมาก จึงอ่านค่าแรงได้จากระยะที่สปริงยืด', 'The harder you pull, the more the spring stretches, so the stretch shows the size of the force.')
Q(T, 'แม่เหล็กดูดวัสดุใด', 'Which material does a magnet attract?', 'เหล็ก|อะลูมิเนียม|ทองแดง|ทองคำ', 'iron|aluminium|copper|gold',
  'แม่เหล็กดูดเหล็ก นิกเกิล และโคบอลต์ ไม่ได้ดูดโลหะทุกชนิด', 'A magnet attracts iron, nickel and cobalt. It does not attract every metal.')
Q(T, 'ไม้กระดกในสนามเด็กเล่นเป็นเครื่องกลอย่างง่ายชนิดใด', 'What kind of simple machine is a playground seesaw?', 'คาน|รอก|พื้นเอียง|สกรู', 'a lever|a pulley|a slope|a screw',
  'คานคือแท่งแข็งที่หมุนรอบจุดหมุน ไม้กระดกมีจุดหมุนอยู่ตรงกลาง', 'A lever is a stiff bar that turns on a fixed point. A seesaw turns on a point in the middle.')
Q(T, 'รอกที่ยอดเสาธงช่วยเราอย่างไร', 'How does the pulley at the top of a flagpole help?', 'เปลี่ยนทิศของแรงดึง|ทำให้ธงหนักขึ้น|ทำให้เชือกยาวขึ้น|ทำให้ลมแรงขึ้น', 'it changes the direction of the pull|it makes the flag heavier|it makes the rope longer|it makes the wind stronger',
  'เราดึงเชือกลง แต่ธงเคลื่อนขึ้น เพราะรอกเปลี่ยนทิศของแรง', 'We pull the rope down and the flag goes up, because the pulley turns the force around.')
Q(T, 'ทางลาดช่วยให้ขนของหนักขึ้นที่สูงได้อย่างไร', 'How does a ramp help to lift a heavy load?', 'ใช้แรงน้อยลง แต่ต้องเคลื่อนไกลขึ้น|ทำให้ของเบาลงจริง ๆ|ทำให้แรงโน้มถ่วงหายไป|ใช้แรงมากขึ้นและไกลขึ้น', 'less force, but a longer distance|it makes the load truly lighter|it removes gravity|more force and a longer distance',
  'ทางลาดแลกแรงกับระยะทาง ออกแรงน้อยลงแต่ต้องเข็นไกลกว่ายกตรง ๆ', 'A ramp trades force for distance: you push less hard but further than lifting straight up.')
Q(T, 'แผงโซลาร์เซลล์เปลี่ยนพลังงานใดเป็นไฟฟ้า', 'Which kind of energy does a solar panel turn into electricity?', 'พลังงานแสง|พลังงานลม|พลังงานเสียง|พลังงานน้ำ', 'light energy|wind energy|sound energy|water energy',
  'แผงโซลาร์เซลล์รับแสงอาทิตย์แล้วเปลี่ยนเป็นไฟฟ้าโดยตรง', 'A solar panel takes in sunlight and turns it straight into electricity.')
Q(T, 'กังหันลมผลิตไฟฟ้าจากอะไร', 'What does a wind turbine use to make electricity?', 'อากาศที่เคลื่อนที่|ความร้อนของดิน|แสงจันทร์|เสียง', 'moving air|heat from the soil|moonlight|sound',
  'ลมหมุนใบพัด ใบพัดหมุนเครื่องกำเนิดไฟฟ้า จึงได้ไฟฟ้าออกมา', 'Wind spins the blades, the blades spin a generator, and the generator makes electricity.')
Q(T, 'แหล่งพลังงานใดใช้แล้วหมดไป', 'Which energy source will run out?', 'น้ำมัน|แสงอาทิตย์|ลม|น้ำไหล', 'oil|sunlight|wind|flowing water',
  'น้ำมันใช้เวลาเกิดหลายล้านปี ใช้หมดแล้วสร้างใหม่ไม่ทัน ส่วนแสงอาทิตย์ ลม และน้ำ มีให้ใช้ต่อเนื่อง', 'Oil took millions of years to form and cannot be replaced in time. Sunlight, wind and water keep coming.')
Q(T, 'ทำไมนักบินอวกาศกระโดดบนดวงจันทร์ได้สูงกว่าบนโลก', 'Why can an astronaut jump higher on the Moon than on Earth?', 'แรงโน้มถ่วงของดวงจันทร์น้อยกว่า|บนดวงจันทร์มีลมพัดขึ้น|ดวงจันทร์อยู่ใกล้ดวงอาทิตย์|บนดวงจันทร์ตัวเราใหญ่ขึ้น', 'the Moon\'s gravity is weaker|wind blows upward there|it is nearer the Sun|we grow bigger there',
  'ดวงจันทร์มีมวลน้อยกว่าโลก แรงโน้มถ่วงจึงมีราว 1 ใน 6 ของโลก', 'The Moon has less mass than Earth, so its gravity is only about one sixth as strong.')
Q(T, 'ร่มชูชีพทำให้คนตกลงมาช้าลงเพราะแรงใด', 'Which force makes a parachute fall slowly?', 'แรงต้านอากาศ|แรงแม่เหล็ก|แรงเสียดทานของพื้น|แรงดึงของดวงจันทร์', 'air resistance|magnetism|friction with the ground|the pull of the Moon',
  'ร่มที่กางกว้างปะทะอากาศมาก อากาศจึงต้านการตกไว้', 'The wide canopy catches a lot of air, and the air pushes back against the fall.')

# ---------------------------------------------------------------- แสงและเสียง (12)
T = 'light-sound'
Q(T, 'แสงเดินทางเป็นแนวแบบใด', 'In what kind of path does light travel?', 'เส้นตรง|เส้นโค้ง|วงกลม|ซิกแซก', 'a straight line|a curve|a circle|a zigzag',
  'แสงเดินทางเป็นเส้นตรง จึงอ้อมสิ่งกีดขวางไม่ได้ และทำให้เกิดเงา', 'Light travels in straight lines. It cannot bend round an object, which is why shadows form.')
Q(T, 'เงาเกิดขึ้นเมื่อใด', 'When does a shadow form?', 'เมื่อวัตถุทึบแสงกั้นแสง|เมื่อแสงผ่านกระจกใส|เมื่อไม่มีแสงเลย|เมื่อแสงสะท้อนผิวน้ำ', 'when an object blocks light|when light passes through clear glass|when there is no light at all|when light bounces off water',
  'วัตถุทึบแสงไม่ยอมให้แสงผ่าน ด้านหลังวัตถุจึงมืดเป็นเงา', 'An object that light cannot pass through leaves a dark patch behind it: a shadow.')
Q(T, 'ในวันแดดออก เงาของเราสั้นที่สุดเวลาใด', 'On a sunny day, when is your shadow shortest?', 'เที่ยงวัน|เช้าตรู่|ตอนเย็น|ตอนพลบค่ำ', 'at noon|early morning|in the evening|at dusk',
  'ตอนเที่ยงดวงอาทิตย์อยู่สูงเกือบตรงศีรษะ เงาจึงสั้น ตอนเช้าและเย็นดวงอาทิตย์อยู่ต่ำ เงาจึงยาว', 'At noon the Sun is high overhead, so shadows are short. In the morning and evening it is low, so they are long.')
Q(T, 'เรามองเห็นวัตถุรอบตัวได้เพราะอะไร', 'How do we see the things around us?', 'แสงสะท้อนจากวัตถุเข้าตา|ตาปล่อยแสงออกไป|วัตถุทุกชนิดมีแสงในตัว|อากาศพาภาพมา', 'light bounces off them into our eyes|our eyes send out light|every object makes its own light|air carries the picture',
  'แสงจากดวงอาทิตย์หรือหลอดไฟตกกระทบวัตถุ แล้วสะท้อนเข้าตาเรา ในห้องมืดสนิทจึงมองไม่เห็น', 'Light from the Sun or a lamp hits an object and bounces into our eyes. In total darkness we see nothing.')
Q(T, 'เราเห็นภาพตัวเองในกระจกเงาเพราะอะไร', 'Why can you see yourself in a mirror?', 'การสะท้อนของแสง|การหักเหของแสง|การดูดกลืนแสง|การกระจายของเสียง', 'light reflecting|light bending|light soaking in|sound spreading',
  'ผิวกระจกเงาเรียบและมันวาว แสงจึงสะท้อนกลับอย่างเป็นระเบียบจนเห็นเป็นภาพ', 'A mirror is smooth and shiny, so light bounces back evenly and forms a picture.')
Q(T, 'หลอดที่จุ่มในแก้วน้ำดูเหมือนหักเพราะอะไร', 'Why does a straw in a glass of water look bent?', 'การหักเหของแสง|การสะท้อนของแสง|หลอดงอจริง|น้ำขยายหลอด', 'light bending (refraction)|light reflecting|the straw really bends|water stretches the straw',
  'แสงเปลี่ยนทิศเมื่อผ่านจากน้ำออกสู่อากาศ เราจึงเห็นหลอดส่วนที่อยู่ในน้ำผิดตำแหน่ง', 'Light changes direction as it passes from water into air, so the part under water seems to be in the wrong place.')
Q(T, 'รุ้งกินน้ำเกิดจากอะไร', 'What makes a rainbow?', 'แสงอาทิตย์ผ่านหยดน้ำแล้วแยกเป็นสี|เมฆสะท้อนสีของดอกไม้|ลมพัดฝุ่นหลากสี|แสงจันทร์ผสมกับหมอก', 'sunlight splitting in raindrops|clouds reflecting flowers|wind blowing coloured dust|moonlight mixing with fog',
  'แสงอาทิตย์เป็นแสงสีขาวที่มีหลายสีรวมกัน หยดน้ำทำให้แสงหักเหและแยกออกเป็น 7 สี', 'Sunlight is white light made of many colours. Raindrops bend it and split it into 7 colours.')
Q(T, 'วัตถุใดเป็นวัตถุโปร่งแสง คือแสงผ่านได้บ้าง แต่มองไม่ชัด', 'Which object lets some light through but gives no clear view?', 'กระจกฝ้า|กระจกใส|แผ่นไม้|แผ่นเหล็ก', 'frosted glass|clear glass|a wooden board|a steel sheet',
  'กระจกใสเป็นวัตถุโปร่งใส กระจกฝ้าเป็นวัตถุโปร่งแสง ส่วนไม้และเหล็กเป็นวัตถุทึบแสง', 'Clear glass is transparent, frosted glass is translucent, and wood and steel are opaque.')
Q(T, 'เสียงเดินทางผ่านสิ่งใดไม่ได้', 'What can sound not travel through?', 'สุญญากาศ|อากาศ|น้ำ|เหล็ก', 'empty space (a vacuum)|air|water|steel',
  'เสียงต้องอาศัยตัวกลางที่สั่นต่อกันไป ในอวกาศที่ไม่มีอากาศจึงเงียบสนิท', 'Sound needs something to vibrate through. Space has no air, so it is silent.')
Q(T, 'เสียงสูงหรือเสียงต่ำขึ้นอยู่กับอะไร', 'What decides whether a sound is high or low?', 'สั่นเร็วหรือช้า|สั่นแรงหรือเบา|สีของวัตถุ|ขนาดของห้อง', 'how fast it vibrates|how hard it vibrates|its colour|the size of the room',
  'สั่นเร็วให้เสียงสูง สั่นช้าให้เสียงต่ำ สายกีตาร์เส้นเล็กจึงเสียงสูงกว่าเส้นใหญ่', 'Fast vibrations make a high sound and slow ones a low sound. That is why thin guitar strings sound higher.')
Q(T, 'เสียงดังหรือเสียงเบาขึ้นอยู่กับอะไร', 'What decides whether a sound is loud or quiet?', 'สั่นแรงหรือเบา|สั่นเร็วหรือช้า|สีของวัตถุ|เวลาของวัน', 'how hard it vibrates|how fast it vibrates|its colour|the time of day',
  'ตีกลองแรง หนังกลองสั่นแรง เสียงจึงดัง ตีเบาเสียงก็เบา', 'Hit a drum hard and the skin vibrates strongly, so the sound is loud. Tap it gently and it is quiet.')
Q(T, 'ตะโกนใส่หน้าผาแล้วได้ยินเสียงตัวเองกลับมา ปรากฏการณ์นี้คืออะไร', 'You shout at a cliff and hear your voice come back. What is this?', 'เสียงสะท้อน|เสียงหักเห|เสียงถูกดูดกลืน|เสียงระเหย', 'an echo|sound bending|sound soaking in|sound evaporating',
  'เสียงกระทบผิวแข็งแล้วสะท้อนกลับมาเข้าหูเราอีกครั้ง', 'Sound hits a hard surface and bounces back to our ears.')

# ---------------------------------------------------------------- ไฟฟ้า (10)
T = 'electricity'
Q(T, 'วงจรไฟฟ้าอย่างง่ายที่ทำให้หลอดไฟสว่างต้องมีอะไรบ้าง', 'What do you need for a simple circuit that lights a bulb?', 'ถ่านไฟฉาย สายไฟ หลอดไฟ|สายไฟ ไม้ ยาง|หลอดไฟ น้ำ แก้ว|ถ่านไฟฉาย เชือก กระดาษ', 'a battery, wires and a bulb|wires, wood and rubber|a bulb, water and glass|a battery, string and paper',
  'ต้องมีแหล่งกำเนิดไฟฟ้า ตัวนำให้ไฟฟ้าไหล และอุปกรณ์ที่ใช้ไฟฟ้า', 'You need a source of electricity, something for it to flow through, and something that uses it.')
Q(T, 'หลอดไฟจะสว่างเมื่อวงจรเป็นแบบใด', 'When does the bulb in a circuit light up?', 'วงจรปิด ต่อครบวง|วงจรเปิด มีช่องขาด|ไม่มีถ่านไฟฉาย|สายไฟขาด', 'when the circuit is a complete loop|when the circuit has a gap|when there is no battery|when a wire is broken',
  'ไฟฟ้าไหลได้เมื่อเส้นทางต่อกันครบรอบจากขั้วหนึ่งกลับไปอีกขั้วหนึ่ง', 'Electricity flows only when the path runs all the way round from one end of the battery to the other.')
Q(T, 'วัสดุใดเป็นตัวนำไฟฟ้า', 'Which material lets electricity flow through it?', 'ทองแดง|ยาง|พลาสติก|ไม้แห้ง', 'copper|rubber|plastic|dry wood',
  'โลหะเป็นตัวนำไฟฟ้า ทองแดงนำไฟฟ้าได้ดีมาก จึงใช้ทำไส้ในของสายไฟ', 'Metals carry electricity. Copper does it very well, so it is used inside wires.')
Q(T, 'วัสดุใดเป็นฉนวนไฟฟ้า', 'Which material stops electricity flowing?', 'ยาง|ทองแดง|เหล็ก|อะลูมิเนียม', 'rubber|copper|iron|aluminium',
  'ฉนวนคือวัสดุที่ไฟฟ้าไหลผ่านไม่ได้ เช่น ยาง พลาสติก และแก้ว', 'An insulator is a material electricity cannot pass through, such as rubber, plastic and glass.')
Q(T, 'ทำไมสายไฟจึงหุ้มด้วยพลาสติก', 'Why are wires covered in plastic?', 'กันไฟฟ้ารั่วและไฟดูด|ทำให้ไฟฟ้าไหลเร็วขึ้น|ให้สายไฟดูสวย|ทำให้สายไฟเบา', 'to stop electric shocks|to make electricity flow faster|to make the wire look nice|to make the wire lighter',
  'พลาสติกเป็นฉนวน ไฟฟ้าจึงไม่รั่วออกมาถึงมือเรา', 'Plastic is an insulator, so the electricity cannot leak out to our hands.')
Q(T, 'สวิตช์ทำหน้าที่อะไรในวงจรไฟฟ้า', 'What does a switch do in a circuit?', 'เปิดและปิดวงจร|ผลิตไฟฟ้า|เก็บไฟฟ้า|ทำให้สายไฟร้อน', 'it opens and closes the circuit|it makes electricity|it stores electricity|it heats the wire',
  'สวิตช์ต่อหรือตัดเส้นทางของไฟฟ้า เมื่อเส้นทางขาด ไฟฟ้าหยุดไหล หลอดไฟจึงดับ', 'A switch joins or breaks the path. When the path is broken the electricity stops and the light goes out.')
Q(T, 'ถ่านไฟฉายเปลี่ยนพลังงานใดเป็นพลังงานไฟฟ้า', 'Which energy does a battery turn into electricity?', 'พลังงานเคมี|พลังงานแสง|พลังงานลม|พลังงานเสียง', 'chemical energy|light energy|wind energy|sound energy',
  'ในถ่านมีสารเคมีที่ทำปฏิกิริยากันแล้วให้ไฟฟ้า เมื่อสารเคมีหมด ถ่านก็หมด', 'Chemicals inside a battery react to give electricity. When they are used up, the battery is flat.')
Q(T, 'หลอดไฟเปลี่ยนพลังงานไฟฟ้าเป็นพลังงานใดที่เรานำมาใช้', 'A lamp turns electricity into which useful energy?', 'พลังงานแสง|พลังงานเสียง|พลังงานเคมี|พลังงานลม', 'light energy|sound energy|chemical energy|wind energy',
  'หลอดไฟให้แสงสว่าง และมีความร้อนเกิดขึ้นด้วยเล็กน้อย', 'A lamp gives out light, along with a little heat.')
Q(T, 'ข้อใดเป็นการใช้ไฟฟ้าอย่างปลอดภัย', 'Which is a safe way to use electricity?', 'เช็ดมือให้แห้งก่อนจับปลั๊ก|จับปลั๊กตอนมือเปียก|เอานิ้วแหย่เต้ารับ|ดึงสายไฟแรง ๆ', 'dry your hands before touching a plug|touch a plug with wet hands|put a finger in a socket|pull hard on the wire',
  'น้ำที่ใช้ในบ้านนำไฟฟ้าได้ มือเปียกจึงเสี่ยงถูกไฟดูด', 'Water in the home carries electricity, so wet hands can give you a shock.')
Q(T, 'ถูลูกโป่งกับผมแห้ง แล้วลูกโป่งดูดเส้นผมได้ เพราะอะไร', 'Rub a balloon on dry hair and it pulls the hair up. Why?', 'เกิดไฟฟ้าสถิต|ลูกโป่งกลายเป็นแม่เหล็ก|ผมเปียกจึงเหนียว|ลมในลูกโป่งดูดไว้', 'static electricity|the balloon becomes a magnet|the hair is wet and sticky|the air inside pulls it',
  'การถูทำให้ประจุไฟฟ้าย้ายจากผมไปยังลูกโป่ง ประจุต่างชนิดกันจึงดูดกัน', 'Rubbing moves electric charge from the hair to the balloon, and opposite charges pull together.')

# ---------------------------------------------------------------- โลกของเรา (14)
T = 'earth'
Q(T, 'ชั้นหินแข็งนอกสุดของโลกที่เราอาศัยอยู่เรียกว่าอะไร', 'What is the hard, rocky outer layer of the Earth called?', 'เปลือกโลก|แก่นโลก|เนื้อโลก|แมกมา', 'the crust|the core|the mantle|magma',
  'โลกมี 3 ชั้นหลัก คือ เปลือกโลก เนื้อโลก และแก่นโลก เราอยู่บนชั้นที่บางที่สุด', 'The Earth has 3 main layers: crust, mantle and core. We live on the thinnest one.')
Q(T, 'ชั้นในสุดตรงใจกลางโลกเรียกว่าอะไร', 'What is the innermost layer at the centre of the Earth called?', 'แก่นโลก|เปลือกโลก|เนื้อโลก|ชั้นดิน', 'the core|the crust|the mantle|the soil',
  'แก่นโลกอยู่ลึกที่สุดและร้อนจัด ประกอบด้วยเหล็กและนิกเกิลเป็นส่วนใหญ่', 'The core is the deepest and hottest part. It is mostly iron and nickel.')
Q(T, 'แผ่นดินไหวส่วนใหญ่เกิดจากอะไร', 'What causes most earthquakes?', 'แผ่นเปลือกโลกเคลื่อนที่|ลมพัดแรง|ฝนตกหนัก|น้ำขึ้นน้ำลง', 'plates of the crust moving|strong wind|heavy rain|the tides',
  'เปลือกโลกแตกเป็นแผ่นใหญ่หลายแผ่นที่ขยับช้า ๆ เมื่อแผ่นเลื่อนกะทันหัน พื้นดินจึงสั่น', 'The crust is broken into huge plates that move slowly. When they slip suddenly, the ground shakes.')
Q(T, 'หินหนืดร้อนที่ยังอยู่ใต้เปลือกโลกเรียกว่าอะไร', 'What is hot, melted rock called while it is still under the ground?', 'แมกมา|ลาวา|ถ่านหิน|โคลน', 'magma|lava|coal|mud',
  'อยู่ใต้ดินเรียกว่าแมกมา เมื่อไหลออกมาบนผิวโลกจึงเรียกว่าลาวา', 'Underground it is magma. Once it flows out onto the surface it is called lava.')
Q(T, 'หินแบ่งเป็นกี่ประเภทใหญ่', 'How many main types of rock are there?', '3 ประเภท|2 ประเภท|5 ประเภท|7 ประเภท', '3 types|2 types|5 types|7 types',
  'มี 3 ประเภท คือ หินอัคนี หินตะกอน และหินแปร', 'There are 3: igneous, sedimentary and metamorphic rock.')
Q(T, 'หินที่เกิดจากแมกมาหรือลาวาเย็นตัวเรียกว่าอะไร', 'What is rock made from cooled magma or lava called?', 'หินอัคนี|หินตะกอน|หินแปร|หินทราย', 'igneous rock|sedimentary rock|metamorphic rock|sandstone',
  'หินอัคนีเกิดจากหินหนืดเย็นตัวแล้วแข็ง เช่น หินแกรนิตและหินบะซอลต์', 'Igneous rock forms when melted rock cools and hardens, like granite and basalt.')
Q(T, 'ซากดึกดำบรรพ์ (ฟอสซิล) มักพบในหินประเภทใด', 'In which type of rock are fossils usually found?', 'หินตะกอน|หินอัคนี|หินแปร|แมกมา', 'sedimentary rock|igneous rock|metamorphic rock|magma',
  'หินตะกอนเกิดจากตะกอนทับถมเป็นชั้น ๆ ซากพืชซากสัตว์ที่ถูกฝังจึงคงรูปอยู่ได้', 'Sedimentary rock builds up in layers of mud and sand, so buried plants and animals can keep their shape.')
Q(T, 'ดินเกิดจากอะไร', 'What is soil made from?', 'หินผุพังผสมกับซากพืชซากสัตว์|ฝนที่แข็งตัว|ลาวาที่ยังร้อน|ทรายจากอวกาศ', 'worn rock mixed with rotted plants|frozen rain|hot lava|sand from space',
  'หินค่อย ๆ ผุพังเป็นเม็ดเล็ก ๆ แล้วผสมกับซากพืชซากสัตว์ที่เน่าเปื่อย ใช้เวลานานมาก', 'Rock slowly breaks into tiny grains and mixes with rotted plants and animals. It takes a very long time.')
Q(T, 'น้ำบนโลกส่วนใหญ่เป็นน้ำชนิดใด', 'What kind of water is most of the water on Earth?', 'น้ำเค็ม|น้ำจืด|น้ำแข็ง|น้ำบาดาล', 'salt water|fresh water|ice|groundwater',
  'น้ำราว 97 ใน 100 ส่วนเป็นน้ำเค็มในทะเลและมหาสมุทร น้ำจืดมีน้อยมาก จึงต้องใช้อย่างประหยัด', 'About 97 parts in 100 are salt water in the seas. Fresh water is scarce, so we must not waste it.')
Q(T, 'พื้นผิวโลกมีน้ำปกคลุมประมาณเท่าใด', 'About how much of the Earth\'s surface is covered by water?', 'ราว 70%|ราว 30%|ราว 50%|ราว 90%', 'about 70%|about 30%|about 50%|about 90%',
  'น้ำปกคลุมผิวโลกราว 7 ใน 10 ส่วน โลกจึงดูเป็นสีน้ำเงินเมื่อมองจากอวกาศ', 'Water covers about 7 tenths of the surface, which is why Earth looks blue from space.')
Q(T, 'ทวีปใดเล็กที่สุดในโลก', 'Which is the smallest continent?', 'ออสเตรเลีย|ยุโรป|แอนตาร์กติกา|อเมริกาใต้', 'Australia|Europe|Antarctica|South America',
  'โลกมี 7 ทวีป ทวีปออสเตรเลียมีพื้นที่น้อยที่สุด และทวีปเอเชียมีพื้นที่มากที่สุด', 'Of the 7 continents, Australia has the least land and Asia has the most.')
Q(T, 'เส้นสมมุติที่แบ่งโลกเป็นซีกโลกเหนือและซีกโลกใต้เรียกว่าอะไร', 'What is the imaginary line that divides the Earth into north and south halves?', 'เส้นศูนย์สูตร|เส้นเมริเดียน|เส้นขอบฟ้า|แกนโลก', 'the Equator|a meridian|the horizon|Earth\'s axis',
  'เส้นศูนย์สูตรลากรอบกลางโลก บริเวณใกล้เส้นนี้อากาศร้อนตลอดปี', 'The Equator runs round the middle of the Earth. Places near it are hot all year.')
Q(T, 'เข็มทิศใช้บอกอะไร', 'What does a compass tell you?', 'ทิศ|เวลา|อุณหภูมิ|น้ำหนัก', 'direction|time|temperature|weight',
  'เข็มของเข็มทิศเป็นแม่เหล็ก จึงชี้ไปทางทิศเหนือเสมอ ทำให้รู้ทิศอื่นได้ด้วย', 'A compass needle is a magnet and always points north, so you can work out the other directions.')
Q(T, 'การปลูกต้นไม้บนภูเขาช่วยป้องกันอะไร', 'What does planting trees on a hillside help to prevent?', 'ดินถล่ม|แผ่นดินไหว|ภูเขาไฟระเบิด|สุริยุปราคา', 'landslides|earthquakes|volcanic eruptions|eclipses',
  'รากไม้ยึดดินไว้ และใบไม้ช่วยชะลอน้ำฝน ดินจึงไม่ถูกน้ำพัดไปง่าย', 'Roots hold the soil and leaves slow the rain, so the soil is not easily washed away.')

# ---------------------------------------------------------------- อวกาศ (14)
T = 'space'
Q(T, 'ดาวฤกษ์ที่อยู่ใกล้โลกที่สุดคือดวงใด', 'Which star is nearest to Earth?', 'ดวงอาทิตย์|ดวงจันทร์|ดาวศุกร์|ดาวเหนือ', 'the Sun|the Moon|Venus|the North Star',
  'ดวงอาทิตย์เป็นดาวฤกษ์ คือก้อนแก๊สร้อนที่ส่องแสงได้เอง ส่วนดวงจันทร์และดาวศุกร์ไม่ใช่ดาวฤกษ์', 'The Sun is a star, a ball of hot gas that makes its own light. The Moon and Venus are not stars.')
Q(T, 'โลกหมุนรอบตัวเองครบ 1 รอบใช้เวลาเท่าใด', 'How long does the Earth take to spin round once?', '24 ชั่วโมง|12 ชั่วโมง|7 วัน|365 วัน', '24 hours|12 hours|7 days|365 days',
  'โลกหมุนรอบตัวเอง 1 รอบคือ 1 วัน ทำให้เกิดกลางวันและกลางคืน', 'One spin is one day. It gives us day and night.')
Q(T, 'โลกโคจรรอบดวงอาทิตย์ครบ 1 รอบใช้เวลาประมาณเท่าใด', 'About how long does the Earth take to go once round the Sun?', '1 ปี|1 วัน|1 เดือน|10 ปี', '1 year|1 day|1 month|10 years',
  'โลกใช้เวลาราว 365 วันกับอีก 6 ชั่วโมง จึงมีปีที่เดือนกุมภาพันธ์มี 29 วันทุก 4 ปี', 'It takes about 365 days and 6 hours, which is why February has 29 days every fourth year.')
Q(T, 'ดวงจันทร์โคจรรอบโลกครบ 1 รอบใช้เวลาประมาณเท่าใด', 'About how long does the Moon take to go once round the Earth?', 'ประมาณ 1 เดือน|ประมาณ 1 วัน|ประมาณ 1 สัปดาห์|ประมาณ 1 ปี', 'about 1 month|about 1 day|about 1 week|about 1 year',
  'ดวงจันทร์โคจรรอบโลกราว 27 วัน คำว่า "เดือน" จึงมาจากดวงจันทร์', 'The Moon takes about 27 days. The word "month" comes from "moon".')
Q(T, 'ดาวเคราะห์ดวงใดอยู่ไกลดวงอาทิตย์ที่สุด', 'Which planet is furthest from the Sun?', 'ดาวเนปจูน|ดาวยูเรนัส|ดาวเสาร์|ดาวพฤหัสบดี', 'Neptune|Uranus|Saturn|Jupiter',
  'ดาวเนปจูนเป็นดาวเคราะห์ดวงที่ 8 และอยู่ไกลที่สุด ส่วนดาวพลูโตถูกจัดเป็นดาวเคราะห์แคระตั้งแต่ พ.ศ. 2549', 'Neptune is the 8th and furthest planet. Pluto has been classed as a dwarf planet since 2006.')
Q(T, 'ดาวเคราะห์ดวงใดร้อนที่สุดในระบบสุริยะ', 'Which planet is the hottest in the Solar System?', 'ดาวศุกร์|ดาวพุธ|ดาวอังคาร|โลก', 'Venus|Mercury|Mars|Earth',
  'ดาวศุกร์มีบรรยากาศหนาที่กักความร้อนไว้ จึงร้อนกว่าดาวพุธแม้จะอยู่ไกลดวงอาทิตย์กว่า', 'Venus has a thick blanket of gas that traps heat, so it is hotter than Mercury even though it is further from the Sun.')
Q(T, 'โลกเป็นดาวเคราะห์ลำดับที่เท่าใดนับจากดวงอาทิตย์', 'Which number planet from the Sun is the Earth?', 'ลำดับที่ 3|ลำดับที่ 1|ลำดับที่ 2|ลำดับที่ 4', 'the 3rd|the 1st|the 2nd|the 4th',
  'เรียงจากดวงอาทิตย์: ดาวพุธ ดาวศุกร์ โลก ดาวอังคาร', 'In order from the Sun: Mercury, Venus, Earth, Mars.')
Q(T, 'ฤดูกาลบนโลกเกิดจากอะไร', 'What causes the seasons on Earth?', 'แกนโลกเอียงขณะโคจรรอบดวงอาทิตย์|โลกเข้าใกล้และออกห่างดวงอาทิตย์|ดวงจันทร์บังแสงอาทิตย์|เมฆหนาขึ้นในบางเดือน', 'Earth\'s tilted axis as it orbits the Sun|Earth moving nearer the Sun|the Moon blocking sunlight|thicker clouds in some months',
  'แกนโลกเอียง ซีกโลกที่หันเข้าหาดวงอาทิตย์จึงได้รับแสงมากกว่าและเป็นฤดูร้อน อีกซีกหนึ่งเป็นฤดูหนาว', 'The Earth is tilted. The half leaning towards the Sun gets more light and has summer while the other half has winter.')
Q(T, 'สุริยุปราคาเกิดขึ้นเมื่อใด', 'When does an eclipse of the Sun happen?', 'ดวงจันทร์อยู่ระหว่างดวงอาทิตย์กับโลก|โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์|เมฆบังดวงอาทิตย์|ดวงอาทิตย์ดับชั่วคราว', 'the Moon is between the Sun and Earth|Earth is between the Sun and the Moon|clouds cover the Sun|the Sun switches off',
  'ดวงจันทร์บังแสงอาทิตย์ เงาของดวงจันทร์จึงตกลงบนโลก ห้ามมองดวงอาทิตย์ด้วยตาเปล่า', 'The Moon blocks the Sun and its shadow falls on Earth. Never look at the Sun without proper protection.')
Q(T, 'จันทรุปราคาเกิดขึ้นเมื่อใด', 'When does an eclipse of the Moon happen?', 'โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์|ดวงจันทร์อยู่ระหว่างดวงอาทิตย์กับโลก|ดวงจันทร์เข้าใกล้ดาวอังคาร|ดวงจันทร์หยุดหมุน', 'Earth is between the Sun and the Moon|the Moon is between the Sun and Earth|the Moon goes near Mars|the Moon stops turning',
  'โลกบังแสงอาทิตย์ เงาของโลกจึงตกลงบนดวงจันทร์ ทำให้ดวงจันทร์มืดลง', 'The Earth blocks the sunlight and its shadow falls on the Moon, making the Moon go dark.')
Q(T, 'กาแล็กซีที่ระบบสุริยะของเราอยู่มีชื่อว่าอะไร', 'What is the name of the galaxy our Solar System is in?', 'ทางช้างเผือก|แอนดรอเมดา|ดาวเหนือ|กลุ่มดาวลูกไก่', 'the Milky Way|Andromeda|the North Star|the Pleiades',
  'กาแล็กซีทางช้างเผือกมีดาวฤกษ์หลายแสนล้านดวง ดวงอาทิตย์เป็นเพียงดวงหนึ่งในนั้น', 'The Milky Way holds hundreds of billions of stars. The Sun is just one of them.')
Q(T, 'ทำไมเราเห็นดวงจันทร์เปลี่ยนรูปร่างไปในแต่ละคืน', 'Why does the Moon seem to change shape from night to night?', 'เห็นด้านที่รับแสงอาทิตย์ไม่เท่ากัน|ดวงจันทร์หดและขยาย|เมฆบังอยู่เสมอ|เงาโลกบังทุกคืน', 'we see different amounts of its sunlit side|the Moon shrinks and grows|clouds always hide it|Earth\'s shadow covers it every night',
  'ดวงจันทร์สว่างครึ่งดวงเสมอ แต่เมื่อมันโคจรรอบโลก เราเห็นด้านสว่างได้มากน้อยต่างกัน', 'Half of the Moon is always lit. As it goes round the Earth we see more or less of that bright half.')
Q(T, 'มนุษย์คนแรกที่เหยียบดวงจันทร์คือใคร', 'Who was the first person to walk on the Moon?', 'นีล อาร์มสตรอง|ยูริ กาการิน|บัซ อัลดริน|ไอแซก นิวตัน', 'Neil Armstrong|Yuri Gagarin|Buzz Aldrin|Isaac Newton',
  'นีล อาร์มสตรอง เหยียบดวงจันทร์ใน พ.ศ. 2512 กับยานอะพอลโล 11 ส่วนยูริ กาการิน เป็นคนแรกที่ไปอวกาศ', 'Neil Armstrong stepped onto the Moon in 1969 with Apollo 11. Yuri Gagarin was the first person in space.')
Q(T, 'ดาวหางมีลักษณะเด่นอย่างไร', 'What is special about a comet?', 'มีหางยาวเมื่อเข้าใกล้ดวงอาทิตย์|มีวงแหวนล้อมรอบ|ส่องแสงเองเหมือนดาวฤกษ์|อยู่นิ่งไม่เคลื่อนที่', 'it grows a long tail near the Sun|it has rings|it shines like a star|it never moves',
  'ดาวหางเป็นก้อนน้ำแข็งปนฝุ่น เมื่อเข้าใกล้ดวงอาทิตย์ น้ำแข็งกลายเป็นแก๊สพุ่งเป็นหางยาว', 'A comet is a lump of ice and dust. Near the Sun the ice turns to gas and streams out as a long tail.')

# ---------------------------------------------------------------- ลมฟ้าอากาศ (10)
T = 'weather'
Q(T, 'เมฆเกิดจากอะไร', 'What are clouds made from?', 'ไอน้ำควบแน่นเป็นหยดน้ำเล็ก ๆ|ควันจากโรงงาน|ไอร้อนจากดวงอาทิตย์|ฝุ่นจากอวกาศ', 'water vapour condensed into tiny drops|factory smoke|hot steam from the Sun|dust from space',
  'ไอน้ำลอยขึ้นสูง เมื่อเจออากาศเย็นจึงควบแน่นเป็นหยดน้ำเล็กมากจำนวนมหาศาล รวมกันเป็นเมฆ', 'Water vapour rises, meets cold air and condenses into countless tiny drops that gather as a cloud.')
Q(T, 'พลังงานที่ทำให้น้ำระเหยในวัฏจักรของน้ำมาจากไหน', 'Where does the energy that evaporates water in the water cycle come from?', 'ดวงอาทิตย์|ดวงจันทร์|แก่นโลก|ดวงดาว', 'the Sun|the Moon|the Earth\'s core|the stars',
  'ความร้อนจากดวงอาทิตย์ทำให้น้ำในทะเล แม่น้ำ และพื้นดิน ระเหยเป็นไอน้ำ', 'Heat from the Sun turns water in seas, rivers and the ground into water vapour.')
Q(T, 'เครื่องมือใดใช้วัดอุณหภูมิ', 'Which tool measures temperature?', 'เทอร์โมมิเตอร์|บารอมิเตอร์|เข็มทิศ|ไม้บรรทัด', 'a thermometer|a barometer|a compass|a ruler',
  'เทอร์โมมิเตอร์บอกความร้อนเย็นเป็นองศา ส่วนบารอมิเตอร์ใช้วัดความกดอากาศ', 'A thermometer shows how hot or cold something is in degrees. A barometer measures air pressure.')
Q(T, 'ศรลมใช้บอกอะไร', 'What does a wind vane show?', 'ทิศทางลม|อุณหภูมิ|ปริมาณฝน|ความชื้น', 'wind direction|temperature|rainfall|humidity',
  'หัวลูกศรของศรลมจะชี้ไปทางทิศที่ลมพัดมา', 'The arrow of a wind vane points to where the wind is coming from.')
Q(T, 'ลมคืออะไร', 'What is wind?', 'อากาศที่เคลื่อนที่|เมฆที่ตกลงมา|เสียงของต้นไม้|ไอน้ำร้อน', 'moving air|falling cloud|the sound of trees|hot steam',
  'อากาศร้อนลอยตัวขึ้น อากาศเย็นจึงไหลเข้ามาแทนที่ การเคลื่อนที่ของอากาศนี้คือลม', 'Warm air rises and cooler air flows in to take its place. That moving air is wind.')
Q(T, 'ลูกเห็บคืออะไร', 'What is hail?', 'ก้อนน้ำแข็งที่ตกจากเมฆ|ฝนที่ร้อนจัด|หิมะที่ละลาย|ฝุ่นที่แข็งตัว', 'lumps of ice falling from clouds|very hot rain|melted snow|hardened dust',
  'ในเมฆพายุฝนฟ้าคะนอง หยดน้ำถูกลมพัดขึ้นไปสูงจนแข็งเป็นก้อนน้ำแข็ง แล้วตกลงมา', 'Inside a storm cloud, drops are blown high up, freeze into balls of ice and fall.')
Q(T, 'โดยทั่วไปประเทศไทยมีกี่ฤดู', 'How many seasons does Thailand usually have?', '3 ฤดู|2 ฤดู|4 ฤดู|5 ฤดู', '3|2|4|5',
  'มี 3 ฤดู คือ ฤดูร้อน ฤดูฝน และฤดูหนาว (ภาคใต้มีฝนเกือบทั้งปี จึงมักนับเป็น 2 ฤดู)', 'There are 3: hot, rainy and cool. (The south has rain most of the year, so people there often count 2.)')
Q(T, 'ลมมรสุมตะวันตกเฉียงใต้นำอะไรมาสู่ประเทศไทย', 'What does the south-west monsoon bring to Thailand?', 'ฝน|ความหนาวเย็น|หิมะ|พายุทราย', 'rain|cold weather|snow|sandstorms',
  'ลมนี้พัดผ่านมหาสมุทรอินเดีย จึงพาความชื้นมาตกเป็นฝนในฤดูฝน', 'This wind blows across the Indian Ocean and carries moisture that falls as rain in the rainy season.')
Q(T, 'ฟ้าผ่าคืออะไร', 'What is lightning?', 'ไฟฟ้าที่ปล่อยจากเมฆ|เสียงของเมฆชนกัน|แสงจากดวงอาทิตย์|ดาวตก', 'electricity jumping from a cloud|the sound of clouds bumping|light from the Sun|a shooting star',
  'ในเมฆฝนมีประจุไฟฟ้าสะสมมาก เมื่อมากพอจึงปล่อยออกมาเป็นประกายไฟขนาดใหญ่', 'Electric charge builds up in a storm cloud. When there is enough, it jumps as a giant spark.')
Q(T, 'เมื่อมีฟ้าร้องฟ้าผ่า ควรทำอย่างไร', 'What should you do in a thunderstorm?', 'หลบเข้าในอาคาร|ยืนใต้ต้นไม้สูง|ลงว่ายน้ำ|ชูร่มกลางสนาม', 'go inside a building|stand under a tall tree|go swimming|hold up an umbrella in a field',
  'ฟ้าผ่ามักลงที่สูงและที่โล่ง รวมถึงผิวน้ำ ในอาคารจึงปลอดภัยที่สุด', 'Lightning tends to strike tall things, open ground and water, so indoors is the safest place.')

# ---------------------------------------------------------------- ประเทศไทย (10)
T = 'thailand'
Q(T, 'ก่อนกรุงเทพมหานคร เมืองหลวงของไทยคือที่ใด', 'Which city was the Thai capital just before Bangkok?', 'กรุงธนบุรี|กรุงศรีอยุธยา|กรุงสุโขทัย|เชียงใหม่', 'Thonburi|Ayutthaya|Sukhothai|Chiang Mai',
  'เรียงตามลำดับเวลา: กรุงสุโขทัย กรุงศรีอยุธยา กรุงธนบุรี แล้วจึงเป็นกรุงเทพมหานครตั้งแต่ พ.ศ. 2325', 'In order of time: Sukhothai, Ayutthaya, Thonburi, and then Bangkok from 1782.')
Q(T, 'ประเทศไทยมีกี่จังหวัด เมื่อนับรวมกรุงเทพมหานคร', 'How many provinces does Thailand have, counting Bangkok?', '77|55|67|87', '77|55|67|87',
  'มี 76 จังหวัด กับกรุงเทพมหานครซึ่งเป็นเขตปกครองพิเศษ รวมเป็น 77', 'There are 76 provinces plus Bangkok, a special city, making 77.')
Q(T, 'ชายฝั่งด้านตะวันตกของภาคใต้ของไทยติดกับทะเลใด', 'Which sea lies along the west coast of southern Thailand?', 'ทะเลอันดามัน|อ่าวไทย|ทะเลแดง|ทะเลญี่ปุ่น', 'the Andaman Sea|the Gulf of Thailand|the Red Sea|the Sea of Japan',
  'ภาคใต้มีทะเลสองฝั่ง ฝั่งตะวันตกคือทะเลอันดามัน ฝั่งตะวันออกคืออ่าวไทย', 'The south has sea on both sides: the Andaman Sea to the west and the Gulf of Thailand to the east.')
Q(T, 'สัตว์ประจำชาติไทยคือสัตว์ใด', 'What is the national animal of Thailand?', 'ช้างไทย|เสือ|ควาย|ลิง', 'the Thai elephant|the tiger|the buffalo|the monkey',
  'ช้างผูกพันกับคนไทยมาตั้งแต่อดีต ทั้งในการทำงานและในประวัติศาสตร์ วันที่ 13 มีนาคมเป็นวันช้างไทย', 'Elephants have been part of Thai work and history for centuries. 13 March is Thai Elephant Day.')
Q(T, 'ดอกไม้ประจำชาติไทยคือดอกอะไร', 'What is the national flower of Thailand?', 'ดอกราชพฤกษ์ (ดอกคูน)|ดอกบัว|ดอกกุหลาบ|ดอกมะลิ', 'the golden shower flower|the lotus|the rose|jasmine',
  'ดอกราชพฤกษ์มีสีเหลืองทอง ออกดอกเป็นพวงห้อยในฤดูร้อน', 'The golden shower tree has bright yellow flowers that hang in bunches in the hot season.')
Q(T, 'ธงชาติไทยมีกี่สี', 'How many colours are on the Thai flag?', '3 สี|2 สี|4 สี|5 สี', '3|2|4|5',
  'ธงไตรรงค์มี 3 สี คือ แดง ขาว และน้ำเงิน เรียงเป็น 5 แถบ', 'The flag has 3 colours, red, white and blue, in 5 stripes.')
Q(T, 'จังหวัดใดอยู่เหนือสุดของประเทศไทย', 'Which province is the furthest north in Thailand?', 'เชียงราย|เชียงใหม่|แม่ฮ่องสอน|น่าน', 'Chiang Rai|Chiang Mai|Mae Hong Son|Nan',
  'จุดเหนือสุดของประเทศไทยอยู่ที่อำเภอแม่สาย จังหวัดเชียงราย', 'The northernmost point of Thailand is in Mae Sai district, Chiang Rai.')
Q(T, 'เกาะที่ใหญ่ที่สุดของประเทศไทยคือเกาะใด', 'Which is the biggest island in Thailand?', 'ภูเก็ต|เกาะสมุย|เกาะช้าง|เกาะเต่า', 'Phuket|Ko Samui|Ko Chang|Ko Tao',
  'ภูเก็ตเป็นเกาะที่ใหญ่ที่สุด และเป็นจังหวัดเดียวของไทยที่เป็นเกาะ', 'Phuket is the biggest island and the only Thai province that is an island.')
Q(T, 'แม่น้ำใดเป็นพรมแดนระหว่างไทยกับลาวเป็นระยะทางยาว', 'Which river forms a long stretch of the border between Thailand and Laos?', 'แม่น้ำโขง|แม่น้ำเจ้าพระยา|แม่น้ำปิง|แม่น้ำแม่กลอง', 'the Mekong|the Chao Phraya|the Ping|the Mae Klong',
  'แม่น้ำโขงไหลผ่านภาคเหนือและภาคตะวันออกเฉียงเหนือ กั้นระหว่างไทยกับลาว', 'The Mekong runs along the north and north-east of Thailand, between Thailand and Laos.')
Q(T, 'สกุลเงินของประเทศไทยคืออะไร', 'What is the money of Thailand called?', 'บาท|ดอลลาร์|เยน|หยวน', 'the baht|the dollar|the yen|the yuan',
  '1 บาทเท่ากับ 100 สตางค์ ส่วนเยนเป็นเงินของญี่ปุ่น และหยวนเป็นเงินของจีน', '1 baht is 100 satang. The yen is Japan\'s money and the yuan is China\'s.')

# ---------------------------------------------------------------- โลกกว้าง (8)
T = 'world'
Q(T, 'ทวีปใดใหญ่ที่สุดในโลก', 'Which is the biggest continent?', 'เอเชีย|แอฟริกา|ยุโรป|อเมริกาเหนือ', 'Asia|Africa|Europe|North America',
  'ทวีปเอเชียมีพื้นที่มากที่สุดและมีคนอาศัยอยู่มากที่สุด', 'Asia has the most land and the most people.')
Q(T, 'ทะเลทรายร้อนที่ใหญ่ที่สุดในโลกคือทะเลทรายใด', 'Which is the biggest hot desert in the world?', 'สะฮารา|โกบี|คาลาฮารี|อาตากามา', 'the Sahara|the Gobi|the Kalahari|the Atacama',
  'ทะเลทรายสะฮาราอยู่ทางเหนือของทวีปแอฟริกา กว้างใหญ่เกือบเท่าประเทศจีน', 'The Sahara is in the north of Africa and is almost as big as China.')
Q(T, 'พีระมิดแห่งกีซาอยู่ในประเทศใด', 'Which country are the pyramids of Giza in?', 'อียิปต์|เม็กซิโก|อินเดีย|กรีซ', 'Egypt|Mexico|India|Greece',
  'ชาวอียิปต์โบราณสร้างพีระมิดเป็นสุสานของกษัตริย์เมื่อราว 4,500 ปีก่อน', 'The ancient Egyptians built the pyramids as tombs for their kings about 4,500 years ago.')
Q(T, 'หอไอเฟลอยู่ในเมืองใด', 'Which city is the Eiffel Tower in?', 'ปารีส|ลอนดอน|โรม|นิวยอร์ก', 'Paris|London|Rome|New York',
  'หอไอเฟลเป็นหอเหล็กสูงในกรุงปารีส เมืองหลวงของประเทศฝรั่งเศส', 'The Eiffel Tower is a tall iron tower in Paris, the capital of France.')
Q(T, 'ประเทศใดมีพรมแดนติดกับประเทศไทย', 'Which country shares a border with Thailand?', 'ลาว|เวียดนาม|อินโดนีเซีย|ฟิลิปปินส์', 'Laos|Vietnam|Indonesia|the Philippines',
  'ไทยมีพรมแดนติดกับ 4 ประเทศ คือ เมียนมา ลาว กัมพูชา และมาเลเซีย', 'Thailand borders 4 countries: Myanmar, Laos, Cambodia and Malaysia.')
Q(T, 'ขั้วโลกใต้อยู่ในทวีปใด', 'Which continent is the South Pole in?', 'แอนตาร์กติกา|ออสเตรเลีย|อเมริกาใต้|แอฟริกา', 'Antarctica|Australia|South America|Africa',
  'ทวีปแอนตาร์กติกาปกคลุมด้วยน้ำแข็งหนาและหนาวที่สุดในโลก', 'Antarctica is covered in thick ice and is the coldest place on Earth.')
Q(T, 'เพนกวินในธรรมชาติเกือบทั้งหมดอาศัยอยู่ที่ใด', 'Where do almost all wild penguins live?', 'ซีกโลกใต้|ขั้วโลกเหนือ|ทวีปยุโรป|ทวีปเอเชีย', 'the southern half of the world|the North Pole|Europe|Asia',
  'เพนกวินอยู่ในซีกโลกใต้ ส่วนหมีขั้วโลกอยู่แถบขั้วโลกเหนือ ในธรรมชาติจึงไม่เคยพบกัน', 'Penguins live in the south and polar bears in the far north, so they never meet in the wild.')
Q(T, 'ภาษาใดมีคนใช้เป็นภาษาแม่มากที่สุดในโลก', 'Which language has the most native speakers in the world?', 'ภาษาจีนกลาง|ภาษาอังกฤษ|ภาษาสเปน|ภาษาฮินดี', 'Mandarin Chinese|English|Spanish|Hindi',
  'คนที่พูดภาษาจีนกลางมาตั้งแต่เกิดมีมากที่สุด ส่วนภาษาอังกฤษมีคนเรียนเป็นภาษาที่สองมากที่สุด', 'Mandarin has the most people who speak it from birth. English is the most widely learned second language.')

# ---------------------------------------------------------------- สุขภาพและความปลอดภัย (7)
T = 'health'
Q(T, 'ควรฟอกสบู่ล้างมือนานอย่างน้อยเท่าใด', 'How long should you wash your hands with soap, at least?', '20 วินาที|2 วินาที|5 วินาที|8 วินาที', '20 seconds|2 seconds|5 seconds|8 seconds',
  'ต้องถูให้ทั่วฝ่ามือ หลังมือ ซอกนิ้ว และเล็บ อย่างน้อย 20 วินาที เชื้อโรคจึงจะหลุดออก', 'Scrub palms, backs, between the fingers and the nails for at least 20 seconds to lift the germs off.')
Q(T, 'เด็กวัยประถมควรนอนวันละประมาณกี่ชั่วโมง', 'About how many hours should a primary-school child sleep each night?', 'ประมาณ 9–11 ชั่วโมง|ประมาณ 3–4 ชั่วโมง|ประมาณ 5–6 ชั่วโมง|ประมาณ 15–16 ชั่วโมง', 'about 9–11 hours|about 3–4 hours|about 5–6 hours|about 15–16 hours',
  'ร่างกายเติบโตและสมองจัดเก็บสิ่งที่เรียนมาในขณะหลับ เด็กจึงต้องนอนมากกว่าผู้ใหญ่', 'The body grows and the brain stores what it learned during sleep, so children need more than adults.')
Q(T, 'ร่างกายสร้างวิตามินใดได้เองเมื่อผิวหนังได้รับแสงแดด', 'Which vitamin can the body make when sunlight falls on the skin?', 'วิตามินดี|วิตามินเอ|วิตามินซี|วิตามินบี', 'vitamin D|vitamin A|vitamin C|vitamin B',
  'วิตามินดีช่วยให้ร่างกายดูดซึมแคลเซียม กระดูกจึงแข็งแรง', 'Vitamin D helps the body take in calcium, which keeps bones strong.')
Q(T, 'วิตามินซีพบมากในอาหารใด', 'Which food is rich in vitamin C?', 'ส้มและฝรั่ง|ข้าวขาว|เนื้อหมู|น้ำมันพืช', 'oranges and guavas|white rice|pork|cooking oil',
  'ผลไม้สดหลายชนิดมีวิตามินซีสูง ช่วยให้เหงือกและผิวหนังแข็งแรง และแผลหายเร็ว', 'Many fresh fruits are rich in vitamin C. It keeps gums and skin healthy and helps cuts heal.')
Q(T, 'เมื่อเกิดไฟไหม้ในอาคารและมีควันมาก ควรทำอย่างไร', 'What should you do in a building fire with a lot of smoke?', 'ก้มตัวต่ำและออกทางหนีไฟ|ใช้ลิฟต์|ซ่อนใต้เตียง|วิ่งกลับไปเอาของ', 'stay low and leave by the fire exit|use the lift|hide under the bed|go back for your things',
  'ควันร้อนลอยขึ้นสูง อากาศใกล้พื้นจึงหายใจได้ดีกว่า และห้ามใช้ลิฟต์เพราะอาจค้าง', 'Hot smoke rises, so the air near the floor is easier to breathe. Never use a lift, as it may get stuck.')
Q(T, 'ข้ามถนนอย่างไรจึงปลอดภัย', 'What is the safe way to cross a road?', 'ข้ามทางม้าลายและมองรถทั้งสองทาง|วิ่งข้ามเร็ว ๆ|ข้ามจากหลังรถที่จอดอยู่|ดูโทรศัพท์ขณะข้าม', 'use the crossing and look both ways|run across quickly|cross from behind a parked car|look at your phone while crossing',
  'หยุด มองขวา มองซ้าย แล้วมองขวาอีกครั้ง เมื่อไม่มีรถจึงเดินข้ามตรงทางม้าลาย', 'Stop, look right, look left, then look right again. Walk across on the crossing when it is clear.')
Q(T, 'น้ำแบบใดดื่มได้อย่างปลอดภัย', 'Which water is safe to drink?', 'น้ำใสไม่มีกลิ่นที่กรองหรือต้มแล้ว|น้ำขุ่นแต่เย็น|น้ำที่มีสีสวย|น้ำจากแม่น้ำโดยตรง', 'clear water that is filtered or boiled|cloudy but cold water|brightly coloured water|water straight from a river',
  'น้ำที่ดูใสอาจยังมีเชื้อโรคที่มองไม่เห็น การต้มหรือกรองช่วยกำจัดเชื้อโรค', 'Water that looks clear can still hold germs too small to see. Boiling or filtering removes them.')

assert len(ITEMS) == 165, len(ITEMS)
