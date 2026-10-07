"""Team crests carrying the arcade names: every team gets the embroidered shield of
tools/generate-coherent-crests.py (same artwork family as the existing generated crests),
rendered with its catalog name, a monogram from that name, its kit colours (flag for nations)
and its year. Originals are left untouched; output goes to arcade/assets/crests-arcade/<id>.png
and the catalog points there (the original path is kept in crestOriginal).
Usage: python3 tools/rename-crests.py
"""
from pathlib import Path
import importlib.util, json, re, unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'arcade/assets/crests-arcade'
spec = importlib.util.spec_from_file_location('coherent', ROOT / 'tools/generate-coherent-crests.py')
cc = importlib.util.module_from_spec(spec); spec.loader.exec_module(cc)
nat = cc.nat


def monogram(name):
    plain = unicodedata.normalize('NFD', name).encode('ascii', 'ignore').decode().upper()
    words = [w for w in re.split(r'[^A-Z]+', plain) if w]
    if len(words) >= 2: return ''.join(w[0] for w in words[:3])
    return words[0][:3] if words else 'FC'


def year_of(team):
    """Year printed on the crest: from the original file name (club season or nation year)."""
    kind, _, key = team['id'].partition('_')[2].partition('_') if team['id'].startswith('arc_') else ('', '', '')
    if kind == 'club' and key in cc.CLUBS: return cc.CLUBS[key][1]
    if kind == 'national' and key in cc.EXTRA_NATIONS: return cc.EXTRA_NATIONS[key][1]
    src = Path(team.get('crestOriginal') or team['crest']).stem
    m = re.search(r'_(\d{4})$', src)
    if m:
        a, b = m.group(1)[:2], m.group(1)[2:]
        if team['id'].startswith(('arc_national', )) or len(set([a, b])) == 0: return m.group(1)
        # Club seasons like 9495 -> 1994/95; four-digit years stay.
        if src.split('_')[0] in nat.FLAGS: return m.group(1)
        century = '19' if int(a) > 30 else '20'
        return f'{century}{a}/{b}'
    return '1990'


def national_key(team):
    src = Path(team.get('crestOriginal') or team['crest']).stem
    key = src.rsplit('_', 1)[0]
    if team['id'].startswith('arc_national_'): key = team['id'][len('arc_national_'):]
    return key if key in nat.FLAGS or key in cc.EXTRA_FLAGS else None


def render(team):
    name, kit = team['name'], team.get('arcadeKit') or {}
    key = national_key(team) if team in CAT['national'] else None
    if key:
        fn = nat.FLAGS.get(key) or cc.EXTRA_FLAGS[key]
        return cc.render(name, fn, cc.band_for(cc.dominant(fn)), monogram(name), 'NAZIONALE', year_of(team), cc.hexc('#152c63'))
    full = lambda h: '#' + ''.join(ch * 2 for ch in h[1:]) if len(h) == 4 else h
    c1, c2, pattern = full(kit.get('shirtPrimary', '#2050a0')), full(kit.get('shirtSecondary', '#ffffff')), kit.get('pattern', 'solid')
    p, s = cc.hexc(c1), cc.hexc(c2)
    band = cc.band_for(p if cc.luminance(p) < 215 else s)
    emblem = band if cc.luminance(band) < 120 else cc.shade(band, .6)
    scroll = 'NAZIONALE' if team in CAT['national'] else 'FOOTBALL CLUB'
    return cc.render(name, lambda im: cc.club_field(im, c1, c2, pattern), band, monogram(name), scroll, year_of(team), emblem)


path = ROOT / 'game/catalog.js'; raw = path.read_text(); st, en = raw.index('{'), raw.rindex('}') + 1; CAT = json.loads(raw[st:en])
OUT.mkdir(parents=True, exist_ok=True); n = 0
for team in CAT['club'] + CAT['national']:
    team['crestOriginal'] = team.get('crestOriginal') or team['crest'].split('?')[0]
    render(team).save(OUT / (team['id'] + '.png'), optimize=True)
    team['crest'] = 'arcade/assets/crests-arcade/' + team['id'] + '.png'; n += 1
path.write_text(raw[:st] + json.dumps(CAT, ensure_ascii=False, separators=(',', ':')) + raw[en:])
print('rendered', n, 'crests with arcade names')
