"""Replace displayed team/player identities, preserving IDs, attributes and save compatibility."""
from pathlib import Path
import json, re
root=Path(__file__).resolve().parents[1];path=root/'game/catalog.js';raw=path.read_text();catalog=json.loads(raw.split('window.SA2000_CATALOG=',1)[1].rstrip(';\n'))
prefix=['Veyra','Koryn','Azuro','Nexara','Velkor','Sorya','Orvex','Kaizen','Ravora','Lumex','Zephra','Talvox','Miraka','Draxen','Asteron','Elyra','Zorvak','Kyrova','Valtrix','Novarae','Teryn','Xavora','Yureka','Valkora','Onyra','Javex','Arvona','Renvox','Morvex','Sylkara','Feyron','Orynda']
suffix=['Comets','Falcons','Drakes','Wolves','Titans','Phoenix','Storm','Knights','Raptors','Meteors','Guardians','Blades','Vipers','Stars','Lynx','Giants']
first=['Yoren','Kavri','Zeylo','Aroven','Nivak','Velrin','Toryn','Seyra','Korvi','Davren','Mavik','Jorven','Ryxel','Fenro','Orven','Zavik','Talven','Nyro','Veyko','Lurian','Axren','Sorvik','Kevar','Yavren','Deyro','Varik','Xeylo','Ruvan','Lorvek','Kyran','Mevra','Teyrik']
syllables=['va','ki','zor','ren','vak','lo','mir','dra','xen','jor','tal','vek','nor','sy','ry','vor','kal','dor','zel','ny','tar','vex','lor','ka','ryn','fer','xel','tor','ma','zen','val','kor']
aliases={};number=0
for ti,t in enumerate(catalog['club']+catalog['national']):
 if not t.get('arcadeFictional'): aliases[t['name']]=prefix[ti%len(prefix)]+' '+suffix[(ti//len(prefix))%len(suffix)]
 t['name']=aliases.get(t['name'],t['name']);t['season']='';t['arcadeFictional']=True;t['crest']='arcade/assets/art/crests/team-'+str(ti).zfill(3)+'.png'
 number+=len(t['players'])  # player names come from tools/fictional-player-names.py (nation-flavoured, owner-chosen names kept)
path.write_text('/* Fictional arcade identities; stable internal IDs preserve existing saves. */\nwindow.SA2000_CATALOG='+json.dumps(catalog,separators=(',',':'),ensure_ascii=False)+';\n')
# Keep scenario tests tied to the same squads, now under their fictional display names.
for test in (root/'arcade/tests').glob('*tests.js'):
 text=test.read_text()
 for old,new in aliases.items():
  text=text.replace("'"+old+"'", "'"+new+"'").replace('"'+old+'"','"'+new+'"')
 test.write_text(text)
print(len(catalog['club']+catalog['national']),'fictional squads;',number,'fictional players')
