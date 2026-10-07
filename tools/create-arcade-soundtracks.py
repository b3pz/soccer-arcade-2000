"""Original cabinet soundtracks, synthesised from scratch (no samples): four loops in different moods.

Each song: chord progression, triangle bass, pulse-wave arpeggio, a lead melody built from a motif
(A A' B A form, notes taken from the current chord and scale), and synthesised drums.
Output: arcade/assets/music/*.wav (mono, 22 050 Hz, 16 bit). Usage: python3 tools/create-arcade-soundtracks.py
"""
from pathlib import Path
import math, wave, array, random

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / 'arcade/assets/music'
MAJOR, MINOR, DORIAN = [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10]

SONGS = [
    # name, bpm, key (midi), scale, progression (scale degrees), lead duty, swing, seed, drum style
    ('kick-off', 144, 57, MINOR, [0, 5, 2, 6], .25, 0, 2000, 'drive'),
    ('world-tour', 126, 62, MAJOR, [0, 4, 5, 3], .5, 0, 1998, 'stomp'),
    ('night-final', 112, 52, DORIAN, [0, 3, 0, 4], .125, .12, 1994, 'half'),
    ('extra-time', 156, 60, MAJOR, [5, 3, 0, 4], .25, 0, 1990, 'drive'),
]


def chord(scale, key, degree):
    pick = lambda d: key + scale[d % 7] + 12 * (d // 7)
    return [pick(degree), pick(degree + 2), pick(degree + 4)]


def render(name, bpm, key, scale, prog, duty, swing, seed, drums):
    rng = random.Random(seed)
    beat = 60 / bpm; bars = 16; size = round(bars * 4 * beat * RATE); buf = [0.0] * size

    def tone(midi, start, length, vol, voice, d=.5):
        f = 440 * 2 ** ((midi - 69) / 12); lo = round(start * RATE); n = min(round(length * RATE), size - lo)
        for i in range(max(0, n)):
            t = i / RATE; env = min(1, t / .005) * min(1, (length - t) / .04) * (1 - .35 * t / max(length, .01))
            ph = (t * f) % 1
            v = (1 if ph < d else -1) if voice == 'pulse' else (4 * abs(ph - .5) - 1) if voice == 'tri' else (2 * ph - 1)
            buf[lo + i] += v * env * vol

    def noise(start, length, vol, decay):
        lo = round(start * RATE)
        for i in range(round(length * RATE)):
            if lo + i < size: buf[lo + i] += (rng.random() * 2 - 1) * math.exp(-i / RATE * decay) * vol

    def kick(start, vol=.3):
        lo = round(start * RATE)
        for i in range(round(.16 * RATE)):
            t = i / RATE
            if lo + i < size: buf[lo + i] += math.sin(2 * math.pi * (60 * t + 2.2 * (1 - math.exp(-t * 28)))) * math.exp(-t * 20) * vol

    # Motif: 8 eighth-note steps, each a chord-tone index or a rest; variations reuse it.
    motif = [rng.choice([0, 1, 2, 2, 3, None]) for _ in range(8)]
    answer = [rng.choice([1, 2, 3, 4, None]) for _ in range(8)]
    form = ['A', 'A2', 'B', 'A'] * 4
    for bar in range(bars):
        ch = chord(scale, key, prog[bar % len(prog)]); t0 = bar * 4 * beat
        sw = lambda step: step * beat / 2 + (swing * beat if step % 2 else 0)
        # bass: root on beats, fifth pick-ups
        for b in range(4):
            tone(ch[0] - 24 + (7 if b == 3 and bar % 2 else 0), t0 + b * beat, beat * .85, .2, 'tri')
        # arpeggio, sixteenths
        for s in range(16):
            tone(ch[s % 3] + 12 * ((s // 3) % 2), t0 + s * beat / 4, beat * .2, .045, 'pulse', .5)
        # lead
        part = form[bar]; line = answer if part == 'B' else motif
        for step, idx in enumerate(line):
            if idx is None: continue
            if part == 'A2' and step >= 6: idx += 1
            midi = (ch + [ch[0] + 12, ch[1] + 12])[idx % 5] + 12
            length = beat / 2 * (2 if step in (3, 7) else .9)
            tone(midi, t0 + sw(step), length, .11, 'pulse', duty)
        # drums
        for s in range(8):
            at = t0 + sw(s); noise(at, .05, .05 if s % 2 else .035, 70)  # hats
            if drums == 'drive':
                if s in (0, 3, 4, 6): kick(at)
                if s in (2, 6): noise(at, .14, .16, 22)
            elif drums == 'stomp':
                if s % 2 == 0: kick(at, .34)
                if s in (2, 6): noise(at, .18, .2, 18)
            else:
                if s in (0, 5): kick(at)
                if s == 4: noise(at, .2, .2, 16)
        if bar % 4 == 3:  # fill
            for s in range(4): noise(t0 + 3 * beat + s * beat / 4, .08, .12, 30)
    peak = max(1e-6, max(abs(v) for v in buf))
    pcm = array.array('h', (round(math.tanh(v / peak * 1.4) * 24000) for v in buf))
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / (name + '.wav')), 'wb') as w:
        w.setparams((1, 2, RATE, 0, 'NONE', 'not compressed')); w.writeframes(pcm.tobytes())
    return bars * 4 * beat


for song in SONGS:
    print(f'{song[0]}.wav {render(*song):.1f} s')
