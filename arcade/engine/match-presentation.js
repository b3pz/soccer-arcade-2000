/* Match presentation: compact scoreboard, kick-off camera, bitmap crowd celebration, scorer caption. Presentation only. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,R=E.Renderer.prototype,CAM=E.CameraController.prototype;
const CROWD='arcade/assets/crowd-celebration.png?v=crowd-1',CROWD_W=420,CROWD_H=120,CROWD_FRAMES=4;
const effects=()=>window.S9ArcadeEvolution?.settings.effects??1;
R.bitmap?.(CROWD);

// ---------------------------------------------------------------- kick-off camera
// Every kick-off opens close on the ball at the centre spot and pulls back slowly to the playing view.
const KICKOFF_CAMERA=2.6,update=CAM.update,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
CAM.update=function(m,dt){update.call(this,m,dt);const d=m.restarts?.data;
 if(m.phase==='RESTART'&&d?.type==='KICKOFF'&&d!==this.kickoffSeen){this.kickoffSeen=d;this.kickoff={age:0};if(!m.rules?.period||m.rules.period!=='PENALTIES')d.delay=Math.max(d.delay||0,KICKOFF_CAMERA-.5)}
 const k=this.kickoff;if(!k)return;k.age+=Math.min(dt,.1);const t=Math.min(1,k.age/KICKOFF_CAMERA);if(t>=1){this.kickoff=null;return}
 const e=ease(t),b=m.ball,zoom=this.zoom;this.x=b.x+(this.x-b.x)*e;this.y=b.y+.6*(1-e)+(this.y-b.y)*e;this.zoom=zoom*(3.4-2.4*e)};

// ---------------------------------------------------------------- compact scoreboard
// One slim strip, top left: crest, three-letter code, score, clock. Cards as small pips under the code.
const code=t=>{const name=(t?.name||'---').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z ]/g,'');const words=name.split(/\s+/).filter(w=>w.length>2);return (words.length>1&&words[0].length<=4?words[0][0]+words[1].slice(0,2):(words[0]||name)).slice(0,3)};
R.teamCode=code;
R.hud=function(m){const c=this.ctx,pen=m.phase==='PENALTIES',golden=m.rules.period==='GOLDEN',score=pen&&!m.pen?.single?m.pen.goals:m.rules.score,x=18,y=14,w=pen||this.replayMode?318:404,h=50;
 this.panel(x,y,w,h,10);
 for(const team of [0,1]){const t=m.teams[team],tx=team?x+196:x+14,color=team?'#ff8fa3':'#7fdcff';
  this.teamCrest(t,team?tx+60:tx,y+9,30,32);this.text(code(t),team?tx+34:tx+66,y+33,20,'#fff');c.fillStyle=t.kit?.shirtPrimary||color;c.fillRect(team?tx+20:tx+50,y+40,30,3);
  const warned=t.players.filter(p=>(p.yellowCards||0)>0&&!p.sentOff).length,off=t.players.filter(p=>p.sentOff).length;for(let i=0;i<Math.min(4,warned+off);i++){c.fillStyle=i<off?'#fa4151':'#ffe340';c.fillRect((team?tx+20:tx+50)+i*7,y+5,5,7)}}
 c.fillStyle='#050b1fcc';c.fillRect(x+120,y+8,78,34);this.text(score[0]+' - '+score[1],x+159,y+35,26,'#ffe62f');
 if(pen)this.text('RIGORI',x+w-6,y+h+16,13,'#ff8fa3','right');
 else if(!this.replayMode){const sec=Math.max(0,Math.ceil(golden?m.rules.goldenRemaining:m.rules.remaining));c.fillStyle='#050b1fcc';c.fillRect(x+w-88,y+8,76,34);this.text((golden?'GG ':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),x+w-50,y+34,golden?18:22,golden?'#ffb52b':'#fff')}
 if(!pen&&!this.replayMode)this.radar(m);
 if(m.messageTime>0){if(this.eventMessage!==m.message){this.eventMessage=m.message;this.eventStart=m.elapsed}const age=m.elapsed-this.eventStart,big=/GOAL|VINCE|FINISHED/i.test(m.message);
  // GOAL gets its own banner; everything else is a short strip under the scoreboard area, out of the way.
  if(!/^GOAL!|^GOLDEN GOAL!$|CALCIO D’INIZIO/.test(m.message)){c.save();c.translate(Math.max(0,3-Math.floor(age*30))*14,0);const tw=Math.min(620,Math.max(260,m.message.length*15+60));this.panel(640-tw/2,96,tw,big?56:42,10);this.text(m.message,640,big?133:124,big?26:19,'#fff06b');c.restore()}}
 if(!this.replayMode)this.chargeMeter?.(m);
 const fx=effects();if(fx>0)for(let yy=0;yy<720;yy+=4){c.fillStyle='rgba(0,0,0,'+(.04*fx)+')';c.fillRect(0,yy,1280,1)}
};
// Radar, when switched on: small and low in the corner, away from the play.
R.radar=function(m){if(m.phase==='PENALTIES'||this.replayMode||window.S9ArcadeEvolution&&!S9ArcadeEvolution.settings.radar)return;const c=this.ctx,w=150,h=93,x=1280-w-22,y=720-h-22;
 c.fillStyle='#03101aa8';c.fillRect(x-4,y-4,w+8,h+8);c.fillStyle='#1268477a';c.fillRect(x,y,w,h);c.strokeStyle='#bfead088';c.lineWidth=1;c.strokeRect(x,y,w,h);c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();
 const at=(px,py)=>({x:x+Math.max(0,Math.min(100,px))*w/100,y:y+Math.max(0,Math.min(62,py))*h/62});
 for(const p of m.players){if(p.sentOff)continue;const a=at(p.x,p.y),human=(m.humans||[]).find(hh=>hh.selected===p);c.fillStyle=human?human.color:p.team.id?'#ff5673':'#35cfff';c.fillRect(a.x-2,a.y-2,human?5:4,human?5:4)}
 const b=at(m.ball.x,m.ball.y);c.fillStyle='#fff';c.fillRect(b.x-2,b.y-2,4,4)};

// ---------------------------------------------------------------- crowd celebration (bitmap)
// The sheet holds the stand plus two grey masks; the masks are tinted with the scoring kit once per kit.
function tinted(r,kit){const im=r.bitmap(CROWD);if(!im||!im.complete||!im.naturalWidth||typeof document==='undefined')return null;
 const key=(kit?.shirtPrimary||'#2f7de8')+'|'+(kit?.shirtSecondary||'#ffffff');r.crowdSheets=r.crowdSheets||new Map();if(r.crowdSheets.has(key))return r.crowdSheets.get(key);
 const out=document.createElement('canvas');out.width=CROWD_W;out.height=CROWD_H*CROWD_FRAMES;const o=out.getContext('2d');if(!o)return null;o.imageSmoothingEnabled=false;o.drawImage(im,0,0,CROWD_W,out.height,0,0,CROWD_W,out.height);
 const layer=document.createElement('canvas');layer.width=CROWD_W;layer.height=out.height;const l=layer.getContext('2d');
 [kit?.shirtPrimary||'#2f7de8',kit?.shirtSecondary||'#ffffff'].forEach((color,i)=>{l.globalCompositeOperation='source-over';l.clearRect(0,0,CROWD_W,out.height);l.drawImage(im,CROWD_W*(i+1),0,CROWD_W,out.height,0,0,CROWD_W,out.height);l.globalCompositeOperation='multiply';l.fillStyle=color;l.fillRect(0,0,CROWD_W,out.height);l.globalCompositeOperation='destination-in';l.drawImage(im,CROWD_W*(i+1),0,CROWD_W,out.height,0,0,CROWD_W,out.height);o.drawImage(layer,0,0)});
 l.globalCompositeOperation='source-over';r.crowdSheets.set(key,out);return out}
R.crowdCutaway=function(m){const event=this.stadiumCelebration;if(!event||event.age>1.6)return;const sheet=tinted(this,m.teams?.[event.team]?.kit);if(!sheet)return;const c=this.ctx;
 const w=CROWD_W*2,h=CROWD_H*2,slide=Math.min(1,event.age/.18),out=Math.max(0,(event.age-1.4)/.2),x=640-w/2,y=720-h-26+Math.round((1-slide+out)*(h+40)),frame=Math.floor(event.age*9)%CROWD_FRAMES;
 this.panel(x-10,y-10,w+20,h+20,12);const smooth=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(sheet,0,frame*CROWD_H,CROWD_W,CROWD_H,x,y,w,h);c.imageSmoothingEnabled=smooth};

// ---------------------------------------------------------------- penalties
// Shoot-out and single penalties on the goal backdrop seen from behind the spot (same picture as close free kicks):
// nothing of the match stadium shows around it. Picture geometry: posts x 360/920, bar y 246, goal line y 430, spot (640,554).
const GOAL_BG='arcade/assets/freekick-backdrop.png?v=fk-1';R.bitmap?.(GOAL_BG);
const PEN={left:360,right:920,bar:246,line:430,spotX:640,spotY:554,perY:560/12,perZ:184/5};
R.drawPenalty=function(m){const c=this.ctx,pen=m.pen,team=pen.turn%2,g=m.teams[1-team].players.find(p=>!p.sentOff&&p.role==='GK'),shooter=m.teams[team].players.find(p=>!p.sentOff&&p.role==='ST')||m.teams[team].players.find(p=>!p.sentOff&&p.role!=='GK'),b=m.ball,bg=this.bitmap(GOAL_BG),pad=!!window.S9ArcadeControls?.padConnected;
 c.clearRect(0,0,1280,720);if(bg?.complete&&bg.naturalWidth){const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(bg,0,0,1280,720);c.imageSmoothingEnabled=sm}else{c.fillStyle='#1d7a35';c.fillRect(0,0,1280,720)}
 // Detailed supporters over the backdrop's stand, in the shooting side's colours.
 const sheet=tinted(this,m.teams[team]?.kit);if(sheet){const h=218,w=h*CROWD_W/CROWD_H,f=Math.floor((m.presentationTime??m.elapsed)*4)%CROWD_FRAMES,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;for(let x=0;x<1280;x+=w)c.drawImage(sheet,0,f*CROWD_H,CROWD_W,CROWD_H,x,4,w,h);c.imageSmoothingEnabled=sm}
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
const draw=R.draw;
R.draw=function(m){draw.call(this,m);if(!this.replayMode&&!m.cardScene&&m.phase!=='FINISHED'&&m.phase!=='PENALTIES'&&m.phase!=='FREEKICK')this.scorerCaption(m);if(m.demo)this.demoOverlay(m)};
// Attract mode: DEMO tag, blinking start prompt and the button the bot is using right now.
R.demoOverlay=function(m){const t=performance?.now?.()/1000||0,cap=m.demo.caption;this.panel(1000,14,262,50,10);this.text('DEMO',1060,47,24,'#ff8fa3');if(Math.floor(t*2)%2===0)this.text('PREMI START',1192,46,15,'#fff');
 if(cap){const w=Math.min(820,cap.text.length*15+260),x=640-w/2,y=590;this.panel(x,y,w,58,12);this.text(cap.keys+'  '+cap.text,640,y+37,20,'#fff')}};
})();
