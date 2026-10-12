"""Read-only trial metrics and equal-display-size comparison; no raw edits."""
from pathlib import Path
import json,hashlib,colorsys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from asset_png_lossless import optimize
R=Path(__file__).resolve().parent;D=['S','SE','E','NE','N','NW','W','SW'];CROSS=ndi.generate_binary_structure(2,1)

def measure(a):
 out=[]
 for d in range(8):
  frame=a[:,128*d:128*d+128];m=frame[:,:,3]>0;y,x=np.where(m);bb=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)];holes=ndi.binary_fill_holes(m,structure=CROSS)&~m;labs,n=ndi.label(holes,structure=CROSS);sizes=np.bincount(labs.ravel());small=[]
  for k in np.where((sizes>=1)&(sizes<=3))[0]:
   if not k:continue
   yy,xx=np.where(labs==k);small.append([[int(x),int(y)] for x,y in zip(xx,yy)])
  blocks=frame.reshape(64,2,64,2,4).transpose(0,2,1,3,4).reshape(64,64,4,4);uniform=np.all(blocks==blocks[:,:,0:1,:],axis=(2,3))&(blocks[:,:,0,3]>0);uniform_pixels=int(uniform.sum())*4;opaque=int(m.sum());fraction=uniform_pixels/opaque
  item={'direction':D[d],'bbox_xyxy_exclusive':bb,'height':bb[3]-bb[1],'foot_row':bb[3]-1,'center_x':float(x.mean()),'center_error':abs(float(x.mean())-64),'opaque_pixels':opaque,'partial_alpha_pixels':int(((frame[:,:,3]>0)&(frame[:,:,3]<255)).sum()),'tiny_enclosed_components':small,'tiny_enclosed_pixels':sum(len(c) for c in small),'uniform_2x2_opaque_pixels':uniform_pixels,'uniform_2x2_opaque_fraction':fraction}
  item['numeric_pass']={'height':120<=item['height']<=124,'foot':item['foot_row']==124,'center':item['center_error']<=4,'partial_alpha':item['partial_alpha_pixels']==0,'tiny_gaps':item['tiny_enclosed_pixels']==0,'real_detail':fraction<=.5};out.append(item)
 return out

def build():
 raw=Image.open(R/'kid-p128-raw.png').convert('RGBA');assert raw.size==(1024,128);a=np.array(raw)
 q=json.loads((R/'kid-p128-qa.json').read_text());q['frame_size']=[128,128];q['raw_size']=[1024,128];q['frame_order']=D;q['frames']=measure(a);q['uniform_block_method']='even-aligned2x2 grid; all4 RGBA pixels equal and opaque; numerator4 per block / all opaque pixels; transparent blocks excluded'
 q['numeric_acceptance_pass']=all(all(f['numeric_pass'].values()) for f in q['frames']);q['raw_sha256']=hashlib.sha256((R/'kid-p128-raw.png').read_bytes()).hexdigest();q['raw_modified']=False;q['layers_extracted']=False
 j=json.loads((R/'kid8.json').read_text());base=Image.new('RGBA',(512,64))
 for p in j['layerOrder']:base=Image.alpha_composite(base,Image.open(R/f'kid8-{p}-1.png').convert('RGBA'))
 out=Image.new('RGB',(4096,1024),(59,69,79))
 upper=base.resize((4096,512),Image.Resampling.NEAREST);lower=raw.resize((4096,512),Image.Resampling.NEAREST);out.paste(upper,(0,0),upper);out.paste(lower,(0,512),lower);out.save(R/'kid-p128-compare.png',optimize=True);optimize(R/'kid-p128-compare.png')
 q['comparison']={'file':'kid-p128-compare.png','size':[4096,1024],'top':'native64px hair1/body1/eyes1/mouth1 ×8','bottom':'native128px raw ×4','runtime_resampling':False,'comparison_nearest_neighbour_only':True}
 (R/'kid-p128-qa.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n');print(json.dumps([{'direction':f['direction'],'height':f['height'],'foot':f['foot_row'],'center':f['center_x'],'tiny_pixels':f['tiny_enclosed_pixels'],'uniform_fraction':f['uniform_2x2_opaque_fraction'],'pass':f['numeric_pass']} for f in q['frames']],indent=2))
if __name__=='__main__':build()
