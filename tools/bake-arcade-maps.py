"""Bake existing accurate region geometry into textured raster cabinet map assets."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,re,random,subprocess,tempfile
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as td:
 js=Path(td)/'export.js';js.write_text("var window=globalThis;load('arcade/assets/regional-maps.js');print(JSON.stringify([...S9ArcadeRegions.regions,...S9ArcadeRegions.nationalRegions]));")
 raw=subprocess.check_output(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc',str(js)],cwd=root,text=True)
regions=json.loads(raw);out=root/'arcade/assets/art/maps';out.mkdir(parents=True,exist_ok=True)
for zone in regions:
 im=Image.new('RGB',(420,500));d=ImageDraw.Draw(im)
 for y in range(500):d.line((0,y,420,y),fill=(5,18+y//40,40+y//25))
 for x in range(0,420,42):d.line((x,0,x,500),fill='#163d59')
 for y in range(0,500,50):d.line((0,y,420,y),fill='#163d59')
 for country in zone['paths']:
  for ring in country['d'].split('M')[1:]:
   points=[tuple(map(float,p)) for p in re.findall(r'(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',ring)]
   if len(points)<3:continue
   d.polygon([(x+2,y+3) for x,y in points],fill='#020b19')
   d.polygon(points,fill='#65caba' if country.get('selected') else '#2b6b78',outline='#b8f8dc' if country.get('selected') else '#3e8999',width=1)
 rng=random.Random(zone['id'])
 for _ in range(5000):
  x,y=rng.randrange(420),rng.randrange(500);color=im.getpixel((x,y));delta=rng.choice([-8,-4,4,8]);d.point((x,y),fill=tuple(max(0,min(255,v+delta)) for v in color))
 # Small corner ticks / latitude edge give the artwork a cabinet atlas feel.
 for x,y,dx,dy in [(5,5,1,1),(414,5,-1,1),(5,494,1,-1),(414,494,-1,-1)]:d.line([(x+dx*14,y),(x,y),(x,y+dy*14)],fill='#76dcdb',width=2)
 im.save(out/(zone['id']+'.png'))
print(len(regions),'regional raster maps')
