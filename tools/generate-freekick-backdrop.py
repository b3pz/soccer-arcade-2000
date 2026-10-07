#!/usr/bin/env python3
"""Pixel-art backdrop for the close free-kick scene: end stand, floodlights, boards, turf, box and goal.

Drawn at 640x360 and doubled with nearest neighbour to 1280x720, matching the cabinet look.
Goal geometry (final pixels) is mirrored in arcade/engine/freekick.js: posts x 360/920, bar y 246, line y 430.
Usage: python3 tools/generate-freekick-backdrop.py
"""
import os, random
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 640, 360
rnd = random.Random(1998)
img = Image.new('RGB', (W, H), (8, 14, 36))
d = ImageDraw.Draw(img)

# Night sky and roof
for y in range(0, 40):
    t = y / 40
    d.line([(0, y), (W, y)], fill=(int(6 + 10 * t), int(10 + 18 * t), int(30 + 30 * t)))
d.rectangle([0, 26, W, 34], fill=(28, 34, 58))
for x in range(0, W, 12):
    d.line([(x, 26), (x + 6, 34)], fill=(46, 54, 84))
# Floodlight towers
for cx in (70, 570):
    d.rectangle([cx - 2, 8, cx + 2, 40], fill=(60, 66, 90))
    d.rectangle([cx - 22, 2, cx + 22, 16], fill=(34, 40, 64))
    for gx in range(cx - 20, cx + 20, 5):
        for gy in (4, 9):
            d.rectangle([gx, gy, gx + 3, gy + 3], fill=(255, 250, 214))
    for r, a in ((60, 18), (40, 26)):
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([cx - r, 9 - r // 2, cx + r, 9 + r // 2], fill=(255, 248, 200, a))
        img.paste(Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB'))
d = ImageDraw.Draw(img)

# Crowd terraces: four tiers, supporters with scarves and flags, aisles
palette = [(255, 203, 68), (86, 202, 255), (242, 83, 107), (221, 215, 191), (120, 230, 120), (250, 250, 250)]
skin = [(236, 192, 152), (204, 140, 98), (150, 96, 64), (246, 214, 180)]
for tier in range(5):
    y0 = 36 + tier * 15
    d.rectangle([0, y0, W, y0 + 14], fill=(26 + tier * 3, 32 + tier * 3, 56 + tier * 4))
    d.line([(0, y0 + 14), (W, y0 + 14)], fill=(14, 18, 34))
    for x in range(2, W, 6):
        if (x // 6) % 23 == 11:
            d.rectangle([x, y0, x + 5, y0 + 13], fill=(18, 22, 40))
            continue
        shirt = palette[rnd.randrange(len(palette))] if rnd.random() < .8 else palette[(tier + x // 60) % len(palette)]
        bob = rnd.choice((0, 0, 1))
        d.rectangle([x, y0 + 6 - bob, x + 4, y0 + 12], fill=shirt)
        d.rectangle([x + 1, y0 + 2 - bob, x + 3, y0 + 5 - bob], fill=skin[rnd.randrange(len(skin))])
        if rnd.random() < .06:
            d.rectangle([x - 2, y0 - 1 - bob, x + 7, y0], fill=palette[rnd.randrange(len(palette))])
    for _ in range(4):
        fx = rnd.randrange(20, W - 20)
        d.line([(fx, y0 - 6), (fx, y0 + 8)], fill=(200, 200, 200))
        d.rectangle([fx + 1, y0 - 6, fx + 12, y0], fill=palette[rnd.randrange(len(palette))])

# Advertising boards
font = ImageFont.load_default()
d.rectangle([0, 112, W, 124], fill=(7, 22, 41))
labels = ['SUPER FOOTBALL', 'PUSH START', 'SERIE A 2000', 'INSERT COIN']
for i, x in enumerate(range(0, W, 128)):
    d.rectangle([x + 1, 112, x + 126, 124], outline=(255, 205, 57))
    text = labels[i % len(labels)]
    tw = d.textlength(text, font=font)
    d.text((x + 64 - tw / 2, 113), text, fill=(252, 223, 102), font=font)

# Turf with perspective mowing stripes and grain
y = 124
band = 0
while y < H:
    h = 6 + int((y - 124) * .09)
    d.rectangle([0, y, W, y + h], fill=(41, 155, 64) if band % 2 else (33, 133, 54))
    y += h
    band += 1
for _ in range(4500):
    x, yy = rnd.randrange(W), rnd.randrange(125, H)
    d.point((x, yy), fill=(140, 218, 73) if rnd.random() < .5 else (12, 80, 40))

line = (241, 241, 203)
# Goal line, six-yard box and penalty box in perspective
d.line([(0, 215), (W, 215)], fill=line, width=2)
d.line([(150, 215), (120, 252), (520, 252), (490, 215)], fill=line, width=2)
d.line([(40, 215), (-30, 320), (670, 320), (600, 215)], fill=line, width=2)
d.arc([262, 296, 378, 344], 15, 165, fill=line, width=2)
d.rectangle([318, 276, 322, 278], fill=line)

# Goal: net with depth, then posts and bar (posts x 180/460, bar y 123, line y 215 at half scale)
net = (205, 222, 228)
d.rectangle([180, 112, 460, 215], fill=(18, 40, 46))
for x in range(184, 460, 7):
    d.line([(x, 112), (x, 215)], fill=net)
for yy in range(114, 215, 6):
    d.line([(180, yy), (460, yy)], fill=net)
d.line([(166, 104), (180, 123)], fill=(150, 160, 170))
d.line([(474, 104), (460, 123)], fill=(150, 160, 170))
d.rectangle([166, 104, 474, 106], fill=(150, 160, 170))
for x0 in (176, 456):
    d.rectangle([x0, 123, x0 + 7, 216], fill=(19, 35, 53))
    d.rectangle([x0 + 1, 123, x0 + 6, 216], fill=(255, 242, 207))
d.rectangle([176, 119, 463, 126], fill=(19, 35, 53))
d.rectangle([177, 120, 462, 125], fill=(255, 242, 207))

out = os.path.join(ROOT, 'arcade', 'assets', 'freekick-backdrop.png')
img.resize((W * 2, H * 2), Image.NEAREST).save(out, optimize=True)
print('wrote', out)
