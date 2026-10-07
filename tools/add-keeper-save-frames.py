"""Extend the checked-in atlas when the original source pack is unavailable."""
from pathlib import Path
from PIL import Image
import importlib.util, json
root=Path(__file__).resolve().parents[1];assets=root/'arcade/assets'
spec=importlib.util.spec_from_file_location('keeper_save_poses',root/'tools/keeper-save-poses.py')
poses=importlib.util.module_from_spec(spec);spec.loader.exec_module(poses)
manifest=json.loads((assets/'animations.json').read_text());audit=json.loads((assets/'animation-audit.json').read_text());sheet=Image.open(assets/'animations.png').convert('RGBA')
manifest={k:v for k,v in manifest.items() if not k.startswith('save_')}
used=sorted({i for row in manifest.values() for i in row});lookup={old:new for new,old in enumerate(used)}
frames=[sheet.crop((i%8*128,i//8*128,i%8*128+128,i//8*128+128)) for i in used];manifest={k:[lookup[i] for i in row] for k,row in manifest.items()}
for kind in ['stretch','tip','punch']:
 for side in ['left','right']:
  name='save_'+kind+'_'+side;manifest[name]=[]
  for index in range(8):manifest[name].append(len(frames));frames.append(poses.pose(kind,index,side=='left'))
  audit['sequences'][name]={'frames':8,'sourcePoses':0,'derivedPoses':8,'repeatedExposure':False,'technique':'original articulated pixel body: push-off, extension, glove contact, landing, recovery'}
out=Image.new('RGBA',(1024,128*((len(frames)+7)//8)))
for i,cell in enumerate(frames):out.alpha_composite(cell,(i%8*128,i//8*128))
tmp=assets/'animations.png.atomic';out.save(tmp,format='PNG');tmp.replace(assets/'animations.png')
for name,text in [('animations.json',json.dumps(manifest,indent=2)),('animations.js','window.S9ArcadeFrames='+json.dumps(manifest)+';\n'),('animation-audit.json',json.dumps(audit,indent=2))]:
 target=assets/name;tmp=target.with_suffix(target.suffix+'.atomic');tmp.write_text(text);tmp.replace(target)
print(f'{len(frames)} frames, {len(manifest)} actions')
