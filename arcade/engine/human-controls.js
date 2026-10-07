/* Human controls: sprint by tapping the special button (Track & Field style), dribble or hard tackle when an
   opponent is close; long ball charged by holding the high-pass button, distance set by how long it is held. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}};
const TAP=.3,DECAY=.7,BOOST=.38,LOB_FULL=.8;
// Opponent in front of p within r metres (in the direction p is moving/facing).
function inFront(m,p,r){const f=p.face||{x:p.team.dir,y:0};return m.players.some(o=>o.team!==p.team&&!o.sentOff&&o.role!=='GK'&&dist(o,p)<r&&((o.x-p.x)*f.x+(o.y-p.y)*f.y)>-.5)}
// Long ball: lands range metres ahead along the stick (or facing); the teammate nearest the landing spot runs onto it.
function lob(m,h,p,power){const b=m.ball,a=h.input.axis(),dir=unit(a.x||a.y?a.x:p.face?.x??p.team.dir,a.x||a.y?a.y:p.face?.y??0),range=12+power*38,
  land={x:clamp(p.x+dir.x*range,2,98),y:clamp(p.y+dir.y*range,2,60)},q=p.team.players.filter(o=>o!==p&&!o.sentOff&&o.role!=='GK').sort((x,y)=>dist(x,land)-dist(y,land))[0],
  f=clamp(range/30,.75,1.6),speed=Math.max(.5,range-1.2)*.12/(1-Math.exp(-.12*f));
 h.input.cancelShot();m.stats.teams[p.team.id].passes++;m.lastPasser=p;p.face=dir;p.visualKickFace={...dir};
 const target=q&&dist(q,land)<14?q:null;b.kick(p,dir.x*speed,dir.y*speed,(12*f*f-2)/f,'aerial',target);
 if(target){target.receiverIntent=land;target.receiveState='running'}b.assisted=true;b.assistedBy=h;p.action='pass';p.actionTime=.3;m.say(power>.75?'LANCIO LUNGO!':'LANCIO!',.45)}
const step=M.humanStep;
M.humanStep=function(dt){const h=this.human,p=this.selected,b=this.ball,input=this.input;
 if(!h||!p){return step.call(this,dt)}
 h.sprint=Math.max(0,(h.sprint||0)-DECAY*dt);
 // Special button: close to an opponent it is the move it always was (burst dribble with the ball, hard tackle without);
 // otherwise every tap feeds the sprint, which fades if you stop tapping.
 if(input.pressed.has('v')&&b.controlMode!=='HANDS'){const own=b.owner===p,close=own?inFront(this,p,3.4)&&!p.specialCooldown:!!b.owner&&b.owner.team!==p.team&&dist(b.owner,p)<2.6;
  if(!close){input.pressed.delete('v');h.sprint=Math.min(1,h.sprint+TAP)}}
 // High-pass button with the ball: hold to charge, release to play it. Without the ball it stays a slide tackle.
 if(b.owner===p&&b.controlMode!=='HANDS'&&input.pressed.has('x')){input.pressed.delete('x');h.lob={held:0}}
 if(h.lob){if(b.owner!==p){h.lob=null}else if(input.down.has('x')){h.lob.held+=dt}else{const power=clamp(h.lob.held/LOB_FULL,0,1);h.lob=null;lob(this,h,p,power)}}
 const t=p.team,pace=t.humanPace;t.humanPace=(pace||1)*(1+BOOST*h.sprint*(b.owner===p?.8:1));try{return step.call(this,dt)}finally{t.humanPace=pace}};
// Gauges above the controlled player: sprint (tap rate) and long-ball power while held.
const R=E.Renderer.prototype,draw=R.draw;
R.draw=function(m){draw.call(this,m);if(this.replayMode||m.phase!=='PLAY'||m.cardScene)return;const c=this.ctx;
 for(const h of m.humans||[]){const p=h.selected;if(!p)continue;const pr=this.project(p.x,p.y),x=pr.x-36,y=pr.y-92*pr.scale;
  if(h.lob){const q=clamp(h.lob.held/LOB_FULL,0,1);c.fillStyle='#071226d0';c.fillRect(x-3,y-3,78,14);for(let i=0;i<8;i++){c.fillStyle=i<Math.ceil(q*8)?(i>5?'#ff6436':i>2?'#ffe44a':'#79e752'):'#253c50';c.fillRect(x+i*9.5,y,8,8)}this.text('LANCIO',pr.x,y-6,12,'#ffe55b')}
  else if(h.sprint>.05){c.fillStyle='#071226b0';c.fillRect(x-3,y+1,78,8);c.fillStyle='#7fdcff';c.fillRect(x,y+3,72*h.sprint,4)}}};
})();
