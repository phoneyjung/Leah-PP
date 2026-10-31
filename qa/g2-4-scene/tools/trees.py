#!/usr/bin/env python3
# G2.4 S6 (Claude · 31 Oct 2569): pick which T cells get a 128 tree (the rest = 32 px bush) so walk-behind cells <= 24 and 0 in the slime zone
# (ASSET_SPEC_10 section 4). Real art masks (hut, lamps, gate, props, trees a/b) + the real kid S idle mask, feet at each walkable cell centre,
# 'walk-behind' = more than half of the kid covered by art drawn in front of her. Greedy: east / west / bottom in turn, trees >= 2 cells apart,
# east-edge trees may sit 12-28 px further out and bottom-row trees 12-20 px lower (whole px, art never scaled).
# Result -> TREES in pilot-g2-scene.html. usage: python3 -I trees.py
# v1.1 (Codex T7 R7): props placed exactly like the page (cell top-left, sort +30), was bbox-centred; TREES result unchanged
import json, sys, numpy as np
from PIL import Image
import os
HERE=os.path.dirname(os.path.abspath(__file__)); R=os.path.normpath(os.path.join(HERE,'..','..','..'))+'/'
L=json.load(open(R+'qa/g2-4-scene/pilot-scene-layout.json'))
G=L['grid']; W,H=28,14; T=32; zone={tuple(c) for c in L['slime_zone']}
walk=lambda c: c in ',.=-XDS*'
cells=[(x,y) for y in range(H) for x in range(W)]
wc=[(x,y) for x,y in cells if walk(G[y][x])]
def m(p): return np.array(Image.open(R+p).convert('RGBA'))[...,3]>0
kid=np.array(Image.open(R+'c2-pilot-kid4-idleanim.png').convert('RGBA'))[0:96,0:96,3]>0   # row S, frame 0
hut=m('g24-hut.png'); ta=m('g24-tree-a.png'); tb=m('g24-tree-b.png'); lamp=m('g24-lamp.png'); gate=m('g24-gate.png')
pr=np.array(Image.open(R+'g24-props.png').convert('RGBA'))[...,3]>0; P=json.load(open(R+'g24-props.json'))['items']
def prop(k): x,y=P[k]; return pr[y:y+32,x:x+32]
def placed_prop(k,cx,cy):   # same as the page (spec 10 v1.3 section 4, Codex T7 R7): 32 x 32 on its own cell, top-left (cx*32, cy*32), sort y = cy*32+30
    return (prop(k),cx*T,cy*T,cy*T+30)
base=[(hut,96,32,287)]
for (x,y) in cells:
    ch=G[y][x]
    if ch=='L': base.append((lamp,x*T+16-64,(y+1)*T-128,(y+1)*T-4))
for (x,y) in [(14,13)]: base.append((gate,448,384,446))
for (x,y),k in [((11,8),'crate'),((12,8),'rope'),((24,6),'boulder'),((23,8),'boulder')]+[((x,13),'fence') for x in (12,13,16,17)]:
    base.append(placed_prop(k,x,y))
Tc=[(x,y) for x,y in cells if G[y][x]=='T']
def cover(art):
    out={}
    for (x,y) in wc:
        fx,fy=x*T+16,y*T+16; l0,t0=fx-48,fy-94; cov=np.zeros((96,96),bool)
        for a,l,t,b in art:
            if b<=fy: continue
            h,w=a.shape; ox0,oy0=max(l0,l),max(t0,t); ox1,oy1=min(l0+96,l+w),min(t0+96,t+h)
            if ox0>=ox1 or oy0>=oy1: continue
            cov[oy0-t0:oy1-t0,ox0-l0:ox1-l0]|=a[oy0-t:oy1-t,ox0-l:ox1-l]
        f=(cov&kid).sum()/kid.sum()
        if f>0.5: out[(x,y)]=round(float(f),2)
    return out
base_cov=cover(base); print('base (hut+lamps+gate+props) walk-behind', len(base_cov), sorted(base_cov))
def tree_art(x,y,i): return ((ta,tb)[i%2],x*T+16-64,(y+1)*T-128,(y+1)*T-4)
def tree_art2(x,y,i,dx,dy): return ((ta,tb)[i%2],x*T+16-64+dx,(y+1)*T-128+dy,(y+1)*T-4+dy)
def offs(c):
    x,y=c; o=[(0,0)]
    if x==27: o=[(0,0),(12,0),(20,0),(28,0)]
    if x==0: o=[(0,0),(-12,0),(-20,0),(-28,0)]
    if y==13: o=[(a,b) for a,_ in o for b in (0,12,20)]
    return o
east=[c for c in Tc if c[0]>=26]; west=[c for c in Tc if c[0]<=1]; bot=[c for c in Tc if c not in east and c not in west]
for g_ in (east,west,bot): g_.sort(key=lambda c:(c[1],c[0]))
order=[]
for i in range(max(map(len,(east,west,bot)))):
    for g_ in (east,west,bot):
        if i<len(g_): order.append(g_[i])
trees=[]
for c in order:
    if any(max(abs(c[0]-t[0][0]),abs(c[1]-t[0][1]))<2 for t in trees): continue
    for (dx,dy) in offs(c):
        cand=trees+[(c,dx,dy)]; art=base+[tree_art2(x,y,i,a,b) for i,((x,y),a,b) in enumerate(cand)]
        cv=cover(art)
        if len(cv)<=24 and not any(k in zone for k in cv): trees=cand; break
bush=[c for c in Tc if c not in [t[0] for t in trees]]
art=base+[tree_art2(x,y,i,a,b) for i,((x,y),a,b) in enumerate(trees)]+[placed_prop('bush',x,y) for x,y in bush]
cv=cover(art)
print(json.dumps({'TREES':[[c[0],c[1],dx,dy] for c,dx,dy in trees],'bushes':len(bush),'walk_behind':len(cv),'in_slime_zone':[list(k) for k in cv if k in zone],'cells':sorted([list(k) for k in cv])}))
