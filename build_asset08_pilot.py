"""Compose the authorized two-job pilot from untouched 64px PixelLab rotations.

No API calls. No scaling/repainting of source pixels. The combo is a diagnostic
assembly, not an accepted production paperdoll. Re-run with Python + Pillow.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
DIRECTIONS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
# Manually inspected masks: full head through row 27, neck only on row 28,
# and the two long hair masses. Carrier clothes/arms/legs are excluded.
HAIR = [
    [[(8,23),(21,23),(23,31),(21,37),(21,41),(8,41)], [(42,23),(55,23),(55,41),(42,41),(41,36),(40,31)]],
    [[(8,23),(21,23),(23,27),(23,35),(20,41),(8,41)], [(36,23),(50,23),(50,40),(41,40),(39,36),(40,32),(36,28)]],
    [[(15,23),(29,23),(29,32),(27,35),(28,38),(26,42),(15,42)]],
    [[(10,23),(22,23),(24,27),(23,32),(19,40),(10,40)], [(34,23),(50,23),(50,41),(43,41),(41,38),(38,35),(34,29)]],
    [[(8,23),(19,23),(22,27),(23,31),(21,36),(20,41),(8,41)], [(44,23),(55,23),(55,41),(43,41),(42,37),(40,31),(41,27)]],
    [[(15,23),(28,23),(30,28),(28,34),(26,38),(24,41),(15,41)], [(40,23),(53,23),(53,40),(43,40),(43,36),(40,33),(40,29)]],
    [[(34,23),(48,23),(48,42),(39,42),(36,39),(37,36),(33,34),(34,29)]],
    [[(13,23),(27,23),(26,29),(25,32),(24,36),(22,40),(13,40)], [(42,23),(56,23),(56,41),(45,41),(43,36),(41,32),(41,28)]],
]
NECK = [(29,33),(30,33),(31,34),(29,32),(30,33),(29,32),(26,29),(28,31)]
# Keep the outfit's neck/collar; its removable head ends above this row.
BODY_TOP = [23,23,23,23,24,23,23,23]
# Only translate the three rear bodies down one pixel to place their soles at62.
BODY_DY = [0,0,0,1,1,1,0,0]

def measure(im):
    rows=[]
    for i,d in enumerate(DIRECTIONS):
        fr=im.crop((i*64,0,(i+1)*64,64)); a=fr.getchannel('A'); b=a.getbbox()
        rows.append({'direction':d,'bbox_xyxy_exclusive':list(b),'height':b[3]-b[1],
                     'bottom_row':b[3]-1,'bbox_center_x':(b[0]+b[2]-1)/2,
                     'partial_alpha_pixels':sum(0<v<255 for v in a.get_flattened_data()),
                     'rgba_sha256':hashlib.sha256(fr.tobytes()).hexdigest()})
    return rows

def build():
    head=Image.open(ROOT/'kid-b1-pilot-hf1-raw.png').convert('RGBA')
    outfit=Image.open(ROOT/'kid-b1-pilot-of1-raw.png').convert('RGBA')
    assert head.size==outfit.size==(512,64)
    sheet=Image.new('RGBA',(512,64))
    for i in range(8):
        h=head.crop((i*64,0,(i+1)*64,64)); o=outfit.crop((i*64,0,(i+1)*64,64))
        hm=Image.new('L',(64,64)); draw=ImageDraw.Draw(hm)
        draw.rectangle((0,0,63,27),fill=255)
        draw.rectangle((NECK[i][0],28,NECK[i][1],28),fill=255)
        for polygon in HAIR[i]:draw.polygon(polygon,fill=255)
        # Both masks copy only source RGBA, never a mask colour.
        hh=Image.new('RGBA',(64,64));hh.paste(h,(0,0),hm)
        body=Image.new('RGBA',(64,64));dy=BODY_DY[i]
        body.paste(o.crop((0,BODY_TOP[i],64,64-dy)),(0,BODY_TOP[i]+dy))
        # Rear hair is behind the torso in front/side views; in rear views it
        # is visible in front of the back of the shirt.
        if i in (3,4,5):
            frame=Image.alpha_composite(body,hh)
        else:
            rear=hh.copy();rear.paste((0,0,0,0),(0,0,64,29))
            crown=hh.copy();crown.paste((0,0,0,0),(0,29,64,64))
            frame=Image.alpha_composite(Image.alpha_composite(rear,body),crown)
        sheet.paste(frame,(i*64,0))
    sheet.save(ROOT/'kid-b1-pilot-combo.png',optimize=True)
    sheet.resize((2048,256),Image.Resampling.NEAREST).save(ROOT/'kid-b1-pilot-combo-4x.png',optimize=True)
    return {'hf1':measure(head),'of1':measure(outfit),'combo':measure(sheet)}

if __name__=='__main__':
    print(json.dumps(build(),indent=2))
