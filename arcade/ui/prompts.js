/* Button prompts: "{m:confirm} CONFERMA" draws the keyboard key and, when a joypad is connected, the real icon of
   that pad's button (PlayStation ✕ ○ □ △ in their colours, Xbox A B X Y), from the current bindings.
   Tokens: {p:z} 1P game action · {m:confirm} menu action · {s:pause} system action · {arrows} direction keys. */
(function(){
'use strict';
const PS={0:['✕','#7cb1ff'],1:['○','#ff6b78'],2:['□','#ff8fd0'],3:['△','#3fd39a'],4:['L1'],5:['R1'],6:['L2'],7:['R2'],8:['SELECT'],9:['START'],10:['L3'],11:['R3'],12:['↑'],13:['↓'],14:['←'],15:['→'],16:['PS']};
const XB={0:['A','#3fbf55'],1:['B','#e8473f'],2:['X','#3a7fe0'],3:['Y','#f2c12e'],4:['LB'],5:['RB'],6:['LT'],7:['RT'],8:['VIEW'],9:['MENU'],10:['L3'],11:['R3'],12:['↑'],13:['↓'],14:['←'],15:['→'],16:['HOME']};
const TOKEN=/\{(p|m|s):(\w+)\}|\{arrows\}/g;
const pad=()=>{try{return [...(navigator.getGamepads?.()||[])].find(Boolean)||null}catch(e){return null}};
const isPS=p=>/playstation|dualshock|dualsense|054c|sony/i.test(p?.id||'')||!!window.S9ArcadePads?.has(p?.raw||p);
// Touch screen without a pad: commands are named like the on-screen buttons, confirm is a tap.
const touchOnly=()=>!pad()&&typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches&&('ontouchstart' in window||navigator.maxTouchPoints>0);
const TOUCH={z:'TIRO',c:'PASSA',x:'LANCIO',v:'SCATTO',switch:'CAMBIO',pause:'PAUSA',confirm:'TOCCA',back:'INDIETRO',arrowleft:'LEVETTA',arrowright:'LEVETTA',arrowup:'LEVETTA',arrowdown:'LEVETTA',fullscreen:''};
function touchText(text){
 if(/\{arrows\}[^{]*SCEGLI/.test(text)&&!/\{p:/.test(text))return 'TOCCA UNA VOCE PER SCEGLIERLA';
 if(/PREMI START|PREMI UN TASTO/.test(text))return 'TOCCA LO SCHERMO';
 return text.replace(/\{arrows\}/g,'{arrows}')}
function resolve(kind,action){if(touchOnly()){const label=kind==='arrows'?'LEVETTA':TOUCH[action]??action.toUpperCase();return {key:label,slot:null,touch:true}}const B=window.S9ArcadeBindings;if(kind==='arrows')return {key:'FRECCE',slot:'dpad'};if(!B)return {key:action.toUpperCase(),slot:null};
 const key=kind==='p'?B.map('p1')[action]:kind==='m'?B.map('menu')[action]:B.key(action),slot=kind==='m'?B.map('padmenu')[action]:B.map('pad0')[action];return {key:B.label(key),slot}}
function parts(text){if(touchOnly())text=touchText(text);const out=[];let last=0,m;TOKEN.lastIndex=0;while((m=TOKEN.exec(text))){if(m.index>last)out.push({text:text.slice(last,m.index)});out.push(resolve(m[0]==='{arrows}'?'arrows':m[1],m[2]));last=TOKEN.lastIndex}if(last<text.length)out.push({text:text.slice(last)});return out}
const has=text=>typeof text==='string'&&(text.includes('{')&&(TOKEN.lastIndex=0,TOKEN.test(text))||touchOnly()&&/PREMI START|PREMI UN TASTO/.test(text));
// Plain text (DOM, aria labels): keyboard key, plus the pad button name when a pad is connected.
function plain(text){if(!has(text))return text;const p=pad();return parts(text).map(x=>x.text!=null?x.text:x.key+(p&&x.slot!=null?'/'+(x.slot==='dpad'?'CROCE':((isPS(p)?PS:XB)[x.slot]||['?'])[0]):'')).join('')}
function round(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function keycap(c,label,x,cy,s){c.font='900 '+Math.round(s*.62)+'px monospace';const w=Math.max(s*1.05,c.measureText(label).width+s*.5);round(c,x,cy-s*.55,w,s*1.1,s*.2);c.fillStyle='#0a0f1e';c.fill();round(c,x+1.5,cy-s*.55+1.5,w-3,s*1.1-5,s*.18);c.fillStyle='#eef1f7';c.fill();c.fillStyle='#1a2030';c.textAlign='center';c.textBaseline='middle';c.fillText(label,x+w/2,cy-1);return w}
function padIcon(c,slot,x,cy,s,p){const table=isPS(p)?PS:XB;
 if(slot==='dpad'||slot>=12&&slot<=15){const w=s*1.1,cx=x+w/2,arm=s*.2;c.fillStyle='#0a0f1e';c.beginPath();c.arc(cx,cy,s*.55,0,Math.PI*2);c.fill();c.fillStyle='#d7dbe6';c.fillRect(cx-arm,cy-s*.42,arm*2,s*.84);c.fillRect(cx-s*.42,cy-arm,s*.84,arm*2);if(slot!=='dpad'){c.fillStyle='#ffe447';const o={12:[0,-1],13:[0,1],14:[-1,0],15:[1,0]}[slot];c.fillRect(cx+o[0]*s*.22-arm,cy+o[1]*s*.22-arm,arm*2,arm*2)}return w}
 const [label,color]=table[slot]||['?'];
 if(color){const r=s*.55,cx=x+r;c.fillStyle='#0a0f1e';c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();c.fillStyle='#262b38';c.beginPath();c.arc(cx,cy,r-2,0,Math.PI*2);c.fill();
  if(table===PS){c.strokeStyle=color;c.lineWidth=Math.max(2,s*.12);c.beginPath();const k=s*.24;if(slot===0){c.moveTo(cx-k,cy-k);c.lineTo(cx+k,cy+k);c.moveTo(cx+k,cy-k);c.lineTo(cx-k,cy+k)}else if(slot===1)c.arc(cx,cy,k,0,Math.PI*2);else if(slot===2)c.rect(cx-k,cy-k,2*k,2*k);else{c.moveTo(cx,cy-k*1.1);c.lineTo(cx+k*1.1,cy+k*.8);c.lineTo(cx-k*1.1,cy+k*.8);c.closePath()}c.stroke()}
  else{c.fillStyle=color;c.beginPath();c.arc(cx,cy,r-3,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='900 '+Math.round(s*.62)+'px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(label,cx,cy+1)}return r*2}
 c.font='900 '+Math.round(s*.48)+'px monospace';const w=c.measureText(label).width+s*.6;round(c,x,cy-s*.42,w,s*.84,s*.42);c.fillStyle='#0a0f1e';c.fill();round(c,x+2,cy-s*.42+2,w-4,s*.84-4,s*.38);c.fillStyle='#3a4152';c.fill();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(label,x+w/2,cy+1);return w}
// Draws text with prompt tokens; returns the total width. y is the text baseline (as fillText).
function draw(c,text,x,y,size,color='#fff',align='center',shadow='#07101b',maxW=Infinity){const p=pad(),bits=parts(text);if(maxW<Infinity){const w=draw(fake(c),text,0,0,size,color,align,shadow);if(w>maxW)size=Math.max(6,size*maxW/w)}const gap=size*.25;c.save();c.font='bold '+size+'px monospace';
 const capW=label=>{c.font='900 '+Math.round(size*1.1*.62)+'px monospace';return Math.max(size*1.1*1.05,c.measureText(label).width+size*1.1*.5)};
 const iconW=slot=>{if(slot==='dpad'||slot>=12&&slot<=15)return size*1.1*1.1;const t=(isPS(p)?PS:XB)[slot]||['?'];if(t[1])return size*1.1*1.1;c.font='900 '+Math.round(size*1.1*.48)+'px monospace';return c.measureText(t[0]).width+size*1.1*.6};
 const widthOf=b=>{if(b.text!=null){c.font='bold '+size+'px monospace';return c.measureText(b.text).width}return capW(b.key)+(p&&b.slot!=null?gap+iconW(b.slot):0)+gap};
 const widths=bits.map(widthOf),total=widths.reduce((a,b)=>a+b,0);let cx=align==='center'?x-total/2:align==='right'?x-total:x;const mid=y-size*.34;
 bits.forEach((b,i)=>{if(b.text!=null){c.font='bold '+size+'px monospace';c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=shadow;c.fillText(b.text,cx+2,y+2);c.fillStyle=color;c.fillText(b.text,cx,y)}else{if(b.touch&&!b.key)return;let w=keycap(c,b.key,cx,mid,size*1.1);if(p&&b.slot!=null)padIcon(c,b.slot,cx+w+gap,mid,size*1.1,p)}cx+=widths[i]});
 c.restore();return total}
// Measuring pass: same maths, nothing painted.
function fake(c){return new Proxy(c,{get:(t,k)=>k==='measureText'?s=>t.measureText(s):typeof t[k]==='function'?()=>{}:t[k],set:(t,k,v)=>{if(k==='font')t.font=v;return true}})}
window.S9ArcadePrompts={draw,plain,has,parts,buttonGlyph:(slot,p=pad())=>((isPS(p)?PS:XB)[slot]||['?'])[0]};
// Every canvas text drawn by the match renderer understands the tokens.
const R=window.S9ArcadeEngine?.Renderer?.prototype;if(R){const text=R.text;R.text=function(s,x,y,size=20,color='#fff',align='center'){if(has(s))return draw(this.ctx,s,x,y,size,color,align);return text.call(this,s,x,y,size,color,align)}}
})();
