/* Match presentation: compact scoreboard, kick-off camera, bitmap crowd celebration, scorer caption. Presentation only. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,R=E.Renderer.prototype,CAM=E.CameraController.prototype;
const CROWD='arcade/assets/crowd-celebration.png?v=crowd-1',CROWD_W=420,CROWD_H=120,CROWD_FRAMES=4;
const effects=()=>window.S9ArcadeEvolution?.settings.effects??1;
R.bitmap?.(CROWD);

// ---------------------------------------------------------------- kick-off camera
// Every kick-off opens close on the ball at the centre spot and pulls back slowly to the playing view.
const KICKOFF_CAMERA=3.2,update=CAM.update,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
CAM.update=function(m,dt){update.call(this,m,dt);const d=m.restarts?.data;
 if(m.phase==='RESTART'&&d?.type==='KICKOFF'&&d!==this.kickoffSeen&&!m.training){this.kickoffSeen=d;this.kickoff={age:0};if(!m.rules?.period||m.rules.period!=='PENALTIES')d.delay=Math.max(d.delay||0,KICKOFF_CAMERA-.5)}
 const k=this.kickoff;if(!k)return;k.age+=Math.min(dt,.1);const t=Math.min(1,k.age/KICKOFF_CAMERA);if(t>=1){this.kickoff=null;return}
 const e=ease(t),b=m.ball,zoom=this.zoom;this.x=b.x+(this.x-b.x)*e;this.y=b.y+.6*(1-e)+(this.y-b.y)*e;this.zoom=Math.min(140,zoom*(3.4-2.4*e))};

// ---------------------------------------------------------------- compact scoreboard
// Two compact corner scoreboards and a central clock.
const code=t=>{const name=(t?.name||'---').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z ]/g,'');const words=name.split(/\s+/).filter(w=>w.length>2);return (words.length>1&&words[0].length<=4?words[0][0]+words[1].slice(0,2):(words[0]||name)).slice(0,3)};
R.teamCode=code;
R.hud=function(m){this.chargeMeter?.(m);const c=this.ctx,pen=m.phase==='PENALTIES',golden=m.rules.period==='GOLDEN',score=pen&&!m.pen?.single?m.pen.goals:m.rules.score;
 for(const side of [0,1]){const x=side?1100:16,t=m.teams[side];this.panel(x,12,164,46,8);this.teamCrest(t,side?x+119:x+8,18,30,32);this.text(code(t),side?x+86:x+75,41,19,'#fff');this.text(String(score[side]).padStart(2,'0'),side?x+33:x+129,45,30,'#ffe62f')}
 const sec=Math.max(0,Math.ceil(golden?m.rules.goldenRemaining:m.rules.remaining));this.panel(564,12,152,46,8);this.text(pen?'RIGORI':(golden?'GG ':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),640,43,pen?20:27,golden?'#ffb52b':'#ffe62f');
 if(!pen&&!this.replayMode)this.radar(m);
 if(m.messageTime>0&&/CORNER|FALLO|FOUL|FUORI|PALO|TRAVERSA|CARTELLINO|FINISHED|INTERVALLO/.test(m.message)&&!m.cardScene&&!m.preMatch){this.panel(420,72,440,35,8);this.text(m.message,640,96,17,'#fff06b')}
 if(!this.replayMode)this.chargeMeter?.(m);
};
// Radar, when switched on: small and low in the corner, away from the play.
R.radar=function(m){if(m.phase==='PENALTIES'||this.replayMode||window.S9ArcadeEvolution&&!S9ArcadeEvolution.settings.radar)return;const c=this.ctx,w=150,h=93,x=640-w/2,y=720-h-16;
 c.fillStyle='#03101aa8';c.fillRect(x-4,y-4,w+8,h+8);c.fillStyle='#1268477a';c.fillRect(x,y,w,h);c.strokeStyle='#bfead088';c.lineWidth=1;c.strokeRect(x,y,w,h);c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();
 const at=(px,py)=>({x:x+Math.max(0,Math.min(100,px))*w/100,y:y+Math.max(0,Math.min(62,py))*h/62});
 for(const p of m.players){if(p.sentOff)continue;const a=at(p.x,p.y),human=(m.humans||[]).find(hh=>hh.selected===p);c.fillStyle=human?human.color:p.team.id?'#ff5673':'#35cfff';c.fillRect(a.x-2,a.y-2,human?5:4,human?5:4)}
 const b=at(m.ball.x,m.ball.y);c.fillStyle='#fff';c.fillRect(b.x-2,b.y-2,4,4)};

// ---------------------------------------------------------------- crowd celebration (bitmap)
// The sheet holds the stand plus two grey masks; the masks are tinted with the scoring kit once per kit.
function tinted(r,kit){return null}
R.crowdCutaway=function(m){const event=this.stadiumCelebration;if(!event||event.age>1.6)return;const art=window.S9ArcadeArt;if(!art?.ready(art.image('crowd')))return;const c=this.ctx,w=720,h=420,slide=Math.min(1,event.age/.18),out=Math.max(0,(event.age-1.4)/.2),x=280,y=720-h-22+Math.round((1-slide+out)*(h+40));this.panel(x-8,y-8,w+16,h+16,12);art.crowd(c,event.age,x,y,w,h)};
// ---------------------------------------------------------------- penalties
// Shoot-out and single penalties on the goal backdrop seen from behind the spot (same picture as close free kicks):
// nothing of the match stadium shows around it. Picture geometry: posts x 360/920, bar y 246, goal line y 430, spot (640,554).
const GOAL_BG='arcade/assets/freekick-backdrop.png?v=fk-1';R.bitmap?.(GOAL_BG);
const PEN={left:360,right:920,bar:246,line:430,spotX:640,spotY:554,perY:560/12,perZ:184/5};
R.drawPenalty=function(m){const c=this.ctx,pen=m.pen,team=pen.turn%2,g=m.teams[1-team].players.find(p=>!p.sentOff&&p.role==='GK'),shooter=m.teams[team].players.find(p=>!p.sentOff&&p.role==='ST')||m.teams[team].players.find(p=>!p.sentOff&&p.role!=='GK'),b=m.ball,bg=this.bitmap(GOAL_BG),pad=!!window.S9ArcadeControls?.padConnected;
 c.clearRect(0,0,1280,720);if(bg?.complete&&bg.naturalWidth){const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(bg,0,0,1280,720);c.imageSmoothingEnabled=sm}else{c.fillStyle='#1d7a35';c.fillRect(0,0,1280,720)}
 // Detailed supporters over the backdrop's stand, in the shooting side's colours.
 const sheet=tinted(this,m.teams[team]?.kit);if(window.S9ArcadeArt?.ready(S9ArcadeArt.image('crowd')))S9ArcadeArt.crowd(c,m.elapsed,0,0,1280,218);if(sheet){const h=218,w=h*CROWD_W/CROWD_H,f=Math.floor((m.presentationTime??m.elapsed)*4)%CROWD_FRAMES,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;for(let x=0;x<1280;x+=w)c.drawImage(sheet,0,f*CROWD_H,CROWD_W,CROWD_H,x,4,w,h);c.imageSmoothingEnabled=sm}
 const lift=pen.keeperCommitted?Math.max(0,E.PenaltyTargets.cell(pen.diveCell).z-1.2)*PEN.perZ:0;c.save();c.translate(PEN.spotX+(g.y-31)*PEN.perY,PEN.line+2-lift);this.sprite(g,m,{scale:2.1});c.restore();
 const progress=pen.flight?Math.max(0,Math.min(1,Math.abs(b.x-(team?18:82))/18)):0,bx=PEN.spotX+(b.y-31)*PEN.perY*progress,ground=PEN.spotY-progress*(PEN.spotY-PEN.line),by=ground-b.z*PEN.perZ;
 c.fillStyle='#0005';c.beginPath();c.ellipse(bx,ground+4,10-progress*5,4-progress*2,0,0,7);c.fill();this.drawBall(bx,by,11-progress*5,m);
 if(!pen.flight||pen.age<.4||pen.stage==='result'){c.save();c.translate(PEN.spotX-58,PEN.spotY+70);this.sprite(shooter,m,{scale:2.4});c.restore()}
 this.hud(Object.assign(Object.create(Object.getPrototypeOf(m)),m,{messageTime:0}));
 // Shoot-out record: one strip per side, in the free grass below the box line.
 if(!pen.single)for(const side of [0,1]){const x=side?1010:30;this.panel(x,560,240,64,10);this.text(this.teamCode?.(m.teams[side])||'',x+40,600,18,'#fff');this.text(pen.history[side].map(v=>v?'●':'○').join(' ')||'—',x+150,600,20,'#ffe55b')}
 const shooterHuman=(m.humans||[]).some(h=>h.team===team),keeperHuman=(m.humans||[]).some(h=>h.team===1-team),chosen=shooterHuman?pen.aim:pen.saveCell,a=PEN.left,z=PEN.right,top=PEN.bar,bottom=PEN.line;
 if((shooterHuman||keeperHuman)&&(pen.stage==='ready'||keeperHuman&&pen.stage==='flight'&&!pen.keeperCommitted)){for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=a+col*(z-a)/3,y=top+row*(bottom-top)/3,on=row*3+col===chosen;c.strokeStyle=on?'#fff257':'#87dfff88';c.lineWidth=on?5:2;c.strokeRect(x+3,y+3,(z-a)/3-6,(bottom-top)/3-6);if(on){c.fillStyle='#ffe85122';c.fillRect(x+3,y+3,(z-a)/3-6,(bottom-top)/3-6)}this.text(String(row*3+col+1),x+(z-a)/6,y+(bottom-top)/6+7,20,on?'#fff257':'#9fc2d4')}}
 if(pen.stage==='result'){this.panel(330,96,620,140,18);this.text(pen.outcome.label,640,156,48,pen.outcome.goal?'#ffe743':'#ff8294');this.text((pen.single?'RIGORE':'RIGORE '+(Math.floor(pen.turn/2)+1))+' · '+m.teams[team].name,640,190,20,'#b3eaff');if(pen.age>=.7)this.text('{p:z} CONTINUA',640,222,22,'#fff06a')} // above the bar: the goal stays visible
 else{this.panel(250,84,780,42,10);this.text(shooterHuman?'{arrows} 9 POSIZIONI   {p:z} TIRA':'{arrows} 9 POSIZIONI   {p:x}{p:c} TUFFO DOPO IL TIRO',640,112,19,'#ffe55b')}
};

// ---------------------------------------------------------------- pause
// Same look as OPZIONI: banner, the match at a glance, three large entries with a selection bar, button prompts with icons.
R.pauseScreen=function(m){const c=this.ctx,at=this.pauseIndex||0,golden=m.rules.period==='GOLDEN',sec=Math.max(0,Math.ceil(golden?m.rules.goldenRemaining:m.rules.remaining));
 c.fillStyle='#020612d0';c.fillRect(0,0,1280,720);this.arcadeBanner?this.arcadeBanner('PAUSA','#ffe447',128,1):this.text('PAUSA',640,120,52,'#ffe447');
 this.panel(300,196,680,92,14);this.teamCrest(m.teams[0],326,208,54,68);this.teamCrest(m.teams[1],900,208,54,68);
 this.text(code(m.teams[0]),430,252,26,'#fff');this.text(code(m.teams[1]),850,252,26,'#fff');this.text(m.rules.score[0]+' - '+m.rules.score[1],640,256,40,'#ffe62f');this.text((golden?'GOLDEN GOAL · ':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),640,280,15,'#9fc2d4');
 this.panel(360,310,560,250,18);['RIPRENDI','OPZIONI','ESCI SENZA REGISTRARE'].forEach((label,i)=>{const y=362+i*72;if(i===at){c.fillStyle='#ffe44726';c.fillRect(384,y-34,512,58);c.fillStyle='#ffe447';c.fillRect(384,y-34,8,58)}this.text(label,640,y+6,i===at?30:24,i===at?'#fff':i===2?'#ff8fa3':'#c9dbe6')});
 this.text('{arrows} SCEGLI    {m:confirm} CONFERMA    {m:back} RIPRENDI',640,612,18,'#ffe55b')};

// ---------------------------------------------------------------- scorer caption
// Under the GOAL! banner: shirt number and (fictional) name of the scorer, or own goal.
R.scorerCaption=function(m){const s=m.scorers?.[m.scorers.length-1];if(!s||!/^GOAL!|^GOLDEN GOAL!$/.test(m.message||'')||m.messageTime<=0)return;
 const p=s.playerId?m.players.find(q=>q.source?.id===s.playerId):null,label=p?(p.number?p.number+'  ':'')+(p.source?.name||s.name||'').toUpperCase():s.name?'AUTOGOL':'';if(!label)return;
 const team=m.teams[s.team],tw=Math.min(700,label.length*17+120);this.panel(640-tw/2,290,tw,52,10);this.teamCrest(team,640-tw/2+14,296,34,40);this.text(label,640+14,325,24,'#fff')};
// ---------------------------------------------------------------- CPU marker
// The player the CPU is driving right now (its ball carrier, else its player closest to the ball) is labelled, like 1P.
R.cpuMarker=function(m){const b=m.ball;for(const t of m.teams||[]){if((m.humans||[]).some(h=>h.team===t.id))continue;const own=b.owner?.team===t?b.owner:null,p=own||t.players.filter(q=>!q.sentOff&&q.role!=='GK').sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(!p)continue;
 const pr=this.project(p.x,p.y),c=this.ctx;c.strokeStyle='#ff6b7d';c.lineWidth=2;c.beginPath();c.ellipse(pr.x,pr.y+6,13*pr.scale,4.6*pr.scale,0,0,7);c.stroke();this.text('CPU',pr.x,pr.y-75*pr.scale,18,'#ff8fa3')}};

// ---------------------------------------------------------------- slow motion
// A shot that will reach the goal frame within ~0.4 s slows the match down (goal or save), like the cabinet replays live.
const SLOW=.3,WINDOW=.42,MAXREAL=1.6;
function slowScale(m,dt){const b=m.ball,s=m.slowmo=m.slowmo||{amount:0,real:0,shot:null};let want=0;
 if(m.phase==='PLAY'&&!b.owner&&b.state==='shot'&&Math.abs(b.vx)>8){const line=b.vx>0?100:0,t=(line-b.x)/b.vx;if(t>0&&t<WINDOW){const y=b.y+b.vy*t,z=b.z+b.vz*t-12*t*t,key=m.lastShot?.time;
  if(y>23.5&&y<38.5&&z<6){if(s.shot!==key){s.shot=key;s.real=0}if(s.real<MAXREAL)want=1}}}
 s.real+=dt;s.amount+=(want-s.amount)*Math.min(1,dt*(want?14:5));return 1-(1-SLOW)*s.amount}
window.S9ArcadeSlowmo={scale:slowScale};
const draw=R.draw;
R.draw=function(m){draw.call(this,m);if(!this.replayMode&&!m.cardScene&&(m.phase==='PLAY'||m.phase==='RESTART'))this.cpuMarker(m);if(!this.replayMode&&!m.cardScene&&m.phase!=='FINISHED'&&m.phase!=='PENALTIES'&&m.phase!=='FREEKICK')this.scorerCaption(m);if(m.demo)this.demoOverlay(m);
 // Slow-motion look: cinema bars and a soft vignette while it lasts.
 const a=m.slowmo?.amount||0;if(a>.02&&!this.replayMode){const c=this.ctx;c.fillStyle='rgba(0,0,0,'+(.85*a)+')';c.fillRect(0,0,1280,46*a);c.fillRect(0,720-46*a,1280,46*a);const g=c.createRadialGradient(640,360,260,640,360,760);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.35*a)+')');c.fillStyle=g;c.fillRect(0,0,1280,720)}};
// Attract mode: DEMO tag, blinking start prompt and the button the bot is using right now.
R.demoOverlay=function(m){const t=performance?.now?.()/1000||0,cap=m.demo.caption;this.panel(1000,66,262,46,10);this.text('DEMO',1060,97,22,'#ff8fa3');if(Math.floor(t*2)%2===0)this.text('PREMI START',1192,96,15,'#fff');
 if(cap){const w=Math.min(820,cap.text.length*15+260),x=640-w/2,y=590;this.panel(x,y,w,58,12);this.text(cap.keys+'  '+cap.text,640,y+37,20,'#fff')}};
})();
