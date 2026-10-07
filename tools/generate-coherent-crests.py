#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stemmi coerenti con lo stile dei club (scudo ricamato 320x480, bordo oro,
nome in alto, emblema centrale, nastro crema e anno in basso).

Rigenera:
  - le nazionali generate in assets/crests/national/*.png (non i bespoke
    brazil_2002, germany_1990, italy_2006, france_1998 già in stile club);
  - le squadre Arcade aggiunte (arcade/assets/crests/arc_*.png) e aggiorna
    i percorsi in arcade/assets/world-roster.js da .svg a .png.

Uso:  python3 tools/generate-coherent-crests.py
"""
import importlib.util, json, math, os, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('natcrests', os.path.join(ROOT, 'tools', 'generate-national-crests.py'))
nat = importlib.util.module_from_spec(spec); spec.loader.exec_module(nat)
hexc, star, fill_h, fill_v = nat.hexc, nat.star, nat.fill_h, nat.fill_v

SS = 3
W, H = 320 * SS, 480 * SS
SERIF = nat.first_font('/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
                       '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
                       '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf')
CREAM, CREAM_DARK, INK = hexc('#f6ecd2'), hexc('#cdb98a'), hexc('#2a1d12')
BESPOKE = set()  # previous bespoke art kept in assets/crests/national/previous-style

# ------------------------------------------------------------- geometry --
def bezier(p0, p1, p2, n=40):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]

def shield(inset=0.0):
    """Club silhouette: raised centre top, chamfered shoulders, long sides, point."""
    i = inset
    x0, x1 = (0.035 + i) * W, (0.965 - i) * W
    top, shoulder, side = (0.012 + i * 0.9) * H, (0.07 + i * 0.6) * H, 0.60 * H
    tip = (0.905 - i * 0.75) * H
    pts = []
    pts += bezier((x0, shoulder), (W * 0.27, top + 0.03 * H), (W / 2, top))
    pts += bezier((W / 2, top), (W * 0.73, top + 0.03 * H), (x1, shoulder))[1:]
    pts += [(x1, side)]
    pts += bezier((x1, side), (x1 - 0.01 * W, tip - 0.11 * H), (W / 2, tip))[1:]
    pts += bezier((W / 2, tip), (x0 + 0.01 * W, tip - 0.11 * H), (x0, side))[1:]
    return pts

def mask_of(points, value=255):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(points, fill=value); return m

def font_fit(text, max_w, start, minimum):
    size = start
    while size > minimum:
        f = ImageFont.truetype(SERIF, size)
        b = f.getbbox(text)
        if b[2] - b[0] <= max_w: return f
        size -= 2
    return ImageFont.truetype(SERIF, minimum)

def shade(rgb, k):
    return tuple(max(0, min(255, int(c * k))) for c in rgb)

def luminance(rgb):
    return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]

def embroidered_text(img, xy, text, font, fill, outline, anchor='mm', stroke=None):
    d = ImageDraw.Draw(img)
    s = stroke if stroke is not None else max(2, font.size // 12)
    d.text((xy[0] + SS * 2, xy[1] + SS * 3), text, font=font, fill=(0, 0, 0, 110), anchor=anchor, stroke_width=s, stroke_fill=(0, 0, 0, 110))
    d.text(xy, text, font=font, fill=fill + (255,), anchor=anchor, stroke_width=s, stroke_fill=outline + (255,))

# ---------------------------------------------------------- club fields --
def club_field(img, c1, c2, pattern):
    w, h = img.size
    d = ImageDraw.Draw(img)
    if pattern == 'vertical_stripes':
        n = 7
        for i in range(n): d.rectangle([i * w / n, 0, (i + 1) * w / n + 1, h], fill=hexc(c1 if i % 2 == 0 else c2))
    elif pattern == 'halves':
        fill_v(img, [c1, c2])
    elif pattern == 'horizontal_band':
        img.paste(hexc(c1), [0, 0, w, h]); d.rectangle([0, h * 0.40, w, h * 0.56], fill=hexc(c2))
    elif pattern == 'hoops':
        fill_h(img, [c1, c2] * 5)
    elif pattern == 'sash':
        img.paste(hexc(c1), [0, 0, w, h]); lw = w * 0.2
        d.polygon([(0, h * 0.15), (lw, h * 0.15 - lw * 0.4), (w, h * 0.78), (w - lw, h * 0.78 + lw * 0.4)], fill=hexc(c2))
    else:  # trim: plain shirt with two contrasting pinstripes
        img.paste(hexc(c1), [0, 0, w, h])
        for x in (0.2, 0.8): d.rectangle([w * x - w * 0.025, 0, w * x + w * 0.025, h], fill=hexc(c2))

# Extra flags for the Arcade-only national teams (plain geometric fields).
def flag_china(im):
    w, h = im.size; im.paste(hexc('#DE2910'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    star(d, w * .2, h * .2, h * .08, hexc('#FFDE00'))
    for a in range(4): star(d, w * .34 + math.cos(a - 1.2) * w * .05, h * .2 + math.sin(a - 1.2) * h * .07, h * .025, hexc('#FFDE00'))
def flag_congo(im):
    w, h = im.size; im.paste(hexc('#007FFF'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    for lw, col in ((h * .22, '#F7D618'), (h * .15, '#CE1021')): d.polygon([(0, h - lw), (w - lw, 0), (w, 0), (w, lw), (lw, h), (0, h)], fill=hexc(col))
    star(d, w * .18, h * .18, h * .1, hexc('#F7D618'))
def flag_jamaica(im):
    w, h = im.size; im.paste(hexc('#009B3A'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    d.polygon([(0, 0), (w / 2, h / 2), (0, h)], fill=(0, 0, 0)); d.polygon([(w, 0), (w / 2, h / 2), (w, h)], fill=(0, 0, 0))
    lw = h * .14
    for (x0, y0, x1, y1) in [(0, 0, w, h), (0, h, w, 0)]:
        a = math.atan2(y1 - y0, x1 - x0); dx, dy = math.sin(a) * lw / 2, -math.cos(a) * lw / 2
        d.polygon([(x0 + dx, y0 + dy), (x1 + dx, y1 + dy), (x1 - dx, y1 - dy), (x0 - dx, y0 - dy)], fill=hexc('#FED100'))
def flag_panama(im):
    w, h = im.size; d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w / 2, h / 2], fill=(255, 255, 255)); d.rectangle([w / 2, 0, w, h / 2], fill=hexc('#DA121A'))
    d.rectangle([0, h / 2, w / 2, h], fill=hexc('#072357')); d.rectangle([w / 2, h / 2, w, h], fill=(255, 255, 255))
    star(d, w * .25, h * .25, h * .09, hexc('#072357')); star(d, w * .75, h * .75, h * .09, hexc('#DA121A'))
def flag_qatar(im):
    w, h = im.size; im.paste(hexc('#8A1538'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    pts = [(0, 0), (w * .3, 0)]
    for i in range(9): pts += [(w * .38, h * (i + .5) / 9), (w * .3, h * (i + 1) / 9)]
    d.polygon(pts + [(0, h)], fill=(255, 255, 255))
def flag_uae(im):
    w, h = im.size; fill_h(im, ['#00732F', '#FFFFFF', '#000000']); ImageDraw.Draw(im).rectangle([0, 0, w * .26, h], fill=hexc('#FF0000'))
def flag_zambia(im):
    w, h = im.size; im.paste(hexc('#198A00'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    for i, col in enumerate(['#DE2010', '#000000', '#EF7D00']): d.rectangle([w * (.64 + i * .12), h * .4, w * (.76 + i * .12), h], fill=hexc(col))
def flag_nz(im):
    w, h = im.size; im.paste(hexc('#012169'), [0, 0, w, h]); d = ImageDraw.Draw(im)
    for x, y in ((.7, .25), (.82, .45), (.6, .5), (.72, .78)): star(d, w * x, h * y, h * .06, (255, 255, 255)); star(d, w * x, h * y, h * .04, hexc('#C8102E'))
    d.rectangle([0, h * .2, w * .45, h * .3], fill=(255, 255, 255)); d.rectangle([w * .17, 0, w * .27, h * .5], fill=(255, 255, 255))
    d.rectangle([0, h * .225, w * .45, h * .275], fill=hexc('#C8102E')); d.rectangle([w * .195, 0, w * .245, h * .5], fill=hexc('#C8102E'))

EXTRA_FLAGS = {
    'algeria': lambda im: fill_v(im, ['#006233', '#FFFFFF']),
    'bolivia': lambda im: fill_h(im, ['#D52B1E', '#F9E300', '#007934']),
    'canada': lambda im: fill_v(im, ['#D52B1E', '#FFFFFF', '#D52B1E'], [1, 2, 1]),
    'china': flag_china, 'congo': flag_congo,
    'ecuador': lambda im: fill_h(im, ['#FFDD00', '#034EA2', '#ED1C24'], [2, 1, 1]),
    'egypt': lambda im: fill_h(im, ['#CE1126', '#FFFFFF', '#000000']),
    'honduras': lambda im: fill_h(im, ['#0073CF', '#FFFFFF', '#0073CF']),
    'iran': lambda im: fill_h(im, ['#239F40', '#FFFFFF', '#DA0000']),
    'iraq': lambda im: fill_h(im, ['#CE1126', '#FFFFFF', '#000000']),
    'jamaica': flag_jamaica,
    'mali': lambda im: fill_v(im, ['#14B53A', '#FCD116', '#CE1126']),
    'newzealand': flag_nz, 'panama': flag_panama,
    'peru': lambda im: fill_v(im, ['#D91023', '#FFFFFF', '#D91023']),
    'qatar': flag_qatar,
    'tunisia': lambda im: nat.fill_circle_disc(im, '#E70013', '#FFFFFF', .26),
    'uae': flag_uae,
    'uzbek': lambda im: fill_h(im, ['#0099B5', '#CE1126', '#FFFFFF', '#CE1126', '#1EB53A'], [6, .4, 5, .4, 6]),
    'venezuela': lambda im: fill_h(im, ['#FFCC00', '#00247D', '#CF142B']),
    'zambia': flag_zambia,
}
# FIFA code in the emblem, federation founding year on the bottom scroll.
EXTRA_NATIONS = {
    'algeria': ('ALG', '1962'), 'bolivia': ('BOL', '1925'), 'canada': ('CAN', '1912'), 'china': ('CHN', '1924'),
    'congo': ('COD', '1919'), 'ecuador': ('ECU', '1925'), 'egypt': ('EGY', '1921'), 'honduras': ('HON', '1951'),
    'iran': ('IRN', '1920'), 'iraq': ('IRQ', '1948'), 'jamaica': ('JAM', '1910'), 'mali': ('MLI', '1960'),
    'newzealand': ('NZL', '1891'), 'panama': ('PAN', '1937'), 'peru': ('PER', '1922'), 'qatar': ('QAT', '1960'),
    'tunisia': ('TUN', '1957'), 'uae': ('UAE', '1971'), 'uzbek': ('UZB', '1946'), 'venezuela': ('VEN', '1926'),
    'zambia': ('ZAM', '1929'),
}
# Club monogram and founding year; field pattern refinements for recognisable shirts.
CLUBS = {
    'napoli': ('N', '1926'), 'atalanta': ('BC', '1907'), 'bologna': ('BFC', '1909'), 'cagliari': ('CC', '1920'),
    'psg': ('PSG', '1970'), 'atletico': ('ATM', '1903'), 'sporting': ('SCP', '1906'), 'psv': ('PSV', '1913'),
    'rangers': ('RFC', '1872'), 'fener': ('FB', '1907'), 'boca': ('CABJ', '1905'), 'river': ('CARP', '1901'),
    'flamengo': ('CRF', '1895'), 'santos': ('SFC', '1912'), 'saopaulo': ('SPFC', '1930'), 'corinthians': ('SCCP', '1910'),
    'palmeiras': ('SEP', '1914'), 'penarol': ('CAP', '1891'), 'nacional': ('CNF', '1899'), 'america': ('CA', '1916'),
    'chivas': ('CDG', '1906'), 'galaxy': ('LAG', '1994'), 'dcunited': ('DCU', '1995'), 'alahly': ('SC', '1907'),
    'zamalek': ('ZSC', '1911'), 'raja': ('RCA', '1949'), 'sundowns': ('MSFC', '1970'), 'alhilal': ('HFC', '1957'),
    'kashima': ('KA', '1947'), 'urawa': ('URD', '1950'), 'jeonbuk': ('JHM', '1994'), 'shanghai': ('SSH', '1993'),
    'sydney': ('SFC', '2004'), 'auckland': ('ACFC', '2004'),
}
PATTERN_FIX = {'river': 'sash', 'flamengo': 'hoops', 'sporting': 'hoops'}

# ---------------------------------------------------------------- render --
def render(name, field_fn, band_rgb, emblem_text, scroll_text, year, emblem_rgb):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    outer, rim_in, field_in = shield(0), shield(0.035), shield(0.05)
    # Drop shadow
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).polygon([(x + 4 * SS, y + 6 * SS) for x, y in outer], fill=(0, 0, 0, 120))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(5 * SS)))
    # Gold embroidered rim with vertical gradient and twisted-thread texture
    gold = Image.new('RGBA', (W, H)); gd = ImageDraw.Draw(gold)
    for y in range(H):
        t = y / H; k = 0.5 + 0.5 * math.cos(t * math.pi * 2.2)
        gd.line([(0, y), (W, y)], fill=nat.lerp(hexc('#f7e3a1'), hexc('#a77a2c'), 1 - k * .8) + (255,))
    for o in range(-H, W, 5 * SS): gd.line([(o, 0), (o + H * .5, H)], fill=(255, 245, 200, 60), width=SS)
    ImageDraw.Draw(img).polygon(outer, fill=hexc('#3a2a10') + (255,))
    img.paste(gold, (0, 0), mask_of(shield(0.006)))
    ImageDraw.Draw(img).polygon(rim_in, fill=hexc('#4a3713') + (255,))
    # Team field
    field = Image.new('RGB', (W, H), (255, 255, 255)); field_fn(field)
    fm = mask_of(field_in)
    img.paste(field.convert('RGBA'), (0, 0), fm)
    d = ImageDraw.Draw(img)
    # Top name band separated by a gold curve
    arc_y = 0.205 * H
    curve = [(W * i / 40, arc_y + 0.03 * H * math.sin(math.pi * i / 40)) for i in range(41)]
    above = Image.new('L', (W, H), 0); ImageDraw.Draw(above).polygon([(0, 0), (W, 0)] + curve[::-1], fill=255)
    img.paste(band_rgb + (255,), (0, 0), ImageChops.multiply(above, fm))
    d = ImageDraw.Draw(img)
    d.line(curve, fill=hexc('#3a2a10') + (255,), width=7 * SS)
    d.line(curve, fill=hexc('#ecc96a') + (255,), width=4 * SS)
    # Name (one or two lines) in cream serif with dark outline
    words = name.upper().split()
    lines = [name.upper()]
    big = font_fit(lines[0], W * .8, int(H * .1), int(H * .045))
    if big.size < H * .07 and len(words) > 1:
        cut = max(range(1, len(words)), key=lambda i: -abs(len(' '.join(words[:i])) - len(' '.join(words[i:]))))
        lines = [' '.join(words[:cut]), ' '.join(words[cut:])]
    if len(lines) == 1:
        embroidered_text(img, (W / 2, H * .13), lines[0], big, CREAM, shade(band_rgb, .35))
    else:
        f1 = font_fit(lines[0], W * .68, int(H * .058), int(H * .03)); f2 = font_fit(lines[1], W * .78, int(H * .072), int(H * .03))
        embroidered_text(img, (W / 2, H * .095), lines[0], f1, CREAM, shade(band_rgb, .35))
        embroidered_text(img, (W / 2, H * .158), lines[1], f2, CREAM, shade(band_rgb, .35))
    # Central emblem: gold-ringed roundel, monogram and three stars
    cx, cy, r = W / 2, H * .445, W * .245
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r + 3 * SS, cy - r + 5 * SS, cx + r + 3 * SS, cy + r + 5 * SS], fill=(0, 0, 0, 110))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hexc('#f1d27a') + (255,), outline=hexc('#6b4c16') + (255,), width=2 * SS)
    d.ellipse([cx - r * .9, cy - r * .9, cx + r * .9, cy + r * .9], fill=hexc('#7a5a1c') + (255,))
    d.ellipse([cx - r * .85, cy - r * .85, cx + r * .85, cy + r * .85], fill=emblem_rgb + (255,))
    for a in range(0, 360, 12):  # stitched inner ring
        t = math.radians(a); d.ellipse([cx + math.cos(t) * r * .95 - SS * 1.5, cy + math.sin(t) * r * .95 - SS * 1.5, cx + math.cos(t) * r * .95 + SS * 1.5, cy + math.sin(t) * r * .95 + SS * 1.5], fill=hexc('#fff3c4') + (255,))
    for i, x in enumerate((-.32, 0, .32)): star(d, cx + x * r, cy - r * (.45 if i == 1 else .38), r * .13, hexc('#f6d66a') + (255,))
    ef = font_fit(emblem_text, r * 1.45, int(r * (.85 if len(emblem_text) <= 2 else .62)), int(r * .3))
    embroidered_text(img, (cx, cy + r * .12), emblem_text, ef, CREAM, hexc('#3b2a0f'))
    # Bottom panel in band colour (year area)
    low = Image.new('L', (W, H), 0); ImageDraw.Draw(low).polygon(field_in, fill=255); ImageDraw.Draw(low).rectangle([0, 0, W, H * .7], fill=0)
    img.paste(shade(band_rgb, .92) + (255,), (0, 0), low)
    # Curled cream scroll
    d = ImageDraw.Draw(img)
    sy, sh_ = H * .675, H * .07
    x0, x1 = W * .11, W * .89
    curve = lambda x: -math.sin((x - x0) / (x1 - x0) * math.pi) * H * .018
    top_edge = [(x, sy + curve(x)) for x in [x0 + (x1 - x0) * i / 40 for i in range(41)]]
    scroll = top_edge + [(x, y + sh_) for x, y in reversed(top_edge)]
    for side in (-1, 1):  # folded tails behind the scroll
        bx = x0 if side < 0 else x1
        tail = [(0, H * .02), (W * .075, H * .03), (W * .045, sh_ * .55 + H * .025), (W * .075, sh_ + H * .03), (0, sh_ + H * .02)]
        d.polygon([(bx - side * dx, sy + dy) for dx, dy in tail], fill=CREAM_DARK + (255,), outline=hexc('#6d5526') + (255,))
    d.polygon(scroll, fill=CREAM + (255,), outline=hexc('#6d5526') + (255,))
    d.line(scroll + [scroll[0]], fill=hexc('#8a6c31') + (255,), width=2 * SS)
    sf = font_fit(scroll_text.upper(), (x1 - x0) * .86, int(H * .048), int(H * .026))
    d.text((W / 2, sy + sh_ / 2 - H * .012), scroll_text.upper(), font=sf, fill=INK + (255,), anchor='mm')
    yf = ImageFont.truetype(SERIF, int(H * .062))
    embroidered_text(img, (W / 2, H * .81), year, yf, CREAM, shade(band_rgb, .3), stroke=SS)
    # Embroidery: fine thread lines and a soft top light on the whole patch
    weave = Image.new('RGBA', (W, H), (0, 0, 0, 0)); wd = ImageDraw.Draw(weave)
    for o in range(-H, W, 4 * SS):
        wd.line([(o, 0), (o + H, H)], fill=(255, 255, 255, 18), width=SS)
        wd.line([(o + 2 * SS, 0), (o + H + 2 * SS, H)], fill=(0, 0, 0, 14), width=SS)
    weave.putalpha(ImageChops.multiply(weave.getchannel('A'), fm))
    img = Image.alpha_composite(img, weave)
    light = Image.new('RGBA', (W, H), (255, 255, 255, 0)); lm = Image.new('L', (W, H), 0); ld = ImageDraw.Draw(lm)
    for y in range(int(H * .5)): ld.line([(0, y), (W, y)], fill=int(20 * (1 - y / (H * .5))))
    light.putalpha(ImageChops.multiply(lm, fm)); img = Image.alpha_composite(img, light)
    # Cream stitch line just inside the gold rim
    d = ImageDraw.Draw(img); edge = shield(0.043)
    for i in range(0, len(edge) - 1, 2): d.line([edge[i], edge[i + 1]], fill=hexc('#fff3cf') + (230,), width=2 * SS)
    return img.resize((320, 480), Image.LANCZOS)

def dominant(field_fn):
    probe = Image.new('RGB', (60, 40), (255, 255, 255)); field_fn(probe)
    colors = sorted(probe.getcolors(4000), reverse=True)
    for count, c in colors:
        if luminance(c) < 200: return c
    return colors[0][1]

def band_for(rgb):
    # Top band and bottom panel stay deep enough for cream lettering.
    return rgb if luminance(rgb) < 150 else shade(rgb, .55) if luminance(rgb) < 215 else hexc('#14306b')

def national(key, name, code, year):
    fn = nat.FLAGS.get(key) or EXTRA_FLAGS[key]
    base = band_for(dominant(fn))
    return render(name, fn, base, code, 'NAZIONALE', year, hexc('#152c63'))

def club(key, name, c1, c2, pattern):
    code, year = CLUBS[key]
    p, s = hexc(c1), hexc(c2)
    band = band_for(p if luminance(p) < 215 else s)
    emblem = band if luminance(band) < 120 else shade(band, .6)
    return render(name, lambda im: club_field(im, c1, c2, PATTERN_FIX.get(key, pattern)), band, code, name.split()[-1] if len(name) > 14 else 'FOOTBALL CLUB', year, emblem)

def main():
    made = 0
    ndir = os.path.join(ROOT, 'assets', 'crests', 'national')
    for fname in sorted(os.listdir(ndir)):
        if not fname.endswith('.png') or fname[:-4] in BESPOKE: continue
        key, year = fname[:-4].rsplit('_', 1)
        if key not in nat.FLAGS: continue
        national(key, nat.NAMES_IT[key], nat.CODES.get(key, key[:3].upper()), year).save(os.path.join(ndir, fname), optimize=True); made += 1
    roster_path = os.path.join(ROOT, 'arcade', 'assets', 'world-roster.js')
    src = open(roster_path, encoding='utf-8').read()
    data = json.loads(re.search(r'window\.S9ArcadeRosterData=(\{.*\});', src, re.S).group(1))
    for t in data['clubs'] + data['nations']:
        kind, key = t['id'].split('_', 2)[1:]
        out = 'arcade/assets/crests/' + t['id'] + '.png'
        if kind == 'club':
            k = t['arcadeKit']; img = club(key, t['name'], k['shirtPrimary'], k['shirtSecondary'], k['pattern'])
        else:
            code, year = EXTRA_NATIONS[key]; img = national(key, t['name'], code, year)
        img.save(os.path.join(ROOT, out), optimize=True); t['crest'] = out; made += 1
    src = re.sub(r'window\.S9ArcadeRosterData=\{.*\};', lambda m: 'window.S9ArcadeRosterData=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';', src, flags=re.S)
    open(roster_path, 'w', encoding='utf-8').write(src)
    print('generated', made)

if __name__ == '__main__':
    main()
