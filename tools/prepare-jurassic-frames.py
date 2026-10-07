"""Locate isolated sprites in the unmodified generated atlas; save source rectangles."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1];im=Image.open(root/'arcade/assets/jurassic-players.png');a=im.getchannel('A');w,h=im.size;px=a.load()
counts=[sum(px[x,y]>60 for x in range(w)) for y in range(h)];split=min(range(int(h*.38),int(h*.55)),key=lambda y:counts[y]);frames=[]
for y0,y1 in [(0,split),(split,h)]:
 columns=[sum(px[x,y]>60 for y in range(y0,y1))>=3 for x in range(w)];runs=[];start=None
 for x,v in enumerate(columns+[False]):
  if v and start is None:start=x
  if not v and start is not None:runs.append([start,x]);start=None
 merged=[]
 for run in runs:
  if merged and run[0]-merged[-1][1]<12:merged[-1][1]=run[1]
  else:merged.append(run)
 assert len(merged)==6,'Atlas must contain six separate full silhouettes per species'
 row=[]
 for left,right in merged:
  left=max(0,left-3);right=min(w,right+3);mask=a.crop((left,y0,right,y1)).point(lambda v:255 if v>=60 else 0);l,t,r,b=mask.getbbox();row.append({'x':left+l,'y':y0+t,'w':r-l,'h':b-t,'bottom':b})
 frames.append(row)
p=root/'arcade/assets/jurassic-frames.js';tmp=p.with_suffix('.js.atomic');tmp.write_text('window.S9JurassicFrames='+json.dumps(frames,separators=(',',':'))+';\n');tmp.replace(p)
print('Located 12 complete creature sprites without cutting tails or boots')
