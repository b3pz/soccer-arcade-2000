/* Match weather: SERENO (day), NOTTE (floodlights), PIOGGIA (rain, wet pitch: the ball skids further on the grass).
   Chosen per match from OPZIONI → METEO (CASUALE picks one). Presentation plus one physics change (ground friction in rain). */
(function(){
'use strict';
const E=window.S9ArcadeEngine,R=E.Renderer.prototype,B=E.Ball.prototype;
const KINDS=['day','night','rain'],LABEL={day:'SERENO',night:'NOTTE',rain:'PIOGGIA'};
const setting=()=>window.S9ArcadeEvolution?.settings.weather||'auto';
function pick(config={}){const w=config.weather||setting();if(KINDS.includes(w))return w;return Math.random()<.45?'day':Math.random()<.55?'night':'rain'}
let current=null;
// Wet grass: rolling friction 0.6 -> 0.42 per second (the ball runs on), airborne flight unchanged.
const ballUpdate=B.update;
B.update=function(dt){const r=ballUpdate.apply(this,arguments);if(current==='rain'&&!this.owner&&this.z<=.1){const k=Math.exp(.18*dt);this.vx*=k;this.vy*=k}return r};
// Every launched match gets its weather (not penalties-only scenes or training, which stay clear).
const launch=window.launchArcadeMatch;
if(launch){window.launchArcadeMatch=function(config={}){const w=config.training?'day':pick(config);current=w;const p=launch.call(this,config);const a=window.S9ArcadeActive;if(a?.match){a.match.weather=w;if(w!=='day')a.match.say?.(w==='rain'?'PIOGGIA · IL PALLONE SCIVOLA':'NOTTURNA SOTTO I RIFLETTORI',2.5)}const done=()=>{if(current===w)current=null};p.then(done,done);return p};
 if(window.ArcadeMatchBridge)window.ArcadeMatchBridge.launchArcadeMatch=window.launchArcadeMatch}
// Rain drops: fixed pool, screen space.
const drops=Array.from({length:180},(_,i)=>({x:(i*397)%1280,y:(i*211)%720,l:10+(i%7)*3,s:900+(i%5)*120}));
const pitch=R.pitch;
R.pitch=function(...args){const r=pitch.apply(this,args),w=this.currentMatch?.weather,c=this.ctx;if(!w||w==='day')return r;
 c.save();if(w==='night'){c.globalCompositeOperation='multiply';c.fillStyle='#34406e';c.fillRect(0,0,1280,720);c.globalCompositeOperation='lighter';
  for(const [x,y] of [[0,0],[1280,0],[0,720],[1280,720]]){const g=c.createRadialGradient(x,y,40,x,y,760);g.addColorStop(0,'rgba(255,250,215,.16)');g.addColorStop(.6,'rgba(255,250,215,.04)');g.addColorStop(1,'rgba(255,250,215,0)');c.fillStyle=g;c.fillRect(0,0,1280,720)}}
 else{c.fillStyle='rgba(40,60,90,.28)';c.fillRect(0,0,1280,720);c.globalCompositeOperation='lighter';c.fillStyle='rgba(180,210,255,.05)';for(let i=0;i<24;i++){const x=(i*173)%1280,y=(i*97)%720;c.beginPath();c.ellipse(x,y,60+(i%4)*20,10+(i%3)*4,0,0,7);c.fill()}}
 c.restore();return r};
const draw=R.draw;
R.draw=function(m){const r=draw.call(this,m);if(m?.weather!=='rain'||m.phase==='PENALTIES'||m.phase==='FREEKICK')return r;const c=this.ctx,t=(this.animationTime??m.presentationTime??m.elapsed??0);
 c.save();c.strokeStyle='rgba(200,220,255,.45)';c.lineWidth=1.5;c.beginPath();for(const d of drops){const y=(d.y+t*d.s)%760-20,x=(d.x-t*d.s*.18)%1300;const xx=x<0?x+1300:x;c.moveTo(xx,y);c.lineTo(xx-d.l*.18,y+d.l)}c.stroke();
 c.fillStyle='rgba(220,235,255,.35)';for(let i=0;i<14;i++){const k=(t*3+i*.37)%1,x=(i*271)%1280,y=180+(i*131)%520;if(k<.25){c.beginPath();c.ellipse(x,y,6+k*30,2+k*8,0,0,7);c.fill()}}c.restore();return r};
window.S9ArcadeWeather={pick,KINDS,LABEL,get current(){return current},set current(v){current=v}};
})();
