/* Focused gameplay additions: discipline events and their short presentation pause. */
(function(){
'use strict';
const E=window.S9ArcadeEngine;
class CardManager {
 static issue(m,p,violent=false){
  if(!p||p.sentOff)return null;
  const second=(p.yellowCards||0)>0,red=violent||second;
  p.yellowCards=(p.yellowCards||0)+(violent?0:1);
  const event={card:red?'RED':'YELLOW',secondYellow:second&&!violent,player:p,playerId:p.source?.id,name:p.source?.name||('PLAYER '+p.number),team:p.team.name,number:p.number,time:m.elapsed};
  m.discipline=m.discipline||[];m.discipline.push(event);
  const stats=m.stats.teams[p.team.id];stats.yellowCards=(stats.yellowCards||0)+(violent?0:1);stats.redCards=(stats.redCards||0)+(red?1:0);
  if(red){
   p.sentOff=true;m.players=m.players.filter(q=>q!==p);
   if(p.role==='GK'){
    const replacement=p.team.players.filter(q=>!q.sentOff).sort((a,b)=>(b.attributes?.goalkeeping||0)-(a.attributes?.goalkeeping||0))[0];
    if(replacement){replacement.role='GK';replacement.home={...p.home};replacement.update=E.Goalkeeper.prototype.update;replacement.x=p.home.x;replacement.y=p.home.y}
   }
   for(const h of m.humans||[])if(h.selected===p)h.selected=null;m.assignIdle?.();
  }
  for(const h of m.humans||[{input:m.input}])h.input.cancelShot();m.cardScene={...event,age:0,duration:2.4};return event;
 }
}
E.CardManager=CardManager;
const reset=E.Match.prototype.reset;
E.Match.prototype.reset=function(){for(const h of this.humans||[])h.input.cancelShot();reset.call(this);this.discipline=[];this.cardScene=null;this.lastShot=null};
const update=E.Match.prototype.update;
E.Match.prototype.update=function(dt){if(this.cardScene){this.cardScene.age+=dt;this.elapsed+=dt;for(const h of this.humans)h.input.cancelShot();if(this.cardScene.age>=this.cardScene.duration)this.cardScene=null;return}update.call(this,dt)};
})();
