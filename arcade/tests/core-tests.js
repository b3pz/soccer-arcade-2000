var window=globalThis;var console={log:print};function addEventListener(){};var document={};var Image=class{};function assert(v){if(!v)throw Error('Assertion failed')}assert.equal=(a,b)=>assert(a===b);assert.notEqual=(a,b)=>assert(a!==b);
load('arcade/engine/core.js');load('arcade/engine/controllers.js');load('arcade/engine/penalties.js');window.neo={match:new S9ArcadeEngine.Match(new S9ArcadeEngine.InputManager())};window.neo.input=window.neo.match.input;
const {match:m,input}=window.neo;let count=0;
function test(name,fn){m.reset();input.pressed.clear();input.down.clear();input.shotBuffer=0;fn();console.log('PASS '+name);count++}
function play(){m.phase='PLAY';m.restarts.data=null}
function press(k){input.pressed.add(k)}
test('1 Kickoff C, clock starts only after pass',()=>{m.update(.1);assert.equal(m.rules.remaining,120);press('c');m.update(.01);assert.equal(m.ball.state,'pass');assert.equal(m.phase,'PLAY')});
test('2 Lateral pass chooses teammate in facing direction',()=>{play();const p=m.selected;p.face={x:0,y:1};m.pass(p);assert(m.ball.passTarget.y>p.y)});
test('3 Pressed player always passes',()=>{play();m.teams[1].players[9].x=m.selected.x+.5;press('c');m.update(.01);assert.equal(m.ball.state,'pass')});
test('4 Immediate shot',()=>{play();input.shotBuffer=.28;m.update(.01);assert.equal(m.ball.state,'shot')});
test('5 Buffered shot on reception',()=>{play();const p=m.selected,b=m.ball;b.owner=null;b.x=p.x;b.y=p.y;b.z=0;b.lock=0;input.shotBuffer=.2;m.receive();assert.equal(b.state,'shot')});
test('6 Aerial volley',()=>{play();const p=m.selected,b=m.ball;b.owner=null;b.x=p.x;b.y=p.y;b.z=3;b.lock=0;input.shotBuffer=.2;m.receive();assert.equal(b.state,'shot');assert(Math.hypot(b.vx,b.vy)>60)});
test('7 Physical normal tackle and recovery expires',()=>{play();const p=m.selected,o=m.teams[1].players[9];o.x=p.x+2;o.y=p.y;p.face={x:1,y:0};m.control(o);p.tackle(false);m.tackles(.01);assert.equal(m.ball.owner,p);p.tick(.4);p.tick(.4);assert.equal(p.recovery,0)});
test('8 Hard tackle clears ball',()=>{play();const p=m.selected,o=m.teams[1].players[9];o.x=p.x+2;o.y=p.y;p.face={x:1,y:0};m.control(o);p.tackle(true);m.tackles(.01);assert.equal(m.ball.state,'rebound');assert.equal(m.ball.owner,null)});
test('9 Special burst',()=>{play();press('v');m.update(.01);assert(m.selected.burst>0);assert(m.selected.specialCooldown>0)});
test('10 Throw-in uses different receiver, ball enters field',()=>{m.restarts.award('THROW IN',0,50,0);const taker=m.ball.owner;m.restarts.data.delay=0;press('c');m.restarts.update(.01);assert.notEqual(m.ball.passTarget,taker);assert(m.ball.y>0)});
test('11 Off-ball attacking team movement',()=>{play();m.teams[0].ai.update(m,.1);assert(m.teams[0].players.filter(p=>Math.hypot(p.vx,p.vy)>0).length>=5)});
test('12 Defensive press and cover',()=>{play();m.control(m.teams[1].players[6]);m.transition=0;m.teams[0].ai.update(m,.1);assert.equal(m.teams[0].state,'DEFENDING');assert(m.teams[0].players.filter(p=>Math.hypot(p.vx,p.vy)>0).length>=5)});
test('13 Loose-ball team has only two assigned chasers',()=>{play();m.ball.owner=null;m.ball.x=65;m.ball.y=30;m.teams[1].ai.update(m,.01);assert.equal(m.teams[1].state,'LOOSE_BALL');assert.equal(m.teams[1].players.slice(1).filter(p=>distance(p.target,m.ball)<1).length,2)});
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
test('14 Goal resets formation and conceding kickoff',()=>{play();m.rules.goal(0);assert.equal(m.rules.score[0],1);assert.equal(m.restarts.data.team,1);assert.equal(m.ball.owner.team.id,1)});
test('15 Regulation then golden goal then penalties',()=>{play();m.rules.remaining=.01;m.rules.update(.02);assert.equal(m.rules.period,'GOLDEN');play();m.rules.goldenRemaining=.01;m.rules.update(.02);assert.equal(m.phase,'PENALTIES')});
test('All players remain finite over 150 seconds',()=>{play();for(let i=0;i<18000;i++){if(m.phase==='RESTART'&&m.restarts.data.team===0)press('c');if(m.phase==='PENALTIES')press('z');m.update(1/120);input.end(1/120);for(const p of m.players)assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(Number.isFinite(m.ball.x));}assert.equal(m.players.length,22)});


test('GK holding is protected and contact awards a goalkeeper free kick',()=>{play();const g=m.teams[1].players[0];m.control(g);assert.equal(m.ball.controlMode,'HANDS');assert.equal(m.ball.canBeStolen,false);const p=m.selected;p.x=g.x-1;p.y=g.y;p.face={x:1,y:0};p.tackle(true);m.tackles(.01);assert.equal(m.phase,'RESTART');assert.equal(m.restarts.data.type,'FREE KICK');assert.equal(m.restarts.data.team,1);assert(m.ball.owner!==p)});
test('Golden Goal is exactly 30 seconds',()=>{play();m.rules.remaining=0;m.rules.update(.001);assert.equal(m.rules.goldenRemaining,30);assert.equal(m.phase,'PLAY');m.rules.update(29.999);assert.equal(m.rules.period,'GOLDEN');m.rules.update(.0011);assert.equal(m.phase,'PENALTIES')});
test('Corner and goal kick',()=>{play();m.ball.owner=null;m.ball.x=101;m.ball.y=10;m.ball.lastTeam=1;m.boundaries();assert.equal(m.restarts.data.type,'CORNER');play();m.ball.owner=null;m.ball.x=101;m.ball.y=10;m.ball.lastTeam=0;m.boundaries();assert.equal(m.restarts.data.type,'GOAL KICK')});
test('Close ball camera',()=>{const c=new S9ArcadeEngine.CameraController();m.ball.x=90;c.update(m,1);assert(c.x>80);assert(c.zoom>26)});
test('Shootout mathematical early finish',()=>{const P=S9ArcadeEngine.PenaltyManager;assert(P.decided([3,3],[3,0]));assert(!P.decided([5,5],[4,4]));assert(!P.decided([6,5],[5,4]));assert(P.decided([6,6],[5,4]))});

test('Keeper positions, catches and distributes',()=>{play();const g=m.teams[1].players[0];m.ball.owner=null;m.ball.x=g.x;m.ball.y=g.y;m.ball.vx=0;m.ball.z=0;m.ball.lock=0;g.update(m,.001);assert.equal(m.ball.owner,g);assert.equal(m.ball.controlMode,'HANDS');g.aiWait=0;g.update(m,.001);assert.equal(m.ball.owner,null)});
test('Played penalty aim and shot',()=>{m.startPenalties();input.down.add('arrowleft');press('z');m.penalties(.01);assert(m.pen.flight);assert(m.ball.vy<0);assert.equal(m.ball.state,'shot')});
test('Receiver approaches passing ball',()=>{play();m.pass(m.selected);const p=m.ball.passTarget;m.teams[0].ai.update(m,.1);assert.equal(p.receiveState,'approaching');assert(p.receiverIntent);assert(Math.hypot(p.vx,p.vy)>0)});

test('Golden goal first score ends match',()=>{play();m.rules.period='GOLDEN';m.rules.goal(1);assert.equal(m.phase,'FINISHED')});
test('Keeper dive rebounds fast shot',()=>{play();const g=m.teams[1].players[0];m.ball.owner=null;m.ball.x=g.x;m.ball.y=g.y;m.ball.vx=60;m.ball.z=3;m.ball.lock=0;g.update(m,.001);assert.equal(m.ball.state,'rebound');assert.equal(g.keeperState,'GK_DIVING')});
test('First leg may draw; return leg uses aggregate',()=>{play();m.rules.allowDraw=true;m.rules.remaining=0;m.rules.update(.01);assert.equal(m.phase,'FINISHED');assert.equal(m.rules.leader(),null);m.reset();play();m.rules.offset=[0,2];m.rules.score=[2,0];m.rules.remaining=0;m.rules.update(.01);assert.equal(m.rules.period,'GOLDEN')});
test('Return leg honors away goals',()=>{play();m.rules.offset=[2,1];m.rules.score=[0,1];m.rules.awayGoals=[null,1];m.rules.remaining=0;m.rules.update(.01);assert.equal(m.phase,'FINISHED');assert.equal(m.rules.leader(),1)});


load('arcade/bridge.js');
test('Database player attributes and formation are retained',()=>{const ps=Array.from({length:11},(_,i)=>({id:'source'+i,name:'DB Player',pos:i===0?'GK':i<5?'DF':i<9?'MF':'ST',overall:65,morale:80,stats:{speed:i?95:40,shooting:90,passing:85}}));ArcadeMatchBridge.setupTeam(m.teams[0],{name:'DB Team',season:'1998/99',players:ps},{players:ps,lineup:ps.map(p=>p.id),formation:'3-5-2',mentality:'Offensivo'});assert.equal(m.teams[0].players[9].source.id,'source9');assert.equal(m.teams[0].players[9].attributes.speed,95);assert.equal(m.teams[0].formation,'3-5-2');assert.equal(m.teams[0].players[9].morale,80)});
test('Replay stores frames and never resimulates',()=>{const replay=new S9ArcadeEngine.ReplayManager(),camera=new S9ArcadeEngine.CameraController();for(let i=0;i<120;i++)replay.record(m,.04,camera);assert.equal(replay.frames.length,90);const snap=replay.frames[0].players[0].x;m.players[0].x+=10;assert.equal(replay.frames[0].players[0].x,snap);replay.start();assert.equal(replay.playback.length,90)});


test('Dribble over touchline awards real throw in',()=>{play();m.selected.y=-.5;m.selected.face={x:0,y:-1};m.ball.update(0);m.boundaries();assert.equal(m.restarts.data.type,'THROW IN');assert.equal(m.restarts.data.team,1)});
console.log(count+' core scenarios passed');
// Verify the real public bridge completion and cancellation lifecycle.
var keyListeners=[];addEventListener=(t,f)=>{if(t==='keydown')keyListeners.push(f)};var removeEventListener=(t,f)=>{keyListeners=keyListeners.filter(g=>g!==f)},key=k=>[...keyListeners].forEach(f=>f({key:k,preventDefault(){},stopImmediatePropagation(){}})),performance={now:()=>0},frameCallback,panelForTest;
var requestAnimationFrame=fn=>frameCallback=fn;
var document={createElement:()=>{const canvas={getContext:()=>({}),setAttribute(){},addEventListener(){}};return panelForTest={style:{},dataset:{},setAttribute(){},querySelector:s=>s==='canvas'?canvas:null,remove(){this.removed=true}}},body:{append(){}}};
S9ArcadeEngine.Renderer.prototype.draw=function(){};
(async()=>{
 const roster=Array.from({length:11},(_,i)=>({id:'bridge'+i,name:'Bridge Player',pos:i===0?'GK':i<5?'DF':i<9?'MF':'ST',overall:80,stats:{speed:90}}));
 const config={home:{id:'home',name:'Home',season:'1998/99',players:roster},away:{id:'away',name:'Away',season:'1998/99',players:roster}};
 let musicStops=0,eventStops=0,musicRestarts=0;window.stopMenuMusic=()=>musicStops++;window.stopEventMusic=()=>eventStops++;window.startMenuMusic=()=>musicRestarts++;
 const resultPromise=launchArcadeMatch(config),active=S9ArcadeActive;assert.equal(S9ArcadeMusicMuted,true);assert.equal(musicStops,1);assert.equal(eventStops,1);
 assert.equal(active.match.players.length,22);active.match.rules.score=[3,1];active.match.phase='FINISHED';for(let t=100;t<=1400;t+=100)frameCallback(t);assert(active.match.presentationTime>active.match.elapsed);assert.equal(active.match.rules.score[0],3);key('z');const r=await resultPromise;assert.equal(r.homeGoals,3);assert.equal(r.awayGoals,1);assert.equal(r.winner,'home');assert.equal(S9ArcadeActive,null);assert.equal(active.input.active,false);assert(panelForTest.removed);console.log('PASS actual ArcadeMatchBridge result and disposal');assert.equal(S9ArcadeMusicMuted,false);console.log('PASS match entry silences menu and event music, completion leaves the menu to restart its own theme');
 const celebration=launchArcadeMatch(config),celebrating=S9ArcadeActive;celebrating.match.phase='PLAY';celebrating.match.rules.goal(0);frameCallback(100);const frozenElapsed=celebrating.match.elapsed,frozenClock=celebrating.match.rules.remaining;frameCallback(200);assert.equal(celebrating.match.elapsed,frozenElapsed);assert.equal(celebrating.match.rules.remaining,frozenClock);assert.equal(celebrating.match.rules.score[0],1);key('Escape');key('x');assert.equal(await celebration,null);console.log('PASS goal presentation pauses physics without changing score or match clock');
 const cancel=launchArcadeMatch(config);key('Escape');assert.equal(S9ArcadeActive.input.active,false);key('z');assert.equal(S9ArcadeActive.input.active,true);key('Escape');key('x');assert.equal(await cancel,null);assert.equal(S9ArcadeMusicMuted,false);console.log('PASS ESC pause resumes with Z; X exits without result and restores menu audio (no DOM button)');
})().catch(e=>{print('FAIL bridge '+e);quit(1)});
