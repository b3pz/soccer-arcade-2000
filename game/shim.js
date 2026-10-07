/* Soccer Arcade 2000 platform services: settings storage, referee whistle and small sound effects. */
(function(){
'use strict';
const PREFIX='sa2000:';
// Settings / saved tournament in localStorage (asynchronous API kept for the menu code).
window.S9Save={
 async getSetting(key){try{const v=localStorage.getItem(PREFIX+key);return v==null?null:JSON.parse(v)}catch(e){return null}},
 async putSetting(key,value){try{if(value==null)localStorage.removeItem(PREFIX+key);else localStorage.setItem(PREFIX+key,JSON.stringify(value))}catch(e){}return value}
};
let audio=null;
function ctx(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;audio=new A()}if(audio.state==='suspended')audio.resume?.();return audio}
function tone(freq,to,dur,type='square',vol=.1){const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,a.currentTime);if(to)o.frequency.exponentialRampToValueAtTime(to,a.currentTime+dur*.4);g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur+.02)}
function noise(dur,vol=.2,cut=900){const a=ctx();if(!a)return;const len=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=buf;f.type='lowpass';f.frequency.value=cut;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(a.destination);s.start()}
function whistle(){tone(1800,2500,.32,'square',.08)}
window.whistle=whistle;
window.S9SFX={whistle,fullTimeWhistle(){whistle();setTimeout(whistle,260);setTimeout(whistle,520)},saveSound(){noise(.18,.25,600)},kick(){noise(.08,.35,300)},slam(){noise(.35,.5,220);tone(90,40,.35,'sawtooth',.18)},coin(){tone(988,null,.08,'square',.07);setTimeout(()=>tone(1319,null,.25,'square',.07),80)},unlock:ctx};
})();
