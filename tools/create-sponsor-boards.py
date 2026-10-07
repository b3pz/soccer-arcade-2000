"""Ten sponsor boards parodying 1990s stadium advertisers, appended to arcade/assets/art/sponsors.png.

Each strip matches the painted ones (2172x181): bold italic wordmark with a dark outline and a
drop shadow, a simple icon at each end, speed stripes, flat arcade colours. Brand names are invented.
The original four painted strips are kept as the first rows (sponsors-base.png is the untouched copy).
Usage: python3 tools/create-sponsor-boards.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ART = Path(__file__).resolve().parents[1] / 'arcade/assets/art'
W, H = 2172, 181
FONT = next(p for p in ['/System/Library/Fonts/Supplemental/Arial Black.ttf', '/System/Library/Fonts/Supplemental/Impact.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'] if Path(p).exists())

BRANDS = [  # 1990s stadium sponsors, parodied: text, background, text colour, outline, accent, icon
    ('PARMALAIT', '#ffffff', '#123c9c', '#0a1f5a', '#e1262c', 'drop'),
    ('PIRELLA', '#ffe23b', '#e1262c', '#3a0606', '#101010', 'tyre'),
    ('OPAL', '#ffd51e', '#1b2f7a', '#081440', '#1b2f7a', 'bolt'),
    ('SHARX', '#ffffff', '#e1262c', '#5a0606', '#1b1b1b', 'none'),
    ('JVK', '#0d1a5c', '#ffffff', '#020818', '#ff2a2a', 'none'),
    ('FUJIX FILM', '#139a49', '#ffffff', '#064022', '#e1262c', 'film'),
    ('KARLSBRAU', '#0d6b33', '#ffffff', '#032a14', '#ffd51e', 'crown'),
    ('DIADORO', '#0b2a8a', '#ffe23b', '#04103a', '#ffffff', 'star'),
    ('KAPA', '#101010', '#ffffff', '#000000', '#ffffff', 'duo'),
    ('PHILIPZ', '#1d4fd8', '#ffffff', '#0a1f66', '#bfe3ff', 'wave'),
]


def hexc(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def icon(d, kind, cx, cy, r, col, dark):
    c, k = hexc(col), hexc(dark)
    if kind == 'bubbles':
        for dx, dy, rr in ((-.4, .3, .45), (.35, -.1, .6), (-.1, -.55, .3)): d.ellipse([cx + dx * r - rr * r, cy + dy * r - rr * r, cx + dx * r + rr * r, cy + dy * r + rr * r], outline=c, width=10)
    elif kind == 'slice':
        d.polygon([(cx - r, cy - r * .7), (cx + r, cy - r * .7), (cx, cy + r)], fill=c, outline=k, width=8)
        for dx, dy in ((-.3, -.3), (.3, -.3), (0, .2)): d.ellipse([cx + dx * r - 16, cy + dy * r - 16, cx + dx * r + 16, cy + dy * r + 16], fill=(212, 35, 28))
    elif kind == 'phone':
        d.rounded_rectangle([cx - r * .55, cy - r, cx + r * .55, cy + r], 18, fill=k, outline=c, width=10); d.rectangle([cx - r * .4, cy - r * .75, cx + r * .4, cy + r * .55], fill=c)
    elif kind == 'rocket':
        d.polygon([(cx + r, cy), (cx - r * .5, cy - r * .5), (cx - r * .5, cy + r * .5)], fill=c, outline=k, width=8); d.polygon([(cx - r * .5, cy - r * .3), (cx - r, cy), (cx - r * .5, cy + r * .3)], fill=(255, 140, 30))
    elif kind == 'bolt':
        d.polygon([(cx + r * .2, cy - r), (cx - r * .6, cy + r * .15), (cx, cy + r * .15), (cx - r * .2, cy + r), (cx + r * .6, cy - r * .15), (cx, cy - r * .15)], fill=c, outline=k, width=8)
    elif kind == 'atom':
        for a in (0, 60, 120):
            box = Image.new('RGBA', (int(r * 2.4), int(r * 2.4)))
            ImageDraw.Draw(box).ellipse([0, r * .8, r * 2.4, r * 1.6], outline=c + (255,), width=9)
            box = box.rotate(a, resample=Image.BICUBIC); IMG.alpha_composite(box, (int(cx - r * 1.2), int(cy - r * 1.2)))
        d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=c)
    elif kind == 'tv':
        d.rounded_rectangle([cx - r, cy - r * .7, cx + r, cy + r * .7], 16, fill=k, outline=c, width=10); d.line([(cx - r * .4, cy - r * 1.1), (cx, cy - r * .7), (cx + r * .4, cy - r * 1.1)], fill=c, width=8)
    elif kind == 'drop':
        d.ellipse([cx - r * .6, cy - r * .2, cx + r * .6, cy + r * .9], fill=c); d.polygon([(cx, cy - r), (cx - r * .55, cy + r * .2), (cx + r * .55, cy + r * .2)], fill=c)
    elif kind == 'tyre':
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c); d.ellipse([cx - r * .5, cy - r * .5, cx + r * .5, cy + r * .5], fill=(200, 200, 200))
    elif kind == 'film':
        d.rectangle([cx - r, cy - r * .6, cx + r, cy + r * .6], fill=k, outline=c, width=8)
        for i in range(5): d.rectangle([cx - r * .85 + i * r * .4, cy - r * .5, cx - r * .7 + i * r * .4, cy - r * .35], fill=c); d.rectangle([cx - r * .85 + i * r * .4, cy + r * .35, cx - r * .7 + i * r * .4, cy + r * .5], fill=c)
    elif kind == 'crown':
        d.polygon([(cx - r, cy + r * .5), (cx - r, cy - r * .4), (cx - r * .5, cy + r * .05), (cx, cy - r * .7), (cx + r * .5, cy + r * .05), (cx + r, cy - r * .4), (cx + r, cy + r * .5)], fill=c, outline=k, width=6)
    elif kind == 'star':
        pts = [(cx + math.cos(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * .42), cy + math.sin(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * .42)) for i in range(10)]
        d.polygon(pts, fill=c, outline=k, width=6)
    elif kind == 'duo':
        for sx in (-1, 1):
            d.ellipse([cx + sx * r * .35 - r * .22, cy - r, cx + sx * r * .35 + r * .22, cy - r * .56], fill=c); d.polygon([(cx + sx * r * .35, cy - r * .5), (cx + sx * r * .05, cy + r), (cx + sx * r * .7, cy + r)], fill=c)
    elif kind == 'wave':
        for i in range(3): d.arc([cx - r + i * 14, cy - r * .9 + i * 22, cx + r - i * 14, cy + r * .3 + i * 22], 200, 340, fill=c, width=8)
    elif kind == 'none':
        pass
    elif kind == 'sun':
        for i in range(12):
            a = i * math.pi / 6; d.line([(cx + math.cos(a) * r * .6, cy + math.sin(a) * r * .6), (cx + math.cos(a) * r, cy + math.sin(a) * r)], fill=c, width=10)
        d.ellipse([cx - r * .5, cy - r * .5, cx + r * .5, cy + r * .5], fill=c, outline=k, width=6)


def board(text, bg, fg, outline, accent, kind):
    global IMG
    IMG = Image.new('RGBA', (W, H), hexc(bg) + (255,)); d = ImageDraw.Draw(IMG)
    for i in range(6):  # speed stripes behind the wordmark
        y = 30 + i * 22; d.polygon([(220 + i * 40, y), (520 + i * 30, y), (500 + i * 30, y + 9), (200 + i * 40, y + 9)], fill=hexc(accent))
        d.polygon([(W - 220 - i * 40, y), (W - 520 - i * 30, y), (W - 500 - i * 30, y + 9), (W - 200 - i * 40, y + 9)], fill=hexc(accent))
    size = 150
    while True:
        f = ImageFont.truetype(FONT, size); b = d.textbbox((0, 0), text, font=f, stroke_width=10)
        if b[2] - b[0] < W - 520 or size < 60: break
        size -= 6
    # italic: draw on a wide layer and shear
    layer = Image.new('RGBA', (W, H)); ld = ImageDraw.Draw(layer)
    ld.text((W / 2 + 10, H / 2 + 12), text, font=f, fill=(0, 0, 0, 140), anchor='mm', stroke_width=12, stroke_fill=(0, 0, 0, 140))
    ld.text((W / 2, H / 2 + 4), text, font=f, fill=hexc(fg), anchor='mm', stroke_width=10, stroke_fill=hexc(outline))
    layer = layer.transform(layer.size, Image.AFFINE, (1, .22, -H * .11, 0, 1, 0), resample=Image.BICUBIC)
    IMG.alpha_composite(layer)
    d = ImageDraw.Draw(IMG)
    for cx in (110, W - 110): icon(d, kind, cx, H / 2, 62, accent if kind not in ('slice',) else '#ffe9a8', outline)
    d.rectangle([0, 0, W - 1, 5], fill=(255, 255, 255, 90)); d.rectangle([0, H - 6, W - 1, H - 1], fill=(0, 0, 0, 90))
    return IMG.convert('RGB')


base_path = ART / 'sponsors-base.png'
if not base_path.exists(): Image.open(ART / 'sponsors.png').convert('RGB').save(base_path)
base = Image.open(base_path).convert('RGB')
rows = [base.crop((0, round(i * base.height / 4), base.width, round((i + 1) * base.height / 4))).resize((W, H)) for i in range(4)]
rows += [board(*b) for b in BRANDS]
sheet = Image.new('RGB', (W, H * len(rows)))
for i, r in enumerate(rows): sheet.paste(r, (0, i * H))
sheet.save(ART / 'sponsors.png', optimize=True)
print('sponsors.png', len(rows), 'boards')
