/* EDITOR SQUADRE: rename a team and its players, change kit colours; preview with the real sprite.
   Canvas screen in the OPZIONI style: arrows/stick, confirm edits a name (keyboard typing, or the phone's text box),
   left/right change colours and the team, back leaves. Changes are saved at once (game/team-edits.js). */
(function(){
'use strict';
const E=window.S9ArcadeEngine,T=()=>window.S9ArcadeTeamEdits;
const PALETTE=['#ffffff','#111111','#d11f26','#7a1424','#f39ac0','#ff7a1a','#ffd51e','#1e8f3a','#0b6b3a','#36b7ff','#1d63d6','#0d2050','#6b2fb5','#8a8f99','#c9a24a','#2e0b18'];
const teams=()=>[...window.SA2000_CATALOG.club,...window.SA2000_CATALOG.national];
function open({onClose}={}){
 const root=document.createElement('div');root.className='sa-options';root.style.cssText='position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center';
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.style.cssText='width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;image-rendering:pixelated';root.append(canvas);document.body.append(root);
 const r=new E.Renderer(canvas),c=r.ctx;let ti=0,row=0,scroll=0,typing=null,alive=true,raf=0,note='',noteAt=0;
 const team=()=>teams()[ti];
 function rows(){const t=team(),k=t.arcadeKit||{};return [
  {label:'SQUADRA',value:()=>t.name.toUpperCase(),step:d=>{ti=(ti+d+teams().length)%teams().length;scroll=0}},
  {label:'NOME SQUADRA',edit:{get:()=>t.name,set:v=>T().set(t.id,{name:v})}},
  {label:'MAGLIA',color:'shirtPrimary'},{label:'SECONDO COLORE',color:'shirtSecondary'},{label:'PANTALONCINI',color:'shorts'},{label:'CALZETTONI',color:'socks'},
  ...t.players.map(p=>({label:p.pos+'  ',player:p,edit:{get:()=>p.name,set:v=>T().set(t.id,{player:{id:p.id,name:v}})}})),
  {label:'RIPRISTINA SQUADRA ORIGINALE',action:()=>{T().reset(t.id);say('SQUADRA RIPRISTINATA')}},{label:'ESCI',action:close}]}
 const say=t=>{note=t;noteAt=performance.now()};
 function step(x,d){if(x.step)x.step(d);else if(x.color){const k=team().arcadeKit||{},i=PALETTE.indexOf((k[x.color]||'').toLowerCase());T().set(team().id,{kit:{[x.color]:PALETTE[(i+d+PALETTE.length)%PALETTE.length]}})}}
 function startEdit(x){const cur=x.edit.get();if(matchMedia?.('(pointer:coarse)').matches){const v=prompt(x.player?'Nome del giocatore':'Nome della squadra',cur);if(v!=null&&v.trim()){x.edit.set(v.trim().slice(0,24));say('SALVATO')}return}typing={x,text:cur}}
 function key(e){if(!alive)return;e.preventDefault();e.stopImmediatePropagation();const k=e.key;
  if(typing){if(k==='Enter'){if(typing.text.trim()){typing.x.edit.set(typing.text.trim());say('SALVATO')}typing=null}else if(k==='Escape')typing=null;else if(k==='Backspace')typing.text=typing.text.slice(0,-1);else if(k.length===1&&typing.text.length<24)typing.text+=k;return}
  const B=window.S9ArcadeBindings,a=B?.keyboard('menu',e)||({escape:'back',enter:'confirm'})[k.toLowerCase()],list=rows();
  if(a==='back'){close();return}if(a==='arrowup'){row=Math.max(0,row-1)}if(a==='arrowdown'){row=Math.min(list.length-1,row+1)}
  if(a==='arrowleft'||a==='arrowright')step(list[row],a==='arrowleft'?-1:1);
  if(a==='confirm'){const x=list[row];if(x.edit)startEdit(x);else if(x.action)x.action();else step(x,1)}
  scroll=Math.max(0,Math.min(scroll,row-1),row-10)}
 // Touch: tap a row to select it, tap it again to act; tap the left/right third of a value row to step it.
 canvas.addEventListener('click',e=>{const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*1280/b.width,y=(e.clientY-b.top)*720/b.height,list=rows();if(x>1130&&y<120){close();return}const i=Math.floor((y-226)/34)+scroll;if(i<0||i>=list.length||x>780)return;if(i!==row){row=i;return}const it=list[i];if((it.step||it.color)&&x>520)step(it,1);else if((it.step||it.color)&&x<330)step(it,-1);else key({key:'Enter',preventDefault(){},stopImmediatePropagation(){}})});
 function frame(){if(!alive)return;raf=requestAnimationFrame(frame);const now=performance.now(),t=team(),list=rows();c.fillStyle='#050a1c';c.fillRect(0,0,1280,720);
  const bg=r.bitmap?.('arcade/assets/arcade-menu-background.png');if(bg?.complete&&bg.naturalWidth){c.globalAlpha=.45;c.drawImage(bg,0,0,1280,720);c.globalAlpha=1}
  r.arcadeBanner?r.arcadeBanner('EDITOR SQUADRE','#ffe447',96,1):r.text('EDITOR SQUADRE',640,90,48,'#ffe447');
  r.panel(120,180,680,450,18);list.slice(scroll,scroll+12).forEach((x,k)=>{const i=k+scroll,y=226+k*34;if(i===row){c.fillStyle='#ffe44726';c.fillRect(140,y-22,640,32);c.fillStyle='#ffe447';c.fillRect(140,y-22,6,32)}
   r.text(x.player?x.player.pos:x.label,160,y,x.player?15:17,x.player?'#7fdcff':i===row?'#fff':'#c9dbe6','left');
   const v=typing&&typing.x===x?typing.text+(Math.floor(now/400)%2?'_':' '):x.edit?x.edit.get().toUpperCase():x.value?x.value():'';
   if(x.color){const col=(t.arcadeKit||{})[x.color]||'#888';c.fillStyle='#0a1430';c.fillRect(640,y-18,110,24);c.fillStyle=col;c.fillRect(643,y-15,104,18);if(i===row)r.text('◀',622,y,16,'#ffe447'),r.text('▶',768,y,16,'#ffe447')}
   else if(v)r.text((x.step&&i===row?'◀ ':'')+v+(x.step&&i===row?' ▶':''),760,y,16,typing&&typing.x===x?'#7dff9a':'#ffe447','right')});
  if(list.length>12){const h=420*12/list.length,y=196+420*scroll/list.length;c.fillStyle='#ffe44788';c.fillRect(788,y,5,h)}
  // Preview: crest and a player in the kit.
  r.panel(830,180,330,450,18);r.teamCrest({source:t,kit:t.arcadeKit},935,200,120,150);r.text(t.name.toUpperCase(),995,380,18,'#fff');
  const p={role:'ST',team:{kit:t.arcadeKit},face:{x:1,y:0},action:'idle',number:9};c.save();c.translate(995,600);try{r.sprite(p,{elapsed:now/1000,ball:{owner:null},phase:'PLAY',humans:[]},{scale:3})}catch(_){}c.restore();
  if(T().edited(t.id))r.text('MODIFICATA',995,410,13,'#7dff9a');
  r.text(typing?'SCRIVI · INVIO CONFERMA · ESC ANNULLA':'{arrows} SCEGLI    ◀▶ CAMBIA    {m:confirm} MODIFICA    {m:back} ESCI',640,672,16,'#ffe55b');if(note&&now-noteAt<1800)r.text(note,640,704,15,'#7dff9a')}
 function close(){if(!alive)return;alive=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);root.remove();onClose?.()}
 addEventListener('keydown',key,true);frame();return root}
window.S9ArcadeTeamEditor={open,PALETTE};
})();
