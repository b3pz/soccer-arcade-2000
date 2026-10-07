/* CPU attacking play: carriers protect the ball, run past markers, release under pressure and shoot from the edge. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,AI=E.TeamAI.prototype,D=window.S9ArcadeDifficulty;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}};
// Per level: carrier speed, chance to burst past a marker, shooting distance, reach bonus of human tackles.
const STYLE={facile:{run:10,escape:.25,range:26,humanReach:.7,settle:.22},normale:{run:11.5,escape:.5,range:30,humanReach:.35,settle:.14},difficile:{run:12.5,escape:.75,range:33,humanReach:.1,settle:.08}};
const style=m=>STYLE[m.difficulty]||STYLE.normale;
if(D){Object.assign(D.LEVELS.normale,{tackleWait:1.05,reach:.1,aimError:1.2});D.LEVELS.normale.attr={...D.LEVELS.normale.attr,goalkeeping:8,defending:-4,tackleStrength:-4};D.LEVELS.difficile.attr={...D.LEVELS.difficile.attr,goalkeeping:16};Object.assign(D.LEVELS.difficile,{pace:1.06,tackleWait:.75,reach:-.15})}
const depth=(t,p)=>t.dir>0?p.x:100-p.x,foes=(m,t)=>m.players.filter(o=>o.team!==t&&!o.sentOff&&o.role!=='GK');
function chance(m,salt){const v=Math.sin(m.elapsed*91.17+salt*12.9898)*43758.5453;return v-Math.floor(v)}
// Long human shots get less precise on harder levels (the far-corner assist stays, the margin shrinks).
const shoot=M.shoot;
M.shoot=function(p,...args){const human=this.isControlled(p);shoot.call(this,p,...args);const b=this.ball;if(!human||b.state!=='shot'||b.owner||this.phase==='PENALTIES')return;const range=Math.hypot((p.team.dir>0?100:0)-p.x,31-p.y),k=({facile:0,normale:.012,difficile:.02}[this.difficulty]??.012)*Math.max(0,range-14),a=Math.sin(this.elapsed*7.77+p.number)*k,c=Math.cos(a),s=Math.sin(a);[b.vx,b.vy]=[b.vx*c-b.vy*s,b.vx*s+b.vy*c]};
// Human tackle reach depends on the level instead of a fixed bonus.
M.humanReach=function(){return style(this).humanReach};
// A CPU carrier on the move cannot be tackled from behind, and is safe during a burst: same rule humans enjoy.
const shielded=M.shielded;
M.shielded=function(tackler,owner){if(!this.teamHasHumans(owner.team)&&this.teamHasHumans(tackler.team)){if(owner.burst>0)return true;const n=unit(tackler.x-owner.x,tackler.y-owner.y),v=Math.hypot(owner.vx,owner.vy);if(v>5&&(n.x*owner.vx+n.y*owner.vy)/v<-.35)return true}return shielded?shielded.call(this,tackler,owner):false};
// A fresh CPU receiver is ready sooner.
const control=M.control;
M.control=function(p){control.call(this,p);if(p&&!this.teamHasHumans(p.team)&&p.role!=='GK'){p.cpuSettle=Math.min(p.cpuSettle||0,style(this).settle);p.aiWait=Math.min(p.aiWait||0,.55+(p.team.cpu?.react||0)*.5)}};
// Defending: the first chaser gets goal-side of a human carrier and meets him face on, instead of trailing behind.
function goalSide(m,t,dt){const o=m.ball.owner;if(!o||o.team===t||!m.isControlled(o)||m.ball.controlMode==='HANDS')return;const own=t.dir>0?0:100,ahead=unit(own-o.x,31-o.y),spot={x:o.x+o.vx*.3+ahead.x*1.6,y:o.y+o.vy*.3+ahead.y*1.6};
 const chaser=t.players.filter(p=>!p.sentOff&&p.role!=='GK'&&!m.isControlled(p)).sort((a,c)=>dist(a,o)-dist(c,o))[0];if(!chaser||chaser.stun||chaser.recovery||chaser.actionTime>0)return;
 const behind=(chaser.x-o.x)*(own-o.x)<0;if(behind||dist(chaser,spot)>1.2)chaser.move(spot.x-chaser.x,spot.y-chaser.y,dt,(behind?13.5:12)*(t.cpu?.pace||1)*.35)}
// CPU passing: forward to the freest teammate with an open lane; short and safe when nothing is on.
function blocked(m,t,a,b){return foes(m,t).some(o=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,k=clamp(((o.x-a.x)*dx+(o.y-a.y)*dy)/l,0,1);return Math.hypot(a.x+dx*k-o.x,a.y+dy*k-o.y)<1.7})}
const choose=M.chooseTarget;
M.chooseTarget=function(p,aerial=false){const t=p.team;if(aerial||this.restarts.data||this.teamHasHumans(t)||p.role==='GK')return choose.call(this,p,aerial);
 const list=t.players.filter(q=>q!==p&&!q.sentOff&&q.role!=='GK');let best=null,top=-1e9;
 for(const q of list){const d=dist(p,q);if(d<5||d>34)continue;const free=Math.min(9,...foes(this,t).map(o=>dist(o,q))),gain=(q.x-p.x)*t.dir,score=gain*1.1+free*2.2-Math.abs(d-16)*.25-(blocked(this,t,p,q)?14:0)+(depth(t,q)>70?6:0);if(score>top){top=score;best=q}}
 return best||choose.call(this,p,aerial)};
const update=AI.update;
AI.update=function(m,dt){const t=this.team,b=m.ball,p=b.owner?.team===t&&!m.isControlled(b.owner)&&b.owner.role!=='GK'&&b.controlMode!=='HANDS'&&m.phase==='PLAY'?b.owner:null;
 const wing=p&&window.S9ArcadeWingPlay?.onWing(t,p),mine=p&&!wing&&!m.teamHasHumans(t)?p:null,from=mine?{x:mine.x,y:mine.y}:null,wait=mine?mine.aiWait:0;
 if(mine)mine.aiWait=Math.max(wait,1);update.call(this,m,dt);if(!m.teamHasHumans(t))goalSide(m,t,dt);if(!mine||b.owner!==mine)return;mine.aiWait=wait;mine.x=from.x;mine.y=from.y;if(mine.cpuSettle>0){mine.move(0,0,dt);return}
 const s=style(m),near=foes(m,t).map(o=>({o,d:dist(o,mine)})).sort((a,c)=>a.d-c.d),closest=near[0],goal={x:t.dir>0?100:0,y:31},range=Math.hypot(goal.x-mine.x,goal.y-mine.y);
 const ahead=near.filter(({o})=>(o.x-mine.x)*t.dir>0),lane=ahead.some(({o,d})=>d<5&&Math.abs((o.y-mine.y)-(goal.y-mine.y)*((o.x-mine.x)/(goal.x-mine.x||1)))<1.6);
 // Shot: inside the level's range with a lane, or anywhere near the box when pressed.
 if(mine.aiWait<=0&&(range<s.range&&!lane&&Math.abs(mine.y-31)<18||range<20)){m.shoot(mine);mine.aiWait=1.4;return}
 // Pressed: burst past the marker or release the ball quickly.
 if(closest&&closest.d<3.2){if(!mine.burst&&!mine.specialCooldown&&chance(m,mine.number)<s.escape*dt*8){mine.burst=.38;mine.specialCooldown=2.6;m.say('BURST!',.4)}else if(mine.aiWait>.3&&!mine.burst)mine.aiWait=.18+(t.cpu?.react||0)*.3}
 if(mine.aiWait<=0){m.pass(mine);mine.aiWait=(t.style==='possession'?.7:1)+(t.cpu?.react||0);return}
 // Run at goal, bending away from the nearest marker in front.
 let dir={x:t.dir,y:clamp((31-mine.y)/14,-.5,.5)};const block=ahead[0];if(block&&block.d<7){const side=Math.sign(mine.y-block.o.y)||(mine.y<31?1:-1);dir.y+=side*(1.2-block.d/7)}
 mine.move(dir.x,dir.y,dt,s.run*(t.cpu?.pace||1)*(mine.burst>0?1.25:1))};
})();
