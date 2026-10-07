/* Soccer Arcade 2000: boot screen, attract cutscene and title, drawn on one canvas. Keyboard, pad or click. */
(function(){
'use strict';
const W=1280,H=720,canvas=document.getElementById('sa2000-stage'),c=canvas.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=p=>1-(1-p)*(1-p),img=src=>{const i=new Image();i.src=src;return i};
const bg=img('arcade/assets/arcade-menu-background.png');
let renderer=null,ballRenderer=null,ballCanvas=null,state='idle',start=0,raf=0,shake=0,flash=0,landed=new Set(),cues=new Set(),crowd=null,roar=null,music=null,idleSince=0;
function engine(){if(!renderer&&window.S9ArcadeEngine){renderer=new S9ArcadeEngine.Renderer(canvas);ballCanvas=document.createElement('canvas');ballCanvas.width=ballCanvas.height=100;ballRenderer=new S9ArcadeEngine.Renderer(ballCanvas)}return renderer}
// Pixel ball rendered once per frame at 96 px, then scaled with hard edges.
function bigBall(x,y,r,spin){if(state==='title'&&window.S9ArcadeCinematic){S9ArcadeCinematic.ball(c,x,y,r,spin);return}if(!engine())return;const q=ballRenderer.ctx;q.clearRect(0,0,100,100);ballRenderer.drawBall(50,50,48,{ball:{x:spin,y:0,vx:1,vy:0}});const s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(ballCanvas,Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));c.imageSmoothingEnabled=s}
function cover(im,dark){if(im.complete&&im.naturalWidth){const k=Math.max(W/im.naturalWidth,H/im.naturalHeight);c.drawImage(im,(W-im.naturalWidth*k)/2,(H-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k)}else{c.fillStyle='#0a1430';c.fillRect(0,0,W,H)}if(dark>0){c.fillStyle='rgba(2,4,16,'+dark+')';c.fillRect(0,0,W,H)}}
function text(s,x,y,size,color,align='center'){c.font='900 '+size+'px monospace';c.textAlign=align;c.lineJoin='round';c.lineWidth=Math.max(3,size/6);c.strokeStyle='#05070f';s=window.S9ArcadeBindings?.format(s)||s;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y)}
// Chunky extruded lettering: drawn at half size and doubled with hard edges for the cabinet pixel look.
const glyphs=new Map();
function glyph(ch,size,stops,deep){const key=ch+size+stops.join();if(glyphs.has(key))return glyphs.get(key);const q=document.createElement('canvas'),x=q.getContext('2d'),font='italic 900 '+size+'px "Arial Black","Impact","Helvetica Neue",sans-serif';x.font=font;const depth=Math.round(size*.09),w=Math.ceil(x.measureText(ch).width)+depth+size*.25,h=Math.ceil(size*1.25)+depth;q.width=w;q.height=h;x.font=font;x.textBaseline='top';x.lineJoin='round';
 for(let i=depth;i>0;i--){x.fillStyle=deep[Math.min(deep.length-1,Math.floor((i/depth)*deep.length))];x.fillText(ch,size*.08+i*.7,size*.06+i)}
 x.lineWidth=Math.max(2,size/9);x.strokeStyle='#120620';x.strokeText(ch,size*.08,size*.06);const g=x.createLinearGradient(0,size*.06,0,size*1.06);stops.forEach((col,i)=>g.addColorStop(i/(stops.length-1),col));x.fillStyle=g;x.fillText(ch,size*.08,size*.06);
 const out={canvas:q,width:x.measureText(ch).width+size*.05};glyphs.set(key,out);return out}
function word(letters,cx,top,size,stops,deep,u,delay,step,mode,omitBall=false){const parts=letters.split('').map(ch=>ch==='o'?{ball:true,width:size*.7}:glyph(ch,size/2,stops,deep)),total=parts.reduce((n,p)=>n+(p.ball?p.width:p.width*2),0);let x=cx-total/2;
 parts.forEach((p,i)=>{const at=delay+i*step,k=clamp((u-at)/.2,0,1);if(k<=0){x+=p.ball?p.width:p.width*2;return}const id=letters+i;if(k>=1&&!landed.has(id)){landed.add(id);shake=Math.max(shake,mode==='slide'?6:10);window.S9SFX?.slam?.()}
  const dy=mode==='drop'?-420*(1-ease(k))+(k>=1?Math.sin(clamp((u-at-.2)*14,0,Math.PI))*-8:0):0,dx=mode==='slide'?-1400*Math.pow(1-k,3):0;
  if(p.ball&&!omitBall){bigBall(x+p.width/2+dx,top+size*.6+dy,size*.36,u*40)}else if(!p.ball){const s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(p.canvas,Math.round(x+dx),Math.round(top+dy),p.canvas.width*2,p.canvas.height*2);c.imageSmoothingEnabled=s}x+=p.ball?p.width:p.width*2})}
function starburst(x,y,r,rot,color){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<32;i++){const a=i*Math.PI/16,rr=i%2?r*.7:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fillStyle=color;c.fill();c.lineWidth=6;c.strokeStyle='#14061e';c.stroke();c.restore()}
function beams(t){c.save();c.globalCompositeOperation='lighter';for(const [x,dir] of [[130,1],[1150,-1]]){const a=Math.sin(t*.7+x)*.25*dir;c.save();c.translate(x,40);c.rotate(a+dir*.35);const g=c.createLinearGradient(0,0,0,760);g.addColorStop(0,'#fff6c855');g.addColorStop(1,'#fff6c800');c.fillStyle=g;c.beginPath();c.moveTo(-14,0);c.lineTo(14,0);c.lineTo(170,760);c.lineTo(-170,760);c.closePath();c.fill();c.restore()}c.restore()}
// ------------------------------------------------------------------ scenes
function drawBoot(t){c.fillStyle='#000';c.fillRect(0,0,W,H);for(let y=0;y<H;y+=4){c.fillStyle='#ffffff05';c.fillRect(0,y,W,1)}text('SOCCER ARCADE 2000',W/2,300,40,'#ffe14a');if(Math.floor(t*2)%2===0)text(window.S9ArcadeControls?.padConnected?'PREMI START':'PREMI UN TASTO',W/2,400,28,'#fff');text('TASTIERA · JOYPAD · F SCHERMO INTERO',W/2,660,16,'#7fd8ff')}
function drawIntro(t){
 const film=window.S9ArcadeCinematic;
 if(!film){goTitle(1.8);return}
 film.draw(c,t,{
  effects:window.S9ArcadeEvolution?.settings.effects??1,
  fantasy:window.S9ArcadeEvolution?.settings.fantasy!==false,
  cue(key,kind){if(cues.has(key))return;cues.add(key);window.S9SFX?.[kind]?.();if(key==='netBreak'){try{roar.currentTime=5.1;roar.play().catch(()=>{})}catch(_){}}},
  impact(p){if(p<.35)shake=Math.max(shake,9)},
  titleBackground(time){cover(bg,.65);beams(time)},
  logo(progress){
   // Leave the O empty: the ball from the broken net fills this exact slot.
   word('SOCCER'.replace('O','o'),W/2,80,170,['#fffbe0','#ffe36b','#ffb21f','#ff6a00'],['#3b0f05','#5d1a08','#7d2a0c'],2,0,0,'none',true);
   c.save();c.globalAlpha=progress;word('ARCADE',W/2-120,290,130,['#f4ffff','#9feaff','#35b8ff','#1450c8'],['#06143a','#0a1f5a','#12307a'],2,0,0,'none');
   starburst(1000,470,128,0,'#ffd21f');word('2000',1005,392,145,['#ffffff','#ffe9a8','#ff4b3a','#9c0018'],['#3a0010','#5c0018','#7c0a1e'],2,0,0,'none');c.restore();
  }
 });
}
function lerp(a,b,t){return a+(b-a)*t}
function drawTitle(u,t){cover(bg,.55);beams(t);for(let i=0;i<40;i++){const x=(i*173+t*40*(i%3+1))%W,y=(i*97+Math.sin(t+i)*20)%H;c.fillStyle=i%2?'#ffe14a55':'#7fd8ff44';c.fillRect(x,y,3,3)}
 const reveal=clamp((u-1.35)/.3,0,1);if(reveal>0){if(!cues.has('2000')){cues.add('2000');flash=Math.max(flash,.6);shake=14;try{if(roar){roar.currentTime=5.1;roar.play().catch(()=>{})}}catch(e){}startMusic()}
  const s=lerp(3.5,1,ease(reveal));starburst(1000,470,128*s,t*.4,'#ffd21f');c.save();c.translate(1000,470);c.rotate(-.12);c.scale(s,s);c.translate(-1000,-470);word('2000',1005,392,145,['#ffffff','#ffe9a8','#ff4b3a','#9c0018'],['#3a0010','#5c0018','#7c0a1e'],u,1.35,0,'none');c.restore()}
 word('SOCCER'.replace('O','o'),W/2,80,170,['#fffbe0','#ffe36b','#ffb21f','#ff6a00'],['#3b0f05','#5d1a08','#7d2a0c'],u,0,.12,'drop');
 word('ARCADE',W/2-120,290,130,['#f4ffff','#9feaff','#35b8ff','#1450c8'],['#06143a','#0a1f5a','#12307a'],u,.9,.05,'slide');
 if(u>1.8){if(Math.floor(t*2.2)%2===0)text(window.S9ArcadeControls?.padConnected?'PREMI START':'PREMI START  ·  Z / INVIO',W/2,640,30,'#ffffff');text('1–4 GIOCATORI  ·  TASTIERA / JOYPAD  ·  F SCHERMO INTERO',W/2,692,15,'#7fd8ff');text('© 2026 SOCCER ARCADE 2000',W-24,30,13,'#ffe14a','right')}}
function frame(now){raf=requestAnimationFrame(frame);const t=(now-start)/1000;c.save();if(shake>0){c.translate((Math.random()-.5)*shake*(window.S9ArcadeEvolution?.settings.effects??1),(Math.random()-.5)*shake*(window.S9ArcadeEvolution?.settings.effects??1));shake=Math.max(0,shake-1.2)}
 if(state==='boot')drawBoot(t);else if(state==='intro'){drawIntro(t);if(t>=(window.S9ArcadeCinematic?.duration||12))goTitle(1.8)}else if(state==='title'){drawTitle(t,t);if(t>20){idleSince=now;demo()}}
 c.restore();if(flash>0){c.fillStyle='rgba(255,255,255,'+(flash*(window.S9ArcadeEvolution?.settings.effects??1))+')';c.fillRect(0,0,W,H);flash=Math.max(0,flash-.05)}if(state!=='intro')for(let y=0;y<H;y+=4){c.fillStyle='rgba(0,0,0,'+(.09*(window.S9ArcadeEvolution?.settings.effects??1))+')';c.fillRect(0,y,W,1)}}
// ------------------------------------------------------------------ audio
function audio(){if(crowd)return;try{crowd=new Audio('assets/audio/stadium-ambience.mp3');crowd.loop=true;crowd.volume=.18*(window.S9ArcadeEvolution?.settings.volume??1);roar=new Audio('assets/audio/goal-boato.mp3');roar.volume=.45*(window.S9ArcadeEvolution?.settings.volume??1);music=new Audio('arcade/assets/cabinet-theme.wav');music.loop=true;music.volume=.12*(window.S9ArcadeEvolution?.settings.volume??1)}catch(e){}}
function startMusic(){try{music&&music.paused&&music.play().catch(()=>{})}catch(e){}}
function stopAudio(){for(const a of [crowd,roar,music])try{a?.pause()}catch(e){}}
// ------------------------------------------------------------------ flow
function show(next){state=next;start=performance.now();landed=new Set();cues=new Set();canvas.style.display='block';cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}
function boot(){show('boot')}
function play(){audio();window.S9SFX?.unlock?.();try{crowd.currentTime=0;crowd.play().catch(()=>{})}catch(e){}show('intro')}
function goTitle(skipTo=0){shake=0;show('title');if(skipTo){start-=skipTo*1000;for(const k of ['2000'])cues.add(k);startMusic()}}
function title(){audio();show('title');start-=1800;cues.add('2000');startMusic()}
// Attract loop: title → demo match (any key returns to the title) → intro.
function demo(){if(!window.S9ArcadeDemo||!window.launchArcadeMatch)return play();cancelAnimationFrame(raf);state='demo';stopAudio();canvas.style.display='none';const back=r=>{if(state!=='demo')return;canvas.style.display='block';if(r?.demo==='exit')title();else play()};S9ArcadeDemo.play().then(back,()=>back(null))}
function menu(){cancelAnimationFrame(raf);state='menu';stopAudio();canvas.style.display='none';window.S9ArcadeUI?.open()}
function onKey(e){if(state==='menu'||state==='idle'||state==='demo'||window.S9ArcadeMenuOpen||window.S9ArcadeActive)return;const k=(e.key||'').toLowerCase();if(k===(window.S9ArcadeBindings?.key('fullscreen')||'f')||(e.ctrlKey||e.metaKey||e.altKey)&&!['control','meta','alt'].includes(k))return;e.preventDefault();
 if(state==='boot')return play();if(state==='intro')return goTitle(1.8);if(state==='title'){if((performance.now()-start)/1000<1.5){start-=1800;cues.add('2000');startMusic();return}if(window.S9ArcadeBindings?['confirm','back'].includes(S9ArcadeBindings.keyboard('menu',k)):['z','enter',' ','x','c'].includes(k))return menu()}}
addEventListener('keydown',onKey);canvas.addEventListener('click',()=>onKey({key:window.S9ArcadeBindings?.key('confirm','menu')||'Enter',preventDefault(){}}));
// Single still frame of a scene at time t (used for screenshots / QA).
function preview(s,t){engine();state=s;start=performance.now()-t*1000;landed=new Set();cues=new Set(['2000','kick','flash']);if(s==='title')for(let i=0;i<20;i++)landed.add('x'+i);frame(performance.now());cancelAnimationFrame(raf);flash=0}
engine();
window.SA2000={boot,play,title,menu,preview,demo};
})();
