(function(){
const E=window.S9ArcadeEngine;
class CameraController {
 constructor(){this.x=50;this.y=31;this.zoom=36}
 // Smoothed follow (first frame snaps): the stadium no longer shakes with every touch of the ball.
 update(m,dt){const b=m.ball;this.target={x:b.x,y:b.y};if(!this.ready||dt>=.5){this.x=b.x;this.y=b.y;this.ready=true}else{const k=1-Math.exp(-dt*5.5);this.x+=(b.x-this.x)*k;this.y+=(b.y-this.y)*k}this.zoom=36;}

}
class ReplayManager {
 constructor(){this.frames=[];this.playback=null;this.time=0}
 record(m,dt,camera){this.time+=dt;if(this.time<1/30)return;this.time=0;this.frames.push({elapsed:m.elapsed,selected:(m.humans||[]).map(h=>h.selected),camera:camera?{x:camera.x,y:camera.y,zoom:camera.zoom}:null,ball:{x:m.ball.x,y:m.ball.y,z:m.ball.z,owner:m.ball.owner},players:m.players.map(p=>({player:p,role:p.role,x:p.x,y:p.y,action:p.action,visualKickFace:p.visualKickFace,actionTime:p.actionTime,keeperState:p.keeperState,stun:p.stun,burst:p.burst,face:{...p.face}}))});if(this.frames.length>90)this.frames.shift()}
 start(){this.playback=this.frames.slice();this.index=0}
 draw(m,renderer,dt=1/60){
  const f=this.playback?.[Math.floor(this.index)];if(!f){this.playback=null;return false}
  const players=m.players,selected=(m.humans||[]).map(h=>h.selected),ball={x:m.ball.x,y:m.ball.y,z:m.ball.z,owner:m.ball.owner},camera={...renderer.camera},animationTime=renderer.animationTime;
  const fields=['x','y','role','action','actionTime','keeperState','stun','burst','face','visualKickFace'];
  const saved=f.players.map((pose,i)=>{const p=pose.player||players[i];return {p,values:Object.fromEntries(fields.map(key=>[key,p[key]]))}});
  try{
   m.players=saved.map(item=>item.p);(m.humans||[]).forEach((h,i)=>h.selected=(Array.isArray(f.selected)?f.selected[i]:f.selected)||selected[i]);
   saved.forEach(({p},i)=>{for(const key of fields)if(key in f.players[i])p[key]=f.players[i][key]});Object.assign(m.ball,f.ball);
   if(f.camera)Object.assign(renderer.camera,f.camera);renderer.animationTime=f.elapsed;renderer.draw(m);renderer.text('REPLAY · Z SALTA',640,155,30,'#ffea52');this.index+=dt*30;return true;
  }finally{saved.forEach(({p,values})=>Object.assign(p,values));m.players=players;(m.humans||[]).forEach((h,i)=>h.selected=selected[i]);Object.assign(m.ball,ball);Object.assign(renderer.camera,camera);renderer.animationTime=animationTime}
 }

}
// Dedicated, deterministic foul classification; no random outcome.
class PenaltyManager { static decided(kicks,goals){const r=kicks.map(n=>Math.max(0,5-n));return kicks[0]<=5&&kicks[1]<=5&&(goals[0]>goals[1]+r[1]||goals[1]>goals[0]+r[0])||kicks[0]>=5&&kicks[0]===kicks[1]&&goals[0]!==goals[1]} }
Object.assign(E,{CameraController,ReplayManager,PenaltyManager});
const original=E.Match.prototype.tackles;
E.Match.prototype.tackles=function(dt){const keeper=this.ball.owner;if(keeper?.role==='GK'&&this.ball.controlMode==='HANDS'){for(const attacker of this.players){if(attacker.team===keeper.team||attacker.action!=='tackle'||attacker.tackleHit||attacker.actionTime<=0)continue;if(Math.hypot(attacker.x-keeper.x,attacker.y-keeper.y)<3.2){attacker.tackleHit=true;attacker.action='idle';attacker.actionTime=0;this.restarts.award('FREE KICK',keeper.team.id,keeper.x,keeper.y);if(attacker.hard)E.CardManager?.issue(this,attacker);this.say('FOUL!! · PORTIERE',1.5);return}}}for(const p of this.players){const o=this.ball.owner;if(p.hard&&p.action==='tackle'&&p.actionTime>0&&!p.tackleHit&&o&&o.team!==p.team&&this.ball.canBeStolen&&Math.hypot(p.x-o.x,p.y-o.y)<3.2){const behind=(o.x-p.x)*o.face.x+(o.y-p.y)*o.face.y>1.3;if(behind){p.tackleHit=true;const penalty=(o.team.id===0?o.x>84:o.x<16)&&Math.abs(o.y-31)<17;this.restarts.award(penalty?'PENALTY':'FREE KICK',o.team.id,o.x,o.y);E.CardManager?.issue(this,p,behind&&o.burst>0);this.say(penalty?'PENALTY!':'FOUL!!',1.5);return}}}original.call(this,dt)};
const award=E.RestartManager.prototype.award;
E.RestartManager.prototype.award=function(type,team,x,y){if(type==='PENALTY'){x=team?11:89;y=31}award.call(this,type,team,x,y);if(type==='PENALTY'){for(const p of this.m.players){if(p===this.data.taker)continue;if(p.role==='GK'&&p.team.id!==team){p.x=team?2:98;p.y=31}else{p.x=team?25:75;p.y=10+(p.number%9)*4}}}}
const restart=E.RestartManager.prototype.update;
E.RestartManager.prototype.update=function(dt){const d=this.data;if(d?.type==='PENALTY'){d.age+=dt;d.delay=Math.max(0,d.delay-dt);if(!d.delay&&(d.team===1&&d.age>1.5||d.team===0&&this.m.input.take('z'))){this.m.shoot(d.taker);this.m.phase='PLAY';this.data=null}return}restart.call(this,dt)};
})();
