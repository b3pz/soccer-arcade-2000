var window=globalThis;function addEventListener(){}function removeEventListener(){};var navigator={};
load('arcade/engine/core.js');load('arcade/engine/controllers.js');load('arcade/engine/penalties.js');load('arcade/engine/arcade-features.js');load('arcade/engine/assist.js');load('arcade/engine/difficulty.js');load('arcade/engine/setpieces.js');load('arcade/bridge.js');load('game/catalog.js');load('arcade/engine/freekick.js');load('arcade/engine/wing-play.js');load('game/demo.js');
function assert(v,s){if(!v)throw Error(s)}function pass(s){print('PASS '+s)}
const E=S9ArcadeEngine,M=E.Match.prototype,clubs=SA2000_CATALOG.club;let crosses=0,volleys=0,humanVolleys=0,crossDepth=0;
const passFn=M.pass;M.pass=function(p,aerial){if(aerial&&!this.restarts.data&&S9ArcadeWingPlay.onWing(p.team,p)){crosses++;crossDepth=S9ArcadeWingPlay.depth(p.team,p)}return passFn.apply(this,arguments)};
const shootFn=M.shoot;M.shoot=function(p,volley){if(volley){volleys++;if(this.isControlled(p))humanVolleys++}return shootFn.apply(this,arguments)};
function match(h,a,level='facile'){const input=new E.InputManager({keys:null});input.active=true;const m=new E.Match(input);ArcadeMatchBridge.setupTeam(m.teams[0],clubs.find(t=>t.name===h),{cleanNames:true});ArcadeMatchBridge.setupTeam(m.teams[1],clubs.find(t=>t.name===a),{cleanNames:true});m.setHumans([{team:0,input}]);S9ArcadeDifficulty.apply(m,level);m.rules.allowDraw=true;return m}

// The demo bot plays a whole (short) match through the real inputs, with captions.
{const captions=new Set(),score=[];let goals=0;for(const [h,a] of [['Juventus','Milan'],['Ajax','Parma'],['Benfica','Lazio']]){const m=match(h,a,'difficile'),demo=S9ArcadeDemo.create();let t=0;
  for(;t<40000&&m.phase!=='FINISHED';t++){demo.step(m,1/120);m.update(1/120);m.input.end(1/120);if(demo.caption)captions.add(demo.caption.text)}
  assert(m.phase==='FINISHED','demo match did not finish');assert(m.elapsed<200,'demo is not short: '+m.elapsed);goals+=m.rules.score[0]+m.rules.score[1];score.push(m.rules.score.join('-'))}
 for(const c of ['C · PASSAGGIO','TIENI Z · TIRO CARICATO','CALCIO D’INIZIO'])assert(captions.has(c),'caption never shown: '+c);
 assert(crosses>0,'demo never crossed');assert(goals>0,'demo without goals');pass('demo bot plays short matches with '+crosses+' crosses, '+volleys+' volleys, '+goals+' goals ('+score.join(', ')+') and '+captions.size+' different captions')}

// CPU wing play: a wide CPU carrier runs to the byline and crosses to a runner in the box, who often volleys.
{let crossed=0,volleyed=0;for(let k=0;k<12;k++){const m=match('Roma','Inter');m.phase='PLAY';m.restarts.data=null;m.elapsed=k*1.37;const t=m.teams[1],dir=t.dir,winger=t.players.find(p=>p.role==='LM'),gx=dir>0?100:0;
  for(const p of m.teams[0].players)if(p.role!=='GK'){p.x=50;p.y=31}winger.x=gx-dir*24;winger.y=6;for(const p of t.players)if(['ST','CM'].includes(p.role))p.x=gx-dir*(30+(p.number%3)*4);m.control(winger);winger.aiWait=0;crosses=0;volleys=0;const start={x:winger.x};
  for(let n=0;n<480&&!volleys&&m.phase==='PLAY';n++){m.update(1/120);m.input.end(1/120)}
  if(crosses){crossed++;assert(crossDepth>80,'winger crossed without running down the line: '+crossDepth)}if(volleys)volleyed++}
 assert(crossed>=10,'CPU wingers crossed only '+crossed+'/12');assert(volleyed>=3,'CPU volleyed only '+volleyed+'/12 crosses');pass('CPU wingers reach the byline and cross ('+crossed+'/12), runners volley ('+volleyed+'/12)')}

// A human holding Z under a cross takes over the receiver and volleys.
{const m=match('Roma','Inter');m.phase='PLAY';m.restarts.data=null;const h=m.humans[0],t=m.teams[0],dir=t.dir,winger=t.players.find(p=>p.role==='RM'||p.role==='LM'),striker=t.players.find(p=>p.role==='ST');
 for(const p of m.teams[1].players)if(p.role!=='GK'){p.x=dir>0?20:80;p.y=31}winger.x=dir>0?88:12;winger.y=winger.home.y<31?6:56;striker.x=dir>0?85:15;striker.y=31;m.control(winger);h.selected=winger;h.input.down.clear();m.pass(winger,true);assert(m.ball.passTarget===striker,'cross not aimed at the striker in the box');h.input.press('z');
 let volleyed=false;humanVolleys=0;for(let k=0;k<360&&!volleyed;k++){m.update(1/120);m.input.end(1/120);volleyed=humanVolleys>0}
 assert(h.selected===striker,'control not handed to the receiver');assert(volleyed,'human did not volley the cross');pass('human cross: control moves to the striker and holding Z volleys it')}

// Keeper positioning: with the ball on the wing he stays near the middle of his goal (never out at the post),
// and on a shot already on its way he still goes for the ball.
{const m=match('Roma','Inter');m.phase='PLAY';m.restarts.data=null;const k=m.teams[0].players.find(p=>p.role==='GK'),wing=m.teams[1].players.find(p=>p.role==='LM'||p.role==='RM'),own=m.teams[0].dir>0?0:100;
 wing.x=own===0?20:80;wing.y=5;m.control(wing);wing.aiWait=9;m.ball.x=wing.x;m.ball.y=wing.y;k.x=own===0?3:97;k.y=31;for(let i=0;i<240;i++){k.update(m,1/120)}
 assert(Math.abs(k.y-31)<=4.1,'keeper drifted to the post: y='+k.y.toFixed(1));
 const b=m.ball;b.owner=null;b.x=own===0?14:86;b.y=31;b.z=1;b.vx=own===0?-50:50;b.vy=12;b.state='shot';b.lock=0;b.flight=.2;const y0=k.y;for(let i=0;i<6;i++){k.update(m,1/120);b.x+=b.vx/120;b.y+=b.vy/120}
 assert(k.y>y0+.2||m.ball.owner===k||k.keeperState==='GK_DIVING','keeper ignored a shot heading for the corner');pass('keeper holds the middle of the goal on wing play and still moves onto shots')}
