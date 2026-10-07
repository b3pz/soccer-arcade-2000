/* Human set pieces with a swinging arrow (press to stop it, hold for power) and more CPU fouls. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,RM=E.RestartManager.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:x/l,y:y/l}};
const AIMED=new Set(['FREE KICK','CORNER','THROW IN','GOAL KICK']);
// Base direction and swing for each restart, in world angles.
function baseAim(m,d){const t=m.teams[d.team],p=d.taker,goalX=t.dir>0?100:0;
 if(d.type==='FREE KICK')return {base:Math.atan2(31-p.y,goalX-p.x),range:1.05};
 if(d.type==='CORNER')return {base:Math.atan2(31-p.y,(t.dir>0?88:12)-p.x),range:.55};
 if(d.type==='THROW IN')return {base:Math.atan2(p.y<31?1:-1,t.dir*.45),range:.95};
 return {base:Math.atan2(0,t.dir),range:.7}}
// Restart shape: keepers hold their line, outfielders keep their formation shifted towards the ball (no single file),
// corners fill the box with attackers and markers, opponents stand 9 m from a free kick.
const CORNER_SLOTS=[[10,24],[12,30],[9,36],[14,27],[15,34],[7,31],[20,31],[22,22],[22,40]];
function shape(m,d,type,team,x,y){const atkDir=m.teams[team].dir;for(const p of m.players){if(p===d.taker||p.sentOff)continue;const own=p.team.id===team,dir=p.team.dir;
 if(p.role==='GK'){p.target={x:dir>0?3:97,y:31};continue}
 let tx,ty;if(type==='CORNER'){const mates=p.team.players.filter(q=>q!==d.taker&&!q.sentOff&&q.role!=='GK'),i=mates.indexOf(p),slot=CORNER_SLOTS[i%CORNER_SLOTS.length],gx=atkDir>0?100:0;if(i<(own?6:7)){tx=gx-atkDir*(slot[0]+(own?0:-1.2));ty=slot[1]+(own?0:.9)}else{tx=p.home.x+(own?atkDir*18:-dir*4);ty=p.home.y}}
 else{tx=p.home.x+(x-50)*.5+(own?dir*4:-dir*3);ty=p.home.y+(y-31)*.25}
 tx=clamp(tx,3,97);ty=clamp(ty,3,59);if(!own&&type==='FREE KICK'){const dd=Math.hypot(tx-x,ty-y);if(dd<9.3){const n=dd>.01?unit(tx-x,ty-y):{x:-atkDir,y:0};tx=x+n.x*9.3;ty=y+n.y*9.3}}
 p.target={x:clamp(tx,2,98),y:clamp(ty,2,60)}}}
// Fouls: whistle, a "FALLO!" beat with everybody frozen, then players walk into place and the taker walks to the ball.
const award=RM.award;
RM.award=function(type,team,x,y){const m=this.m,foul=m.phase==='PLAY'&&(type==='FREE KICK'||type==='PENALTY'),candidates=m.teams[team].players.filter(p=>!p.sentOff&&p.role!=='GK').map(p=>({p,x:p.x,y:p.y}));award.call(this,type,team,x,y);const d=this.data;if(!d)return;
 if(type!=='PENALTY')shape(m,d,type,team,x,y);if(type==='CORNER')d.delay=Math.max(d.delay,1.6);
 if(foul){d.foul=true;d.freeze=1;d.delay=Math.max(d.delay,2.4);try{window.whistle?.()}catch(e){}
  if(type==='FREE KICK'&&d.taker){const was=candidates.find(c=>c.p===d.taker);d.spot={x:m.ball.x,y:m.ball.y};if(was&&Math.hypot(was.x-d.taker.x,was.y-d.taker.y)>1.5){d.walk={x:d.taker.x,y:d.taker.y};const far=Math.hypot(was.x-d.walk.x,was.y-d.walk.y),k=Math.min(1,7/far);d.taker.x=d.walk.x+(was.x-d.walk.x)*k;d.taker.y=d.walk.y+(was.y-d.walk.y)*k;m.ball.owner=null;m.ball.x=d.spot.x;m.ball.y=d.spot.y}}}};
RM.aimFor=function(d){const m=this.m;if(!d.aim)d.aim={...baseAim(m,d),phase:0,angle:0,button:null,held:0,power:0};return d.aim};
const update=RM.update;
RM.update=function(dt){const m=this.m,d=this.data;
 if(d&&(d.age<(d.freeze||0)||d.walk)){d.age+=dt;d.delay=Math.max(0,d.delay-dt);if(d.age<d.freeze)return;for(const p of m.players)if(p!==d.taker&&p.target&&dist(p,p.target)>.8)p.move(p.target.x-p.x,p.target.y-p.y,dt,9);
  if(d.walk){const t=d.walk,dx=t.x-d.taker.x,dy=t.y-d.taker.y;if(Math.hypot(dx,dy)>.4)d.taker.move(dx,dy,dt,10);else{d.taker.x=t.x;d.taker.y=t.y;d.walk=null;m.control(d.taker);d.taker.face=unit(m.teams[d.team].dir,0)}}return}
 if(!d||!AIMED.has(d.type))return update.call(this,dt);const h=m.humanOf(d.taker);if(!h)return update.call(this,dt);
 d.age+=dt;d.delay=Math.max(0,d.delay-dt);for(const p of m.players)if(p!==d.taker&&dist(p,p.target)>.8)p.move(p.target.x-p.x,p.target.y-p.y,dt,9);
 const aim=this.aimFor(d),input=h.input;
 if(!aim.button){aim.phase+=dt;aim.angle=aim.base+Math.sin(aim.phase*2.3)*aim.range;d.taker.face={x:Math.cos(aim.angle),y:Math.sin(aim.angle)}}
 if(d.delay)return;
 if(!aim.button){const k=['z','c','x'].find(key=>input.down.has(key));if(k){aim.button=k;aim.held=0}return}
 if(input.down.has(aim.button)){aim.held+=dt;aim.power=Math.min(1,aim.held/1.1);input.shotHeld=0;return}
 this.launch(h,aim)};
// Release: Z = strike (free kick only), C = ground pass, X / corners / throw-ins = lofted ball.
RM.launch=function(h,aim){const m=this.m,d=this.data,p=d.taker,b=m.ball,dir={x:Math.cos(aim.angle),y:Math.sin(aim.angle)},pw=.2+.8*aim.power;p.face=dir;p.visualKickFace={...dir};
 const strike=aim.button==='z'&&d.type==='FREE KICK',ground=aim.button==='c'&&d.type!=='THROW IN'&&d.type!=='CORNER';
 if(d.type==='THROW IN')p.throwAt=m.elapsed;
 if(strike){m.as(h,()=>m.shoot(p));const speed=34+pw*40;b.vx=dir.x*speed;b.vy=dir.y*speed;b.vz=1.5+pw*5.5}
 else{const range=ground?8+pw*30:(d.type==='THROW IN'?6+pw*18:10+pw*34),land={x:clamp(p.x+dir.x*range,2,98),y:clamp(p.y+dir.y*range,2,60)},q=p.team.players.filter(o=>o!==p&&!o.sentOff&&o.role!=='GK').sort((a,c)=>dist(a,land)-dist(c,land))[0];
  m.stats.teams[p.team.id].passes++;m.lastPasser=p;
  if(ground){const speed=range*.6/(1-Math.exp(-.6*Math.max(.35,range/40)));b.kick(p,dir.x*speed,dir.y*speed,1.8,'pass',q)}
  else{const f=clamp(range/30,.75,1.6),speed=Math.max(.5,range-1.2)*.12/(1-Math.exp(-.12*f));b.kick(p,dir.x*speed,dir.y*speed,(12*f*f-2)/f,'aerial',q)}
  if(q){q.receiverIntent=land;q.receiveState='running';b.assisted=true;b.assistedBy=h}p.action='pass';p.actionTime=.3;m.say(d.type==='THROW IN'?'THROW!':ground?'PASS!':'CROSS!',.45)}
 h.input.cancelShot();h.input.pressed.clear();m.phase='PLAY';this.data=null};

// Fouls: CPU challenges from behind on a human carrier are whistled (penalty inside the box); CPU defenders near their
// own box go in hard, which can also cost cards. Human soft tackles stay legal.
M.shielded=function(tackler,owner){if(!this.teamHasHumans(owner.team)||this.teamHasHumans(tackler.team))return false;return (this.ball.grace||0)>0||owner.burst>0};
const tackles=M.tackles;
M.tackles=function(dt){const o=this.ball.owner;if(o&&this.ball.canBeStolen&&this.teamHasHumans(o.team))for(const p of this.players){if(p.team===o.team||p.action!=='tackle'||p.actionTime<=0||p.tackleHit||this.teamHasHumans(p.team)||p.hard)continue;
 if(dist(p,o)<2.6&&(o.x-p.x)*o.face.x+(o.y-p.y)*o.face.y>.6&&Math.hypot(o.vx,o.vy)>3){p.tackleHit=true;o.stun=.25;const box=(o.team.dir>0?o.x>84:o.x<16)&&Math.abs(o.y-31)<17;this.restarts.award(box?'PENALTY':'FREE KICK',o.team.id,o.x,o.y);this.stats.teams[p.team.id].fouls=(this.stats.teams[p.team.id].fouls||0)+1;this.say(box?'PENALTY!':'FOUL!',1.5);return}}
 return tackles.call(this,dt)};
// Shots can be blocked: a defender in the way deflects the ball sideways (often behind the line for a corner).
const updateMatch=M.update;
M.update=function(dt){const b=this.ball;if(this.phase==='PLAY'&&!b.owner&&b.state==='shot'&&!b.deflected&&b.flight>.06&&b.z<2.2){const shooterTeam=b.lastTeam;for(const p of this.players){if(p.sentOff||p.role==='GK'||p.team.id===shooterTeam||p.stun)continue;if(Math.hypot(p.x-b.x,p.y-b.y)<1.15){const side=(Math.floor(this.elapsed*10)%2?1:-1),speed=Math.hypot(b.vx,b.vy)*.55;b.vx=Math.sign(b.vx)*speed*.75;b.vy=side*speed*.65;b.vz=3+Math.abs(Math.sin(this.elapsed*7))*5;b.state='rebound';b.deflected=true;b.lastTeam=p.team.id;b.passTarget=null;this.say('DEVIATA!',.6);break}}}if(b.state!=='shot')b.deflected=false;return updateMatch.call(this,dt)};
const tackle=E.Player.prototype.tackle;
E.Player.prototype.tackle=function(hard){const m=this.team.match;if(!hard&&m&&this.team.cpu&&m.ball.owner&&m.teamHasHumans(m.ball.owner.team)){const o=m.ball.owner,own=this.team.dir>0?o.x<30:o.x>70;if(own&&this.number%3===1)hard=true}return tackle.call(this,hard)};
const setHumans=M.setHumans;M.setHumans=function(list){for(const t of this.teams)t.match=this;return setHumans.call(this,list)};
})();
