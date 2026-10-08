/* Touch controls for phones and tablets: a floating stick on the left half and arcade buttons on the right
   during a match (they drive 1P's input exactly like keys: hold = charge, release = shoot), a pause button,
   and taps as confirm on the intro/title. Shown only on touch screens; keyboard and pads are unaffected. */
(function(){
'use strict';
const touchDevice=()=>typeof window!=='undefined'&&('ontouchstart' in window||navigator.maxTouchPoints>0)&&matchMedia?.('(pointer:coarse)').matches;
if(!touchDevice())return;
const doc=document,ARROWS=['arrowleft','arrowright','arrowup','arrowdown'];
const BUTTONS=[['z','TIRO','#e63835',0,0],['c','PASSA','#d59112',1,0],['x','LANCIO','#15963d',0,1],['v','SCATTO','#2f7de8',1,1]];
const css=`#sa-touch{position:fixed;inset:0;z-index:100001;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none;font:900 13px monospace}
#sa-touch .stick{position:absolute;left:0;bottom:0;width:50%;height:70%;pointer-events:auto}
#sa-touch .base{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;background:#ffffff18;border:3px solid #ffffff55;display:none}
#sa-touch .knob{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:#ffe447cc;border:3px solid #0a1430}
#sa-touch .pad{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(2,74px);gap:12px;pointer-events:auto}
#sa-touch .btn{width:74px;height:74px;border-radius:50%;border:4px solid #0a1430;color:#fff;display:grid;place-items:center;text-shadow:2px 2px #000;box-shadow:0 4px #0008;opacity:.82}
#sa-touch .btn.on{transform:translateY(3px);box-shadow:0 1px #0008;opacity:1;filter:brightness(1.3)}
#sa-touch .top{position:absolute;top:calc(max(10px,env(safe-area-inset-top)) + 13vh);right:max(12px,env(safe-area-inset-right));display:flex;gap:10px;pointer-events:auto}
#sa-touch .small{padding:8px 12px;border-radius:10px;background:#071933dd;border:3px solid #ffe447;color:#ffe447}
#sa-rotate{position:fixed;inset:0;z-index:100002;background:#050a1c;color:#ffe447;display:none;place-items:center;text-align:center;font:900 22px monospace;padding:20px}
@media (orientation:portrait){#sa-rotate.show{display:grid}}`;
const style=doc.createElement('style');style.textContent=css;doc.head.append(style);
const rotate=doc.createElement('div');rotate.id='sa-rotate';rotate.textContent='GIRA IL TELEFONO IN ORIZZONTALE';doc.body.append(rotate);rotate.classList.add('show');

const ui=doc.createElement('div');ui.id='sa-touch';ui.style.display='none';
ui.innerHTML='<div class="stick"><div class="base"><div class="knob"></div></div></div><div class="pad"></div><div class="top"><div class="small" data-k="switch">CAMBIO</div><div class="small" data-sys="pause">II PAUSA</div></div>';
doc.body.append(ui);
const padEl=ui.querySelector('.pad');for(const [k,label,color] of BUTTONS){const b=doc.createElement('div');b.className='btn';b.dataset.k=k;b.textContent=label;b.style.background=color;padEl.append(b)}
const input=()=>window.S9ArcadeActive?.input||null;
// Buttons: press on touchstart, release on touchend (same 'touch' source as keys use 'kb').
function bind(el){const k=el.dataset.k,sys=el.dataset.sys;
 el.addEventListener('touchstart',e=>{e.preventDefault();el.classList.add('on');const a=window.S9ArcadeActive;if(sys){const key=window.S9ArcadeBindings?.key('pause')||'escape';dispatchEvent(new KeyboardEvent('keydown',{key:key==='escape'?'Escape':key,bubbles:true,cancelable:true}));return}if(a?.paused){const map={z:'confirm',c:'back',x:'back'};const key=window.S9ArcadeBindings?.key(map[k]||'confirm','menu')||'z';dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));return}if(a?.finished){a.control?.('continue');return}input()?.press(k,'touch')},{passive:false});
 const up=e=>{e.preventDefault();el.classList.remove('on');if(!sys)input()?.release(k,'touch')};el.addEventListener('touchend',up,{passive:false});el.addEventListener('touchcancel',up,{passive:false})}
ui.querySelectorAll('[data-k],[data-sys]').forEach(bind);
// Floating stick: appears where the thumb lands; 8 directions with a dead zone.
const stick=ui.querySelector('.stick'),base=ui.querySelector('.base'),knob=ui.querySelector('.knob');let origin=null,id=null;
function setDir(dx,dy){const i=input();if(!i)return;const want=new Set(),d=Math.hypot(dx,dy);if(d>14){const a=Math.atan2(dy,dx);if(Math.cos(a)>.38)want.add('arrowright');if(Math.cos(a)<-.38)want.add('arrowleft');if(Math.sin(a)>.38)want.add('arrowdown');if(Math.sin(a)<-.38)want.add('arrowup')}
 for(const k of ARROWS){if(want.has(k))i.press(k,'touch');else i.release(k,'touch')}}
stick.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];id=t.identifier;origin={x:t.clientX,y:t.clientY};base.style.display='block';base.style.left=origin.x+'px';base.style.top=origin.y+'px';knob.style.transform='';const a=window.S9ArcadeActive;if(a?.paused||a?.finished)return},{passive:false});
stick.addEventListener('touchmove',e=>{e.preventDefault();const t=[...e.changedTouches].find(x=>x.identifier===id);if(!t||!origin)return;let dx=t.clientX-origin.x,dy=t.clientY-origin.y;const d=Math.hypot(dx,dy),max=50;if(d>max){dx*=max/d;dy*=max/d}knob.style.transform=`translate(${dx}px,${dy}px)`;const a=window.S9ArcadeActive;if(a?.paused){menuStick(dx,dy);return}setDir(dx,dy)},{passive:false});
const end=e=>{if(![...e.changedTouches].some(x=>x.identifier===id))return;e.preventDefault();origin=null;id=null;base.style.display='none';setDir(0,0);lastMenu=null};
stick.addEventListener('touchend',end,{passive:false});stick.addEventListener('touchcancel',end,{passive:false});
// In the pause menu the stick moves the cursor (one step per flick).
let lastMenu=null;function menuStick(dx,dy){const dir=Math.abs(dy)>30?(dy<0?'ArrowUp':'ArrowDown'):null;if(dir&&dir!==lastMenu)dispatchEvent(new KeyboardEvent('keydown',{key:dir,bubbles:true,cancelable:true}));lastMenu=dir}
// Visible only during a match; the portrait warning only matters while playing or on the title.
setInterval(()=>{const a=window.S9ArcadeActive,on=!!a&&!a.match?.demo;ui.style.display=on?'block':'none';rotate.classList.toggle('show',!!a||!window.S9ArcadeMenuOpen)},250);
// Intro and title: a tap is START (the canvas click already confirms; this also covers the boot screen).
doc.getElementById('sa2000-stage')?.addEventListener('touchend',e=>{if(window.S9ArcadeActive||window.S9ArcadeMenuOpen)return;e.preventDefault();const key=window.S9ArcadeBindings?.key('confirm','menu')||'z';dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))},{passive:false});
window.S9ArcadeTouch={ui};
})();
