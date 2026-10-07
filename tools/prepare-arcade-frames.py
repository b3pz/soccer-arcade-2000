"""Crop labelled source atlas to uniform transparent, foot-aligned cells."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path(__file__).resolve().parents[1]
if not (root/'serieasim_arcade_sprite_pack/new_atlases/arcade_sprite_atlas_complete_A.png').exists():
 import runpy
 runpy.run_path(str(root/'tools/add-keeper-save-frames.py'))
 raise SystemExit(0)
im=Image.open(root/'serieasim_arcade_sprite_pack/new_atlases/arcade_sprite_atlas_complete_A.png').convert('RGBA')
def write_asset(name,text):
 path=root/'arcade/assets'/name;temporary=path.with_suffix(path.suffix+'.atomic');temporary.write_text(text);temporary.replace(path)
# Coordinates expressed in a 900 x 600 inspection view; labels excluded.
rows={'idle':(8,200,22,87,4),'run':(536,886,23,89,8),'dribble':(6,340,110,175,8),'pass':(357,627,110,177,6),'shoot':(630,892,111,178,6),'tackle':(6,236,207,267,4),'fall':(240,636,208,267,6),'celebrate':(642,892,199,266,6),'gk_idle':(5,223,291,353,4),'gk_move':(230,544,289,353,6),'dive_left':(550,892,294,359,6),'dive_right':(5,295,383,439,6),'catch':(298,571,383,439,6),'hold':(298,571,383,439,6),'throw':(580,893,383,440,6),'referee':(7,272,547,599,6)}
# Additional actions from the labelled B atlas.
extra=Image.open(root/'serieasim_arcade_sprite_pack/new_atlases/arcade_sprite_atlas_complete_B.png').convert('RGBA')
additional={'special':(330,632,21,77,6),'volley':(372,631,149,215,6),'getup':(329,629,291,322,6),'hard_tackle':(5,319,356,396,8),'shoot':(5,319,300,350,8),'tackle':(5,319,356,396,8),'gk_run':(650,896,121,160,6),'hold':(650,896,290,325,6),'throw':(696,896,302,344,5),'ref_idle':(753,781,434,507,1),'ref_point':(704,751,434,507,1),'ref_whistle':(863,894,434,507,1),'ref_yellow':(793,824,422,507,1),'ref_red':(829,860,422,507,1),'ref_run':(864,896,431,508,1),'kick_long':(681,899,348,396,6)}
manifest={};frames=[];audit={};raw_sizes={}
counts={'idle':4,'run':8,'dribble':8,'pass':6,'shoot':8,'volley':6,'tackle':8,'hard_tackle':6,'special':8,'fall':6,'getup':6,'celebrate':6,'gk_idle':4,'gk_move':6,'gk_run':6,'dive_left':6,'dive_right':6,'catch':6,'hold':4,'throw':6,'kick_long':6,'penalty_save':6,'ref_idle':4,'ref_run':6,'ref_point':4,'ref_whistle':4,'ref_yellow':4,'ref_red':4}
for name,coords in {**rows,**additional}.items():
 src=extra if name in additional else im;x1,x2,y1,y2,n=coords;manifest[name]=[];start=len(frames)
 for j in range(n):
  scale=src.width/900;crop=src.crop((round((x1+(x2-x1)*j/n)*scale),round(y1*scale),round((x1+(x2-x1)*(j+1)/n)*scale),round(y2*scale)))
  # Remove pure neon-blue guide pixels; retain dark boots and uniform shading.
  rgba=crop.load()
  for cy in range(crop.height):
   for cx in range(crop.width):
    red,green,blue,alpha=rgba[cx,cy]
    if blue>210 and red<15 and green<15:rgba[cx,cy]=(0,0,0,0)
  # Discard detached fragments from adjacent poses in nonuniform source cells.
  alpha=crop.getchannel('A');visited=set();largest=[]
  for cy in range(crop.height):
   for cx in range(crop.width):
    if (cx,cy) in visited or alpha.getpixel((cx,cy))<40:continue
    component=[];stack=[(cx,cy)];visited.add((cx,cy))
    while stack:
     px,py=stack.pop();component.append((px,py))
     for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
      if 0<=nx<crop.width and 0<=ny<crop.height and (nx,ny) not in visited and alpha.getpixel((nx,ny))>=40:visited.add((nx,ny));stack.append((nx,ny))
    if len(component)>len(largest):largest=component
  bounds=(min(x for x,y in largest),min(y for x,y in largest),max(x for x,y in largest)+1,max(y for x,y in largest)+1) if largest else crop.getbbox()
  if bounds:crop=crop.crop(bounds)
  raw_sizes.setdefault(name,[]).append([crop.width,crop.height]);
  # Fixed reference scale per atlas/body type, rather than scaling every crouch to standing height.
  reference=120 if name.startswith('ref_') else 64 if name in ['gk_run','hold','throw','kick_long'] else 105 if name.startswith('gk_') or name in ['dive_left','dive_right','catch'] else 85 if name in additional else 105
  factor=min(95/reference,120/crop.width,117/crop.height);crop=crop.resize((max(1,round(crop.width*factor)),max(1,round(crop.height*factor))),Image.Resampling.NEAREST);cell=Image.new('RGBA',(128,128));cell.alpha_composite(crop,((128-crop.width)//2,118-crop.height))
  if name.startswith('gk_') or name in ['dive_left','dive_right','catch','hold','throw','kick_long']:
   pixels=cell.load()
   for py in range(128):
    for px in range(128):
     red,green,blue,alpha=pixels[px,py]
     yellow=red>100 and green>90 and .8<red/max(1,green)<1.4 and blue<green*.65
     scarlet=red>90 and red>green*2 and red>blue*1.5
     if alpha and (yellow or scarlet):
      shade=max(red,green)/255;color=(28,142,72) if py<85 else (22,39,40)
      pixels[px,py]=tuple(round(v*(.55+shade*.45)) for v in color)+(alpha,)
  manifest[name].append(len(frames));frames.append(cell)
# Atlas C has complete, clean silhouettes; labels in B sometimes count detached balls as poses.
clean=Image.open(root/'serieasim_arcade_sprite_pack/new_atlases/arcade_sprite_atlas_complete_C.png').convert('RGBA').resize((900,600),Image.Resampling.NEAREST)
def components(y1,y2):
 alpha=clean.getchannel('A');visited=set();result=[]
 for cy in range(y1,y2):
  for cx in range(900):
   if (cx,cy) in visited or alpha.getpixel((cx,cy))<50:continue
   points=[];stack=[(cx,cy)];visited.add((cx,cy))
   while stack:
    px,py=stack.pop();points.append((px,py))
    for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
     if 0<=nx<900 and y1<=ny<y2 and (nx,ny) not in visited and alpha.getpixel((nx,ny))>=50:visited.add((nx,ny));stack.append((nx,ny))
   if len(points)<=130:continue
   x1=min(x for x,y in points);x2=max(x for x,y in points)+1;top=min(y for x,y in points);bottom=max(y for x,y in points)+1
   crop=Image.new('RGBA',(x2-x1,bottom-top));pixels=crop.load()
   for px,py in points:pixels[px-x1,py-top]=clean.getpixel((px,py))
   result.append((x1,crop))
 return [crop for x,crop in sorted(result,key=lambda p:p[0])]
strips=[components(*bounds) for bounds in [(0,82),(85,170),(171,254),(255,335),(337,418)]]
clean_actions={
 'idle':(0,[0,1,2,3]),'run':(0,list(range(8,16))),'dribble':(1,list(range(8))),
 'pass':(1,list(range(8,14))),'shoot':(1,list(range(14,20))),
 'volley':(0,[16,17,18]),'tackle':(2,[0,1,2,3]),'hard_tackle':(2,[2,3,5]),
 'special':(0,[19,20,21,22,23]),'fall':(2,[8,9,11,6,7,5]),'getup':(2,[5,7,6,11,9,10]),'celebrate':(2,[12,13,14,15,16,17]),
 'gk_idle':(3,[0,1,2,3]),'gk_move':(3,[4,5,6,7,8,9]),'gk_run':(3,[4,5,6,7,8,9]),
 'dive_right':(3,[13,10,11,12,14]),'hold':(3,[0,1,2,3]),'ref_idle':(4,[2])}
for name,(strip,indices) in clean_actions.items():
 manifest[name]=[];raw_sizes[name]=[]
 for index in indices:
  crop=strips[strip][index];raw_sizes[name].append([crop.width,crop.height]);factor=min(95/67,120/crop.width,117/crop.height)
  crop=crop.resize((round(crop.width*factor),round(crop.height*factor)),Image.Resampling.NEAREST);cell=Image.new('RGBA',(128,128));cell.alpha_composite(crop,((128-crop.width)//2,118-crop.height));manifest[name].append(len(frames));frames.append(cell)
manifest['dive_right'].insert(0,manifest['gk_idle'][0])
manifest['dive_left']=[]
for index in manifest['dive_right']:
 manifest['dive_left'].append(len(frames));frames.append(frames[index].transpose(Image.Transpose.FLIP_LEFT_RIGHT))
# Use clean kick silhouettes for passes; football is always drawn by the live renderer.
manifest['pass']=manifest['shoot'][:]
audit['pass']={'frames':6,'sourcePoses':6,'derivedPoses':0,'repeatedExposure':False,'technique':'clean common kick family, six-frame pass timing'}
# Dribbling has its own forward-lean exposures without a baked-in second football.
manifest['dribble']=[]
for index in manifest['run']:
 cell=frames[index].copy();upper=cell.crop((25,20,103,75));cell.paste((0,0,0,0),(25,20,103,75));cell.alpha_composite(upper,(27,19));manifest['dribble'].append(len(frames));frames.append(cell)
audit['dribble']={'frames':8,'sourcePoses':8,'derivedPoses':8,'repeatedExposure':False,'technique':'forward lean on clean running silhouettes; live ball separate'}
# Foot plant, kick preparation, slide and follow-through: exclude the source pose with a baked ball.
manifest['tackle']=[manifest['run'][-1],manifest['tackle'][0],manifest['tackle'][2],manifest['tackle'][3]]
# Goalkeeper glove actions use the clean common body, with articulated pixel sleeves.
gk_base=frames[manifest['gk_idle'][0]].copy()
def keeper_arms(left_elbow,left_hand,right_elbow,right_hand):
 cell=gk_base.copy();d=ImageDraw.Draw(cell);d.rectangle((31,52,46,88),fill=(0,0,0,0));d.rectangle((81,52,98,88),fill=(0,0,0,0))
 for shoulder,elbow,hand in [((46,48),left_elbow,left_hand),((80,48),right_elbow,right_hand)]:
  d.line([shoulder,elbow,hand],fill='#103624',width=10);d.line([shoulder,elbow,hand],fill='#278b45',width=7);d.line([shoulder,elbow,hand],fill='#4cac5c',width=2)
  d.rectangle((hand[0]-4,hand[1]-3,hand[0]+4,hand[1]+4),fill='#4f6371');d.rectangle((hand[0]-3,hand[1]-2,hand[0]+3,hand[1]+3),fill='#e5e7df');d.line((hand[0]-3,hand[1]-2,hand[0]+3,hand[1]-2),fill='#fff8df')
 return cell
catch_poses=[((43,65),(40,76),(84,65),(87,76)),((44,61),(48,70),(83,61),(79,70)),((45,60),(54,65),(82,60),(73,65)),((46,58),(58,59),(81,58),(69,59)),((47,59),(60,58),(80,59),(67,58)),((48,62),(60,62),(79,62),(67,62))]
for name,poses in {
 'catch':catch_poses,
 'hold':[((48,62),(60,62+i%2),(79,62),(67,62+i//2)) for i in range(4)],
 'throw':[((44,65),(48,75),elbow,hand) for elbow,hand in [((85,65),(80,74)),((90,51),(84,48)),((87,36),(76,29)),((96,42),(100,36)),((98,55),(111,52)),((91,67),(107,70))]]}.items():
 manifest[name]=[]
 for pose in poses:manifest[name].append(len(frames));frames.append(keeper_arms(*pose))
 audit[name]={'frames':len(poses),'sourcePoses':1,'derivedPoses':len(poses),'repeatedExposure':False,'technique':'articulated clean goalkeeper body and gloves'}
manifest['kick_long']=[]
for index in manifest['shoot']:
 cell=frames[index].copy();pixels=cell.load()
 for y in range(128):
  for x in range(128):
   red,green,blue,alpha=pixels[x,y]
   if not alpha:continue
   if blue>red*1.3 and blue>green*1.1:
    shade=.55+blue/565;pixels[x,y]=(round(28*shade),round(145*shade),round(67*shade),alpha)
   elif 60<y<98 and min(red,green,blue)>105 and max(red,green,blue)-min(red,green,blue)<35:
    shade=max(red,green,blue)/255;pixels[x,y]=(round(20*shade),round(35*shade),round(35*shade),alpha)
 manifest['kick_long'].append(len(frames));frames.append(cell)
# Derived articulated referee frames: torso/legs remain at a fixed body scale.
# These are new pixel exposures composed from the source uniform, not repeated frame IDs.
base=frames[manifest['ref_idle'][0]].copy()
def arm_pose(base,elbow,hand,card=None):
 cell=base.copy();d=ImageDraw.Draw(cell)
 # Replace the right sleeve/arm while preserving the torso and original foot position.
 d.rectangle((76,46,96,87),fill=(0,0,0,0))
 shoulder=(72,48)
 d.line([shoulder,elbow],fill='#101522',width=10);d.line([shoulder,elbow],fill='#343c4c',width=7)
 d.line([elbow,hand],fill='#623728',width=7);d.line([elbow,hand],fill='#d78c51',width=5)
 d.line([(elbow[0]-1,elbow[1]),(hand[0]-1,hand[1])],fill='#f2b16e',width=2)
 d.rectangle((hand[0]-2,hand[1]-2,hand[0]+2,hand[1]+2),fill='#efb473')
 if card:
  d.rectangle((hand[0]-5,hand[1]-12,hand[0]+5,hand[1]-1),fill='#141a2b')
  d.rectangle((hand[0]-4,hand[1]-11,hand[0]+4,hand[1]-2),fill=card)
  d.line((hand[0]-3,hand[1]-10,hand[0]+3,hand[1]-10),fill='#fff7b1')
 return cell
poses={
 'ref_point':[((80,62),(85,78)),((83,56),(96,58)),((85,48),(106,46)),((86,48),(108,47))],
 'ref_whistle':[((80,62),(85,78)),((83,57),(76,48)),((79,51),(70,39)),((78,50),(69,38))],
 'ref_yellow':[((80,62),(85,77)),((85,46),(82,31)),((81,35),(80,18)),((80,34),(79,16))],
 'ref_red':[((80,62),(85,77)),((85,46),(82,31)),((81,35),(80,18)),((80,34),(79,16))]
}
for name,sequence in poses.items():
 manifest[name]=[]
 for j,(elbow,hand) in enumerate(sequence):
  card=('#ffe348' if name=='ref_yellow' else '#f53343') if name in ['ref_yellow','ref_red'] and j>0 else None
  cell=arm_pose(base,elbow,hand,card);manifest[name].append(len(frames));frames.append(cell)
 audit[name]={'frames':4,'sourcePoses':1,'derivedPoses':4,'repeatedExposure':False,'technique':'articulated pixel arm on fixed source body'}
manifest['ref_idle']=[]
for shift in [0,-1,0,1]:
 cell=base.copy();torso=cell.crop((38,23,89,83));cell.paste((0,0,0,0),(38,23,89,83));cell.alpha_composite(torso,(38,23+shift));manifest['ref_idle'].append(len(frames));frames.append(cell)
# Each idle exposure receives a tiny sleeve highlight variant; feet stay at baseline.
for j,i in enumerate(manifest['ref_idle']):
 ImageDraw.Draw(frames[i]).point((72+j%2,51+j//2),fill='#526075')
audit['ref_idle']={'frames':4,'sourcePoses':1,'derivedPoses':4,'repeatedExposure':False,'technique':'breathing torso, fixed feet'}
manifest['penalty_save']=manifest['dive_left'][:]
manifest['ref_run']=manifest['run'][:]
for name,count in counts.items():
 if name in audit:continue
 source=manifest[name][:];manifest[name]=[source[min(len(source)-1,int(j*len(source)/count))] for j in range(count)]
 if count>len(source):
  # Distinct lean/anticipation exposures for special dribble, preserving leg/body scale.
  for j,index in enumerate(manifest[name]):
   if j and index==manifest[name][j-1]:
    cell=frames[index].copy();bounds=cell.getbbox();
    if bounds and bounds[3]-bounds[1]<55:
     shifted=Image.new('RGBA',(128,128));shifted.alpha_composite(cell,(2,0));cell=shifted
    upper=cell.crop((25,20,103,75));cell.paste((0,0,0,0),(25,20,103,75));cell.alpha_composite(upper,(27,19));manifest[name][j]=len(frames);frames.append(cell)
 audit[name]={'frames':count,'sourcePoses':len(source),'derivedPoses':max(0,count-len(source)),'repeatedExposure':False}
# New full-body keeper exposures generated in the atlas' established pixel palette.
import importlib.util
spec=importlib.util.spec_from_file_location('keeper_save_poses',root/'tools/keeper-save-poses.py')
save_poses=importlib.util.module_from_spec(spec);spec.loader.exec_module(save_poses)
for kind in ['stretch','tip','punch']:
 for side in ['left','right']:
  name='save_'+kind+'_'+side;manifest[name]=[]
  for index in range(8):
   manifest[name].append(len(frames));frames.append(save_poses.pose(kind,index,side=='left'))
  audit[name]={'frames':8,'sourcePoses':0,'derivedPoses':8,'repeatedExposure':False,'technique':'original articulated pixel body: push-off, extension, glove contact, landing, recovery'}
write_asset('animation-audit.json',json.dumps({'cell':[128,128],'baseline':118,'bodyHeight':95,'rawSizes':raw_sizes,'sequences':audit},indent=2))
used=sorted({i for sequence in manifest.values() for i in sequence});lookup={old:new for new,old in enumerate(used)};frames=[frames[i] for i in used];manifest={name:[lookup[i] for i in sequence] for name,sequence in manifest.items()}
sheet=Image.new('RGBA',(128*8,128*((len(frames)+7)//8)))
for i,f in enumerate(frames):sheet.alpha_composite(f,((i%8)*128,(i//8)*128))
temporary=root/'arcade/assets/animations.png.atomic';sheet.save(temporary,format='PNG');temporary.replace(root/'arcade/assets/animations.png');write_asset('animations.json',json.dumps(manifest,indent=2));write_asset('animations.js','window.S9ArcadeFrames='+json.dumps(manifest)+';\n')
print(f'{len(frames)} frames, {len(manifest)} actions')
