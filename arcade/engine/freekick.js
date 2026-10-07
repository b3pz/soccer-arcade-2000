/* Close free kicks: a dedicated scene behind the taker with the wall, keeper and goal (penalty-style). */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,R=E.Renderer.prototype,RM=E.RestartManager.prototype;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
// Screen geometry shared with tools/generate-freekick-backdrop.py.
const G={left:360,right:920,bar:246,line:430,wallY:548,ballX:640,ballY:652},BACKDROP='arcade/assets/freekick-backdrop.png?v=fk-1';
const goalX=team=>team?0:100;R.bitmap?.(BACKDROP);
// Free kick between the box and ~32 m, central enough to shoot: played in the scene.
M.isSceneFreeKick=function(team,x,y){const d=Math.abs(goalX(team)-x);return d>16&&d<=32&&Math.abs(y-31)<18};
const award=RM.award;
RM.award=function(type,team,x,y){award.call(this,type,team,x,y);if(type==='FREE KICK'&&this.data&&this.m.isSceneFreeKick(team,x,y))this.data.scene={team,x,y}};
// The scene opens after the foul beat (whistle, banner, players settling).
const restartUpdate=RM.update;
RM.update=function(dt){const d=this.data;if(d?.scene&&!d.walk&&d.age>=(d.freeze||0)&&!d.delay){const s=d.scene;this.data=null;this.m.beginFreeKick(s.team,s.x,s.y);return}if(d?.scene&&!(d.age<(d.freeze||0)||d.walk)){d.age+=dt;d.delay=Math.max(0,d.delay-dt);for(const p of this.m.players)if(p!==d.taker&&p.target&&Math.hypot(p.x-p.target.x,p.y-p.target.y)>.8)p.move(p.target.x-p.x,p.target.y-p.y,dt,9);return}return restartUpdate.call(this,dt)};
M.beginFreeKick=function(team,x,y){const atk=this.teams[team],def=this.teams[1-team],gx=goalX(team),dir=atk.dir,taker=this.ball.owner||atk.players.find(p=>!p.sentOff&&p.role!=='GK'),keeper=def.players.find(p=>!p.sentOff&&p.role==='GK'),side=y<31?-1:y>31?1:1;
 // World layout mirrors the scene: wall 9 m towards goal, keeper on his line.
 const wall=def.players.filter(p=>!p.sentOff&&p.role!=='GK').sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,4),n=Math.hypot(gx-x,31-y);
 wall.forEach((p,i)=>{p.x=x+(gx-x)/n*9.15;p.y=clamp(y+(31-y)/n*9.15+(i-1.5)*1.1,2,60);p.vx=p.vy=0});if(keeper){keeper.x=gx-dir*1.5;keeper.y=31}
 const level=this.difficulty||'normale',jumpOdds={facile:.3,normale:.5,difficile:.7}[level]??.5;
 this.fk={team,x,y,dist:Math.round(Math.abs(gx-x)),taker,keeper,wall,wallCenter:-.32*side,stage:'ready',age:0,phase:0,lateral:0,power:0,curl:0,button:null,kp:.42*side,jump:false,cpuJump:((this.elapsed*7.31)%1)<jumpOdds,dive:false,outcome:null};
 this.ball.reset();this.ball.x=x;this.ball.y=y;this.control(taker);this.phase='FREEKICK';for(const h of this.humans)h.input.cancelShot();this.say('PUNIZIONE · '+this.fk.dist+' M',1.6)};
M.fkHumans=function(){const fk=this.fk;return {shooter:this.humansOf(fk.team)[0]||null,keeper:this.humansOf(1-fk.team)[0]||null}};
// Pure outcome for a strike: lateral aim at goal (−1..1 = posts), power 0..1, curl −1..1, wall jump, keeper lateral at arrival.
function resolve(fk,keeperReach){const p=fk.power,L=fk.lateral,c=fk.curl,Lw=L*.55-c*.35,uw=.25+p,ug=p*1.35-.12,wallTop=fk.jump?1:.8;
 if(Math.abs(Lw-fk.wallCenter*.55)<.5&&uw<wallTop)return {kind:'wall',label:'RESPINTA DALLA BARRIERA!',Lw,uw,ug:uw};
 if(ug>1.03)return {kind:'over',label:'ALTA!',Lw,uw,ug};if(Math.abs(L)>1.03)return {kind:'wide',label:'FUORI!',Lw,uw,ug};
 if(Math.abs(L)>.95||ug>.95)return {kind:'post',label:Math.abs(L)>.95?'PALO!':'TRAVERSA!',Lw,uw,ug};
 if(Math.abs(fk.kp-L)<keeperReach*(ug>.72?.75:1))return {kind:'save',label:'PARATA!',Lw,uw,ug};return {kind:'goal',label:'GOAL!',Lw,uw,ug}}
M.freeKick=function(dt){const fk=this.fk,{shooter,keeper}=this.fkHumans();fk.age+=dt;const gk=fk.keeper?.attributes?.goalkeeping??75;
 if(fk.stage==='ready'){fk.phase+=dt;if(!fk.button){fk.lateral=Math.sin(fk.phase*2.1)*1.25;
   if(shooter){const k=['z','c','x'].find(key=>shooter.input.down.has(key));if(k&&fk.age>.6){fk.button=k;fk.held=0}}
   else if(fk.age>1.7){fk.lateral=Math.sin(this.elapsed*3.7)*.85;fk.power=.58+((this.elapsed*5.1)%1)*.22;fk.curl=Math.sin(this.elapsed*2.3)*.6;this.fkStrike()}}
  else{fk.held+=dt;fk.power=Math.min(1,fk.held/1.2);const a=shooter.input.axis();fk.curl=clamp(fk.curl+a.x*dt*2.2,-1,1);shooter.input.shotHeld=0;if(!shooter.input.down.has(fk.button))this.fkStrike()}
  if(keeper&&keeper.input.take('z'))fk.jumpQueued=true;return}
 if(fk.stage==='flight'){const T=fk.duration,t=Math.min(1,fk.age/T);(fk.film=fk.film||[]).push({age:fk.age,kp:fk.kp,dive:fk.dive,diveDir:fk.diveDir,jump:fk.jump});
  // Wall: CPU wall jumps by odds, a human wall jumps on Z (timing counts).
  if(keeper){if(keeper.input.take('z')||fk.jumpQueued){fk.jump=fk.age<.35;fk.jumpQueued=false}const a=keeper.input.axis();if(!fk.dive){fk.kp=clamp(fk.kp+a.x*dt*2.3,-1.1,1.1);if(keeper.input.take('x')||keeper.input.take('c')){fk.dive=true;fk.diveDir=Math.sign(a.x)||Math.sign(fk.lateral-fk.kp)||1}}else fk.kp=clamp(fk.kp+fk.diveDir*dt*3.4,-1.2,1.2)}
  else{fk.jump=fk.cpuJump;const react=.16+({facile:.16,normale:.08,difficile:0}[this.difficulty]??.08),speed=.9+gk/150,guess=fk.lateral+(((this.elapsed*7.3)%1)-.5)*.5*({facile:1.5,normale:1,difficile:.7}[this.difficulty]??1);if(fk.age>react)fk.kp+=clamp(guess-fk.kp,-speed*dt,speed*dt);if(fk.age>T*.55)fk.dive=true}
  if(t>=1){const reach=.24+(gk-60)/400+(keeper?(fk.dive?.12:0):fk.dive?.08:0);fk.outcome=resolve(fk,reach);fk.stage='result';fk.age=0;this.say(fk.outcome.label,3);if(fk.outcome.kind==='save')this.stats.teams[1-fk.team].saves++}
  return}
 if(fk.stage==='result'){for(const h of this.humans)h.input.cancelShot(false);const go=fk.age>.6&&this.humans.map(h=>h.input.take('z')).some(Boolean)||fk.age>2.4;if(go)this.fkResume()}};
M.fkStrike=function(){const fk=this.fk;fk.stage='flight';fk.age=0;fk.duration=1.05-.45*fk.power;fk.lateral=clamp(fk.lateral,-1.4,1.4);this.stats.teams[fk.team].shots++;this.lastShooter=fk.taker;this.lastAssist=null;fk.taker.action='shoot';fk.taker.actionTime=.32;for(const h of this.humans)h.input.cancelShot();this.say('TIRO!',.5)};
// Back to the pitch with a world state matching what was shown.
M.fkResume=function(){const fk=this.fk,o=fk.outcome,team=fk.team,gx=goalX(team),dir=this.teams[team].dir,b=this.ball;this.fk=null;
 if(o.kind==='goal'){this.fkReplay={fk:{...fk,stage:'flight',outcome:null},film:fk.film||[]};this.phase='PLAY';this.rules.goal(team);return}
 if(o.kind==='over'||o.kind==='wide'){this.restarts.award('GOAL KICK',1-team,team?6:94,31);return}
 this.phase='PLAY';b.reset();
 if(o.kind==='save'&&fk.keeper){fk.keeper.x=gx-dir*1.5;fk.keeper.y=clamp(31+fk.lateral*3.6,26,36);this.control(fk.keeper);fk.keeper.aiWait=1.2;return}
 const from=o.kind==='wall'?{x:fk.wall[0]?.x??fk.x,y:fk.y}:{x:gx-dir*1.2,y:31+clamp(fk.lateral,-1,1)*3.6};b.x=from.x-dir*.8;b.y=from.y;b.z=1.5;b.vx=-dir*16;b.vy=Math.sin(this.elapsed*9)*8;b.vz=4;b.state='rebound';b.lastTeam=1-team;b.lock=.2};
const update=M.update;
M.update=function(dt){if(this.phase==='FREEKICK'&&!this.cardScene&&this.fk){this.elapsed+=dt;this.messageTime-=dt;this.players.forEach(p=>p.tick(dt));this.freeKick(dt);return}return update.call(this,dt)};

// ----------------------------------------------------------------- scene
if(window.S9ArcadeFrames){const C=S9ArcadeFrames.celebrate;S9ArcadeFrames.wall=S9ArcadeFrames.wall||[C[2]];S9ArcadeFrames.wall_jump=S9ArcadeFrames.wall_jump||[C[5]]}
R.drawFreeKick=function(m){const views=this.fkViews=this.fkViews||new Map(),view=(key,src,extra)=>{let v=views.get(key);if(!v){v={};views.set(key,v)}return Object.assign(v,src,extra)},c=this.ctx,fk=m.fk,bg=this.bitmap(BACKDROP),{shooter,keeper}=m.fkHumans();c.clearRect(0,0,1280,720);
 if(bg&&bg.complete&&bg.naturalWidth){const s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(bg,0,0,1280,720);c.imageSmoothingEnabled=s}else{c.fillStyle='#21853a';c.fillRect(0,0,1280,720)}
 const gx=L=>640+L*280,wx=L=>640+L*300,t=fk.stage==='flight'?Math.min(1,fk.age/fk.duration):fk.stage==='result'?1:0,o=fk.outcome,pw=fk.power,Lw=fk.lateral*.55-fk.curl*.35,uw=.25+pw,ug=pw*1.35-.12;
 // Keeper on the line, wall in front, taker at the bottom.
 if(fk.keeper){const dive=fk.dive&&fk.stage!=='ready';c.save();c.translate(gx(fk.kp),G.line+2-(dive?18:0));this.sprite(view('keeper',fk.keeper,{keeperState:dive?'GK_DIVING':'GK_POSITIONING',action:dive?'keeper':'idle',actionTime:dive?.6:0,face:{x:1,y:dive?(fk.diveDir||Math.sign(fk.lateral-fk.kp)||1):0}}),m,{scale:2.1});c.restore()}
 const jumpLift=fk.jump&&fk.stage!=='ready'?Math.max(0,Math.sin(Math.min(1,fk.age/.55)*Math.PI))*34:0;
 fk.wall.forEach((p,i)=>{const x=wx(fk.wallCenter*.55+(i-1.5)*.21);c.fillStyle='#0006';c.beginPath();c.ellipse(x,G.wallY+4,26,7,0,0,7);c.fill();c.save();c.translate(x,G.wallY-jumpLift);this.sprite(view('wall'+i,p,{role:'ST',action:jumpLift>2?'wall_jump':'wall',actionTime:0,stun:0,burst:0,face:{x:1,y:0}}),m,{scale:1.9});c.restore()});
 c.save();c.translate(560,690);this.sprite(view('taker',fk.taker,{action:fk.stage==='flight'&&fk.age<.32?'shoot':'idle',actionTime:.32,face:{x:1,y:0}}),m,{scale:2.3});c.restore();
 // Ball: quadratic path through the wall plane, curl bends the line.
 const end=o?.kind==='wall'?{x:wx(Lw),y:G.wallY-(o.uw/.8)*150}:{x:gx(fk.lateral),y:G.line-ug*(G.line-G.bar)},mid={x:wx(Lw),y:G.wallY-(uw/.8)*150},tw=.4,q=tt=>{const a=(tt-tw)*(tt-1)/(tw),b=tt*(tt-1)/(tw*(tw-1)),cc=tt*(tt-tw)/(1-tw);return {x:G.ballX*a+mid.x*b+end.x*cc,y:G.ballY*a+mid.y*b+end.y*cc}};
 const bt=o?.kind==='wall'?Math.min(t,tw)/tw:t,ball=fk.stage==='ready'?{x:G.ballX,y:G.ballY}:o?.kind==='wall'?{x:lerp(G.ballX,mid.x,bt),y:lerp(G.ballY,mid.y,bt)-Math.sin(bt*Math.PI)*30}:q(t);
 c.fillStyle='#0006';c.beginPath();c.ellipse(lerp(G.ballX,end.x,t),lerp(G.ballY+6,G.line+4,t),10-t*5,4-t*2,0,0,7);c.fill();this.drawBall(ball.x,ball.y,12-t*6,{ball:{x:fk.lateral*t*30,y:t*30,vx:1,vy:0}});
 // Aim: swinging arrow onto the goal, power gauge, curl.
 if(fk.stage==='ready'&&(shooter||fk.button)){const tx=gx(fk.lateral),ty=G.line-(fk.button?ug:.45)*(G.line-G.bar),color=pw>.8?'#ff5a36':pw>.45?'#ffe23d':'#7dff6a',cx=(G.ballX+tx)/2+fk.curl*-140,cy=(G.ballY+ty)/2;
  c.save();c.setLineDash([16,10]);c.lineWidth=6;c.strokeStyle='#061021';c.beginPath();c.moveTo(G.ballX,G.ballY-10);c.quadraticCurveTo(cx,cy,tx,ty);c.stroke();c.lineWidth=3;c.strokeStyle=color;c.stroke();c.setLineDash([]);c.fillStyle=color;c.strokeStyle='#061021';c.lineWidth=3;c.beginPath();c.arc(tx,ty,14,0,7);c.stroke();c.beginPath();c.arc(tx,ty,4,0,7);c.fill();c.restore();
  if(fk.button){this.panel(1010,560,240,70,12);for(let i=0;i<12;i++){c.fillStyle=i<Math.ceil(pw*12)?i>8?'#ff6436':i>4?'#ffe44a':'#79e752':'#253c50';c.fillRect(1040+i*15,592,12,20)}this.text('POTENZA · EFFETTO '+(fk.curl<-.15?'◀':fk.curl>.15?'▶':'—'),1130,585,14,'#ffe569')}}
 const rm=this.replayMode;this.replayMode=true;try{this.hud({...m,messageTime:0})}finally{this.replayMode=rm}this.panel(470,104,340,48,12);this.text('PUNIZIONE · '+fk.dist+' M',640,136,22,'#ffe55a');
 if(fk.stage==='result'){this.panel(250,262,780,170,22);this.text(o.label,640,340,54,o.kind==='goal'?'#ffe743':'#ff8294');this.text(m.teams[fk.team].name,640,388,22,'#b3eaff')}
 else{const pad=!!window.S9ArcadeControls?.padConnected;this.panel(250,158,780,46,10);this.text(shooter?(fk.button?'TIENI = POTENZA · ←/→ EFFETTO · RILASCIA = TIRO':(pad?'A/B/X':'Z/C/X')+' FERMA LA MIRA'):keeper?'←/→ PORTIERE · '+(pad?'B/X':'X/C')+' TUFFO · '+(pad?'A':'Z')+' SALTO BARRIERA':'PUNIZIONE',640,188,19,'#ffe55b')}};
// Free-kick goals get their own replay: the recorded scene is played back instead of the pitch frames.
const RP=E.ReplayManager.prototype,record=RP.record,start=RP.start,replayDraw=RP.draw;
RP.record=function(m,dt,camera){this.match=m;return record.call(this,m,dt,camera)};
RP.start=function(){const m=this.match;if(m?.fkReplay?.film.length){this.fkFilm=m.fkReplay;m.fkReplay=null;this.playback=this.fkFilm.film;this.index=0;return}this.fkFilm=null;return start.call(this)};
RP.draw=function(m,renderer,dt=1/60){if(!this.fkFilm)return replayDraw.call(this,m,renderer,dt);const film=this.fkFilm.film,f=film[Math.floor(this.index)];if(!f){this.playback=null;this.fkFilm=null;return false}
 const fk={...this.fkFilm.fk,...f,stage:'flight'};renderer.drawFreeKick({...m,fk,phase:'FREEKICK',fkHumans:()=>({shooter:null,keeper:null})});renderer.panel(430,226,420,58,12);renderer.text(window.S9ArcadeControls?.padConnected?'REPLAY · A SALTA':'REPLAY · Z SALTA',640,263,25,'#ffde4b');this.index+=dt*120*.55;return true};
const draw=R.draw;
R.draw=function(m){if(m.phase==='FREEKICK'&&m.fk){this.drawFreeKick(m);if(m.cardScene)this.cardCutscene?.(m);return}return draw.call(this,m)};
})();
