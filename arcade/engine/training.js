/* Training: endless set-piece drills (direct / indirect free kicks, corners, penalties) with a goals / attempts counter. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,R=E.Renderer.prototype;
const DRILLS={direct:'PUNIZIONE DIRETTA',indirect:'PUNIZIONE INDIRETTA',corner:'CALCIO D’ANGOLO',penalty:'RIGORI'};
function setup(m,drill){m.training={drill:DRILLS[drill]?drill:'direct',attempts:0,goals:0,wait:1,active:false,stage:null,timer:0,lastScore:0};m.rules.update=function(){};m.rules.allowDraw=true;m.say('ALLENAMENTO · '+DRILLS[m.training.drill],1.5)}
// Each attempt starts from a clean layout; positions rotate so every kick is a little different.
function next(m){const t=m.training,k=++t.attempts;t.active=true;t.stage='setup';t.timer=0;t.lastScore=m.rules.score[0];m.fk=null;m.pen=null;m.cardScene=null;m.players.forEach(p=>p.reset());m.ball.reset();m.restarts.data=null;m.phase='RESTART';
 if(t.drill==='direct')m.beginFreeKick(0,70+(k*7)%12,21+(k*11)%20);
 else if(t.drill==='indirect')m.restarts.award('FREE KICK',0,62+(k*5)%10,k%2?8:54);
 else if(t.drill==='corner')m.restarts.award('CORNER',0,99.5,k%2?.5:61.5);
 else m.beginSpotKick(0);
 t.data=m.restarts.data}
function end(m,goal){const t=m.training;t.active=false;t.wait=goal?1.8:1.1;if(goal)t.goals++;m.say((goal?'GOAL! ':'')+t.goals+' / '+t.attempts,1.4)}
M.trainingTick=function(dt){const t=this.training;if(!t||this.cardScene)return;if(!t.active){t.wait-=dt;if(t.wait<=0)next(this);return}
 if(this.rules.score[0]>t.lastScore)return end(this,true);
 const waiting=this.phase==='FREEKICK'||this.phase==='PENALTIES'||this.phase==='RESTART'&&this.restarts.data===t.data;
 if(waiting){t.timer=0;return}
 if(this.phase==='PLAY'){t.stage='live';t.timer+=dt;const o=this.ball.owner;if(o&&o.team.id===1||t.timer>6)end(this,false);return}
 if(t.stage==='live'||this.phase==='RESTART')end(this,false)};
const update=M.update;
M.update=function(dt){const r=update.call(this,dt);this.trainingTick(dt);return r};
const draw=R.draw;
R.draw=function(m){draw.call(this,m);const t=m.training;if(!t||this.replayMode)return;this.panel(470,620,340,52,12);this.text(DRILLS[t.drill]+' · GOL '+t.goals+' / '+t.attempts,640,652,18,'#ffe55a')};
window.S9ArcadeTraining={DRILLS,setup};
})();
