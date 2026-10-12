"""Lossless PNG encoding for large nearest-neighbour review sheets.
Unfiltered scanlines often compress pixel-art runs better than PNG heuristics.
Verify decoded RGB equality before replacing the file; never quantize colours.
"""
from pathlib import Path
import struct,zlib,io
import numpy as np
from PIL import Image

def optimize(path):
 path=Path(path);im=Image.open(path)
 if im.mode!='RGB':return
 a=np.array(im);h,w,_=a.shape
 raw=np.hstack([np.zeros((h,1),np.uint8),a.reshape(h,-1)]).tobytes()
 co=zlib.compressobj(9,zlib.DEFLATED,15,9,zlib.Z_DEFAULT_STRATEGY);compressed=co.compress(raw)+co.flush()
 def chunk(tag,data):return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
 out=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',compressed)+chunk(b'IEND',b'')
 if len(out)<path.stat().st_size:
  assert Image.open(io.BytesIO(out)).tobytes()==im.tobytes()
  path.write_bytes(out)
