#!/usr/bin/env python3
"""Normalise club crest canvases to the shared 320x480 patch format (alpha-trimmed, centred)."""
import os, sys
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for folder in ('assets/crests/italian', 'assets/crests/foreign'):
    for name in sorted(os.listdir(os.path.join(root, folder))):
        if not name.endswith('.png'): continue
        path = os.path.join(root, folder, name); im = Image.open(path).convert('RGBA')
        if im.size == (320, 480): continue
        box = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox(); im = im.crop(box)
        scale = min(308 / im.width, 462 / im.height); im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        out = Image.new('RGBA', (320, 480), (0, 0, 0, 0)); out.paste(im, ((320 - im.width) // 2, 480 - 6 - im.height - (462 - im.height) // 2), im)
        out.save(path, optimize=True); print('normalised', folder, name)
