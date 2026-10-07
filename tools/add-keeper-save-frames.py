"""Spectacular-save rows built from the original goalkeeper art of the atlas.

Every exposure comes from the source keeper frames (dive_left, dive_right, catch, gk_idle):
  save_stretch_*  the full dive, with an extra held extension;
  save_tip_*      the same dive rotated upwards, gloves over the bar;
  save_punch_*    a near-vertical leap from the dive frames, fists up through the ball.
Rotations use nearest-neighbour so the pixel art keeps its palette; each cell is re-seated
on the shared 118 px baseline. Run again after tools/prepare-arcade-frames.py, then
tools/embed-arcade-sprites.py.
"""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[1]; assets = root / 'arcade/assets'
manifest = json.loads((assets / 'animations.json').read_text()); audit = json.loads((assets / 'animation-audit.json').read_text())
sheet = Image.open(assets / 'animations.png').convert('RGBA')
cell = lambda i: sheet.crop((i % 8 * 128, i // 8 * 128, i % 8 * 128 + 128, i // 8 * 128 + 128))
manifest = {k: v for k, v in manifest.items() if not k.startswith('save_')}
used = sorted({i for row in manifest.values() for i in row}); lookup = {old: new for new, old in enumerate(used)}
frames = [cell(i) for i in used]; manifest = {k: [lookup[i] for i in row] for k, row in manifest.items()}
src = {k: [frames[i] for i in manifest[k]] for k in ['dive_left', 'dive_right', 'catch', 'gk_idle']}


def seat(im, dx=0):
    """Re-seat on the 118 px baseline (and optionally nudge sideways) without cropping the figure."""
    box = im.getbbox(); out = Image.new('RGBA', (128, 128))
    out.alpha_composite(im, (dx, 118 - box[3]))
    return out


def turn(im, degrees):
    big = Image.new('RGBA', (192, 192)); big.alpha_composite(im, (32, 32))
    big = big.rotate(degrees, resample=Image.NEAREST, center=(96, 96))
    box = big.getbbox(); w, h = box[2] - box[0], box[3] - box[1]
    out = Image.new('RGBA', (128, 128)); out.alpha_composite(big.crop(box), ((128 - w) // 2, max(0, 118 - h)))
    return out


def rows(side):
    d = src['dive_' + side]; up = 1 if side == 'right' else -1   # raise the leading gloves
    c = src['catch'] if side == 'right' else [x.transpose(Image.FLIP_LEFT_RIGHT) for x in src['catch']]
    g = src['gk_idle']
    return {
        'stretch': [d[0], d[1], d[2], d[3], turn(d[3], up * 4), d[4], d[5], seat(d[5], -up * 2)],
        'tip': [d[0], d[1], turn(d[2], up * 16), turn(d[3], up * 26), turn(d[3], up * 32), turn(d[4], up * 24), turn(d[4], up * 10), d[5]],
        'punch': [g[0], d[1], turn(d[2], up * 42), turn(d[3], up * 58), turn(d[3], up * 66), turn(d[4], up * 56), turn(d[4], up * 36), c[0]],
    }


for side in ['left', 'right']:
    built = rows(side)
    for kind in ['stretch', 'tip', 'punch']:
        name = 'save_' + kind + '_' + side; manifest[name] = []
        for im in built[kind]:
            manifest[name].append(len(frames)); frames.append(seat(im))
        audit['sequences'][name] = {'frames': 8, 'sourcePoses': 8, 'derivedPoses': 0, 'repeatedExposure': False,
                                    'technique': 'original keeper frames (dive, catch, idle): rotated and re-seated on the baseline'}
out = Image.new('RGBA', (1024, 128 * ((len(frames) + 7) // 8)))
for i, im in enumerate(frames): out.alpha_composite(im, (i % 8 * 128, i // 8 * 128))
tmp = assets / 'animations.png.atomic'; out.save(tmp, format='PNG'); tmp.replace(assets / 'animations.png')
for name, text in [('animations.json', json.dumps(manifest, indent=2)), ('animations.js', 'window.S9ArcadeFrames=' + json.dumps(manifest) + ';\n'), ('animation-audit.json', json.dumps(audit, indent=2))]:
    target = assets / name; tmp = target.with_suffix(target.suffix + '.atomic'); tmp.write_text(text); tmp.replace(target)
print(f'{len(frames)} frames, {len(manifest)} actions')
