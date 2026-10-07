"""Prepare generated transparent emblem atlases and assign one unique PNG per squad.

Image generation creates the artwork; this script only crops, resizes and packs it
for the game. Run after saving page-00.png ... page-09.png and jurassic.png in
arcade/assets/art/crests/sources/. Stable IDs and all gameplay data are preserved.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib
root=Path(__file__).resolve().parents[1]
folder=root/'arcade/assets/art/crests';sources=folder/'sources'
manifest=json.loads((folder/'manifest.json').read_text())
assert len(manifest)==145 and len({t['id'] for t in manifest})==145

def prepare(cell):
    assert cell.mode=='RGBA' and cell.getchannel('A').getextrema()[0]==0,'Transparent source required'
    bounds=cell.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
    assert bounds,'Empty emblem'
    art=cell.crop(bounds);art.thumbnail((272,272),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(320,320));out.paste(art,((320-art.width)//2,(320-art.height)//2))
    return out

sheets={i:Image.open(sources/f'page-{i:02}.png').convert('RGBA') for i in range(10)}
for entry in manifest:
    sheet=sheets[entry['page']];cell=entry['cell'];col=cell%4;row=cell//4
    bounds=(round(col*sheet.width/4),round(row*sheet.height/4),round((col+1)*sheet.width/4),round((row+1)*sheet.height/4))
    prepare(sheet.crop(bounds)).save(folder/entry['file'],optimize=True)
prepare(Image.open(sources/'jurassic.png').convert('RGBA')).save(folder/'jurassic.png',optimize=True)
# Check every image exists and is genuinely different before touching the catalogue.
digests=[hashlib.sha256(Image.open(folder/t['file']).tobytes()).hexdigest() for t in manifest]
assert len(set(digests))==145,'Duplicate team emblems'
path=root/'game/catalog.js';raw=path.read_text();catalog=json.loads(raw.split('window.SA2000_CATALOG=',1)[1].rstrip(';\n'))
by_id={e['id']:e for e in manifest}
for team in catalog['club']+catalog['national']:
    team['crest']='arcade/assets/art/crests/'+by_id[team['id']]['file']
path.write_text('/* Fictional arcade identities; stable internal IDs preserve existing saves. */\nwindow.SA2000_CATALOG='+json.dumps(catalog,separators=(',',':'),ensure_ascii=False)+';\n')
# Review gallery; never loaded during a match.
gallery_entries=manifest+[{'index':145,'name':'Jurassic Kickers','file':'jurassic.png'}]
cols=8;w=240;h=270;gallery=Image.new('RGB',(cols*w,((len(gallery_entries)+cols-1)//cols)*h),'#071126');draw=ImageDraw.Draw(gallery)
try:font=ImageFont.truetype('/System/Library/Fonts/Menlo.ttc',15)
except OSError:font=ImageFont.load_default()
for entry in gallery_entries:
    i=entry['index'];im=Image.open(folder/entry['file']);im.thumbnail((220,220),Image.Resampling.LANCZOS);x=i%cols*w+(w-im.width)//2;y=i//cols*h+8
    gallery.paste(im,(x,y),im);draw.text((i%cols*w+w/2,i//cols*h+239),entry['name'],font=font,fill='#ffe765',anchor='mm')
gallery.save(folder/'gallery.jpg',quality=92)
print('Installed 145 unique transparent team emblems + Jurassic Kickers; stable IDs and roster data preserved.')
