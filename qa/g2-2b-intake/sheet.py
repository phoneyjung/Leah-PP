import sys,json,glob
sys.path.insert(0,'g22')
from fist_track import cells_from_gif, cells_from_sheet
from PIL import Image, ImageDraw, ImageFont
import numpy as np
L8=['S','SE','E','NE','N','NW','W','SW']; names={'S':'south','SE':'south-east','E':'east','NE':'north-east','N':'north','NW':'north-west','W':'west','SW':'south-west'}
F=ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf',20)
def newcells(D):
    f=[p for p in glob.glob('g22/hold8/zip/*.gif') if f'frames_{names[D]} (' in p][0]
    dx,dy=json.load(open(f'g22/hold8/m/trial-{D}.json'))['placement_dxdy']
    return cells_from_gif(f,dx,dy)
if __name__=='__main__':
    S=2; C=96
    for part,dirs in [('a',L8[:4]),('b',L8[4:])]:
        can=Image.new('RGBA',(60+6*C*S,len(dirs)*2*C*S),(40,38,56,255)); d=ImageDraw.Draw(can)
        for i,D in enumerate(dirs):
            new=newcells(D); old=cells_from_sheet('wt_pilot/c2-pilot-kid4-walk-src.png',L8.index(D),6)
            for j,(lab,cs) in enumerate([('new',new),('old',old)]):
                y=(i*2+j)*C*S; d.text((4,y+10),D,font=F,fill=(255,214,120)); d.text((4,y+40),lab,font=F,fill=(200,200,200))
                for k in range(6):
                    can.alpha_composite(Image.fromarray(cs[k]).resize((C*S,C*S),Image.NEAREST),(60+k*C*S,y))
        can.save(f'g22/hold8/sheet_{part}.png')
