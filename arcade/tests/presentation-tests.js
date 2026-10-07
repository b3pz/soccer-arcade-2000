var window=globalThis;function addEventListener(){}function removeEventListener(){}
var Image=class{constructor(){this.complete=true;this.naturalWidth=1260;this.width=1260;this.height=480}};
var texts=[],ctx=new Proxy({fillText:function(s){texts.push(String(s))},getImageData:()=>({data:new Uint8ClampedArray(4)})},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});var document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
load('arcade/assets/animations.js');load('arcade/engine/core.js');load('arcade/engine/controllers.js');load('arcade/engine/penalties.js');load('arcade/engine/arcade-features.js');load('arcade/engine/setpieces.js');load('arcade/engine/art.js');load('arcade/engine/visual.js');load('arcade/engine/presentation-upgrade.js');load('arcade/engine/freekick.js');load('arcade/engine/match-presentation.js');load('arcade/engine/human-controls.js');load('arcade/engine/coin-toss.js');load('arcade/bridge.js');load('game/catalog.js');
function assert(v,s){if(!v)throw Error(s)}function pass(s){print('PASS '+s)}
const E=S9ArcadeEngine,clubs=SA2000_CATALOG.club;
function game(){const input=new E.InputManager({keys:null});input.active=true;const m=new E.Match(input);ArcadeMatchBridge.setupTeam(m.teams[0],clubs.find(t=>t.name==='Juventus'),{cleanNames:true});ArcadeMatchBridge.setupTeam(m.teams[1],clubs.find(t=>t.name==='Milan'),{cleanNames:true});m.setHumans([{team:0,input}]);m.rules.allowDraw=true;return m}

// No real footballer names: every squad uses invented names.
{const all=[...SA2000_CATALOG.club,...SA2000_CATALOG.national].flatMap(t=>t.players.map(p=>p.name));
 for(const real of ['Edgar Davids','Paolo Maldini','Roberto Baggio','Luis Suárez','Frank de Boer','Landon Donovan'])assert(!all.includes(real),'real name left: '+real);
 assert(!all.some(n=>/^(Portiere|Difensore|Centrocampista|Attaccante) \d/.test(n)),'placeholder names left');assert(new Set(all).size===all.length,'duplicate invented names');
 pass('catalog players carry invented, unique names')}

// A ball that hits the wall stops there: the outcome is decided at the wall, well before the flight would reach the goal.
{const m=game();m.phase='PLAY';m.restarts.data=null;m.restarts.award('FREE KICK',0,76,33);for(let k=0;k<400&&m.phase!=='FREEKICK';k++){m.update(1/120);m.input.end(1/120)}
 const fk=m.fk;fk.kp=-.4;Object.assign(fk,{lateral:-.1,power:.1,curl:0});m.fkStrike();fk.lateral=-.1;fk.cpuJump=false;const duration=fk.duration;let flight=0;
 while(fk.stage==='flight'&&flight<5){m.update(1/120);flight+=1/120}
 assert(fk.outcome?.kind==='wall','expected wall, got '+fk.outcome?.kind);assert(flight<duration*.5,'wall decided only after '+(flight/duration).toFixed(2)+' of the flight');assert(fk.bounce,'no rebound direction');
 const before=m.rules.score[0];for(let k=0;k<600&&m.phase==='FREEKICK';k++){m.update(1/120)}assert(m.phase==='PLAY'&&m.ball.state==='rebound'&&m.rules.score[0]===before,'wall did not resume as a rebound');
 pass('free kick into the wall stops at the wall and rebounds, never shown as a goal first')}

// Kick-off camera: starts close on the centre spot, pulls back to the normal view in ~2.6 s; kick-off waits for it.
{const m=game();m.restarts.kickoff(0);const cam=new E.CameraController();cam.update(m,1/60);const normal=36;
 assert(cam.zoom>normal*3,'kick-off camera not close on the ball: '+cam.zoom);assert(Math.abs(cam.x-50)<.5,'kick-off camera not on the centre spot');assert(m.restarts.data.delay>=2,'kick-off not held for the camera');
 let last=cam.zoom,monotone=true;for(let t=0;t<170;t++){cam.update(m,1/60);if(cam.zoom>last+1e-6)monotone=false;last=cam.zoom}
 assert(monotone,'camera zoom jumps back');assert(Math.abs(cam.zoom-normal)<.01&&!cam.kickoff,'camera did not settle: '+cam.zoom);
 cam.update(m,1/60);assert(cam.zoom===normal,'same kick-off replayed the camera move');pass('kick-off camera pulls back slowly from the centre ball')}

// Compact scoreboard and scorer caption.
{const m=game(),r=new E.Renderer({getContext:()=>ctx});r.camera=new E.CameraController();texts.length=0;r.hud(m);
 assert(texts.includes('JUV')&&texts.includes('MIL')&&texts.includes('0 - 0'),'compact scoreboard: '+texts.join('|'));assert(!texts.includes('4-4-2')&&!texts.includes('CPU')&&!texts.includes('RADAR'),'scoreboard still cluttered');
 const shooter=m.teams[0].players.find(p=>p.role!=='GK');m.lastShooter=shooter;m.rules.goal(0);texts.length=0;r.draw(m);
 assert(texts.some(s=>s.includes(shooter.source.name.toUpperCase())),'scorer name missing: '+texts.join('|'));pass('slim scoreboard and scorer name under the GOAL banner')}

// Crowd celebration is a bitmap: drawn with drawImage from the sheet, no per-supporter rectangles.
{const r=new E.Renderer({getContext:()=>ctx}),m=game();let images=0,rects=0;const draws=new Proxy(ctx,{get:(t,k)=>k==='drawImage'?()=>images++:k==='fillRect'?()=>rects++:t[k]});r.ctx=draws;r.panel=()=>{};r.stadiumCelebration={team:0,age:.5};r.crowdCutaway(m);
 assert(images===1&&rects===0,'crowd cutaway drew '+images+' images and '+rects+' rectangles');pass('crowd celebration cutaway is a tinted bitmap')}

// Slow motion: a shot about to reach the goal frame slows the match; a shot going wide does not.
{const m=game();m.phase='PLAY';m.restarts.data=null;const b=m.ball;b.owner=null;b.state='shot';b.x=90;b.y=31;b.z=1;b.vx=40;b.vy=0;b.vz=0;m.lastShot={time:1};let s=1;for(let i=0;i<10;i++)s=S9ArcadeSlowmo.scale(m,1/60);
 assert(s<.5,'no slow motion on a shot at goal: '+s);const w=game();w.phase='PLAY';w.restarts.data=null;Object.assign(w.ball,{owner:null,state:'shot',x:90,y:5,z:1,vx:40,vy:0,vz:0});w.lastShot={time:2};let k=1;for(let i=0;i<10;i++)k=S9ArcadeSlowmo.scale(w,1/60);assert(k>.95,'slow motion on a shot going wide');
 pass('slow motion when a shot is about to reach the goal frame, not for shots going wide')}

// Coin toss: 1P calls, the coin is flipped, the winner picks the end, the other side kicks off.
{const m=game(),i=m.humans[0].input,toss=S9ArcadeCoinToss.create(m,{});assert(toss&&!toss.done,'no ceremony');i.pressed.add('arrowright');toss.update(1/60,[i]);i.pressed.add('c');toss.update(1/60,[i]);
 for(let t=0;t<200;t++)toss.update(1/60,[i]);i.pressed.add('arrowleft');toss.update(1/60,[i]);for(let t=0;t<60;t++)toss.update(1/60,[i]);i.pressed.add('c');for(let t=0;t<200&&!toss.done;t++)toss.update(1/60,[i]);
 assert(toss.done,'ceremony never ends');const kick=m.restarts.data;assert(kick?.type==='KICKOFF','no kick-off after the toss');assert(typeof m.mirror==='boolean','end not chosen');
 assert(!S9ArcadeCoinToss.create(game(),{demo:{}})&&!S9ArcadeCoinToss.create(game(),{training:'penalty'}),'ceremony in demo/training');pass('coin toss: call, flip, choice of end, kick-off to the other side ('+(kick.team?'CPU':'1P')+')')}

// Defending: holding the pass button shadows the carrier goal-side; tapping pokes.
{const m=game();m.phase='PLAY';m.restarts.data=null;const h=m.humans[0],cpu=m.teams[1].players.find(p=>p.role==='CM'),me=h.selected;cpu.x=40;cpu.y=31;m.control(cpu);cpu.aiWait=9;h.selected=me;me.x=46;me.y=36;
 h.input.press('c');for(let k=0;k<90;k++){m.as(h,()=>m.humanStep(1/120));me.tick(1/120)}const own=m.teams[0].dir>0?0:100,goalSide=(me.x-cpu.x)*(own-cpu.x)>0;
 assert(goalSide&&Math.hypot(me.x-cpu.x,me.y-cpu.y)<2.6,'not shadowing goal-side: '+me.x.toFixed(1)+','+me.y.toFixed(1));h.input.release('c');pass('holding the pass button in defence shadows the carrier goal-side')}

// The CPU's active player is labelled.
{const m=game();m.phase='PLAY';m.restarts.data=null;m.control(m.teams[1].players[5]);const r=new E.Renderer({getContext:()=>ctx});r.camera=new E.CameraController();texts.length=0;r.cpuMarker(m);assert(texts.includes('CPU'),'no CPU label');pass('CPU label on the player the CPU is driving')}
