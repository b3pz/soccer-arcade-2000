/* Nine target cells, keeper waits on the line, readable result before the next kick. */
(function(){
 const E=S9ArcadeEngine,M=E.Match.prototype;
 const heights=[4.2,2.5,.8],lanes=[26,31,36];
 const cell=c=>({row:Math.floor(c/3),col:c%3,y:lanes[c%3],z:heights[Math.floor(c/3)]});
 const setup=M.setupPenalty;
 // Shooter and keeper may each be a human (any slot) or the CPU; takers rotate among a team's humans.
 M.penaltyHumans=function(){const team=this.pen.turn%2,sh=this.humansOf(team),kh=this.humansOf(1-team),n=Math.floor(this.pen.turn/2);return {shooter:sh.length?sh[n%sh.length]:null,keeper:kh.length?kh[n%kh.length]:null}};
 M.setupPenalty=function(){setup.call(this);const p=this.pen,team=p.turn%2;Object.assign(p,{stage:'ready',aim:4,saveCell:4,aimExplicit:false,outcome:null,age:0,flight:false});const {shooter,keeper}=this.penaltyHumans();
  for(const h of this.humans){h.input.cancelShot();h.selected=null}if(shooter)shooter.selected=this.ball.owner;if(keeper)keeper.selected=this.teams[1-team].players.find(q=>!q.sentOff&&q.role==='GK');for(const h of this.humans)if(!h.selected)h.selected=this.teams[h.team].players.find(q=>!q.sentOff&&q.role!=='GK'&&!this.isControlled(q));
  this.say(shooter?shooter.label+' · SCEGLI 1 DI 9 · CARICA Z':keeper?keeper.label+' · SCEGLI 1 DI 9 · TUFFO':'RIGORE',1.8)};
 M.beginSpotKick=function(team){const period=this.rules.period;this.phase='PENALTIES';this.pen={single:true,period,turn:team,history:[[],[]],kicks:[0,0],goals:[0,0],age:0,flight:false};this.setupPenalty()};
 const restart=E.RestartManager.prototype.update;
 E.RestartManager.prototype.update=function(dt){const d=this.data;if(d?.type!=='PENALTY'){restart.call(this,dt);return}d.delay=Math.max(0,d.delay-dt);if(!d.delay){this.data=null;this.m.beginSpotKick(d.team)}};
 function moveCell(m,key,input){let row=Math.floor(m.pen[key]/3),col=m.pen[key]%3;for(const [k,dx,dy] of [['arrowleft',-1,0],['arrowright',1,0],['arrowup',0,-1],['arrowdown',0,1]])if(input.take(k)){col=Math.max(0,Math.min(2,col+dx));row=Math.max(0,Math.min(2,row+dy));m.pen.aimExplicit=true}m.pen[key]=row*3+col}
 function conclude(m,goal,label){const p=m.pen,team=p.turn%2;p.outcome={goal,label,team};p.history[team].push(goal);p.kicks[team]++;if(goal)p.goals[team]++;p.stage='result';p.age=0;for(const h of m.humans)h.input.cancelShot();m.say(label,10)}
 M.penalties=function(dt){
  const p=this.pen,team=p.turn%2,g=this.teams[1-team].players.find(q=>!q.sentOff&&q.role==='GK'),{shooter,keeper}=this.penaltyHumans(),anyZ=()=>this.humans.map(h=>h.input.take('z')).some(Boolean);p.age+=dt;
  if(p.stage==='result'){
   for(const h of this.humans)h.input.cancelShot(false);if(p.age<.7){anyZ();return}if(!anyZ())return;
   if(p.single){const outcome=p.outcome;this.pen=null;this.rules.period=p.period;this.players.forEach(q=>q.reset());if(outcome.goal)this.rules.goal(team);else this.restarts.award('GOAL KICK',1-team,team?6:94,31);return}
   if(E.PenaltyManager.decided(p.kicks,p.goals)){this.phase='FINISHED';this.say(this.teams[p.goals[0]>p.goals[1]?0:1].name+' VINCE AI RIGORI!',999)}else{p.turn++;this.setupPenalty()}return;
  }
  if(!p.flight){
   if(shooter)moveCell(this,'aim',shooter.input);if(keeper)moveCell(this,'saveCell',keeper.input);g.y=31;g.vx=g.vy=0;g.action='idle';g.actionTime=0;g.keeperState='GK_POSITIONING';g.face={x:g.team.dir,y:0};
   if(shooter?shooter.input.take('z'):p.age>=1.8){
    if(shooter&&!p.aimExplicit){const axis=shooter.input.axis();p.aim=(axis.y<0?0:axis.y>0?6:3)+(axis.x<0?0:axis.x>0?2:1)}
    if(!shooter)p.aim=(p.turn*5+Math.floor(this.elapsed*19))%9;
    const target=cell(p.aim);if(shooter)this.as(shooter,()=>this.shoot(this.ball.owner));else this.shoot(this.ball.owner);const b=this.ball,n=(()=>{const dx=(team?0:100)-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy);return {x:dx/d,y:dy/d}})(),speed=this.lastShot.speed;b.vx=n.x*speed;b.vy=n.y*speed;
    const distance=Math.abs((team?0:100)-b.x),time=-Math.log(1-distance*.12/Math.abs(b.vx))/.12;b.vz=(target.z-b.z+12*time*time)/time;
    Object.assign(p,{flight:true,stage:'flight',age:0,cpuSave:(p.turn*7+Math.floor(this.elapsed*13))%9,keeperCommitted:false});this.say('SHOOT!',.5);
   }return;
  }
  if(keeper&&!p.keeperCommitted)moveCell(this,'saveCell',keeper.input);
  const chooseDive=keeper?(keeper.input.take('x')||keeper.input.take('c')||keeper.input.take('z')):p.age>.15;
  if(!p.keeperCommitted&&chooseDive){p.keeperCommitted=true;if(keeper)keeper.input.cancelShot();p.diveCell=keeper?p.saveCell:p.cpuSave;g.keeperState='GK_DIVING';g.action='keeper';g.actionTime=.6;const target=cell(p.diveCell);g.face={x:g.team.dir,y:target.col-1}}
  if(p.keeperCommitted){const target=cell(p.diveCell);g.y+=Math.max(-18*dt,Math.min(18*dt,target.y-g.y));g.keeperState='GK_DIVING'}
  this.ball.update(dt);const b=this.ball,reach=p.keeperCommitted?cell(p.diveCell).z:2.5;
  if(Math.abs(b.x-g.x)<1.4&&Math.abs(b.y-g.y)<1.8&&Math.abs(b.z-reach)<1.5){g.action='keeper';g.actionTime=.6;g.keeperState='GK_CATCHING';conclude(this,false,'PARATO!')}
  else if(b.x<0||b.x>100)conclude(this,b.y>25&&b.y<37&&b.z<5,b.y>25&&b.y<37&&b.z<5?'GOAL!':'FUORI!');
  else if(p.age>3)conclude(this,false,'FUORI!');
 };
 E.PenaltyTargets={cell,heights,lanes};
})();
