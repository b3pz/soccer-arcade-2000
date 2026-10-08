"""Run Soccer Arcade 2000 checks with the platform JS runtime (macOS JavaScriptCore)."""
from pathlib import Path
import subprocess, tempfile, re
root=Path(__file__).resolve().parents[1]
jsc=Path('/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc')
if not jsc.exists():raise SystemExit('JavaScriptCore jsc required on macOS; test files may also be adapted to Node.')
source=(root/'index.html').read_text()
with tempfile.TemporaryDirectory(prefix='sa2000-qa-') as tmp:
 files=list((root/'arcade').rglob('*.js'))+list((root/'game').rglob('*.js'))
 for i,script in enumerate(re.findall(r'<script\b[^>]*>(.*?)</script>',source+(root/'arcade/tests/visual.html').read_text()+(root/'arcade/tests/offline-sprites.html').read_text(),re.S)):
  if script.strip():
   f=Path(tmp)/f'inline-{i}.js';f.write_text(script);files.append(f)
 for index,f in enumerate(files):
  snapshot=Path(tmp)/f'source-{index}.js';snapshot.write_text(f.read_text());syntax=Path(tmp)/f'check-{index}.js';syntax.write_text(f'checkSyntax({str(snapshot)!r});')
  subprocess.run([str(jsc),str(syntax)],cwd=root,check=True)
 for name in ['core','visual','features','tournament','drawn-menu','cabinet','catalog','stadium','offline','full-match-balance','assist','coop','evolution','evolution-ui','fantasy','online','cinematic','bindings','saves','presentation','demo','artwork','replay','teamedit','keeper']:
  run=subprocess.run([str(jsc),str(root/f'arcade/tests/{name}-tests.js')],cwd=root,check=True,capture_output=True,text=True);print(run.stdout,end='');print(run.stderr,end='')
  # Async blocks report failures by printing FAIL without a non-zero exit: treat them as failures too.
  assert not any(line.startswith('FAIL') for line in run.stdout.splitlines()),name+' tests printed FAIL'
 print('PASS JavaScript syntax (modules and all root inline scripts)')
 for f in [root/'arcade/assets/animations.png',root/'arcade/assets/animations.json']:
  assert f.exists() and f.stat().st_size>100
 print('PASS extracted animation assets')

import json
from PIL import Image
audit=json.loads((root/'arcade/assets/animation-audit.json').read_text())
frames=json.loads((root/'arcade/assets/animations.json').read_text())
sheet=Image.open(root/'arcade/assets/animations.png')
for action,info in audit['sequences'].items():
 assert len(frames[action])==info['frames'],action
 for index in frames[action]:
  cell=sheet.crop((index%8*128,index//8*128,index%8*128+128,index//8*128+128));bounds=cell.getbbox()
  assert bounds and bounds[3]==118,(action,index,bounds)
print('PASS '+str(len(audit['sequences']))+' animation sequences, populated cells and unified baseline')

import hashlib
for action in ['ref_idle','ref_point','ref_whistle','ref_yellow','ref_red','catch','hold','throw']:
 cells=[sheet.crop((i%8*128,i//8*128,i%8*128+128,i//8*128+128)) for i in frames[action]]
 assert len({hashlib.sha256(cell.tobytes()).hexdigest() for cell in cells})==len(cells),action
print('PASS referee gestures and goalkeeper glove actions have distinct bitmap exposures')
for action,indices in frames.items():
 if action=='referee':continue
 for i in indices:
  cell=sheet.crop((i%8*128,i//8*128,i%8*128+128,i//8*128+128))
  assert sum(a>=50 for a in cell.getchannel('A').tobytes())>=350,(action,i)
print('PASS requested sequences contain full silhouettes, not detached balls or tiny fragments')

creatures=Image.open(root/'arcade/assets/jurassic-players.png')
creature_frames=json.loads((root/'arcade/assets/jurassic-frames.js').read_text().split('=',1)[1].rstrip(';\n'))
assert len(creature_frames)==2 and all(len(row)==6 for row in creature_frames)
for row in creature_frames:
 for f in row:
  assert 0<=f['x']<f['x']+f['w']<=creatures.width and 0<=f['y']<f['y']+f['h']<=creatures.height
  assert f['w']>100 and f['h']>100
assert creatures.getchannel('A').getextrema()==(0,255)
assert Image.open(root/'arcade/assets/championship-trophy.png').getchannel('A').getextrema()[0]==0
import wave
with wave.open(str(root/'arcade/assets/cabinet-theme.wav')) as soundtrack:
 assert soundtrack.getnframes()>soundtrack.getframerate()*10 and soundtrack.getnchannels()==1
print('PASS twelve complete creature poses, transparent trophy and original menu soundtrack asset')

import json, base64
embedded=json.loads(re.search(r'const embedded=(\{.*?\});window', (root/'arcade/assets/offline-sprites.js').read_text()).group(1))
for key,asset in {'players':'animations.png','creatures':'jurassic-players.png'}.items():
 assert base64.b64decode(embedded[key].split(',',1)[1])==(root/'arcade/assets'/asset).read_bytes(), 'Embedded sprite data is stale'
print('PASS offline sprite package preserves exact original PNG bytes for both palette atlases')

subprocess.run(['python3', str(root/'online/test_server.py')], cwd=root, check=True)
print('PASS private-room server authentication, signaling, expiry and rate limits')

for action,indices in frames.items():
 if not action.startswith('save_'):continue
 cells=[sheet.crop((i%8*128,i//8*128,i%8*128+128,i//8*128+128)) for i in indices]
 assert len(cells)==8 and len({hashlib.sha256(cell.tobytes()).hexdigest() for cell in cells})==8, action
print('PASS six spectacular-save sprite sequences have eight distinct full-body exposures each')

art=root/'arcade/assets/art'
for name in ['title-logo.png','stadium-menu.png','crowd-sheet.png','cinematic-wide-sheet.png','ceremonies.png','sponsors.png','world-map.png']:
 im=Image.open(art/name);im.verify()
assert Image.open(art/'title-logo.png').getchannel('A').getextrema()==(0,255)
assert Image.open(art/'favicon-32.png').size==(32,32)
assert Image.open(art/'apple-touch-icon.png').size==(180,180)
assert len(list((art/'maps').glob('*.png')))==12
# Generated crest set: checked only once installed (the game currently uses the original per-team crests).
crest_manifest=json.loads((art/'crests/manifest.json').read_text())
if all((art/'crests'/e['file']).exists() for e in crest_manifest):
 crest_hashes=set()
 for entry in crest_manifest:
  im=Image.open(art/'crests'/entry['file']);assert im.size==(320,320) and im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255)
  bounds=im.getbbox();assert bounds and bounds[0]>=20 and bounds[1]>=20 and bounds[2]<=300 and bounds[3]<=300,entry['file']
  crest_hashes.add(hashlib.sha256(im.tobytes()).hexdigest())
 assert len(crest_hashes)==145
assert Image.open(art/'crests/jurassic.png').getchannel('A').getextrema()==(0,255)
for path in (art/'maps').glob('*.png'):assert Image.open(path).size==(420,500)
film=Image.open(art/'cinematic-wide-sheet.png');assert abs((film.width/3)/(film.height/2)-16/9)<.03
print('PASS raster environments, transparent title, favicon, Jurassic Kickers crest and 12 regional maps')
