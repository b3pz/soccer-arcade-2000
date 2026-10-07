"""Install recognizable fictional names from the explicit visual-branding plan.
Keeps player identities, IDs, ratings, kits and the existing AI play styles stable.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
plan=json.loads((root/'arcade/assets/art/crests/branding-plan.json').read_text());by_id={t['id']:t for t in plan}
p=root/'game/catalog.js';raw=p.read_text();catalog=json.loads(raw.split('window.SA2000_CATALOG=',1)[1].rstrip(';\n'));aliases={}
for t in catalog['club']+catalog['national']:
 spec=by_id[t['id']];old=t['name'];t.setdefault('arcadeStyle',['press','counter','possession'][sum(map(ord,old))%3]);t['name']=spec['name'];t['arcadeReferenceName']=spec['referenceName'];aliases[old]=t['name']
p.write_text('/* Fictional arcade identities; stable IDs, attributes and original color references. */\nwindow.SA2000_CATALOG='+json.dumps(catalog,separators=(',',':'),ensure_ascii=False)+';\n')
for test in (root/'arcade/tests').glob('*tests.js'):
 s=test.read_text()
 for old,new in aliases.items():s=s.replace("'"+old+"'","'"+new+"'").replace('"'+old+'"','"'+new+'"')
 test.write_text(s)
print(len(plan),'recognizable fictional team names installed; players and gameplay data unchanged.')
