/* Joypad profiles: every pad is presented to the game in the standard layout.
   Pads the browser already maps as "standard" pass through; others (PlayStation Classic, cheap USB pads)
   use the profile recorded by the guided setup in OPZIONI → JOYPAD, saved per pad model. */
(function(){
'use strict';
const KEY='sa2000:padProfiles',nav=typeof navigator!=='undefined'?navigator:null;
const rawGet=nav?.getGamepads?nav.getGamepads.bind(nav):()=>[];
// Standard slots: 0 ✕ 1 ○ 2 □ 3 △ 4 L1 5 R1 6 L2 7 R2 8 SELECT 9 START 10 L3 11 R3 12 ↑ 13 ↓ 14 ← 15 →
const SLOTS=[[12,'↑','SU'],[13,'↓','GIÙ'],[14,'←','SINISTRA'],[15,'→','DESTRA'],[0,'✕','✕ (CROCE)'],[1,'○','○ (CERCHIO)'],[2,'□','□ (QUADRATO)'],[3,'△','△ (TRIANGOLO)'],[4,'L1','L1'],[5,'R1','R1'],[6,'L2','L2'],[7,'R2','R2'],[8,'SELECT','SELECT'],[9,'START','START']];
let profiles={};try{profiles=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){profiles={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(profiles))}catch(e){}};
const model=pad=>String(pad?.id||'').replace(/\s+/g,' ').trim();
// Known non-standard pads, used until the player records their own profile.
const BUILTIN=[{test:/054c.*0cda|playstation.*classic/i,map:{0:{t:'b',i:2},1:{t:'b',i:1},2:{t:'b',i:3},3:{t:'b',i:0},4:{t:'b',i:6},5:{t:'b',i:7},6:{t:'b',i:4},7:{t:'b',i:5},8:{t:'b',i:8},9:{t:'b',i:9},12:{t:'a',i:1,s:-1},13:{t:'a',i:1,s:1},14:{t:'a',i:0,s:-1},15:{t:'a',i:0,s:1}}}];
function profileFor(pad){if(!pad)return null;return profiles[model(pad)]?.map||(pad.mapping==='standard'?null:BUILTIN.find(b=>b.test.test(pad.id))?.map||null)}
const on=(pad,src)=>{if(!src)return false;if(src.t==='b'){const b=pad.buttons[src.i];return !!b&&(b.pressed||b.value>.5)}const v=pad.axes[src.i]??0;return src.s>0?v>.5:v<-.5};
function normalize(pad){if(!pad)return pad;const map=profileFor(pad);if(!map)return pad;
 const buttons=Array.from({length:17},(_,slot)=>{const p=on(pad,map[slot]);return {pressed:p,touched:p,value:p?1:0}});
 // Left stick stays analog unless its axes double as the d-pad.
 const dpadAxes=new Set([12,13,14,15].map(s=>map[s]).filter(s=>s?.t==='a').map(s=>s.i)),axes=[0,1,2,3].map(i=>dpadAxes.has(i)?0:pad.axes[i]??0);
 return {id:pad.id,index:pad.index,connected:pad.connected,mapping:'standard',timestamp:pad.timestamp,buttons,axes,vibrationActuator:pad.vibrationActuator,raw:pad}}
function list(){try{return [...(rawGet()||[])].map(p=>p&&normalize(p))}catch(e){return []}}
try{Object.defineProperty(nav,'getGamepads',{configurable:true,writable:true,value:list})}catch(e){try{nav.getGamepads=list}catch(_){}}
const api={
 SLOTS,raw:()=>{try{return [...(rawGet()||[])].filter(Boolean)}catch(e){return []}},normalize,model,
 has:pad=>!!profiles[model(pad)],
 needsSetup:pad=>!!pad&&pad.mapping!=='standard'&&!profiles[model(pad)],
 set(pad,map){profiles[model(pad)]={map,saved:Date.now()};save()},
 clear(pad){delete profiles[model(pad)];save()},
 capture:false // true while the guided setup reads raw input: menus must not react to the pad
};
window.S9ArcadePads=api;
})();
