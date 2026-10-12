"""6x review of all generated raw lanterns; rejected rows clearly labelled."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent
J=json.loads((R/'kid-lantern.json').read_text());out=Image.new('RGB',(1680,816),(59,69,79));draw=ImageDraw.Draw(out);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
for d,name in enumerate(J['directions']):draw.text((144+d*192+75,12),name,font=font,fill='white')
for l in J['levels']:
 n=l['level'];y=48+192*n;bad=l['status']=='rejected_size_gate';draw.text((12,y+58),f'L{n}',font=font,fill=(255,130,110) if bad else 'white')
 if bad:draw.text((12,y+90),'FAIL',font=font,fill=(255,130,110));draw.text((12,y+115),'12x23',font=font,fill=(255,130,110))
 else:draw.text((12,y+90),'PASS size',font=font,fill=(150,230,170))
 f=l.get('raw_file') or l.get('raw_review_file')
 if not f:continue
 raw=Image.open(R/f).convert('RGBA')
 for d in range(8):
  cell=raw.crop((d*32,0,d*32+32,32))
  # Approved stray cleanup appears here; originals stay in the raw files.
  if l.get('frames'):
   for x0,y0 in l['frames'][d].get('removed_stray_pixels_raw_xy',[]):cell.putpixel((x0,y0),(0,0,0,0))
  cell=cell.resize((192,192),Image.Resampling.NEAREST);out.paste(cell,(144+d*192,y),cell)
out.save(R/'kid-lantern-review-6x.png',optimize=True)
from asset_png_lossless import optimize
optimize(R/'kid-lantern-review-6x.png')
