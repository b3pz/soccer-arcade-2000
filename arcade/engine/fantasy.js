/* Canvas arcade spectacle. Effect state is separate from ball physics and replayable. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,R=E.Renderer.prototype;
const preferences=()=>window.S9ArcadeEvolution?.settings;
if(preferences()&&preferences().fantasy===undefined)preferences().fantasy=true;
const intensity=()=>preferences()?.fantasy===false?0:Math.max(0,Math.min(1,preferences()?.effects??.5));
const clock=(r,m)=>r.animationTime??m.elapsed??r.sceneTime??0;
function ignite(m,p,volley){
 const b=m.ball;
 b.arcadeShot={kind:volley?'meteor':'fire',started:m.elapsed,team:p.team.id,origin:{x:p.x,y:p.y},dx:b.vx,dy:b.vy};
 m.arcadeImpact={kind:'launch',started:m.elapsed,x:p.x,y:p.y,team:p.team.id};
 m.say(volley?'METEOR VOLLEY!':'FIRE SHOT!',.75);
 if(intensity()>0)window.S9SFX?.powerShot?.();
}
const reset=E.Ball.prototype.reset;
E.Ball.prototype.reset=function(){reset.call(this);this.arcadeShot=null};
const kick=E.Ball.prototype.kick;
E.Ball.prototype.kick=function(...args){this.arcadeShot=null;return kick.apply(this,args)};
const control=M.control;
M.control=function(...args){this.ball.arcadeShot=null;return control.apply(this,args)};
const resetMatch=M.reset;M.reset=function(...args){const result=resetMatch.apply(this,args);this.arcadeImpact=null;return result};
const shoot=M.shoot;
M.shoot=function(p,volley=false,power=null){
 if(!p||p.sentOff)return;
 const count=this.stats.teams[p.team.id].shots;
 const result=shoot.call(this,p,volley,power);
 if(p&&this.stats.teams[p.team.id].shots>count&&this.lastShot?.player===p&&this.lastShot.charge>=.999&&this.ball.state==='shot')ignite(this,p,volley);
 return result;
};
const update=M.update;
M.update=function(dt){const result=update.call(this,dt);if(this.ball.owner||this.ball.state!=='shot'||this.pen?.stage==='result')this.ball.arcadeShot=null;return result};
const restart=E.RestartManager.prototype.award;
E.RestartManager.prototype.award=function(...args){const result=restart.apply(this,args);if(this.phase==='RESTART')this.ball.arcadeShot=null;return result};
const goal=E.MatchRules.prototype.goal;
E.MatchRules.prototype.goal=function(team){
 const m=this.m,shot=m.ball.arcadeShot;
 const impact=shot&&shot.team===team?{kind:'goal',started:m.elapsed,x:team?0:100,y:m.ball.y,team}:null;
 const result=goal.call(this,team);
 m.ball.arcadeShot=null;
 if(impact){m.arcadeImpact=impact;m.say('SUPER GOAL!',2)}
 return result;
};
if(M.fkStrike){const strike=M.fkStrike;M.fkStrike=function(){const result=strike.call(this);if(this.fk.power>=.999){this.fk.arcadeShot={kind:'fire',started:this.elapsed,team:this.fk.team};if(intensity()>0)window.S9SFX?.powerShot?.();this.say('FIRE SHOT!',.75)}return result}}

// Tongues of flame and embers trail behind the ball. Motion is deterministic.
R.fantasyFlame=function(x,y,r,dx,dy,time,kind){
 const strength=intensity();if(!strength)return;if(window.S9ArcadeArt?.effectTrail(this.ctx,kind,x,y,r,dx,dy,time,strength))return;
 const c=this.ctx,angle=Math.atan2(dy,dx),length=r*(5.5+strength*2),purple=kind==='meteor';
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=.55+strength*.4;
 const layers=purple?['#733bff','#e559ff','#ffe9ff']:['#ff4823','#ff9a24','#fff39a'];
 for(let layer=0;layer<3;layer++){
  const width=r*(1.3-layer*.3),tail=length*(1-layer*.25);
  c.fillStyle=layers[layer];c.beginPath();c.moveTo(r*.7,-width*.55);
  for(let i=0;i<7;i++){const u=i/6,wave=Math.sin(time*29+i*2.4+layer)*r*.22;c.lineTo(-tail*u,-width*(1-u)+wave);c.lineTo(-tail*(u+.055),-width*(1-u)*.35)}
  c.lineTo(-tail*1.08,0);
  for(let i=6;i>=0;i--){const u=i/6,wave=Math.sin(time*25+i*2.1+layer)*r*.2;c.lineTo(-tail*u,width*(1-u)+wave)}
  c.lineTo(r*.7,width*.55);c.closePath();c.fill();
 }
 for(let i=0;i<10;i++){const u=((time*1.5+i*.137)%1+1)%1;c.globalAlpha=(1-u)*(.45+strength*.4);c.fillStyle=i%2?'#ffe788':purple?'#d97fff':'#ff6835';const size=r*(.11+(1-u)*.12);c.fillRect(-length*(.3+u),Math.sin(i*4.7+time*13)*r*(.5+u),size,size)}
 c.restore();
};
const drawBall=R.drawBall;
R.drawBall=function(x,y,r,m){
 const b=m?.ball,shot=b?.arcadeShot;
 if(shot&&!b.owner&&b.state==='shot'&&!(m.pen?.stage==='result')){
  let dx=b.vx??shot.dx??1,dy=(b.vy??shot.dy??0)*.65-(b.vz||0)*.4;
  if(b.fantasyScreenDirection){dx=b.fantasyScreenDirection.x;dy=b.fantasyScreenDirection.y}
  else if(m.phase==='PENALTIES'){dx=(b.y-31)*48+ b.vy*12;dy=-Math.abs(b.vx)*9.4-b.vz*53}
  this.fantasyFlame(x,y,r,dx,dy,clock(this,m),shot.kind);
 }
 return drawBall.call(this,x,y,r,m);
};
function ring(c,x,y,r,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,r,r*.45,0,0,Math.PI*2);c.stroke()}
const draw=R.draw;
R.draw=function(m){
 draw.call(this,m);
 const strength=intensity();if(!strength||m.cardScene||m.phase==='FREEKICK'||m.phase==='PENALTIES')return;
 const c=this.ctx,time=clock(this,m);
 c.save();
 if(m.phase!=='FINISHED')for(const h of m.humans||[]){
  const p=h.selected;if(!p||p.sentOff)continue;const pr=this.project(p.x,p.y);
  // Full charge gets a pulsing aura, ready to become a fire shot on release.
  if(!this.replayMode&&h.input.shotCharging&&h.input.shotCharge>=.999){
   c.globalAlpha=.55+strength*.35;if(window.S9ArcadeArt?.effect(c,'charge',Math.floor(time*10)%4,pr.x-42*pr.scale,pr.y-57*pr.scale,84*pr.scale,68*pr.scale))continue;ring(c,pr.x,pr.y+6,pr.scale*(21+Math.sin(time*16)*2),'#ffe65e',3);
   for(let i=0;i<7;i++){const a=time*3+i*Math.PI*2/7,x=pr.x+Math.cos(a)*22*pr.scale,y=pr.y+Math.sin(a)*7*pr.scale-((time*30+i*11)%32);c.fillStyle=i%2?'#ff8833':'#fff59a';c.fillRect(x,y,3*pr.scale,5*pr.scale)}
  }
 }
 // Cyan speed slashes behind a special dribble, including recorded replays.
 for(const p of m.players||[]){if(!p.burst||p.sentOff)continue;const pr=this.project(p.x,p.y),fx=p.face?.x||p.team.dir,fy=(p.face?.y||0)*.65;
  c.globalAlpha=.3+strength*.4;if(window.S9ArcadeArt?.motion(c,pr.x,pr.y,fx,fy,pr.scale,time,strength))continue;c.strokeStyle='#8cfff0';c.lineWidth=3;
  for(let i=0;i<3;i++){const distance=(22+i*15)*pr.scale;c.beginPath();c.moveTo(pr.x-fx*distance,pr.y+3-fy*distance+i*5);c.lineTo(pr.x-fx*(distance+18*pr.scale),pr.y+3-fy*(distance+18*pr.scale)+i*5);c.stroke()}
 }
 const event=m.arcadeImpact,age=event?time-event.started:99;
 if(event&&age>=0&&age<(event.kind==='goal'?.75:.32)){
  const pr=this.project(event.x,event.y),duration=event.kind==='goal'?.75:.32,u=age/duration;
  c.globalAlpha=(1-u)*(.35+strength*.6);
  const radius=pr.scale*(12+u*(event.kind==='goal'?85:40));if(!window.S9ArcadeArt?.effect(c,'impact',u*4,pr.x-radius,pr.y-radius*.65,radius*2,radius*1.3)){ring(c,pr.x,pr.y,radius,'#ffda63',4*(1-u)+1);
  for(let i=0;i<12;i++){const a=i*Math.PI/6+(event.kind==='goal'?u*.4:0);c.strokeStyle=i%2?'#fff5b0':'#ff7641';c.lineWidth=2;c.beginPath();c.moveTo(pr.x+Math.cos(a)*radius,pr.y+Math.sin(a)*radius*.65);c.lineTo(pr.x+Math.cos(a)*radius*(1.2+u*.3),pr.y+Math.sin(a)*radius*.65*(1.2+u*.3));c.stroke()}}
 }
 // Dust sprites follow actual sliding actions; they never change tackling or ball physics.
 for(const p of m.players||[]){if(p.sentOff||!['tackle','hard_tackle'].includes(p.action))continue;const pr=this.project(p.x,p.y);c.globalAlpha=.3+strength*.25;window.S9ArcadeArt?.effect(c,'dust',Math.floor(time*12+p.number)%4,pr.x-40*pr.scale,pr.y-18*pr.scale,80*pr.scale,30*pr.scale)}
 c.restore();
};
window.S9ArcadeFantasy={intensity,ignite};
})();
