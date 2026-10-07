"""Cut the generated effect and UI sheets into clean, uniform sprite sheets for the game.

Sources (arcade/assets/art/*/sources/) are image-generation atlases whose drawings sit at
uneven positions inside each grid cell. Every frame is trimmed to its pixels and re-seated in
a cell of uniform size so the animation does not jitter:
  fire / meteor / speed (4x2): head of the trail on the right edge (where the ball is), centred vertically;
  impacts (4x4: charge, impact, contact, dust rows): centred; dust rests on the bottom edge.
The panel is trimmed to its frame for nine-slice scaling.
Usage: python3 tools/cut-arcade-effects.py
"""
from pathlib import Path
from PIL import Image

ART = Path(__file__).resolve().parents[1] / 'arcade/assets/art'


def trimmed(im):
    box = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    return im.crop(box) if box else Image.new('RGBA', (1, 1))


def cut(src, dst, cols, rows, align, pad=6):
    sheet = Image.open(ART / src).convert('RGBA'); fw, fh = sheet.width / cols, sheet.height / rows
    frames = [trimmed(sheet.crop((round(c * fw), round(r * fh), round((c + 1) * fw), round((r + 1) * fh)))) for r in range(rows) for c in range(cols)]
    cw = max(f.width for f in frames) + 2 * pad; ch = max(f.height for f in frames) + 2 * pad
    out = Image.new('RGBA', (cw * cols, ch * rows))
    for i, f in enumerate(frames):
        mode = align(i)
        x = cw - pad - f.width if mode == 'right' else (cw - f.width) // 2
        y = ch - pad - f.height if mode == 'bottom' else (ch - f.height) // 2
        out.alpha_composite(f, ((i % cols) * cw + x, (i // cols) * ch + y))
    (ART / dst).parent.mkdir(parents=True, exist_ok=True); out.save(ART / dst, optimize=True)
    print(dst, out.size, 'cell', (cw, ch))


cut('effects/sources/fire-sheet.png', 'effects/fire-sheet.png', 4, 2, lambda i: 'right')
cut('effects/sources/meteor-sheet.png', 'effects/meteor-sheet.png', 4, 2, lambda i: 'right')
cut('effects/sources/speed-sheet.png', 'effects/speed-sheet.png', 4, 2, lambda i: 'right')
cut('effects/sources/impact-sheet.png', 'effects/impact-sheet.png', 4, 4, lambda i: 'bottom' if i >= 12 else 'centre')
panel = trimmed(Image.open(ART / 'ui/sources/panel.png').convert('RGBA')); panel.save(ART / 'ui/panel.png', optimize=True); print('ui/panel.png', panel.size)
