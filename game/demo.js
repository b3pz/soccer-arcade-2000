/* Attract-mode demo match: a bot plays 1P with the real controls and captions show which button does what. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ARROWS=['arrowup','arrowdown','arrowleft','arrowright'];
function create(){let clock=0,charge=0,volley=0,last={},caption=null;
 const cool=(key,t)=>{if((last[key]??-99)+t>clock)return false;last[key]=clock;return true};
 const say=(keys,text)=>{if(!caption||caption.text!==text&&clock-caption.at>1.4)caption={keys,text,at:clock}};
 function steer(i,from,to){for(const k of ARROWS)i.down.delete(k);const dx=to.x-from.x,dy=to.y-from.y;if(dx>.5)i.down.add('arrowright');if(dx<-.5)i.down.add('arrowleft');if(dy>.5)i.down.add('arrowdown');if(dy<-.5)i.down.add('arrowup')}
 function step(m,dt){if(!clock)m.rules.remaining=Math.min(m.rules.remaining,75);clock+=dt;const h=m.humans[0];if(!h)return;const i=h.input,s=h.selected,b=m.ball,team=m.teams[h.team],dir=team.dir,W=window.S9ArcadeWingPlay,depth=p=>dir>0?p.x:100-p.x;
  if(m.phase==='FREEKICK'&&m.fk){const fk=m.fk;for(const k of ARROWS)i.down.delete(k);if(m.fkHumans().shooter===h){if(fk.stage==='ready'&&!fk.button&&fk.age>1.1){i.press('z');say('{p:z}','PUNIZIONE · FERMA LA MIRA')}else if(fk.button){if(fk.power>.62)i.release('z');else say('{p:z}','TIENI PER LA POTENZA · ←/→ EFFETTO')}}if(fk.stage==='result'&&fk.age>1.4&&cool('fk',.5))i.pressed.add('z');return}
  if(m.phase==='PENALTIES'){if(cool('pen',1.2)){i.pressed.add('z');say('{p:z}','RIGORE · MIRA E TIRA')}return}
  const rd=m.restarts?.data;
  if(m.phase==='RESTART'&&rd){for(const k of ARROWS)i.down.delete(k);if(rd.taker!==s||rd.delay>0)return;
   if(rd.type==='KICKOFF'){if(cool('ko',.8)){i.pressed.add('c');say('{p:c}','CALCIO D’INIZIO')}return}
   if(rd.aim){if(!rd.aim.button){if(cool('aim',.6)){i.press(rd.type==='CORNER'?'x':'c');say(rd.type==='CORNER'?'{p:x}':'{p:c}',rd.type==='CORNER'?'CALCIO D’ANGOLO · CROSS IN AREA':'RIMESSA · FERMA LA FRECCIA')}}else if(rd.aim.power>.4)i.release(rd.aim.button)}
   else if(cool('restart',.8))i.pressed.add('c');return}
  if(m.phase!=='PLAY'||!s){for(const k of ARROWS)i.down.delete(k);return}
  // Shot being charged: hold Z, release when the bar is full enough.
  if(charge>0){charge-=dt;if(b.owner!==s||charge<=0){i.release('z');charge=0}return}
  // A cross from our side is dropping into the box: hold Z to strike it first time.
  const crossing=!b.owner&&b.state==='aerial'&&b.lastTeam===h.team&&b.passTarget&&W?.inBox(team,b.passTarget);
  if(crossing){if(!i.shotCharging&&!volley){i.press('z');volley=1.2;say('{p:z}','TIENILO SUL CROSS · TIRO AL VOLO')}const spot=b.passTarget===s?s.receiverIntent||b:b;steer(i,s,spot);return}
  if(volley){volley-=dt;if(volley<=0||b.owner){if(i.shotCharging)i.release('z');i.down.delete('z');volley=0}}
  if(b.owner===s){
   if(W?.onWing(team,s)&&depth(s)>82&&cool('cross',1.5)){i.pressed.add('x');say('{p:x}','DAL FONDO · CROSS')}
   else if(depth(s)>78&&Math.abs(s.y-31)<13&&cool('shot',m.rules.score[h.team]-m.rules.score[1-h.team]>=2?5:1.6)){i.press('z');charge=.5;say('{p:z}','TIENI · TIRO CARICATO')}
   else if(m.players.some(o=>o.team!==team&&!o.sentOff&&dist(o,s)<3)&&!s.specialCooldown&&cool('dribble',2.5)){i.pressed.add('v');say('{p:v}','DRIBBLING')}
   else if(depth(s)<60&&cool('pass',1.8)){i.pressed.add('c');say('{p:c}','PASSAGGIO')}
   const wide=Math.abs(s.y-31)>13;steer(i,s,wide?{x:s.x+dir*10,y:s.y<31?5:57}:{x:s.x+dir*10,y:s.y+clamp(31-s.y,-4,4)});return}
  if(b.owner&&b.owner.team===team){steer(i,s,{x:b.owner.x+dir*9,y:clamp(s.home?.y??31,8,54)});if(cool('move',6))say('{arrows}','MUOVI IL GIOCATORE');return}
  // Defending like a person: cover goal-side and only now and then go to ground, so the demo stays a match.
  if(b.owner&&dist(s,b.owner)<2.4&&cool('tackle',4.5)){i.pressed.add('c');say('{p:c}{p:x}','IN DIFESA · SCIVOLATA');return}
  steer(i,s,b.owner?{x:b.owner.x-dir*4,y:b.owner.y+(31-b.owner.y)*.3}:{x:b.x+b.vx*.1,y:b.y+b.vy*.1})}
 // Any pad button leaves the demo, like any key.
 function exit(){try{return [...(navigator.getGamepads?.()||[])].some(p=>p&&p.buttons.some(x=>x.pressed))}catch(e){return false}}
 return {step,exit,get caption(){return caption&&clock-caption.at<2.6?caption:null}}}
// Two different clubs for every demo.
function teams(){const pool=(window.S9ArcadeRoster?.pool('club')||window.SA2000_CATALOG?.club||[]).filter(t=>t.players?.length>=11),a=pool[Math.floor(Math.random()*pool.length)];let b=a;while(pool.length>1&&b===a)b=pool[Math.floor(Math.random()*pool.length)];return [a,b]}
function play(){const [home,away]=teams();if(!home||!window.launchArcadeMatch)return Promise.resolve({demo:'end'});
 return window.launchArcadeMatch({home,away,cleanNames:true,allowDraw:true,difficulty:'difficile',players:[{team:0,device:'remote'}],demo:create()})}
window.S9ArcadeDemo={create,play};
})();
