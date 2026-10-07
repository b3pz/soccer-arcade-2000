/* Wing play: wide carriers run to the byline and cross, strikers attack the box, crosses are met with volleys. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,AI=E.TeamAI?.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const WIDE=['LM','RM','LB','RB'],RUNNERS=['ST','CM'];
// Pitch depth measured from the team's own goal (0..100) and distance from the centre line of the pitch.
const depth=(t,p)=>t.dir>0?p.x:100-p.x,wide=p=>Math.abs(p.y-31)>13;
const onWing=(t,p)=>wide(p)&&depth(t,p)>62;
const inBox=(t,p)=>depth(t,p)>74&&Math.abs(p.y-31)<15;
const goalLineX=t=>t.dir>0?100:0;
// Box runs while a teammate is on the wing: near post, far post, penalty spot.
function runSpots(t,carrier){const g=goalLineX(t),near=carrier.y<31?-1:1;return [{x:g-t.dir*7,y:31+near*4},{x:g-t.dir*8,y:31-near*5},{x:g-t.dir*13,y:31}]}
function boxRunners(m,t,carrier){return t.players.filter(p=>!p.sentOff&&p!==carrier&&RUNNERS.includes(p.role)&&!m.isControlled(p)).sort((a,b)=>depth(t,b)-depth(t,a)).slice(0,3)}
// A first-time strike is hard: CPU volleys are often skied or dragged wide (humans aim with the arrows).
function mistime(m,p){const b=m.ball,r=chance(m,p.number*5+1);if(b.state!=='shot')return;if(r<.35)b.vz+=3.5+r*6;else if(r<.65){const a=(r<.5?1:-1)*(.1+r*.12),c=Math.cos(a),s=Math.sin(a);[b.vx,b.vy]=[b.vx*c-b.vy*s,b.vx*s+b.vy*c]}}
// One roll per cross, taken the first time a CPU attacker can reach it.
function roll(m,b){if(b.volleyFor!==b.passTarget||b.flight<(b.volleyFlight??Infinity)){b.volleyFor=b.passTarget;b.volleyRoll=chance(m,(b.passTarget?.number||1)*3.1)}b.volleyFlight=b.flight;return b.volleyRoll}
function chance(m,salt){const v=Math.sin(m.elapsed*12.9898+salt*78.233)*43758.5453;return v-Math.floor(v)}

if(AI){const update=AI.update;
 AI.update=function(m,dt){const t=this.team,b=m.ball,carrier=b.owner?.team===t?b.owner:null;
  const cpuCarrier=carrier&&!m.isControlled(carrier)&&carrier.role!=='GK'&&b.controlMode!=='HANDS'&&onWing(t,carrier)?carrier:null;
  // Hold the generic decision for a wide CPU carrier: it is taken below (run on or cross).
  const wait=cpuCarrier?cpuCarrier.aiWait:0;if(cpuCarrier)cpuCarrier.aiWait=Math.max(wait,1);
  const attack=carrier&&onWing(t,carrier)&&m.phase==='PLAY',runners=attack?boxRunners(m,t,carrier):[],before=new Map([...runners,cpuCarrier].filter(Boolean).map(p=>[p,{x:p.x,y:p.y}]));
  update.call(this,m,dt);
  runners.forEach((p,i)=>{const from=before.get(p),spot=runSpots(t,carrier)[i];p.x=from.x;p.y=from.y;p.target=spot;if(dist(p,spot)>.6)p.move(spot.x-p.x,spot.y-p.y,dt,14*(t.cpu?.pace||1))});
  if(cpuCarrier&&b.owner===cpuCarrier){const from=before.get(cpuCarrier);cpuCarrier.aiWait=wait;cpuCarrier.x=from.x;cpuCarrier.y=from.y;
   if(cpuCarrier.cpuSettle>0){cpuCarrier.move(0,0,dt);return}
   const deep=depth(t,cpuCarrier)>84,blocked=m.players.some(o=>o.team!==t&&!o.sentOff&&o.role!=='GK'&&dist(o,cpuCarrier)<3.2&&(o.x-cpuCarrier.x)*t.dir>0);
   const target=t.players.some(q=>q!==cpuCarrier&&!q.sentOff&&q.role!=='GK'&&inBox(t,q)),byline=depth(t,cpuCarrier)>94;
   if(cpuCarrier.aiWait<=0&&(deep&&(target||byline)||blocked&&depth(t,cpuCarrier)>70)){m.pass(cpuCarrier,target||byline);cpuCarrier.aiWait=1.1+(t.cpu?.react||0);return}
   // Down the line, drifting a little towards the touchline.
   cpuCarrier.move(t.dir*16,clamp((cpuCarrier.y<31?6:56)-cpuCarrier.y,-3,3),dt,(m.teamHasHumans(t)?12:9)*(t.cpu?.pace||1))}
 }}

// Crosses from the wing go to the best-placed runner in the box.
const choose=M.chooseTarget;
M.chooseTarget=function(p,aerial=false){const t=p.team;const back=this.isControlled(p)&&this.as(this.humanOf(p),()=>this.input.axis().x*t.dir<-.3);if(aerial&&!this.restarts.data&&onWing(t,p)&&!back){const box=t.players.filter(q=>q!==p&&!q.sentOff&&q.role!=='GK'&&inBox(t,q));
  if(box.length){const foes=this.players.filter(o=>o.team!==t&&!o.sentOff);return box.sort((a,b)=>{const free=q=>Math.min(8,...foes.map(o=>dist(o,q)));return free(b)*2+depth(t,b)*.3-(free(a)*2+depth(t,a)*.3)})[0]}}
 // CPU build-up: from the middle, a free wide player ahead is a natural outlet.
 if(!aerial&&!this.restarts.data&&!this.isControlled(p)&&!wide(p)&&depth(t,p)>35&&depth(t,p)<70&&chance(this,p.number||1)<.4){const outlet=t.players.filter(q=>q!==p&&!q.sentOff&&WIDE.includes(q.role)&&wide(q)&&depth(t,q)>depth(t,p)+3&&dist(p,q)<30&&!this.players.some(o=>o.team!==t&&!o.sentOff&&dist(o,q)<4)).sort((a,b)=>depth(t,b)-depth(t,a))[0];if(outlet)return outlet}
 return choose.call(this,p,aerial)};

// Volleys: a cross dropping in the box is struck first time.
// CPU attackers volley most crosses; a human volleys by holding the shot button as the ball arrives (or releasing just before).
const receive=M.receive;
M.receive=function(){const b=this.ball;if(!b.owner&&b.lock<=0&&b.z>.6&&b.z<3.2&&(b.state==='aerial'||b.state==='rebound')){
  for(const p of [...this.players].sort((a,c)=>dist(a,b)-dist(c,b))){if(p.sentOff||p.role==='GK'||p.stun>0||p.recovery>0)continue;if(dist(p,b)>3.2)break;const t=p.team;if(!inBox(t,p)||t.id!==b.lastTeam)continue;
   const h=this.humanOf(p);
   if(h){if(h.input.shotCharging){h.input.shotPower=Math.min(1,Math.max(.55,h.input.shotHeld/.6));h.input.shotBuffer=.28;h.input.shotCharging=false;h.input.down.delete('z');this.as(h,()=>this.shoot(p,true));return}}
   // The keeper gets there first in his own six-yard area: no first-time strike, he claims it.
   else if(this.players.some(k=>k.role==='GK'&&k.team!==t&&!k.sentOff&&dist(k,b)<dist(p,b)+.6))break;
   else if(b.state==='aerial'&&roll(this,b)<(this.teamHasHumans(t)?.3:({facile:.45,normale:.6,difficile:.8}[this.difficulty]??.6))){this.shoot(p,true,.45+chance(this,7)*.4);mistime(this,p);return}
   break}}
 return receive.call(this)};
// A human cross hands control to the receiver as the ball drops in, so the human can meet it with a volley.
const update=M.update;
M.update=function(dt){const b=this.ball,q=b.passTarget;if(this.phase==='PLAY'&&!b.owner&&b.state==='aerial'&&q&&!q.sentOff&&!this.isControlled(q)&&dist(q,b)<8&&inBox(q.team,q)){const h=this.humansOf(q.team).find(x=>x===b.assistedBy)||this.humansOf(q.team)[0];if(h&&this.humans.every(o=>o===h||o.selected!==q)){h.selected=q;h.selectionTimer=.6;q.crossRun=true}}
 const result=update.call(this,dt);
 // Until the ball arrives the receiver keeps his run on his own, unless the human steers him.
 for(const h of this.humans){const p=h.selected;if(!p?.crossRun)continue;if(b.owner||b.state!=='aerial'||b.passTarget!==p){p.crossRun=false;continue}const a=h.input.axis(),spot=p.receiverIntent;if(!a.x&&!a.y&&spot&&dist(p,spot)>.5)p.move(spot.x-p.x,spot.y-p.y,dt,13)}
 return result};
// Keepers claim crosses dropping in the six-yard area, but stay on their line for crosses aimed at the penalty spot and beyond.
const keeper=E.Goalkeeper.prototype.update;
E.Goalkeeper.prototype.update=function(m,dt){const b=m.ball,line=this.team.id?100:0,land=b.passTarget?.receiverIntent,far=!b.owner&&b.state==='aerial'&&b.lastTeam!==this.team.id&&land&&Math.abs(land.x-line)>7.5,y0=this.y;
 keeper.call(this,m,dt);
 // Positioning across the goal: a fraction of the way towards the ball (towards where a cross will land), never out to a post,
 // so a ball played back to the middle does not find the goal empty. Shots on their way, dives and holding are untouched.
 const incoming=!b.owner&&b.state==='shot'&&b.vx*this.team.dir<0;
 if(!incoming&&(this.keeperState==='GK_POSITIONING'||far&&this.keeperState==='GK_RUSHING')&&b.owner!==this&&m.phase==='PLAY'){const ref=!b.owner&&b.state==='aerial'&&land?land.y:b.y,want=31+clamp((ref-31)*.35,-4,4),step=11*dt;this.y=y0+clamp(want-y0,-step,step)}if(far&&b.owner!==this){const limit=this.team.id?94.5:5.5;this.x=this.team.id?Math.max(this.x,limit):Math.min(this.x,limit)}};
window.S9ArcadeWingPlay={onWing,inBox,depth};
})();
