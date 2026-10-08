/* OPZIONI: cabinet-style options screen drawn on canvas. Fully usable with a joypad alone; controls are remapped by pressing the button. */
(function(){
'use strict';
const V=window.S9ArcadeEvolution,S=V?.settings,BG='arcade/assets/art/stadium-menu.png';
const XBOX={0:'A',1:'B',2:'X',3:'Y',4:'LB',5:'RB',6:'LT',7:'RT',8:'VIEW',9:'MENU',10:'L3',11:'R3',12:'↑',13:'↓',14:'←',15:'→',16:'HOME'};
const PS={0:'✕',1:'○',2:'□',3:'△',4:'L1',5:'R1',6:'L2',7:'R2',8:'SHARE',9:'OPTIONS',10:'L3',11:'R3',12:'↑',13:'↓',14:'←',15:'→',16:'PS'};
const pads=()=>{try{return [...(navigator.getGamepads?.()||[])].filter(Boolean)}catch(e){return []}};
const family=pad=>/playstation|dualshock|dualsense|054c|sony/i.test(pad?.id||'')||window.S9ArcadePads?.has(pad)?'ps':'xbox';
// Name of a physical button as printed on that pad.
function buttonName(i,pad){const n=(family(pad)==='ps'?PS:XBOX)[i];return n||'TASTO '+i}
function padTitle(pad){if(!pad)return 'NON COLLEGATO';const id=pad.id.replace(/\(.*?\)/g,'').replace(/vendor.*$/i,'').trim();return (family(pad)==='ps'?'PLAYSTATION · ':'')+(id||'JOYPAD').toUpperCase().slice(0,30)}
// PlayStation-style pad, drawn in the cabinet palette. lit: standard slots to light up; blink: slot to point at.
function drawPad(c,cx,cy,s,lit=new Set(),blink=-1,now=0){const on=i=>lit.has(i)||i===blink&&Math.floor(now/260)%2===0,fill=(i,base)=>on(i)?'#ffe447':base;
 c.save();c.translate(cx,cy);c.scale(s,s);c.lineJoin='round';const R=(x,y,w,h,r,f,st='#3b3f4f')=>{c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);c.fillStyle=f;c.fill();c.lineWidth=2.5;c.strokeStyle=st;c.stroke()};
 // shoulders
 R(-128,-82,62,14,5,fill(6,'#8c909c'));R(-128,-68,62,14,5,fill(4,'#a9adb8'));R(66,-82,62,14,5,fill(7,'#8c909c'));R(66,-68,62,14,5,fill(5,'#a9adb8'));
 c.font='bold 10px monospace';c.textAlign='center';c.fillStyle='#262a36';c.fillText('L2',-97,-71);c.fillText('L1',-97,-57);c.fillText('R2',97,-71);c.fillText('R1',97,-57);
 // body and grips
 c.fillStyle='#c9ccd5';c.strokeStyle='#4b4f5e';c.lineWidth=3;c.beginPath();c.ellipse(-92,32,46,64,.22,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.ellipse(92,32,46,64,-.22,0,Math.PI*2);c.fill();c.stroke();R(-136,-56,272,74,34,'#c9ccd5','#4b4f5e');
 c.fillStyle='#c9ccd5';c.fillRect(-120,-30,240,44);c.beginPath();c.ellipse(-92,32,43,61,.22,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(92,32,43,61,-.22,0,Math.PI*2);c.fill();
 // d-pad
 c.fillStyle='#a6aab5';c.beginPath();c.arc(-92,-18,34,0,Math.PI*2);c.fill();
 R(-101,-48,18,24,3,fill(12,'#2b2f3b'),'#14161e');R(-101,-12,18,24,3,fill(13,'#2b2f3b'),'#14161e');R(-126,-27,24,18,3,fill(14,'#2b2f3b'),'#14161e');R(-82,-27,24,18,3,fill(15,'#2b2f3b'),'#14161e');c.fillStyle='#2b2f3b';c.fillRect(-101,-27,18,18);
 // select / start
 R(-34,-14,26,9,4,fill(8,'#2b2f3b'),'#14161e');R(8,-14,26,9,4,fill(9,'#2b2f3b'),'#14161e');c.font='bold 7px monospace';c.fillStyle='#3d4250';c.fillText('SELECT',-21,0);c.fillText('START',21,0);
 // face buttons
 c.fillStyle='#a6aab5';c.beginPath();c.arc(92,-18,38,0,Math.PI*2);c.fill();
 for(const [i,x,y,col] of [[3,92,-42,'#2fbf86'],[1,116,-18,'#ff5d6c'],[0,92,6,'#6fa8ff'],[2,68,-18,'#ff86c8']]){c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fillStyle=on(i)?'#ffe447':'#2b2f3b';c.fill();c.lineWidth=2;c.strokeStyle='#14161e';c.stroke();c.strokeStyle=on(i)?'#2b2f3b':col;c.lineWidth=2.4;c.beginPath();
  if(i===3){c.moveTo(x,y-6);c.lineTo(x+6,y+4);c.lineTo(x-6,y+4);c.closePath()}else if(i===1)c.arc(x,y,6,0,Math.PI*2);else if(i===0){c.moveTo(x-5,y-5);c.lineTo(x+5,y+5);c.moveTo(x+5,y-5);c.lineTo(x-5,y+5)}else c.rect(x-5,y-5,10,10);c.stroke()}
 c.restore()}
const CAMERA=[['close','RAVVICINATA'],['panoramic','PANORAMICA'],['wide','CAMPO LARGO']];

function open({parent=document.body,onClose,inMatch=false,setup=false}={}){
 const B=window.S9ArcadeBindings,E=window.S9ArcadeEngine;
 const root=document.createElement('div');root.className='evo-settings sa-options';root.setAttribute('role','dialog');root.setAttribute('aria-label','Opzioni');
 root.style.cssText='position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center';
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.style.cssText='width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;image-rendering:pixelated';root.append(canvas);parent.append(root);
 const r=new E.Renderer(canvas),c=r.ctx,bg=r.bitmap?.(BG);
 const tabs=[{id:'game',label:'GIOCO'},{id:'pad',label:'JOYPAD'},{id:'p1',label:'TASTIERA 1P'},{id:'p2',label:'TASTIERA 2P'},{id:'menu',label:'MENU · SISTEMA'}];
 let wiz=null,tab=0,row=0,scroll=0,padSlot=Math.max(0,pads()[0]?.index??0),listen=null,note='',noteAt=0,quietUntil=0,alive=true,raf=0,confirmReset=false;
 const say=t=>{note=t;noteAt=performance.now()};
 function rows(){const id=tabs[tab].id;
  if(id==='game')return [
   {label:'CAMERA',value:()=>CAMERA.find(x=>x[0]===S.camera)?.[1]||'PANORAMICA',step:d=>{const i=CAMERA.findIndex(x=>x[0]===S.camera);S.camera=CAMERA[(i+d+CAMERA.length)%CAMERA.length][0]}},
   {label:'METEO',value:()=>({auto:'CASUALE',day:'SERENO',night:'NOTTE',rain:'PIOGGIA'})[S.weather||'auto'],step:d=>{const L=['auto','day','night','rain'];S.weather=L[(L.indexOf(S.weather||'auto')+d+L.length)%L.length]}},
   {label:'RADAR',toggle:'radar'},{label:'VIBRAZIONE JOYPAD',toggle:'vibration'},{label:'FANTASIA ARCADE · FIAMME E SCIE',toggle:'fantasy'},
   {label:'MUSICA DEI MENU',value:()=>{const t=window.S9ArcadeMusic?.track||'';return t.split('/').pop().replace('.wav','').replace('cabinet-theme','cabinet theme').toUpperCase()},step:()=>{window.S9ArcadeMusic?.next()}},
   {label:'VOLUME',bar:'volume'},{label:'FLASH E SCANLINE',bar:'effects'},
   {label:confirmReset?'CONFERMI? PREMI DI NUOVO':'RIPRISTINA TUTTI I COMANDI',action:()=>{if(!confirmReset){confirmReset=true;return}confirmReset=false;B.reset();say('COMANDI RIPRISTINATI')}},
   {label:inMatch?'TORNA ALLA PAUSA':'ESCI',action:close}];
  if(id==='pad'){const pad=pads().find(p=>p.index===padSlot),list=[{label:'CONFIGURA JOYPAD · PREMI OGNI TASTO',action:startWizard},{label:'JOYPAD '+(padSlot+1),value:()=>padTitle(pad),step:d=>{padSlot=(padSlot+d+4)%4}},{header:'IN PARTITA'}];
   for(const [action,label] of [...B.play,...B.system])list.push({label:label.toUpperCase(),bind:{group:'pad'+padSlot,action,pad:true}});
   list.push({header:'NEI MENU (TUTTI I JOYPAD)'});for(const [action,label] of B.menu)list.push({label:label.toUpperCase(),bind:{group:'padmenu',action,pad:true}});return list}
  const groups=id==='menu'?[['menu',B.menu,'MENU E INTRO'],['system',B.system,'COMANDI GENERALI']]:[[id,B.play,id==='p1'?'GIOCATORE 1':'GIOCATORE 2']],list=[];
  for(const [group,commands,title] of groups){list.push({header:title});for(const [action,label] of commands)list.push({label:label.toUpperCase(),bind:{group,action,pad:false}})}return list}
 const selectable=list=>list.map((x,i)=>x.header?-1:i).filter(i=>i>=0);
 function valueOf(x){if(x.toggle)return S[x.toggle]?'SÌ':'NO';if(x.bar)return '■'.repeat(Math.round(S[x.bar]*10)).padEnd(10,'□');if(x.bind){const v=B.map(x.bind.group)[x.bind.action];return x.bind.pad?buttonName(v,pads().find(p=>p.index===padSlot)||pads()[0]):B.label(v)}return x.value?x.value():''}
 function change(x,d){if(x.toggle)S[x.toggle]=!S[x.toggle];else if(x.bar)S[x.bar]=Math.max(0,Math.min(1,Math.round((S[x.bar]+d*.1)*10)/10));else if(x.step)x.step(d);else return;V.save();window.S9ArcadeStadium?.setVolume?.();window.S9ArcadeMusic?.setVolume?.()}
 function activate(x){if(x.bind){listen={...x.bind,label:x.label,since:performance.now(),held:new Set(pads().flatMap(p=>p.buttons.map((b,i)=>b.pressed||b.value>.5?p.index*100+i:-1)).filter(i=>i>=0))};return}if(x.action){x.action();return}change(x,1)}
 function assign(value){const l=listen;listen=null;quietUntil=performance.now()+400;try{const swapped=B.set(l.group,l.action,value);const name=l.pad?buttonName(+value,pads().find(p=>p.index===padSlot)||pads()[0]):B.label(String(value).toLowerCase());say(l.label+' → '+name+(swapped?' · SCAMBIATO':''))}catch(e){say(e.message.toUpperCase())}}
 // Waiting for a joypad button: the first button pressed after the request (buttons already held are ignored until released).
 function pollPad(){if(!listen?.pad)return;for(const p of pads()){if(listen.group!=='padmenu'&&pads().some(q=>q.index===padSlot)&&p.index!==padSlot)continue;p.buttons.forEach((b,i)=>{const id=p.index*100+i,down=b.pressed||b.value>.5;if(!down){listen?.held.delete(id);return}if(listen&&!listen.held.has(id))assign(i)})}if(listen&&performance.now()-listen.since>6000){listen=null;say('ANNULLATO')}}
 // Guided setup: each button of the drawn pad blinks in turn; the first raw input that changes is recorded for it.
 function wizPad(){const raw=window.S9ArcadePads.raw();return raw.find(p=>p.index===padSlot)||raw[0]||null}
 function startWizard(){const pad=wizPad();if(!pad){say('COLLEGA IL JOYPAD E PREMI UN TASTO');return}window.S9ArcadePads.capture=true;wiz={pad:pad.index,id:pad.id,step:0,map:{},base:null,release:false,done:false,since:performance.now()}}
 function pollWizard(now){if(!wiz)return;const pad=window.S9ArcadePads.raw().find(p=>p.index===wiz.pad);if(!pad)return;const pressed=pad.buttons.map(b=>b.pressed||b.value>.5);
  // After the last button (START) the menus stay deaf to the pad until every button is released.
  if(wiz.done){if(wiz.waitRelease&&!pressed.some(Boolean)&&pad.axes.every((v,i)=>Math.abs(v-(wiz.base?.axes[i]??0))<.4)){wiz.waitRelease=false;window.S9ArcadePads.capture=false;quietUntil=now+300}return}
  if(!wiz.base){wiz.base={axes:pad.axes.slice(),held:pressed.map(Boolean)};return}
  const active=pressed.some((p,i)=>p&&!wiz.base.held[i])||pad.axes.some((v,i)=>Math.abs(v-wiz.base.axes[i])>.5);
  if(wiz.release){if(!active){wiz.release=false;wiz.since=now}return}
  if(now-wiz.since>9000){wiz.step++;wiz.since=now;say('TASTO SALTATO');}else{let src=null;pressed.forEach((p,i)=>{if(!src&&p&&!wiz.base.held[i])src={t:'b',i}});if(!src)pad.axes.forEach((v,i)=>{if(!src&&Math.abs(v-wiz.base.axes[i])>.6)src={t:'a',i,s:Math.sign(v-wiz.base.axes[i])}});
   if(src){const dup=Object.values(wiz.map).some(m=>m.t===src.t&&m.i===src.i&&(m.s||0)===(src.s||0));if(dup){say('QUESTO TASTO È GIÀ ASSEGNATO');wiz.release=true;return}wiz.map[window.S9ArcadePads.SLOTS[wiz.step][0]]=src;wiz.step++;wiz.release=true;window.S9SFX?.kick?.()}}
  if(wiz.step>=window.S9ArcadePads.SLOTS.length){window.S9ArcadePads.set(pad,wiz.map);wiz.done=true;wiz.testing=true;wiz.waitRelease=true;say('JOYPAD CONFIGURATO')}}
 function endWizard(){wiz=null;window.S9ArcadePads.capture=false;quietUntil=performance.now()+500}
 function key(e){if(!alive)return;const k=(e.key||'').toLowerCase();e.preventDefault();e.stopImmediatePropagation();
  if(wiz){if(wiz.testing&&!wiz.waitRelease&&performance.now()>quietUntil&&(B.keyboard('menu',e)==='back'||k==='escape'&&e.isTrusted)){endWizard();return}if(!wiz.testing&&k==='escape'&&e.isTrusted){endWizard();say('CONFIGURAZIONE ANNULLATA')}return}
  if(listen){if(k==='escape'&&e.isTrusted){listen=null;say('ANNULLATO');return}if(!listen.pad&&e.isTrusted&&e.type==='keydown'&&!e.repeat)assign(e.key);return}
  if(performance.now()<quietUntil)return;
  const act=B.keyboard('menu',e)||({escape:e.isTrusted?'back':null,enter:'confirm',' ':'confirm'})[k]||(e.isTrusted&&B.keyboard('system',e)==='pause'?'back':null),list=rows(),sel=selectable(list);
  if(act==='back'){close();return}
  if(act==='previous'||act==='next'||row<0&&(act==='arrowleft'||act==='arrowright')){tab=(tab+((act==='previous'||act==='arrowleft')?-1:1)+tabs.length)%tabs.length;row=-1;scroll=0;confirmReset=false;return}
  if(act==='arrowup'||act==='arrowdown'){const at=sel.indexOf(row),next=act==='arrowdown'?at+1:at-1;row=row<0?(act==='arrowdown'?sel[0]:-1):next<0?-1:sel[Math.min(sel.length-1,next)];if(row>=0){scroll=Math.max(0,Math.min(scroll,row-1),row-10)}if(list[row]?.label?.startsWith('CONFERMI'))return;confirmReset=false;return}
  if(row>=0&&(act==='arrowleft'||act==='arrowright')){change(list[row],act==='arrowleft'?-1:1);return}
  if(act==='confirm'){if(row<0){row=sel[0];return}activate(list[row])}}
 function draw(){const now=performance.now(),list=rows(),padNow=pads()[0];c.fillStyle='#050a1c';c.fillRect(0,0,1280,720);
  if(bg?.complete&&bg.naturalWidth){c.globalAlpha=.55;c.drawImage(bg,0,0,1280,720);c.globalAlpha=1}c.fillStyle='#030716aa';c.fillRect(0,0,1280,720);
  r.arcadeBanner?r.arcadeBanner('OPZIONI','#ffe447',96,1):r.text('OPZIONI',640,90,52,'#ffe447');
  // Tabs
  const tw=228;tabs.forEach((t,i)=>{const x=640-tabs.length*tw/2+i*tw;r.panel(x+4,150,tw-8,46,10);if(i===tab){c.fillStyle=row<0?'#ffe447':'#ffe44766';c.fillRect(x+12,188,tw-24,4)}r.text(t.label,x+tw/2,181,17,i===tab?'#ffe447':'#9fc2d4')});
  // Rows
  r.panel(150,210,980,420,18);const visible=list.slice(scroll,scroll+11);visible.forEach((x,k)=>{const i=k+scroll,y=246+k*34;if(x.header){r.text('— '+x.header+' —',640,y+6,15,'#7fdcff');return}
   const right=tabs[tab].id==='pad'?690:1080;if(i===row){c.fillStyle='#ffe44726';c.fillRect(176,y-20,right-152,32);c.fillStyle='#ffe447';c.fillRect(176,y-20,6,32)}r.text(x.label,200,y+3,18,i===row?'#fff':'#c9dbe6','left');
   const v=valueOf(x),boxed=!!x.bind;if(boxed){const w=Math.max(54,v.length*13+24);c.fillStyle=i===row?'#ffe447':'#1b3150';c.fillRect(right-w,y-17,w,26);r.text(v,right-w/2,y+3,17,i===row?'#0b1530':'#fff')}else if(v)r.text((x.step&&i===row?'◀ ':'')+v+(x.step&&i===row?' ▶':''),right,y+3,tabs[tab].id==='pad'?15:18,'#ffe447','right')});
  // Live pad: what is pressed right now lights up.
  if(tabs[tab].id==='pad'&&!wiz){const pad=pads().find(p=>p.index===padSlot)||pads()[0],lit=new Set((pad?.buttons||[]).map((b,i)=>b.pressed||b.value>.5?i:-1).filter(i=>i>=0)),sel=list[row]?.bind?.pad?B.map(list[row].bind.group)[list[row].bind.action]:-1;drawPad(c,915,400,1.18,lit,sel,now);r.text(pad?(window.S9ArcadePads?.needsSetup(pad.raw||pad)?'JOYPAD DA CONFIGURARE':'PREMI UN TASTO: SI ILLUMINA'):'NESSUN JOYPAD',915,560,14,pad&&window.S9ArcadePads?.needsSetup(pad.raw||pad)?'#ff8fa3':'#9fc2d4')}
  if(list.length>11){const h=380*11/list.length,y=228+380*scroll/list.length;c.fillStyle='#ffe44788';c.fillRect(1112,y,5,h)}
  // Hint line, in the glyphs of the device in use
  const pk=a=>padNow?buttonName(B.map('padmenu')[a],padNow):B.label(B.map('menu')[a]);
  r.text('{arrows} SCEGLI    {m:confirm} CONFERMA    {m:back} INDIETRO    {m:previous}{m:next} SCHEDA',640,668,17,'#ffe55b');
  if(note&&now-noteAt<2600)r.text(note,640,700,16,'#7dff9a');
  if(wiz){const P=window.S9ArcadePads,slot=P.SLOTS[Math.min(wiz.step,P.SLOTS.length-1)];c.fillStyle='#030716f2';c.fillRect(0,0,1280,720);r.text('CONFIGURA JOYPAD',640,90,40,'#ffe447');
   if(wiz.testing){const pad=pads().find(p=>p.index===wiz.pad),lit=new Set((pad?.buttons||[]).map((b,i)=>b.pressed||b.value>.5?i:-1).filter(i=>i>=0));drawPad(c,640,370,2.3,lit,-1,now);r.text('FATTO! PREMI I TASTI: SI ILLUMINANO',640,600,26,'#7dff9a');r.text('○ PER FINIRE  ·  ESC DA TASTIERA',640,640,18,'#fff')}
   else{drawPad(c,640,370,2.3,new Set(),slot[0],now);r.text('PREMI  '+slot[2],640,600,34,'#fff');r.text((Math.min(wiz.step+1,P.SLOTS.length))+' / '+P.SLOTS.length+'   ·   ESC ANNULLA   ·   TASTO ASSENTE: ASPETTA 9 SECONDI',640,644,15,'#9fc2d4')}
   if(note&&now-noteAt<2000)r.text(note,640,684,16,'#ffb36b');return}
  if(listen){c.fillStyle='#000a';c.fillRect(0,0,1280,720);r.panel(290,250,700,220,20);r.text(listen.pad?'PREMI IL PULSANTE DEL JOYPAD':'PREMI IL TASTO',640,318,30,'#ffe447');r.text('PER: '+listen.label,640,368,22,'#fff');const left=Math.max(0,1-(now-listen.since)/6000);c.fillStyle='#1b3150';c.fillRect(390,404,500,12);c.fillStyle='#ffe447';c.fillRect(390,404,500*left,12);r.text(listen.pad?'ATTENDI PER ANNULLARE':'ESC PER ANNULLARE',640,446,15,'#9fc2d4')}
 }
 function frame(){if(!alive)return;pollWizard(performance.now());pollPad();draw();raf=requestAnimationFrame(frame)}
 function close(){if(!alive)return;alive=false;if(window.S9ArcadePads)window.S9ArcadePads.capture=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);root.remove();onClose?.()}
 addEventListener('keydown',key,true);row=selectable(rows())[0];if(setup){tab=1;row=0;startWizard()}frame();
 return root}
// A non-standard pad that was never set up opens the guided setup by itself (outside matches), once per session.
let offered=false;function offerSetup(){if(offered||window.S9ArcadeActive||document.querySelector('.sa-options'))return;const pad=window.S9ArcadePads?.raw().find(p=>window.S9ArcadePads.needsSetup(p)&&p.buttons.some(b=>b.pressed));if(!pad)return;offered=true;open({setup:true})}
if(typeof addEventListener==='function'){let t=0;const watch=()=>{if(!offered){offerSetup();t=requestAnimationFrame(watch)}};addEventListener('gamepadconnected',()=>{cancelAnimationFrame(t);watch()});if(window.S9ArcadePads?.raw().length)watch()}
window.S9ArcadeOptions={open,buttonName,drawPad};
// Every existing entry point (Centro Arcade, pause in match) opens this screen.
if(window.S9ArcadeHub)window.S9ArcadeHub.settings=(parent,onClose)=>open({parent:document.body,onClose,inMatch:!!parent?.closest?.('#arcade-match')});
})();
