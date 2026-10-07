#!/usr/bin/env python3
"""Pixel-art sprite sheet of the home end celebrating a goal (goal cutaway in the match).

Output: arcade/assets/crowd-celebration.png, FRAMES frames stacked vertically, three
columns per frame, each FW x FH:
  column 0  everything that keeps its own colours (stand, skin, hair, jackets, poles)
  column 1  pixels in the scoring team's primary colour, as grey shading (alpha = mask)
  column 2  pixels in the scoring team's secondary colour, same encoding
The game tints columns 1-2 with the kit and stacks them over column 0
(arcade/engine/match-presentation.js), so one bitmap serves every team.
Usage: python3 tools/generate-crowd-celebration.py
"""
import os, math, random
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FW, FH, FRAMES = 420, 120, 4
BASE, P, S = 0, 1, 2
OUT = (14, 16, 30)

SKIN = [(238, 196, 156), (214, 152, 108), (160, 104, 70), (112, 72, 50), (246, 214, 182)]
HAIR = [(40, 28, 22), (86, 52, 30), (20, 20, 24), (196, 150, 70), (120, 60, 30), (150, 150, 150)]
JACKETS = [(52, 60, 86), (90, 96, 110), (180, 180, 170), (60, 40, 36), (36, 70, 60)]


class Frame:
    def __init__(self):
        self.px = {}  # (x, y) -> (layer, rgb or shade)

    def put(self, x, y, layer, value):
        if 0 <= x < FW and 0 <= y < FH:
            self.px[(x, y)] = (layer, value)

    def rect(self, x, y, w, h, layer, value):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(xx, yy, layer, value)


def shade(value, k):
    return tuple(max(0, min(255, int(c * k))) for c in value)


def paint(f, x, y, w, h, kind, k=1.0):
    """kind: an RGB tuple, or P / S for kit pixels (k = brightness)."""
    if kind in (P, S):
        f.rect(x, y, w, h, kind, k)
    else:
        f.rect(x, y, w, h, BASE, shade(kind, k))


def stand(f, rows):
    for y in range(FH):
        t = y / FH
        f.rect(0, y, FW, 1, BASE, (int(18 + 14 * t), int(24 + 18 * t), int(48 + 22 * t)))
    for top in rows:
        f.rect(0, top + 18, FW, 7, BASE, (52, 60, 92))
        f.rect(0, top + 18, FW, 1, BASE, (92, 102, 140))
        f.rect(0, top + 24, FW, 1, BASE, (26, 30, 50))


def fan(f, cx, top, rnd_fan, frame, dim):
    skin, hair, style, shirt, pose, phase, flag = rnd_fan
    local = (frame + phase) % FRAMES
    jump = (0, -2, -3, -1)[local]
    hy, ty = top + jump, top + jump + 7          # head top, torso top
    head, torso = (cx - 3, hy, 6, 6), (cx - 5, ty, 10, 11)
    arms = []                                    # (x, y, w, h)
    hands = []
    if pose == 'up':
        lift = local % 2
        arms = [(cx - 7, ty - 8 + lift, 2, 10), (cx + 5, ty - 8 + lift, 2, 10)]
        hands = [(cx - 7, ty - 10 + lift), (cx + 5, ty - 10 + lift)]
    elif pose == 'v':
        arms = [(cx - 8, ty - 5, 2, 7), (cx + 6, ty - 5, 2, 7), (cx - 7, ty, 2, 3), (cx + 5, ty, 2, 3)]
        hands = [(cx - 9, ty - 7), (cx + 7, ty - 7)]
    elif pose == 'fist':
        up = local < 2
        arms = [(cx - 7, ty - 9 if up else ty, 2, 10 if up else 7), (cx + 5, ty, 2, 7)]
        hands = [(cx - 7, ty - 11 if up else ty + 7), (cx + 5, ty + 7)]
    elif pose == 'clap':
        close = local % 2
        arms = [(cx - 6, ty + 2, 2, 5), (cx + 4, ty + 2, 2, 5)]
        hands = [(cx - 2 if close else cx - 4, ty + 3), (cx + 0 if close else cx + 2, ty + 3)]
    elif pose in ('scarf', 'flag'):
        lift = (0, 1, 2, 1)[local]
        arms = [(cx - 7, ty - 8 - lift, 2, 10 + lift), (cx + 5, ty - 8 - lift, 2, 10 + lift)]
        hands = [(cx - 7, ty - 10 - lift), (cx + 5, ty - 10 - lift)]
    # 1 px dark outline under every part, then the fills.
    for (x, y, w, h) in [head, torso] + arms:
        paint(f, x - 1, y - 1, w + 2, h + 2, OUT)
    for (x, y) in hands:
        paint(f, x - 1, y - 1, 4, 4, OUT)
    if pose == 'scarf':
        sy = hands[0][1] - 2
        paint(f, cx - 11, sy - 1, 23, 5, OUT)
    sleeve = shirt if shirt in (P, S) else shirt
    for (x, y, w, h) in arms:
        paint(f, x, y, w, h, sleeve if shirt != 'stripes' else P, .82 * dim)
    for (x, y) in hands:
        paint(f, x, y, 2, 2, skin, dim)
    x, y, w, h = torso
    if shirt == 'stripes':
        for i in range(w):
            paint(f, x + i, y, 1, h, P if (i // 2) % 2 == 0 else S, (1.0 if i < w - 3 else .78) * dim)
    else:
        paint(f, x, y, w, h, shirt, dim)
        paint(f, x + w - 3, y, 3, h, shirt, .78 * dim)
        paint(f, x + 3, y, 4, 1, skin, .9 * dim)     # neckline
    x, y, w, h = head
    paint(f, x, y, w, h, skin, dim)
    paint(f, x + 4, y + 1, 2, 5, skin, .85 * dim)
    if style == 'cap':
        paint(f, x - 1, y - 1, w + 2, 3, P, dim)
        paint(f, x + 1, y + 1, w + 1, 1, S, dim)
    elif style == 'long':
        paint(f, x, y, w, 2, hair, dim)
        paint(f, x, y, 1, 6, hair, dim)
        paint(f, x + w - 1, y, 1, 6, hair, dim)
    elif style != 'bald':
        paint(f, x, y, w, 2, hair, dim)
    paint(f, x + 1, y + 3, 1, 1, OUT)                 # eyes
    paint(f, x + 4, y + 3, 1, 1, OUT)
    if local in (1, 2):                               # shouting
        paint(f, x + 2, y + 4, 2, 2, (90, 20, 30))
    if pose == 'scarf':                               # scarf stretched over the head, fringe at the ends
        sy = hands[0][1] - 2
        for i in range(21):
            paint(f, cx - 10 + i, sy, 1, 3, P if (i // 3) % 2 == 0 else S, dim)
        for i in (0, 2, 18, 20):
            paint(f, cx - 10 + i, sy + 3, 1, 2, S, .8 * dim)
    if pose == 'flag':
        px = hands[1][0] + 1
        pole_top = hy - 22
        paint(f, px, pole_top, 1, hands[1][1] - pole_top + 2, (210, 210, 220))
        for col in range(20):
            wave = round(math.sin(col * .45 - frame * math.pi / 2) * 1.6)
            for row in range(12):
                kind = (P if row < 6 else S) if flag == 'band' else (P if col < 10 else S)
                k = (.86 if (col // 4 + frame) % 2 else 1.0) * dim
                paint(f, px + 1 + col, pole_top + row + wave, 1, 1, kind, k)
            paint(f, px + 1 + col, pole_top - 1 + wave, 1, 1, OUT)
            paint(f, px + 1 + col, pole_top + 12 + wave, 1, 1, OUT)


def build():
    rnd = random.Random(2000)
    rows = [12, 36, 60, 84]
    people = []
    for r, top in enumerate(rows):
        x = 8 + (r % 2) * 7
        while x < FW - 4:
            pose = rnd.choices(['up', 'v', 'fist', 'clap', 'scarf', 'flag'], [5, 3, 3, 2, 4, 3 if r == 1 else 0])[0]
            shirt = rnd.choices([P, S, 'stripes', 'jacket'], [6, 3, 2, 2])[0]
            if shirt == 'jacket':
                shirt = rnd.choice(JACKETS)
            people.append((r, top, x + rnd.randint(-1, 1), (rnd.choice(SKIN), rnd.choice(HAIR),
                           rnd.choices(['short', 'long', 'bald', 'cap'], [5, 2, 1, 2])[0], shirt, pose,
                           rnd.randrange(FRAMES), rnd.choice(['band', 'halves']))))
            x += 13 + rnd.randint(0, 2)
    confetti = [(rnd.randrange(FW), rnd.randrange(FH), rnd.choice([P, S, (255, 255, 255), (255, 228, 80)]), rnd.uniform(5, 9))
                for _ in range(70)]
    flashes = [(rnd.randrange(FW), rnd.randrange(8, 90), rnd.randrange(FRAMES)) for _ in range(10)]
    frames = []
    for k in range(FRAMES):
        f = Frame()
        stand(f, rows)
        for r, top, x, look in people:
            fan(f, x, top, look, k, .72 + .09 * r)
        # Front balustrade with a kit-coloured banner.
        f.rect(0, 106, FW, 14, BASE, (18, 22, 38))
        f.rect(0, 106, FW, 1, BASE, (150, 160, 190))
        for i in range(0, FW, 28):
            f.rect(i + 1, 108, 26, 10, P if (i // 28) % 2 == 0 else S, 1.0)
            f.rect(i + 1, 108, 26, 1, BASE, (240, 240, 240))
            f.rect(i + 1, 117, 26, 1, BASE, (240, 240, 240))
        for x, y, kind, speed in confetti:
            yy = int(y + k * speed) % 104
            xx = int(x + math.sin(k + y) * 2) % FW
            paint(f, xx, yy, 2, 1 + (k + x) % 2, kind, 1.0)
        for x, y, when in flashes:
            if when == k:
                paint(f, x - 1, y, 3, 1, (255, 255, 255))
                paint(f, x, y - 1, 1, 3, (255, 255, 255))
        frames.append(f)
    sheet = Image.new('RGBA', (FW * 3, FH * FRAMES), (0, 0, 0, 0))
    data = sheet.load()
    for k, f in enumerate(frames):
        for (x, y), (layer, value) in f.px.items():
            if layer == BASE:
                data[x, y + k * FH] = value + (255,)
            else:
                g = max(0, min(255, int(232 * value)))
                data[x + layer * FW, y + k * FH] = (g, g, g, 255)
    out = os.path.join(ROOT, 'arcade/assets/crowd-celebration.png')
    sheet.save(out, optimize=True)
    # Preview with sample kits for review only (not used by the game).
    preview = Image.new('RGBA', (FW * 2, FH * FRAMES * 2))
    for k in range(FRAMES):
        frame = sheet.crop((0, k * FH, FW, (k + 1) * FH))
        for layer, color in ((1, (40, 120, 230)), (2, (250, 250, 250))):
            mask = sheet.crop((layer * FW, k * FH, (layer + 1) * FW, (k + 1) * FH))
            tint = Image.new('RGBA', mask.size)
            src, dst = mask.load(), tint.load()
            for y in range(FH):
                for x in range(FW):
                    g, _, _, a = src[x, y]
                    if a:
                        dst[x, y] = tuple(c * g // 255 for c in color) + (255,)
            frame = Image.alpha_composite(frame, tint)
        preview.paste(frame.resize((FW * 2, FH * 2), Image.NEAREST), (0, k * FH * 2))
    return out, preview


if __name__ == '__main__':
    out, preview = build()
    import sys
    if len(sys.argv) > 1:
        preview.save(sys.argv[1])
    print('wrote', out)
