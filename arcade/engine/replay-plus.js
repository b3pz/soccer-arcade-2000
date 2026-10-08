/* Replays: three camera angles (TV, RAVVICINATA on the ball, CONTROCAMPO from the other side), cycled with the
   high-pass button during a replay; the pass button saves the goal. Saved goals (up to 8, in localStorage) are
   watched again from Centro Arcade -> GOL SALVATI. Presentation only. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,RP=E.ReplayManager.prototype,R=E.Renderer.prototype;
const KEY='sa2000:savedGoals',ANGLES=['TV','RAVVICINATA','CONTROCAMPO'],MAX=8;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return []}};
const store=list=>{try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,MAX)));return true}catch(e){return false}};
// Camera per angle, applied inside the replay frame only.
const draw=R.draw;
R.draw=function(m){const a=this.replayMode&&this.replayAngle;if(!a||a==='TV'||!this.camera)return draw.call(this,m);
 const cam=this.camera,saved={x:cam.x,y:cam.y,zoom:cam.zoom},mirror=m.mirror;
 if(a==='RAVVICINATA'){cam.x=m.ball.x;cam.y=m.ball.y;cam.zoom=Math.min(110,saved.zoom*1.9)}else{m.mirror=!mirror;cam.zoom=saved.zoom*.9}
 try{return draw.call(this,m)}finally{Object.assign(cam,saved);m.mirror=mirror}};
const start=RP.start;
RP.start=function(){const r=start.apply(this,arguments);this.angle=0;this.savedFlag=false;return r};
const rdraw=RP.draw;
RP.draw=function(m,renderer,dt){const a=window.S9ArcadeActive,inputs=a?.inputs||[];
 if(this.playback&&!this.fkFilm){if(inputs.some(i=>i.take?.('x'))){this.angle=((this.angle||0)+1)%ANGLES.length;this.index=0}
  if(inputs.some(i=>i.take?.('c'))&&!this.savedFlag){this.savedFlag=save(m,this.playback);m.say?.(this.savedFlag?'GOL SALVATO!':'MEMORIA PIENA',1.2)}}
 renderer.replayAngle=ANGLES[this.angle||0];let r;try{r=rdraw.call(this,m,renderer,dt)}finally{renderer.replayAngle=null}
 if(r&&this.playback&&!this.fkFilm){renderer.text('{p:x} CAMERA: '+ANGLES[this.angle||0]+'    '+(this.savedFlag?'✓ SALVATO':'{p:c} SALVA IL GOL'),640,690,17,'#ffe55b')}return r};
// Compact film: ball and every player's pose per recorded frame (30 fps), plus the identities needed to redraw it.
function save(m,frames){const last=m.scorers?.[m.scorers.length-1],team=m.teams[last?.team??0];
 const film={at:Date.now(),home:m.teams[0].source?.id,away:m.teams[1].source?.id,mirror:!!m.mirror,score:m.rules.score.slice(),scorer:last?.name||'',team:team?.name||'',minute:last?.minute??0,
  frames:frames.map(f=>({b:[f.ball.x,f.ball.y,f.ball.z,f.ball.state==='shot'?1:0],c:f.camera?[f.camera.x,f.camera.y,f.camera.zoom]:null,p:f.players.map(p=>[+p.x.toFixed(2),+p.y.toFixed(2),p.action||'idle',p.face?.x<0?-1:1,p.keeperState||0])}))};
 const list=load();list.unshift(film);return store(list)}
// ---------------------------------------------------------------- viewer (Centro Arcade -> GOL SALVATI)
function open(onClose){const list=load(),root=document.createElement('div');root.className='sa-options';root.style.cssText='position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center';
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.style.cssText='width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;image-rendering:pixelated';root.append(canvas);document.body.append(root);
 const r=new E.Renderer(canvas),c=r.ctx;let sel=0,play=null,alive=true,raf=0,angle=0;
 function build(film){const input=new E.InputManager({keys:null}),m=new E.Match(input),get=id=>window.S9ArcadeRoster?.get(id);const h=get(film.home),a=get(film.away);if(!h||!a)return null;ArcadeMatchBridge.setupTeam(m.teams[0],h,{cleanNames:true});ArcadeMatchBridge.setupTeam(m.teams[1],a,{cleanNames:true});m.setHumans([{team:0,input}]);m.humans=[];m.phase='PLAY';m.restarts.data=null;m.mirror=film.mirror;m.rules.score=film.score.slice();r.camera=new E.CameraController();return m}
 function frame(){if(!alive)return;raf=requestAnimationFrame(frame);c.fillStyle='#050a1c';c.fillRect(0,0,1280,720);
  if(play){const f=play.film.frames[Math.floor(play.i)];if(!f){play.i=0;return}const m=play.m;f.p.forEach((q,i)=>{const p=m.players[i];if(!p)return;p.x=q[0];p.y=q[1];p.action=q[2];p.face={x:q[3],y:0};p.keeperState=q[4]||p.keeperState});Object.assign(m.ball,{x:f.b[0],y:f.b[1],z:f.b[2],owner:null,state:f.b[3]?'shot':'loose'});if(f.c)Object.assign(r.camera,{x:f.c[0],y:f.c[1],zoom:f.c[2]});
   r.replayMode=true;r.replayAngle=ANGLES[angle];r.animationTime=play.i/30;try{r.draw(m)}finally{r.replayMode=false;r.replayAngle=null}play.i+=.5;
   r.panel(250,640,780,52,10);r.text((play.film.scorer||'GOL').toUpperCase()+' · '+play.film.team.toUpperCase()+'   {m:confirm} CAMERA: '+ANGLES[angle]+'   {m:back} ELENCO',640,672,16,'#ffe55b');return}
  r.arcadeBanner?r.arcadeBanner('GOL SALVATI','#ffe447',96,1):r.text('GOL SALVATI',640,90,48,'#ffe447');r.panel(190,160,900,440,18);
  if(!list.length)r.text('NESSUN GOL SALVATO · DURANTE UN REPLAY PREMI {p:c}',640,380,18,'#fff');
  list.forEach((g,i)=>{const y=210+i*48;if(i===sel){c.fillStyle='#ffe44726';c.fillRect(214,y-28,852,40);c.fillStyle='#ffe447';c.fillRect(214,y-28,6,40)}r.text((i+1)+'.  '+(g.scorer||'GOL').toUpperCase()+'  ·  '+g.team.toUpperCase()+'  ·  '+g.score.join('-')+'  ·  '+g.minute+'′',240,y,18,i===sel?'#fff':'#c9dbe6','left')});
  r.text('{arrows} SCEGLI    {m:confirm} GUARDA    {p:v} CANCELLA    {m:back} ESCI',640,660,17,'#ffe55b')}
 function key(e){if(!alive)return;e.preventDefault();e.stopImmediatePropagation();const B=window.S9ArcadeBindings,a=B?.keyboard('menu',e)||({escape:'back',enter:'confirm'})[e.key.toLowerCase()],k=e.key.toLowerCase();
  if(play){if(a==='back'){play=null;return}if(a==='confirm'){angle=(angle+1)%ANGLES.length;play.i=0}return}
  if(a==='back'){close();return}if(a==='arrowup')sel=Math.max(0,sel-1);if(a==='arrowdown')sel=Math.min(list.length-1,sel+1);
  if(a==='confirm'&&list[sel]){const m=build(list[sel]);if(m)play={film:list[sel],m,i:0}}
  if((k===(B?.map('p1').v||'v'))&&list[sel]){list.splice(sel,1);store(list);sel=Math.max(0,Math.min(sel,list.length-1))}}
 function close(){alive=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);root.remove();onClose?.()}
 addEventListener('keydown',key,true);frame();return root}
window.S9ArcadeGoals={open,load,ANGLES};
})();
