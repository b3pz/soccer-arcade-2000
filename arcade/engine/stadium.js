/* Stadium sound belongs to the match; never starts menu music. */
(function(){
 function create(){let active=false,ambient=null,roar=null,score=[0,0],pen=[0,0],saves=0,phase=null,reaction=null;
  const play=el=>{if(!active||!el)return;try{const p=el.play();p?.catch?.(()=>{})}catch(e){}};
  const retry=()=>{if(active&&ambient?.paused)play(ambient)};
  function start(){if(active)return;active=true;try{ambient=new Audio('assets/audio/stadium-ambience.mp3');ambient.loop=true;ambient.volume=.13;ambient.preload='auto';roar=new Audio('assets/audio/goal-boato.mp3');roar.volume=.52;roar.preload='auto';roar.addEventListener('loadedmetadata',()=>{if(active&&reaction&&reaction.age<1&&roar.paused){roar.currentTime=5.1;play(roar)}});play(ambient);if(typeof addEventListener==='function'){addEventListener('keydown',retry);addEventListener('pointerdown',retry)}}catch(e){}}
  function goal(team){reaction={team,age:0};if(roar){try{roar.pause();roar.currentTime=5.1;play(roar)}catch(e){}}}
  function observe(m){if(!active)return;for(let team=0;team<2;team++){if(m.rules.score[team]>score[team])goal(team);score[team]=m.rules.score[team];const n=m.pen?.goals?.[team]||0;if(n>pen[team])goal(team);pen[team]=n}const n=m.stats?.teams?.reduce((sum,t)=>sum+(t.saves||0),0)||0;if(n>saves)window.S9SFX?.saveSound?.();saves=n;if(phase!==m.phase&&m.phase==='FINISHED')window.S9SFX?.fullTimeWhistle?.();phase=m.phase}
  function tick(dt){if(reaction){reaction.age+=dt;if(reaction.age>3.2)reaction=null}if(roar&&!roar.paused&&roar.currentTime>=10.1)roar.pause();return reaction}
  function stop(){active=false;for(const el of [ambient,roar]){try{el?.pause()}catch(e){}}if(typeof removeEventListener==='function'){removeEventListener('keydown',retry);removeEventListener('pointerdown',retry)}reaction=null;ambient=roar=null}
  return {start,stop,observe,tick,get reaction(){return reaction}};
 }
 window.S9ArcadeStadium={create};
})();
