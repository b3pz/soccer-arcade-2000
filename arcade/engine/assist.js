/* Assisted controls for the human side: tackles, passes, receptions and shots. CPU logic unchanged. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}};
// Safety margin of a ground pass against one defender: lane distance minus how far he can run before the ball passes him.
const lane=(o,a,b,speed)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=clamp(((o.x-a.x)*dx+(o.y-a.y)*dy)/l,0,1);return Math.hypot(a.x+dx*t-o.x,a.y+dy*t-o.y)-1.8-t*Math.sqrt(l)/speed*11};
const foes=(m,team)=>m.players.filter(q=>q.team!==team&&!q.sentOff);
const human=(m,p)=>!!p&&p===m.selected&&m.isControlled(p);

// Ball just won by the human side cannot be stolen instantly; a running carrier shields from CPU tackles from behind.
M.shielded=function(tackler,owner){if(!this.teamHasHumans(owner.team)||this.teamHasHumans(tackler.team))return false;if((this.ball.grace||0)>0||owner.burst>0)return true;const n=unit(tackler.x-owner.x,tackler.y-owner.y);return Math.hypot(owner.vx,owner.vy)>4&&n.x*owner.face.x+n.y*owner.face.y<-.1};
const control=M.control;
M.control=function(p){const before=this.ball.owner?.team.id??this.ball.lastTeam;control.call(this,p);this.ball.assisted=false;this.ball.grace=this.teamHasHumans(p.team)&&!this.teamHasHumans(this.teams[1-p.team.id])&&before!==p.team.id?.7:0};

// Per human: the keeper never stays selected without the ball; the slide is aimed at the nearby carrier (or loose ball).
const update=M.update;
M.update=function(dt){this.ball.grace=Math.max(0,(this.ball.grace||0)-dt);return update.call(this,dt)};
const humanStep=M.humanStep;
M.humanStep=function(dt){const b=this.ball,i=this.input;
 if(this.selected?.role==='GK'&&b.owner!==this.selected){const taken=this.humans.filter(h=>h!==this.human).map(h=>h.selected),next=this.teams[this.human.team].players.filter(q=>!q.sentOff&&q.role!=='GK'&&!taken.includes(q)).sort((a,c)=>dist(a,b)-dist(c,b))[0];if(next)this.selected=next}
 const p=this.selected;if(p&&b.owner!==p&&!p.actionTime&&!p.recovery&&!p.stun&&['x','c','v'].some(k=>i.pressed.has(k))){const o=b.owner&&b.owner.team!==p.team?b.owner:null,t=o||(!b.owner?b:null);if(t&&dist(p,t)<7)p.face=unit(t.x+(t.vx||0)*.2-p.x,t.y+(t.vy||0)*.2-p.y)}
 return humanStep.call(this,dt)};

// Pass assist: arrows (or facing) pick the direction, then the freest teammate with a clear lane wins.
M.landing=function(p,q,aerial){if(aerial){const f=clamp(dist(p,q)/32,.65,1.65);return {x:clamp(q.x+q.vx*f*.35,2,98),y:clamp(q.y+q.vy*f*.35,2,60)}}const t=dist(p,q)/(36+(p.attributes?.passing??70)*.1);return {x:clamp(q.x+q.vx*t*.65,2,98),y:clamp(q.y+q.vy*t*.65,2,60)}};
const choose=M.chooseTarget;
M.chooseTarget=function(p,aerial=false){const r=this.restarts.data;if(!human(this,p)||r?.type==='KICKOFF'||r?.type==='CORNER')return choose.call(this,p,aerial);
 const axis=this.input.axis(),aim=axis.x||axis.y?axis:p.face,enemy=foes(this,p.team);let best=null,top=-Infinity;
 for(const q of p.team.players){if(q===p||q.sentOff||q.role==='GK')continue;const d=dist(p,q);if(d<4)continue;const n=unit(q.x-p.x,q.y-p.y),dot=n.x*aim.x+n.y*aim.y,land=this.landing(p,q,aerial),marked=Math.min(9,...enemy.map(o=>dist(o,land))),blocked=aerial?4:Math.min(4,...enemy.map(o=>lane(o,p,land,40+(p.attributes?.passing??70)*.1)));
  const score=(dot>.75?140:dot>.4?95:dot>0?35:0)+dot*30-(aerial?Math.abs(d-22)*.7+(d<12?60:0):d*.9)+marked*(aerial?6:3)+(blocked<0?blocked*25-40:blocked*8)+p.team.dir*(q.x-p.x)*.15;if(score>top){top=score;best=q}}
 return best||choose.call(this,p,aerial)};
const pass=M.pass;
M.pass=function(p,aerial=false){const assisted=human(this,p)&&!['KICKOFF','CORNER'].includes(this.restarts.data?.type);pass.call(this,p,aerial);const b=this.ball,q=b.passTarget;if(!assisted||!q||b.owner)return;b.assisted=true;b.assistedBy=this.human;
 if(!aerial){b.vx*=1.1;b.vy*=1.1;return}
 // Lob into space: higher arc, landing spot moves away from the closest marker and slightly forward.
 let land={...q.receiverIntent};const near=foes(this,p.team).reduce((a,o)=>!a||dist(o,land)<dist(a,land)?o:a,null);
 if(near&&dist(near,land)<6){const away=unit(land.x-near.x,land.y-near.y),push=(6-dist(near,land))*.55;land={x:clamp(land.x+away.x*push+p.team.dir*1.2,3,97),y:clamp(land.y+away.y*push,3,59)}}
 const f=clamp(dist(p,q)/32,.95,1.65),n=unit(land.x-p.x,land.y-p.y),range=Math.max(.5,Math.hypot(land.x-p.x,land.y-p.y)-1.2),speed=range*.12/(1-Math.exp(-.12*f));
 b.x=p.x+n.x*1.2;b.y=clamp(p.y+n.y*1.2,.2,61.8);b.vx=n.x*speed;b.vy=n.y*speed;b.vz=(12*f*f-2)/f;q.receiverIntent=land;p.face=n;p.visualKickFace={...n}};

// Reception assist: the intended receiver takes the ball unless an opponent is clearly first; a buffered Z finishes first time.
const receive=M.receive;
M.receive=function(){const b=this.ball,q=b.passTarget;if(b.owner||b.lock>0||!b.assisted||!q||q.sentOff||q.stun>0||q.recovery>0)return receive.call(this);
 const d=dist(q,b);if(d<2.6&&b.z<2.8){const rival=foes(this,q.team).some(o=>o.role!=='GK'&&!o.stun&&!o.recovery&&b.z<1.8&&dist(o,b)<d-1.2&&dist(o,b)<1.5+(o.attributes?.control??75)/150);
  if(!rival){const fh=b.assistedBy,finish=!!fh&&fh.team===q.team.id&&fh.input.shotBuffer>0;if(finish){fh.selected=q;if(b.z>.6){this.as(fh,()=>this.shoot(q,true));return}}this.control(q);if(finish)this.as(fh,()=>this.shoot(q));return}}
 return receive.call(this)};

// Shot assist: arrows choose high/low post; without arrows the far side from the keeper.
const shoot=M.shoot;
M.shoot=function(p,volley=false,power=null){const assisted=human(this,p)&&this.phase!=='PENALTIES',axis=this.input.axis();shoot.call(this,p,volley,power);const b=this.ball;if(!assisted||b.state!=='shot'||b.owner)return;
 const goalX=p.team.id?-3:103,keeper=this.teams[1-p.team.id].players.find(q=>q.role==='GK'&&!q.sentOff);let aim=axis.y?31+Math.sign(axis.y)*4.4:keeper?(keeper.y>=31?27.4:34.6):31;aim+=Math.sin(this.elapsed*5.3)*(volley?1.1:.45);
 const speed=Math.hypot(b.vx,b.vy),n=unit(goalX-p.x,aim-p.y);b.x=p.x+n.x*1.2;b.y=clamp(p.y+n.y*1.2,.2,61.8);b.vx=n.x*speed;b.vy=n.y*speed;p.face=n;p.visualKickFace={...n};if(this.lastShot)this.lastShot.aim=aim};
})();
