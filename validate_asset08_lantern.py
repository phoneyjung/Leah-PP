"""Check each game cell against raw + permitted stray removal + translation."""
from pathlib import Path
import json,hashlib
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
R=Path(__file__).resolve().parent;J=json.loads((R/'kid-lantern.json').read_text());game=Image.open(R/'kid-lantern.png').convert('RGBA');errors=[];checked=removed=partial=blue=0
assert game.size==(256,128)
for level in J['levels']:
 if not level.get('frames'):
  if level['status']=='rejected_size_gate':
   raw=Image.open(R/level['raw_review_file']).convert('RGBA');assert len(level['rejected_raw_frames'])==8
   for d,f in enumerate(level['rejected_raw_frames']):
    cell=raw.crop((d*32,0,d*32+32,32));assert hashlib.sha256(cell.tobytes()).hexdigest()==f['raw_rgba_sha256'];assert list(cell.getbbox())==f['raw_bbox'];x,y=f['raw_grip_xy'];assert cell.getpixel((x,y))[3]==255
   assert not game.crop((0,32*level['level'],256,32*level['level']+32)).getbbox()
  continue
 raw=Image.open(R/level['raw_file']).convert('RGBA');assert raw.size==(256,32)
 for d,f in enumerate(level['frames']):
  checked+=1;frame=raw.crop((32*d,0,32*d+32,32));assert hashlib.sha256(frame.tobytes()).hexdigest()==f['raw_rgba_sha256']
  a=np.array(frame);labels,n=ndi.label(a[:,:,3]>0,structure=np.ones((3,3)));counts=np.bincount(labels.ravel());counts[0]=0;main=labels==int(counts.argmax())
  stray=f.get('removed_stray_pixels_raw_xy',[]);assert len(stray)<=4
  for x,y in stray:assert a[y,x,3]>0 and not main[y,x];frame.putpixel((x,y),(0,0,0,0));removed+=1
  expected=Image.new('RGBA',(32,32));expected.paste(frame,tuple(f['translation_xy']));actual=game.crop((32*d,32*level['level'],32*d+32,32*level['level']+32));assert actual.tobytes()==expected.tobytes()
  assert sum(p[3]>0 for p in frame.get_flattened_data())==sum(p[3]>0 for p in actual.get_flattened_data())
  bb=actual.getbbox();assert list(bb)==f['opaque_bbox_xyxy_exclusive'];assert bb[2]-bb[0]<=13 and bb[3]-bb[1]<=22
  x,y=f['grip_xy'];assert actual.getpixel((x,y))[3]==255
  a=np.array(actual);partial+=int(((a[:,:,3]>0)&(a[:,:,3]<255)).sum());rgb=a[:,:,:3].astype(int);blue+=int(((a[:,:,3]>0)&(rgb[:,:,2]>rgb[:,:,0]+20)&((rgb[:,:,1]>rgb[:,:,0]+10)|(rgb[:,:,2]>rgb[:,:,1]+15))).sum())
assert partial==0 and blue==0
preview=Image.open(R/'kid-lantern-6x.png').convert('RGBA');assert preview.size==(1536,768) and preview.tobytes()==game.resize((1536,768),Image.Resampling.NEAREST).tobytes()
report={'checked_frames':checked,'removed_stray_pixels':removed,'partial_alpha':partial,'blue_cyan_pixels':blue,'game_sheet_size':[256,128],'preview_size':[1536,768],'pixel_preservation':True,'resampled_runtime_sprites':0,'delivery_integrity_pass':True,'acceptance_complete':J['production_complete'] and J['size_pass'],'production_complete':J['production_complete'],'unavailable_rows':J['unavailable_rows']}
print(json.dumps(report,indent=2))
