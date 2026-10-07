/* OPZIONI: cabinet-style options screen drawn on canvas. Fully usable with a joypad alone; controls are remapped by pressing the button. */
(function(){
'use strict';
const V=window.S9ArcadeEvolution,S=V?.settings,BG='arcade/assets/arcade-menu-background.png';
const XBOX={0:'A',1:'B',2:'X',3:'Y',4:'LB',5:'RB',6:'LT',7:'RT',8:'VIEW',9:'MENU',10:'L3',11:'R3',12:'↑',13:'↓',14:'←',15:'→',16:'HOME'};
const PS={0:'✕',1:'○',2:'□',3:'△',4:'L1',5:'R1',6:'L2',7:'R2',8:'SHARE',9:'OPTIONS',10:'L3',11:'R3',12:'↑',13:'↓',14:'←',15:'→',16:'PS'};
const pads=()=>{try{return [...(navigator.getGamepads?.()||[])].filter(Boolean)}catch(e){return []}};
const family=pad=>/playstation|dualshock|dualsense|054c|sony/i.test(pad?.id||'')?'ps':pad?'xbox':'xbox';
// Name of a physical button as printed on that pad.
function buttonName(i,pad){const n=(family(pad)==='ps'?PS:XBOX)[i];return n||'TASTO '+i}
function padTitle(pad){if(!pad)return 'NON COLLEGATO';const id=pad.id.replace(/\(.*?\)/g,'').replace(/vendor.*$/i,'').trim();return (family(pad)==='ps'?'PLAYSTATION · ':'')+(id||'JOYPAD').toUpperCase().slice(0,30)}
const CAMERA=[['close','RAVVICINATA'],['panoramic','PANORAMICA'],['wide','CAMPO LARGO']];

function open({parent=document.body,onClose,inMatch=false}={}){
 const B=window.S9ArcadeBindings,E=window.S9ArcadeEngine;
 const root=document.createElement('div');root.className='evo-settings sa-options';root.setAttribute('role','dialog');root.setAttribute('aria-label','Opzioni');
 root.style.cssText='position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center';
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.style.cssText='width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;image-rendering:pixelated';root.append(canvas);parent.append(root);
 const r=new E.Renderer(canvas),c=r.ctx,bg=r.bitmap?.(BG);
 const tabs=[{id:'game',label:'GIOCO'},{id:'pad',label:'JOYPAD'},{id:'p1',label:'TASTIERA 1P'},{id:'p2',label:'TASTIERA 2P'},{id:'menu',label:'MENU · SISTEMA'}];
 let tab=0,row=0,scroll=0,padSlot=Math.max(0,pads()[0]?.index??0),listen=null,note='',noteAt=0,quietUntil=0,alive=true,raf=0,confirmReset=false;
 const say=t=>{note=t;noteAt=performance.now()};
 function rows(){const id=tabs[tab].id;
  if(id==='game')return [
   {label:'CAMERA',value:()=>CAMERA.find(x=>x[0]===S.camera)?.[1]||'PANORAMICA',step:d=>{const i=CAMERA.findIndex(x=>x[0]===S.camera);S.camera=CAMERA[(i+d+CAMERA.length)%CAMERA.length][0]}},
   {label:'RADAR',toggle:'radar'},{label:'VIBRAZIONE JOYPAD',toggle:'vibration'},{label:'FANTASIA ARCADE · FIAMME E SCIE',toggle:'fantasy'},
   {label:'VOLUME',bar:'volume'},{label:'FLASH E SCANLINE',bar:'effects'},
   {label:confirmReset?'CONFERMI? PREMI DI NUOVO':'RIPRISTINA TUTTI I COMANDI',action:()=>{if(!confirmReset){confirmReset=true;return}confirmReset=false;B.reset();say('COMANDI RIPRISTINATI')}},
   {label:inMatch?'TORNA ALLA PAUSA':'ESCI',action:close}];
  if(id==='pad'){const pad=pads().find(p=>p.index===padSlot),list=[{label:'JOYPAD '+(padSlot+1),value:()=>padTitle(pad),step:d=>{padSlot=(padSlot+d+4)%4}},{header:'IN PARTITA'}];
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
 function key(e){if(!alive)return;const k=(e.key||'').toLowerCase();e.preventDefault();e.stopImmediatePropagation();
  if(listen){if(k==='escape'&&e.isTrusted){listen=null;say('ANNULLATO');return}if(!listen.pad&&e.isTrusted&&e.type==='keydown'&&!e.repeat)assign(e.key);return}
  if(performance.now()<quietUntil)return;
  const act=B.keyboard('menu',e)||({escape:'back',enter:'confirm',' ':'confirm'})[k]||(B.keyboard('system',e)==='pause'?'back':null),list=rows(),sel=selectable(list);
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
   if(i===row){c.fillStyle='#ffe44726';c.fillRect(176,y-20,928,32);c.fillStyle='#ffe447';c.fillRect(176,y-20,6,32)}r.text(x.label,200,y+3,18,i===row?'#fff':'#c9dbe6','left');
   const v=valueOf(x),boxed=!!x.bind;if(boxed){const w=Math.max(54,v.length*13+24);c.fillStyle=i===row?'#ffe447':'#1b3150';c.fillRect(1080-w,y-17,w,26);r.text(v,1080-w/2,y+3,17,i===row?'#0b1530':'#fff')}else if(v)r.text((x.step&&i===row?'◀ ':'')+v+(x.step&&i===row?' ▶':''),1080,y+3,18,'#ffe447','right')});
  if(list.length>11){const h=380*11/list.length,y=228+380*scroll/list.length;c.fillStyle='#ffe44788';c.fillRect(1112,y,5,h)}
  // Hint line, in the glyphs of the device in use
  const pk=a=>padNow?buttonName(B.map('padmenu')[a],padNow):B.label(B.map('menu')[a]);
  r.text((padNow?'CROCE':'FRECCE')+' · SCEGLI    '+pk('confirm')+' · CONFERMA    '+pk('back')+' · INDIETRO    '+pk('previous')+' / '+pk('next')+' · SCHEDA',640,668,17,'#ffe55b');
  if(note&&now-noteAt<2600)r.text(note,640,700,16,'#7dff9a');
  if(listen){c.fillStyle='#000a';c.fillRect(0,0,1280,720);r.panel(290,250,700,220,20);r.text(listen.pad?'PREMI IL PULSANTE DEL JOYPAD':'PREMI IL TASTO',640,318,30,'#ffe447');r.text('PER: '+listen.label,640,368,22,'#fff');const left=Math.max(0,1-(now-listen.since)/6000);c.fillStyle='#1b3150';c.fillRect(390,404,500,12);c.fillStyle='#ffe447';c.fillRect(390,404,500*left,12);r.text(listen.pad?'ATTENDI PER ANNULLARE':'ESC PER ANNULLARE',640,446,15,'#9fc2d4')}
 }
 function frame(){if(!alive)return;pollPad();draw();raf=requestAnimationFrame(frame)}
 function close(){if(!alive)return;alive=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);root.remove();onClose?.()}
 addEventListener('keydown',key,true);row=selectable(rows())[0];frame();
 return root}
window.S9ArcadeOptions={open,buttonName};
// Every existing entry point (Centro Arcade, pause in match) opens this screen.
if(window.S9ArcadeHub)window.S9ArcadeHub.settings=(parent,onClose)=>open({parent:parent?.closest?.('#arcade-match')||document.body,onClose,inMatch:!!parent?.closest?.('#arcade-match')});
})();
