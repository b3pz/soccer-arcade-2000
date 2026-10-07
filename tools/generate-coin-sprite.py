#!/usr/bin/env python3
"""Pixel-art coin for the pre-match toss: arcade/assets/coin.png, 8 frames of 64x64 in a row.
Frames 0-3 turn the heads face (a football) edge-on, 4-7 bring the tails face (a cross) back; the game
picks frames by the flip angle. Usage: python3 tools/generate-coin-sprite.py
"""
import math, os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S, FRAMES = 64, 8
GOLD = [(255, 236, 140), (246, 200, 66), (214, 156, 32), (160, 104, 18), (96, 58, 10)]


def face(kind):
    im = Image.new('RGBA', (S * 4, S * 4), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S * 2; r = S * 2 - 6
    d.ellipse([c - r, c - r, c + r, c + r], fill=GOLD[4]); d.ellipse([c - r + 8, c - r + 8, c + r - 8, c + r - 8], fill=GOLD[2])
    d.ellipse([c - r + 18, c - r + 18, c + r - 18, c + r - 18], fill=GOLD[1])
    for i in range(36):  # milled edge
        a = i * math.pi / 18; d.line([(c + math.cos(a) * (r - 4), c + math.sin(a) * (r - 4)), (c + math.cos(a) * (r - 12), c + math.sin(a) * (r - 12))], fill=GOLD[3], width=3)
    if kind == 'heads':  # football emblem
        br = r * .52; d.ellipse([c - br, c - br, c + br, c + br], fill=GOLD[0], outline=GOLD[4], width=6)
        pts = [(c + math.cos(-math.pi / 2 + k * 2 * math.pi / 5) * br * .38, c + math.sin(-math.pi / 2 + k * 2 * math.pi / 5) * br * .38) for k in range(5)]
        d.polygon(pts, fill=GOLD[4])
        for x, y in pts:
            d.line([(x, y), (c + (x - c) * 2.5, c + (y - c) * 2.5)], fill=GOLD[4], width=5)
    else:  # cross
        w = r * .2; L = r * .6
        d.rectangle([c - w, c - L, c + w, c + L], fill=GOLD[0], outline=GOLD[4], width=5); d.rectangle([c - L, c - w, c + L, c + w], fill=GOLD[0], outline=GOLD[4], width=5)
        d.rectangle([c - w + 5, c - w + 5, c + w - 5, c + w - 5], fill=GOLD[0])
    d.ellipse([c - r + 28, c - r + 22, c - r + 70, c - r + 44], fill=(255, 250, 220, 160))
    return im.resize((S, S), Image.NEAREST)


sheet = Image.new('RGBA', (S * FRAMES, S), (0, 0, 0, 0))
heads, tails = face('heads'), face('tails')
for f in range(FRAMES):
    side = heads if f < 4 else tails
    k = abs(math.cos((f % 4) / 4 * math.pi / 2)) if f < 4 else abs(math.sin(((f - 4) + 1) / 4 * math.pi / 2))
    w = max(6, round(S * k))
    squashed = side.resize((w, S), Image.NEAREST)
    edge = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ImageDraw.Draw(edge).rectangle([S // 2 - 3, 3, S // 2 + 2, S - 4], fill=GOLD[3])
    cell = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    if w < 14: cell.alpha_composite(edge)
    cell.alpha_composite(squashed, ((S - w) // 2, 0)); sheet.alpha_composite(cell, (f * S, 0))
sheet.save(os.path.join(ROOT, 'arcade/assets/coin.png'), optimize=True)
print('wrote coin.png')
