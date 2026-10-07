/* Human controls: sprint by tapping the special button (Track & Field style); burst dribble / slide tackle when an
   opponent is close; long ball charged by holding high pass; in defence the pass button pokes (tap) or shadows (hold). */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}};
const TAP=.35,DECAY=.6,BOOST=.75,LOB_FULL=.8,HOLD=.18;
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
 const rival=b.owner&&b.owner.team!==p.team&&b.controlMode!=='HANDS'?b.owner:null;
 // Special button: with the ball and an opponent in front it is the burst dribble; without the ball and an opponent
 // carrier within reach it is the slide tackle (a foul if it comes from behind); otherwise every tap feeds the sprint.
 if(input.pressed.has('v')&&b.controlMode!=='HANDS'){const own=b.owner===p,close=own?inFront(this,p,3.4)&&!p.specialCooldown:!!rival&&dist(rival,p)<3.2;
  if(!close){input.pressed.delete('v');h.sprint=Math.min(1,h.sprint+TAP)}}
 // Defending: the high-pass button slides as well; the pass button is a standing poke when tapped and, held, shadows
 // the carrier goal-side (pressing) without diving in.
 if(b.owner!==p){if(input.pressed.has('x')){input.pressed.delete('x');if(rival&&dist(rival,p)<3.2)p.tackle(true)}
  if(input.pressed.has('c')){input.pressed.delete('c');h.press={held:0}}
  if(h.press){if(input.down.has('c')){h.press.held+=dt}else{if(h.press.held<HOLD&&!p.actionTime)p.tackle(false);h.press=null}}}else h.press=null
 // High-pass button with the ball: hold to charge, release to play it. Without the ball it stays a slide tackle.
 if(b.owner===p&&b.controlMode!=='HANDS'&&input.pressed.has('x')){input.pressed.delete('x');h.lob={held:0}}
 if(h.lob){if(b.owner!==p){h.lob=null}else if(input.down.has('x')){h.lob.held+=dt}else{const power=clamp(h.lob.held/LOB_FULL,0,1);h.lob=null;lob(this,h,p,power)}}
 // While pressing, keep the same man: no automatic switch to the teammate nearest the ball.
 if(h.press)h.selectionTimer=Math.max(h.selectionTimer||0,.25);
 const t=p.team,pace=t.humanPace,x0=p.x,y0=p.y;t.humanPace=(pace||1)*(1+BOOST*h.sprint*(b.owner===p?.8:1));try{step.call(this,dt)}finally{t.humanPace=pace}
 // Shadowing: stay 1.5 m goal-side of the carrier, facing him; the stick is ignored while the button is held.
 if(h.press&&h.press.held>=HOLD&&rival&&!p.actionTime&&!p.stun){const own=t.dir>0?0:100,g=unit(own-rival.x,31-rival.y),spot={x:rival.x+rival.vx*.15+g.x*1.5,y:rival.y+rival.vy*.15+g.y*1.5};p.x=x0;p.y=y0;
  if(dist(p,spot)>.25)p.move(spot.x-p.x,spot.y-p.y,dt,15*(t.humanPace||1)*(1+BOOST*h.sprint));p.face=unit(rival.x-p.x,rival.y-p.y)}};
// Gauges above the controlled player: sprint (tap rate) and long-ball power while held.
const R=E.Renderer.prototype,draw=R.draw;
R.draw=function(m){draw.call(this,m);if(this.replayMode||m.phase!=='PLAY'||m.cardScene)return;const c=this.ctx;
 for(const h of m.humans||[]){const p=h.selected;if(!p)continue;const pr=this.project(p.x,p.y),x=pr.x-36,y=pr.y-92*pr.scale;
  if(h.lob){const q=clamp(h.lob.held/LOB_FULL,0,1);c.fillStyle='#071226d0';c.fillRect(x-3,y-3,78,14);for(let i=0;i<8;i++){c.fillStyle=i<Math.ceil(q*8)?(i>5?'#ff6436':i>2?'#ffe44a':'#79e752'):'#253c50';c.fillRect(x+i*9.5,y,8,8)}this.text('LANCIO',pr.x,y-6,12,'#ffe55b')}
  else if(h.sprint>.05){c.fillStyle='#071226b0';c.fillRect(x-3,y+1,78,8);c.fillStyle='#7fdcff';c.fillRect(x,y+3,72*h.sprint,4);
   // Speed lines behind the runner while the sprint is up.
   if(h.sprint>.25){const f=p.face||{x:1,y:0},n=Math.hypot(p.vx,p.vy);if(n>1){const dx=-p.vx/n,dy=-p.vy/n*.65,t=(this.animationTime??m.elapsed)*20;c.save();c.globalAlpha=Math.min(.8,h.sprint);c.strokeStyle='#e6f6ff';c.lineWidth=2;for(let i=0;i<5;i++){const o=(i-2)*7*pr.scale,len=(18+((t+i*13)%14))*pr.scale*h.sprint,sx=pr.x+dx*14*pr.scale-dy*o,sy=pr.y-34*pr.scale+dy*14*pr.scale+dx*o;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+dx*len,sy+dy*len);c.stroke()}c.restore()}}}
  if(h.press&&h.press.held>=HOLD){this.text('PRESSING',pr.x,y+2,12,'#ff9fb0')}}};
})();
