"""Original loop: square-wave lead/arpeggio, bass and synthesized cabinet drums."""
from pathlib import Path
import math,wave,array,random
rate=22050;bpm=132;beat=60/bpm;duration=32*beat;size=round(duration*rate);samples=[0.0]*size
rng=random.Random(1995)
def note(midi,start,length,volume,voice='pulse'):
 freq=440*2**((midi-69)/12);lo=round(start*rate);n=min(round(length*rate),size-lo)
 for i in range(n):
  t=i/rate;env=min(1,t/.006)*min(1,(length-t)/.035);phase=(t*freq)%1
  v=(1 if phase<.35 else -1) if voice=='pulse' else 4*abs(phase-.5)-1
  samples[lo+i]+=v*env*volume
lead=[72,75,79,82,79,75,72,70,72,75,79,84,82,79,75,70,68,72,75,79,75,72,68,67,70,74,77,82,79,77,74,70]
roots=[48,44,46,43]
for step in range(64):
 start=step*beat/2;root=roots[(step//16)%4];note(lead[step%32],start,beat*.38,.14)
 note(root+[12,19,24,19][step%4],start,beat*.23,.055)
 if step%2==0:note(root,start,beat*.82,.19,'triangle')
 # Closed hi-hat on eighths; kick on quarter beats, snare on 2/4.
 for i in range(round(rate*.055)):
  idx=round(start*rate)+i
  if idx<size:samples[idx]+=(rng.random()*2-1)*math.exp(-i/rate*70)*.06
 if step%2==0:
  for i in range(round(rate*.16)):
   idx=round(start*rate)+i;t=i/rate
   if idx<size:samples[idx]+=math.sin(2*math.pi*(70*t+2*(1-math.exp(-t*25))))*math.exp(-t*22)*.28
 if step%4==2:
  for i in range(round(rate*.12)):
   idx=round(start*rate)+i;t=i/rate
   if idx<size:samples[idx]+=(rng.random()*2-1)*math.exp(-t*25)*.15
pcm=array.array('h',(round(math.tanh(v)*26000) for v in samples));dest=Path(__file__).resolve().parents[1]/'arcade/assets/cabinet-theme.wav'
with wave.open(str(dest),'wb') as out:out.setparams((1,2,rate,0,'NONE','not compressed'));out.writeframes(pcm.tobytes())
print('Created original cabinet loop:',dest.name,round(duration,2),'seconds')
