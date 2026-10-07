/* Pre-match ceremony: coin toss (1P calls heads or tails), the winner picks the end to attack, the other side kicks off.
   Choosing the end mirrors the picture and the controls only (the simulation keeps its own left-to-right frame). */
(function(){
'use strict';
const E=window.S9ArcadeEngine,R=E.Renderer.prototype,IM=E.InputManager.prototype;
const COIN='arcade/assets/coin.png?v=coin-1';R.bitmap?.(COIN);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------------------------------------------------------------- mirrored picture
// m.mirror: team 0 is shown attacking to the left. World x is flipped in the projection; facing and ball velocity are
// flipped only while drawing; the human's left/right are swapped while playing on the pitch.
const project=R.project;
R.project=function(x,y){if(!this.mirror)return project.call(this,x,y);const cam=this.camera,saved=cam?.x;if(cam)cam.x=100-saved;try{return project.call(this,100-x,y)}finally{if(cam)cam.x=saved}};
const draw=R.draw;
R.draw=function(m){this.mirror=!!m.mirror&&!['PENALTIES','FREEKICK'].includes(m.phase);if(!this.mirror)return draw.call(this,m);
 const flipped=[],flippedVx=[];for(const p of [...m.players,this.referee].filter(Boolean)){for(const key of ['face','visualKickFace'])if(p[key]&&typeof p[key].x==='number'){flipped.push([p[key],p[key].x]);p[key].x=-p[key].x}if(typeof p.vx==='number'){flippedVx.push([p,p.vx]);p.vx=-p.vx}}
 const b=m.ball,vx=b.vx;b.vx=-vx;try{return draw.call(this,m)}finally{for(const [o,x] of flipped)o.x=x;for(const [p,v] of flippedVx)p.vx=v;b.vx=vx;this.mirror=false}};
const radar=R.radar;R.radar=function(m){if(!this.mirror)return radar.call(this,m);const saved=m.players.map(p=>p.x),bx=m.ball.x;m.players.forEach(p=>p.x=100-p.x);m.ball.x=100-bx;try{return radar.call(this,m)}finally{m.players.forEach((p,i)=>p.x=saved[i]);m.ball.x=bx}};
// The stadium is symmetric: drawn unmirrored with the camera reflected (track, stands and boards keep their geometry).
const pitch=R.pitch;R.pitch=function(...args){if(!this.mirror||!this.camera)return pitch.apply(this,args);const cam=this.camera,x=cam.x;this.mirror=false;cam.x=100-x;try{return pitch.apply(this,args)}finally{cam.x=x;this.mirror=true}};
// Goals: drawn as the goal at the other end with the mirror off, so the net depth points away from the pitch.
const goal=R.goal;R.goal=function(x){if(!this.mirror)return goal.call(this,x);this.mirror=false;try{return goal.call(this,100-x)}finally{this.mirror=true}};
// Set-piece arrow: the aim is a world angle; on the mirrored picture it is drawn reflected.
const arrow=R.setPieceArrow;if(arrow)R.setPieceArrow=function(m){const a=m.restarts?.data?.aim;if(!this.mirror||!a)return arrow.call(this,m);const angle=a.angle;a.angle=Math.PI-angle;try{return arrow.call(this,m)}finally{a.angle=angle}};
const axis=IM.axis;IM.axis=function(){const a=axis.call(this),m=this.context;if(m?.mirror&&!['PENALTIES','FREEKICK'].includes(m.phase))return {x:-a.x,y:a.y};return a};

// ---------------------------------------------------------------- ceremony
function create(m,config={}){
 if(config.demo||config.training||config.onlineSession||config.challenge||config.specialFinal||config.skipToss)return null;
 const human=m.humans?.[0],hTeam=human?.team??0,cpuOnly=!human;let stage='call',age=0,call=0,result=null,winner=null,side=0,done=false,last=0;
 const rnd=()=>Math.random();
 function take(i,k){return i.take?.(k)}
 function update(dt,inputs){age+=dt;const i=human?.input||inputs[0],left=take(i,'arrowleft')||take(i,'arrowup'),right=take(i,'arrowright')||take(i,'arrowdown'),ok=take(i,'z')||take(i,'c')||take(i,'x');
  if(stage==='call'){if(cpuOnly||age>8)call=rnd()<.5?0:1;if(left)call=0;if(right)call=1;if(ok||cpuOnly||age>8){stage='flip';age=0;result=rnd()<.5?0:1;window.S9SFX?.kick?.()}return}
  if(stage==='flip'){if(age>2.1){stage='won';age=0;winner=result===call?hTeam:1-hTeam;side=rnd()<.5?0:1}return}
  if(stage==='won'){if(winner===hTeam&&!cpuOnly){if(left)side=0;if(right)side=1;if(ok&&age>.4){stage='go';age=0}}else if(age>1.8){stage='go';age=0}return}
  if(stage==='go'&&age>.9){done=true;
   // side 0 = the winner attacks to the left of the screen. Team 0 attacks right in the simulation.
   const winnerLeft=side===0;m.mirror=winner===0?winnerLeft:!winnerLeft;m.restarts.kickoff(1-winner)}}
 function drawCoin(r,x,y,size){const im=r.bitmap(COIN);if(!im?.complete||!im.naturalWidth)return;const c=r.ctx;let f;if(stage==='flip'){const spin=age*14;f=Math.floor(spin)%8;if(age>1.7)f=result===0?0:7}else if(stage==='call')f=call===0?0:7;else f=result===0?0:7;
  const lift=stage==='flip'?Math.sin(clamp(age/1.7,0,1)*Math.PI)*170:0,s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+size*.62,size*.45*(1-lift/400),size*.12,0,0,7);c.fill();c.drawImage(im,f*64,0,64,64,x-size/2,y-size/2-lift,size,size);c.imageSmoothingEnabled=s}
 function drawScene(r){const c=r.ctx;if(window.S9ArcadeArt?.ready(S9ArcadeArt.image('ceremonies.png')))S9ArcadeArt.frame(c,'ceremonies.png',0,2,2,0,0,1280,720);const team=t=>m.teams[t],code=t=>r.teamCode?.(team(t))||team(t).name;c.fillStyle='#020612a8';c.fillRect(0,0,1280,720);
  r.arcadeBanner?.(stage==='call'?'TESTA O CROCE?':stage==='flip'?'LANCIO DELLA MONETA':'SCELTA DEL CAMPO','#ffe447',120,1);
  // Captains either side of the referee, the coin in front.
  r.referee=r.referee||{role:'REF',action:'idle',team:{},face:{x:1,y:0},x:50,y:31};const ref={...r.referee,action:stage==='flip'&&age<.4?'whistle':'idle',face:{x:1,y:0}};
  const cap=t=>{const p=team(t).players.find(q=>q.role==='ST')||team(t).players[1];return {...p,action:stage==='won'&&winner===t?'celebrate':'idle',stun:0,burst:0,face:{x:t?-1:1,y:0}}};
  for(const [p,x,flip] of [[cap(0),430,false],[ref,640,false],[cap(1),850,true]]){c.save();c.translate(x,560);if(flip)c.scale(-1,1);r.sprite(p,{...m,elapsed:m.elapsed+age,goalCelebration:null,ball:{owner:null}},{scale:3});c.restore()}
  drawCoin(r,640,330,110);r.teamCrest(team(0),300,470,60,70);r.teamCrest(team(1),920,470,60,70);r.text(code(0),330,560,22,'#fff');r.text(code(1),950,560,22,'#fff');
  if(stage==='call'){for(const [i,label,x] of [[0,'TESTA',470],[1,'CROCE',810]]){r.panel(x-110,226,220,50,10);r.text(label,x,260,26,i===call?'#ffe447':'#9fc2d4');if(i===call){c.strokeStyle='#ffe447';c.lineWidth=3;c.strokeRect(x-110,226,220,50)}}
   if(!cpuOnly)r.text('{arrows} SCEGLI    {m:confirm} LANCIA',640,650,20,'#ffe55b')}
  if(stage==='won'||stage==='go'){const mine=winner===hTeam&&!cpuOnly;r.panel(290,190,700,90,14);r.text((result===0?'TESTA':'CROCE')+'! · VINCE '+team(winner).name.toUpperCase(),640,228,24,'#ffe447');
   r.text(mine?'SCEGLI DOVE ATTACCARE':(team(winner).name.toUpperCase()+' SCEGLIE IL CAMPO'),640,262,18,'#b3eaff');
   for(const [i,label,x] of [[0,'◀ ATTACCA A SINISTRA',430],[1,'ATTACCA A DESTRA ▶',850]]){const on=i===side;r.panel(x-170,600,340,52,10);r.text(label,x,634,20,on?'#ffe447':'#7f93a8');if(on){c.strokeStyle='#ffe447';c.lineWidth=3;c.strokeRect(x-170,600,340,52)}}
   if(mine&&stage==='won')r.text('{arrows} SCEGLI    {m:confirm} CONFERMA',640,690,18,'#ffe55b');else if(stage==='go')r.text('CALCIO D’INIZIO: '+team(1-winner).name.toUpperCase(),640,690,18,'#fff')}}
 return {update,draw:drawScene,get done(){return done}};
}
window.S9ArcadeCoinToss={create};
})();
