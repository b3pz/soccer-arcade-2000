/* Mouse-optional controls for the whole game: fullscreen (F), gamepad and arrow-key focus navigation. */
(function(){
'use strict';
const doc=document,root=doc.documentElement;
const typing=el=>!!el&&(el.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)&&!/^(button|submit|checkbox|radio|reset)$/i.test(el.type||''));

// ---------------------------------------------------------------- fullscreen
function isFullscreen(){return !!(doc.fullscreenElement||doc.webkitFullscreenElement)}
function toggleFullscreen(){try{const p=isFullscreen()?(doc.exitFullscreen||doc.webkitExitFullscreen).call(doc):(root.requestFullscreen||root.webkitRequestFullscreen).call(root,{navigationUI:'hide'});p?.catch?.(()=>{})}catch(e){}}

// ------------------------------------------------- arrow-key focus navigation
// Outside the Arcade screens (which have their own keys), arrows move focus between visible controls and Enter activates.
const NATIVE='button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
function visible(el){const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.right<0||r.top>innerHeight||r.left>innerWidth)return false;const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05&&!el.disabled&&!el.closest('[inert],[aria-hidden="true"]')}
function controls(){const list=new Set(doc.querySelectorAll(NATIVE));for(const el of doc.querySelectorAll('div,span,tr,td,li,label,img,section,article'))if(typeof el.onclick==='function'||el.hasAttribute('onclick'))list.add(el);return [...list].filter(visible)}
function center(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r}}
function move(dir){const items=controls();if(!items.length)return false;const current=doc.activeElement&&items.includes(doc.activeElement)?doc.activeElement:null;
 if(!current){focus(items[0]);return true}const a=center(current),v={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[dir];let best=null,score=Infinity;
 for(const el of items){if(el===current||current.contains(el)||el.contains(current))continue;const b=center(el),dx=b.x-a.x,dy=b.y-a.y,along=dx*v[0]+dy*v[1];if(along<=4)continue;const across=Math.abs(dx*v[1]+dy*v[0]),cost=along+across*2.2;if(cost<score){score=cost;best=el}}
 if(best){focus(best);return true}return false}
function focus(el){if(!el.matches(NATIVE)&&!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');el.focus({preventScroll:true});el.scrollIntoView?.({block:'nearest',inline:'nearest'});el.classList.add('s9-kbd-focus');el.addEventListener('blur',()=>el.classList.remove('s9-kbd-focus'),{once:true})}
const arcadeOwnsKeys=()=>!!(window.S9ArcadeActive||window.S9ArcadeMenuOpen);
doc.addEventListener('keydown',e=>{
 const k=e.key;if((k==='f'||k==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!typing(e.target)){e.preventDefault();toggleFullscreen();return}
 if(e.defaultPrevented||arcadeOwnsKeys()||typing(e.target))return;
 const dir={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[k];
 if(dir){if(move(dir))e.preventDefault();return}
 if(k==='Enter'||k===' '){const el=doc.activeElement;if(!el||el===doc.body){if(move('down'))e.preventDefault();return}
  // Native controls already react to real Enter/Space; synthetic (gamepad) events and clickable rows need an explicit click.
  if(!e.isTrusted||!el.matches('button,a[href],summary,input')){e.preventDefault();el.click()}}
});
const style=doc.createElement('style');style.textContent='.s9-kbd-focus,:focus-visible{outline:3px solid #ffe64a!important;outline-offset:2px}';doc.head.append(style);

// ------------------------------------------------------------------ gamepad
// Standard mapping. In a match pads are read by the engine (A tiro, B passa, X alto, Y dribbling); here only START=ESC pausa.
// Arcade menus: A=Z conferma, B=X indietro, LB/RB=Q/E zone. Rest of the game: A=Invio, B=Esc. BACK=fullscreen (if the browser allows it).
function keyFor(button){const active=window.S9ArcadeActive,menu=!!window.S9ArcadeMenuOpen;
 if(button===8)return 'f';
 // In play every pad is read directly by its own player input; only pause/result screens need key events.
 if(active){if(active.paused||active.finished)return {0:'z',2:'x',9:active.finished?'z':'Escape'}[button]||null;return button===9?'Escape':null}
 if(button===12)return 'ArrowUp';if(button===13)return 'ArrowDown';if(button===14)return 'ArrowLeft';if(button===15)return 'ArrowRight';
 if(menu)return {0:'z',1:'x',2:'x',3:'z',4:'q',5:'e',9:'z'}[button]||null;
 return {0:'Enter',1:'Escape',9:'Enter'}[button]||null}
function send(type,key){const target=doc.activeElement&&doc.activeElement!==doc.body?doc.activeElement:doc;target.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true,composed:true}))}
const held=new Map(),stick=new Map(),repeat=new Map();let polling=false,connected=false;
function poll(now){const pads=(navigator.getGamepads?.()||[]).filter(Boolean);connected=pads.length>0;api.padConnected=connected;if(!connected){for(const [b,k] of held)send('keyup',k);held.clear();polling=false;return}
 const pressed=new Set(),arrows=new Set();
 for(const pad of pads){pad.buttons.forEach((b,i)=>{if(b.pressed||b.value>.5)pressed.add(i)});const [x=0,y=0]=pad.axes;if(x<-.5)arrows.add('ArrowLeft');if(x>.5)arrows.add('ArrowRight');if(y<-.5)arrows.add('ArrowUp');if(y>.5)arrows.add('ArrowDown')}
 for(const i of pressed)if(!held.has(i)){const k=keyFor(i);if(k){held.set(i,k);send('keydown',k);repeat.set('b'+i,now+420)}}
 for(const [i,k] of [...held])if(!pressed.has(i)){held.delete(i);repeat.delete('b'+i);send('keyup',k)}
 if(window.S9ArcadeActive)arrows.clear();
 for(const k of arrows)if(!stick.has(k)){stick.set(k,k);send('keydown',k);repeat.set('s'+k,now+420)}
 for(const [k] of [...stick])if(!arrows.has(k)){stick.delete(k);repeat.delete('s'+k);send('keyup',k)}
 // Menu auto-repeat for held directions (never during a match: the match reads held arrows directly).
 if(!window.S9ArcadeActive)for(const [id,at] of repeat){const k=id[0]==='b'?held.get(+id.slice(1)):stick.get(id.slice(1));if(!k||!k.startsWith('Arrow'))continue;if(now>=at){send('keydown',k);repeat.set(id,now+150)}}
 requestAnimationFrame(poll)}
function start(){if(polling||!navigator.getGamepads)return;polling=true;requestAnimationFrame(poll)}
addEventListener('gamepadconnected',start);if((navigator.getGamepads?.()||[]).some(Boolean))start();

const api={toggleFullscreen,isFullscreen,padConnected:false,move};
window.S9ArcadeControls=api;
})();
