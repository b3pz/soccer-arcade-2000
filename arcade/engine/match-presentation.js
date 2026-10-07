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

// ---------------------------------------------------------------- scorer caption
// Under the GOAL! banner: shirt number and (fictional) name of the scorer, or own goal.
R.scorerCaption=function(m){const s=m.scorers?.[m.scorers.length-1];if(!s||!/^GOAL!|^GOLDEN GOAL!$/.test(m.message||'')||m.messageTime<=0)return;
 const p=s.playerId?m.players.find(q=>q.source?.id===s.playerId):null,label=p?(p.number?p.number+'  ':'')+(p.source?.name||s.name||'').toUpperCase():s.name?'AUTOGOL':'';if(!label)return;
 const team=m.teams[s.team],tw=Math.min(700,label.length*17+120);this.panel(640-tw/2,290,tw,52,10);this.teamCrest(team,640-tw/2+14,296,34,40);this.text(label,640+14,325,24,'#fff')};
const draw=R.draw;
R.draw=function(m){draw.call(this,m);if(!this.replayMode&&!m.cardScene&&m.phase!=='FINISHED'&&m.phase!=='PENALTIES'&&m.phase!=='FREEKICK')this.scorerCaption(m)};
})();
