#!/usr/bin/env python3
"""Pixel-art football, 8 rotation frames of 64x64 in a row: arcade/assets/ball.png.

Classic black-and-white panel ball: a pixel is black when its direction on the sphere is
close to one of the 12 icosahedron vertices (pentagon centres). Lambert shading, rim light,
specular dot and a dark outline, quantised to a small palette for the cabinet look.
Usage: python3 tools/generate-ball-sprite.py
"""
import math, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S, FRAMES, R = 64, 8, 29.5
phi = (1 + 5 ** .5) / 2
verts = []
raw = [(0, 1, phi), (0, -1, phi), (0, 1, -phi), (0, -1, -phi), (1, phi, 0), (-1, phi, 0), (1, -phi, 0), (-1, -phi, 0),
       (phi, 0, 1), (-phi, 0, 1), (phi, 0, -1), (-phi, 0, -1)]
for v in raw:
    n = math.sqrt(sum(c * c for c in v))
    verts.append(tuple(c / n for c in v))
# Hexagon centres: the 20 face centres of the icosahedron (normalised sums of three mutually adjacent vertices).
hexes = []
for i in range(12):
    for j in range(i + 1, 12):
        for k in range(j + 1, 12):
            vi, vj, vk = verts[i], verts[j], verts[k]
            if all(sum(p * q for p, q in zip(u, w)) > .4 for u, w in ((vi, vj), (vj, vk), (vi, vk))):
                c = tuple(vi[t] + vj[t] + vk[t] for t in range(3))
                n = math.sqrt(sum(t * t for t in c))
                hexes.append(tuple(t / n for t in c))
CENTRES = [(v, True) for v in verts] + [(h, False) for h in hexes]
LIGHT = (-.45, -.6, .66)
WHITE = [(255, 255, 255), (232, 238, 244), (196, 208, 220), (148, 164, 182), (104, 120, 140)]
BLACK = [(56, 62, 78), (34, 38, 50), (20, 22, 30), (12, 13, 18), (8, 8, 12)]


def rotate(v, a, b):
    x, y, z = v
    x, z = x * math.cos(a) + z * math.sin(a), -x * math.sin(a) + z * math.cos(a)
    y, z = y * math.cos(b) - z * math.sin(b), y * math.sin(b) + z * math.cos(b)
    return x, y, z


sheet = Image.new('RGBA', (S * FRAMES, S), (0, 0, 0, 0))
px = sheet.load()
for f in range(FRAMES):
    a = f * 2 * math.pi / FRAMES / 5 * 2   # 2/5 turn over the cycle: the pattern repeats every 72 degrees
    for y in range(S):
        for x in range(S):
            dx, dy = (x + .5 - S / 2) / R, (y + .5 - S / 2) / R
            d2 = dx * dx + dy * dy
            if d2 > 1:
                continue
            dz = math.sqrt(1 - d2)
            n = (dx, dy, dz)
            body = rotate(n, a, .35)
            ranked = sorted(((sum(p * q for p, q in zip(body, v)), pent) for v, pent in CENTRES), reverse=True)
            black = ranked[0][1]
            seam = ranked[0][0] - ranked[1][0] < .018
            lam = max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
            level = 0 if lam > .62 else 1 if lam > .4 else 2 if lam > .22 else 3 if lam > .08 else 4
            col = (BLACK if black else WHITE)[level]
            if seam:
                col = (BLACK[min(4, level + 1)] if black else WHITE[min(4, level + 2)])
            if d2 > .86:
                col = (10, 14, 26)
            px[f * S + x, y] = col + (255,)
    for (sx, sy) in ((-10, -12), (-9, -12), (-10, -11)):
        px[f * S + S // 2 + sx, S // 2 + sy] = (255, 255, 255, 255)
out = os.path.join(ROOT, 'arcade/assets/ball.png')
sheet.save(out, optimize=True)
print('wrote', out)
