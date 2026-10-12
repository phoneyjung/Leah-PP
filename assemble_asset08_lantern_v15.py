"""Assemble authorized L2/L3 from preserved raw sheets and recorded QA gates."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from build_asset08_lantern import build
R=Path(__file__).resolve().parent

def assemble():
 evidence=json.loads((R/'kid-lantern-v15-qa.json').read_text());meta=json.loads((R/'kid-lantern.json').read_text())
 meta['spec_revision']=16;meta['grip_definition']='Topmost opaque ring pixel within x13..19 nearest x16; native integer translation to (16,4), except accepted L1 E retains (16,5).'
 for job in evidence['jobs']:
  n=int(job['tag'][1:]);gate=evidence['gates'][job['tag']]
  owner_accepted_l3=(n==3 and all(g['width']<=12 and g['height']<=23 and len(g['stray_pixels'])<=4 and g['partial_alpha']==0 and g['blue_cyan_pixels']==0 for g in gate['frames']))
  if not gate['all_directions_pass'] and not owner_accepted_l3:
   raw=Image.open(R/job['raw_file']).convert('RGBA');rejected=[]
   for d,g in enumerate(gate['frames']):
    cell=raw.crop((d*32,0,d*32+32,32));a=np.array(cell);ys,xs=np.where(a[:,:,3]>0);gy,_,gx=min((int(y),abs(int(x)-16),int(x)) for x,y in zip(xs,ys) if 13<=x<=19)
    rejected.append({**g,'raw_grip_xy':[gx,gy],'game_grip_xy':None,'raw_rgba_sha256':hashlib.sha256(cell.tobytes()).hexdigest(),'usable':False})
   meta['levels'][n].update(status='rejected_size_gate',raw_review_file=job['raw_file'],job_id=job['job_id'],object_id=job['object_id'],rejected_raw_frames=rejected,frames=[]);continue
  raw=Image.open(R/job['raw_file']).convert('RGBA');frames=[]
  for d,g in enumerate(gate['frames']):
   cell=raw.crop((d*32,0,d*32+32,32));sha=hashlib.sha256(cell.tobytes()).hexdigest();assert sha==job['raw_rgba_sha256'][d]
   for x,y in g['stray_pixels']:cell.putpixel((x,y),(0,0,0,0))
   a=np.array(cell);ys,xs=np.where(a[:,:,3]>0);candidates=[(int(y),abs(int(x)-16),int(x)) for x,y in zip(xs,ys) if 13<=x<=19];gy,_,gx=min(candidates);dx,dy=16-gx,4-gy;bb=cell.getbbox();placed=[bb[0]+dx,bb[1]+dy,bb[2]+dx,bb[3]+dy]
   frames.append({'direction':meta['directions'][d],'raw_grip_xy':[gx,gy],'grip_xy':[16,4],'raw_opaque_bbox_xyxy_exclusive':g['raw_bbox'],'opaque_bbox_xyxy_exclusive':placed,'opaque_size':[g['width'],g['height']],'size_pass':g['pass'] or owner_accepted_l3,'translation_xy':[dx,dy],'partial_alpha_pixels':g['partial_alpha'],'blue_cyan_pixels':g['blue_cyan_pixels'],'removed_stray_pixels_raw_xy':g['stray_pixels'],'raw_rgba_sha256':sha,'glow_halo_visual_review':False})
  meta['levels'][n]={'level':n,'max_opaque_size':[12,23] if owner_accepted_l3 else [13,22],'frames':frames,'raw_file':job['raw_file'],'job_id':job['job_id'],'object_id':job['object_id'],'status':'accepted_by_owner_v16' if owner_accepted_l3 else 'generated_for_review'}
 meta['production_complete']=all(len(l.get('frames',[]))==8 for l in meta['levels']);meta['runtime_size_pass']=all(f['size_pass'] for l in meta['levels'] for f in l['frames']);meta['size_pass']=meta['runtime_size_pass'] and all(l['status']!='rejected_size_gate' for l in meta['levels']);meta['usable_levels']=[l['level'] for l in meta['levels'] if l['frames']];meta['unavailable_rows']=[l['level'] for l in meta['levels'] if not l['frames']]
 meta['acceptance_v16']={'L3_size':[12,23],'owner_approved':True,'additional_credits':0,'raw_unchanged':True}
 (R/'kid-lantern.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');build()
if __name__=='__main__':assemble()
