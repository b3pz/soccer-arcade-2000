/* Presentation only: no match rules, input or physics changes. */
(function(){
const R=S9ArcadeEngine.Renderer.prototype,originalSprite=R.sprite,originalPenalty=R.drawPenalty;
const humanOf=(m,p)=>(m.humans||[]).find(h=>h.selected===p)||null;
const loop=new Set(['idle','run','dribble','gk_idle','gk_move','gk_run','hold','ref_idle','ref_run','celebrate','charge','throwin_hold']);
// Throw-in: arms-up exposure of the celebration row, ball held overhead, then release.
if(window.S9ArcadeFrames){S9ArcadeFrames.throwin_hold=S9ArcadeFrames.throwin_hold||[S9ArcadeFrames.celebrate[5]];S9ArcadeFrames.throwin=S9ArcadeFrames.throwin||[S9ArcadeFrames.celebrate[5],S9ArcadeFrames.celebrate[3],S9ArcadeFrames.celebrate[2]]}
R.sprite=function(p,m,pr){
 this.poseStates=this.poseStates||new WeakMap();
 let action=p.role==='REF'?'ref_'+(p.action||'idle'):p.role==='GK'?(p.action==='pass'?'throw':p.action==='shoot'?'kick_long':m.ball.owner===p&&m.ball.controlMode==='HANDS'?'hold':p.keeperState==='GK_CATCHING'?'catch':p.keeperState==='GK_HOLDING'?'hold':p.keeperState==='GK_DIVING'?((m.phase==='PENALTIES'?p.y-31:p.face?.y)<0?'dive_left':'dive_right'):p.keeperState==='GK_RUSHING'?'gk_run':p.action==='run'?'gk_move':'gk_idle'):p.stun?'fall':p.burst?'special':p.action==='tackle'?(p.hard?'hard_tackle':'tackle'):m.ball.owner===p&&p.action==='run'?'dribble':p.action||'idle';
 if(m.goalCelebration&&p.role!=='GK'&&p.role!=='REF'&&p.team.id===m.goalCelebration.team)action='celebrate';const hh=humanOf(m,p);if(hh&&hh.input.shotCharging&&m.ball.owner===p&&!hh.input.axis().x&&!hh.input.axis().y&&p.role!=='GK')action='charge';const restart=m.restarts?.data;if(p.role!=='GK'&&p.role!=='REF'&&p.role!=='VISUAL'){if(m.phase==='RESTART'&&restart?.type==='THROW IN'&&restart.taker===p)action='throwin_hold';else if(p.throwAt!=null&&m.elapsed-p.throwAt>=0&&m.elapsed-p.throwAt<.4)action='throwin'}const time=this.animationTime??m.presentationTime??m.elapsed;let state=this.poseStates.get(p);
 if(state&&state.action!==action&&p.role!=='REF'&&['idle','run'].includes(action)&&!loop.has(state.action)&&time-state.start<state.duration+.05)action=state.action;const row=action==='charge'?[S9ArcadeFrames.shoot[0]]:S9ArcadeFrames[action]||S9ArcadeFrames.idle;if(!state||state.action!==action||time<state.start){state={action,face:((['pass','shoot','volley','throw','kick_long'].includes(action)?p.visualKickFace:p.face)?.x??1)<0?-1:1,start:time,duration:Math.max(.2,p.actionTime||.4),plant:['pass','shoot','volley','tackle','hard_tackle'].includes(action)?.045:0};this.poseStates.set(p,state)}
 const age=Math.max(0,time-state.start),duration=state.duration,poseAge=Math.max(0,age-state.plant),tick=Math.floor((action==='hold'?Math.max(0,age-.25):poseAge)*(loop.has(action)?action==='gk_run'?14:10:row.length/Math.max(.12,duration-state.plant)));let activeRow=row,index=loop.has(action)?tick%row.length:Math.min(tick,row.length-1);if(action==='hold'&&age<.25){activeRow=S9ArcadeFrames.catch;index=Math.min(activeRow.length-1,Math.floor(age*activeRow.length/.25))}
 // Reuse established palette renderer with an action-local clock and foot baseline.
 const frames=window.S9ArcadeFrames;const one=Object.create(frames);one[action]=[activeRow[index]];
 window.S9ArcadeFrames=one;this.ctx.save();this.ctx.translate(0,-3*pr.scale);if(!loop.has(action)&&state.face!==(p.face?.x<0?-1:1))this.ctx.scale(-1,1);
 try{originalSprite.call(this,{...p,role:'VISUAL',action,stun:0,burst:0,team:p.role==='GK'?{...p.team,kit:null}:p.role==='REF'&&action==='ref_run'?{kit:{shirtPrimary:'#202638',shirtSecondary:'#202638',shorts:'#171c29',socks:'#171c29',pattern:'solid'}}:p.team},{...m,elapsed:0},pr)}finally{this.ctx.restore();window.S9ArcadeFrames=frames}
};
R.pitch=function(){
 const c=this.ctx,cam=this.camera||{x:50,y:31,zoom:26},a=this.project(0,0),b=this.project(100,62);
 if(!this.turf){const t=document.createElement('canvas');t.width=1000;t.height=620;const q=t.getContext('2d');let seed=1998;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 q.fillStyle='#238f38';q.fillRect(0,0,1000,620);for(let i=0;i<10;i++){q.fillStyle=i%2?'#299b40':'#218536';q.fillRect(i*100,0,100,620)}for(let i=0;i<75000;i++){q.fillStyle=rand()>.5?'#8cda4933':'#043f3138';q.fillRect(Math.floor(rand()*1000),Math.floor(rand()*620),1+Math.floor(rand()*3),1)}this.turf=t}
 c.fillStyle='#133448';c.fillRect(0,0,1280,720);
 // Stands, concourse, crowd and advertising follow the world camera.
 c.fillStyle='#252d49';c.fillRect(a.x-100,a.y-125,b.x-a.x+200,b.y-a.y+250);
 // Seats are indexed from the stand edge (world space), so they scroll with the pitch instead of shimmering.
 for(let side of [-1,1]){const y=side<0?a.y-105:b.y+70,x0=a.x-80,k0=Math.max(0,Math.ceil((-20-x0)/14));for(let row=0;row<4;row++)for(let k=k0,x=x0+k0*14;x<Math.min(1300,b.x+80);k++,x+=14){c.fillStyle=['#ffcb44','#56caff','#f2536b','#ddd7bf'][(k+row*3+8)%4];c.fillRect(x,y+row*11,7,6);c.fillStyle='#111a31';c.fillRect(x,y+row*11+6,9,4)}const ad=side<0?a.y-56:b.y+30;c.fillStyle='#071629';c.fillRect(a.x-30,ad,b.x-a.x+60,25);for(let x=a.x;x<b.x;x+=230){c.strokeStyle='#ffcd39';c.strokeRect(x,ad,225,25);this.text(['SUPER FOOTBALL','PUSH START','SERIE A 2000'][Math.abs(Math.floor(x/230))%3],x+110,ad+18,15,'#fcdf66')}}
 c.fillStyle='#8c9880';c.fillRect(a.x-13,a.y-13,b.x-a.x+26,b.y-a.y+26);c.drawImage(this.turf,a.x,a.y,b.x-a.x,b.y-a.y);
 const line=points=>{c.beginPath();points.forEach(([x,y],i)=>{const p=this.project(x,y);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.strokeStyle='#173e2444';c.lineWidth=5;c.stroke();c.strokeStyle='#f1f1cb';c.lineWidth=2.7;c.setLineDash([23,.7,41,1]);c.stroke();c.setLineDash([])};
 line([[0,0],[100,0],[100,62],[0,62],[0,0]]);line([[50,0],[50,62]]);
 const mid=this.project(50,31);c.strokeStyle='#f1f1cb';c.lineWidth=2.7;c.beginPath();c.ellipse(mid.x,mid.y,9.15*cam.zoom,9.15*cam.zoom*.65,0,0,Math.PI*2);c.stroke();
 for(const x of [0,100]){line([[x,14],[x?84:16,14],[x?84:16,48],[x,48]]);line([[x,23],[x?94:6,23],[x?94:6,39],[x,39]]);const p=this.project(x?89:11,31);c.fillStyle='#f1f1cb';c.fillRect(p.x-2,p.y-2,4,4);this.goal(x)}
};
R.goal=function(x){const c=this.ctx,a=this.project(x,25),b=this.project(x,37),dir=x?1:-1,depth=45,top=50;
 c.fillStyle='#07162066';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+dir*depth,a.y+18);c.lineTo(b.x+dir*depth,b.y+18);c.lineTo(b.x,b.y);c.fill();
 c.fillStyle='#dce8ee22';c.fillRect(a.x+(dir<0?-depth:0),a.y-top,depth,b.y-a.y+top);
 c.strokeStyle='#cee3e688';c.lineWidth=1;for(let y=a.y-top;y<=b.y;y+=9){c.beginPath();c.moveTo(a.x,y);c.lineTo(a.x+dir*depth,y+12);c.stroke()}for(let d=0;d<=depth;d+=9){c.beginPath();c.moveTo(a.x+dir*d,a.y-top+d*.25);c.lineTo(b.x+dir*d,b.y+d*.25);c.stroke()}
 c.strokeStyle='#253346';c.lineWidth=9;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x,a.y-top);c.lineTo(b.x,b.y-top);c.lineTo(b.x,b.y);c.stroke();c.strokeStyle='#fff5d9';c.lineWidth=5;c.stroke();
};
R.radar=function(m){if(m.phase==='PENALTIES'||this.replayMode)return;const c=this.ctx,x=525,y=18,w=230,h=90;const point=(px,py)=>({x:x+Math.max(0,Math.min(100,px))*w/100,y:y+Math.max(0,Math.min(62,py))*h/62});this.panel(x-14,y-20,w+28,h+34,12);c.fillStyle='#126847dd';c.fillRect(x,y,w,h);c.strokeStyle='#83cba0';c.lineWidth=1;c.strokeRect(x,y,w,h);c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();c.beginPath();c.ellipse(x+w/2,y+h/2,w*.0915,h*.1475,0,0,Math.PI*2);c.stroke();for(const end of [x,x+w*.84])c.strokeRect(end,y+h*.265,w*.16,h*.47);this.text('RADAR',x+w/2,y-8,11,'#d4f8ff');for(const p of m.players){if(p.sentOff)continue;const a=point(p.x,p.y);c.fillStyle=p.team.id?'#ff5673':'#35cfff';c.fillRect(a.x-3,a.y-3,6,6);const ph=humanOf(m,p);if(ph){c.strokeStyle=ph.color;c.lineWidth=2;c.strokeRect(a.x-5,a.y-5,10,10)}}const b=point(m.ball.x,m.ball.y);c.fillStyle='#fff';c.beginPath();c.arc(b.x,b.y,3.5,0,Math.PI*2);c.fill();};
R.hud=function(m){const c=this.ctx,golden=m.rules.period==='GOLDEN',pen=m.phase==='PENALTIES';
 const score=pen&&!m.pen.single?m.pen.goals:m.rules.score;
 // Scoreboards: drawn bezel sprite, team patch, yellow cabinet digits.
 for(const team of [0,1]){const x=team?794:18,color=team?'#ff6a85':'#4fd0ff',t=m.teams[team];this.panel(x,2,468,94,18);this.teamCrest(t,team?x+468-86:x+18,10,68,80);
  const hs=(m.humans||[]).filter(h=>h.team===team);this.text(hs.length?hs.map(h=>h.label).join('+'):'CPU',team?1135:145,30,17,color);this.text(t.name,team?1000:280,44,Math.min(21,200/Math.max(1,t.name.length)*1.6),'#fff');this.text(t.formation||'4-4-2',team?1000:280,76,18,'#ffd949');this.text(String(score[team]),team?850:430,78,51,'#ffe62f')}
 const sec=Math.max(0,Math.ceil(golden?m.rules.goldenRemaining:m.rules.remaining));
 if(pen){this.panel(493,4,294,90,16);this.text('PENALTY',640,58,27,'#ff617e')}else if(!this.replayMode){this.radar(m);this.panel(520,106,240,46,12);this.text((golden?'GG ':'')+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),640,139,29,golden?'#ffb52b':'#ffe62f')}
 this.panel(120,664,1040,54,14);this.text(this.controlsHint?this.controlsHint(m):'',640,698,17,'#e0e9fc');
 if(m.messageTime>0){if(this.eventMessage!==m.message){this.eventMessage=m.message;this.eventStart=m.elapsed}const eventAge=m.elapsed-this.eventStart;const emph=/GOAL|FOUL|CORNER|THROW|PENALTY|REPLAY|VINCE|FINISHED/i.test(m.message);if(emph&&eventAge<.12){c.fillStyle='#ffed6618';c.fillRect(0,96,1280,566)}c.save();c.translate(emph?Math.max(0,3-Math.floor(eventAge*30))*18:0,emph&&eventAge<.2?-4:0);this.panel(300,156,680,emph?64:48,14);this.text(m.message,640,emph?198:188,emph?30:21,'#fff06b');c.restore()}
 for(let y=0;y<720;y+=4){c.fillStyle='#0000000a';c.fillRect(0,y,1280,1)}
};
R.drawPenalty=function(m){
 const c=this.ctx,team=m.pen.turn%2,g=m.teams[1-team].players.find(p=>!p.sentOff&&p.role==='GK'),shooter=m.teams[team].players.find(p=>!p.sentOff&&p.role==='ST')||m.teams[team].players.find(p=>!p.sentOff&&p.role!=='GK'),b=m.ball;
 c.clearRect(0,0,1280,720);this.pitch();c.fillStyle='#071226';c.fillRect(0,89,1280,140);
 for(let row=0;row<6;row++)for(let x=0;x<1280;x+=14){c.fillStyle=['#eaaa37','#5cadcc','#dc5974'][(row+Math.floor(x/14))%3];c.fillRect(x,98+row*12,7,6)}
 c.drawImage(this.turf,0,230,1280,440);c.strokeStyle='#fff2cf';c.lineWidth=3;c.beginPath();c.moveTo(0,445);c.lineTo(1280,445);c.stroke();const a=275,z=1005,top=180,bottom=445;c.fillStyle='#091c29dd';c.fillRect(a,top,z-a,bottom-top);c.strokeStyle='#b7d7db88';c.lineWidth=1.5;for(let x=a;x<=z;x+=23){c.beginPath();c.moveTo(x,top);c.lineTo(x,bottom);c.stroke()}for(let y=top;y<=bottom;y+=19){c.beginPath();c.moveTo(a,y);c.lineTo(z,y);c.stroke()}c.strokeStyle='#132335';c.lineWidth=17;c.beginPath();c.moveTo(a,bottom);c.lineTo(a,top);c.lineTo(z,top);c.lineTo(z,bottom);c.stroke();c.strokeStyle='#fff2cf';c.lineWidth=9;c.stroke();
 c.save();c.translate(640+(g.y-31)*48,442-(m.pen.keeperCommitted?Math.max(0,S9ArcadeEngine.PenaltyTargets.cell(m.pen.diveCell).z-1.2)*38:0));this.sprite(g,m,{scale:2.1});c.restore();if(!m.pen.flight||m.pen.age<.4||m.pen.stage==='result'){c.save();c.translate(620,622);this.sprite(shooter,m,{scale:2});c.restore()}
 const progress=m.pen.flight?Math.max(0,Math.min(1,Math.abs(b.x-(team?18:82))/18)):0,x=640+(b.y-31)*48*progress,y=610-progress*170-b.z*53;c.fillStyle='#0005';c.beginPath();c.ellipse(x,610-progress*170,10,4,0,0,7);c.fill();this.drawBall(x,y,11-progress*4,m);
 this.hud({...m,messageTime:0});this.text(m.pen.history[0].map(v=>v?'●':'○').join(' '),240,130,25,'#ffe55b');this.text(m.pen.history[1].map(v=>v?'●':'○').join(' '),1040,130,25,'#ffe55b');const shooterHuman=(m.humans||[]).some(h=>h.team===team),keeperHuman=(m.humans||[]).some(h=>h.team===1-team),chosen=shooterHuman?m.pen.aim:m.pen.saveCell;
 if((shooterHuman||keeperHuman)&&(m.pen.stage==='ready'||keeperHuman&&m.pen.stage==='flight'&&!m.pen.keeperCommitted)){for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=a+col*(z-a)/3,y=top+row*(bottom-top)/3;c.strokeStyle=row*3+col===chosen?'#fff257':'#87dfff88';c.lineWidth=row*3+col===chosen?5:2;c.strokeRect(x+3,y+3,(z-a)/3-6,(bottom-top)/3-6);if(row*3+col===chosen){c.fillStyle='#ffe85122';c.fillRect(x+3,y+3,(z-a)/3-6,(bottom-top)/3-6)}this.text(String(row*3+col+1),x+(z-a)/6,y+(bottom-top)/6+7,22,row*3+col===chosen?'#fff257':'#9fc2d4')}}
 if(m.pen.stage==='result'){this.panel(250,258,780,200,22);this.text(m.pen.outcome.label,640,335,56,m.pen.outcome.goal?'#ffe743':'#ff8294');this.text((m.pen.single?'RIGORE':'RIGORE '+(Math.floor(m.pen.turn/2)+1))+' · '+m.teams[team].name,640,379,22,'#b3eaff');if(m.pen.age>=.7)this.text(window.S9ArcadeControls?.padConnected?'A · CONTINUA':'Z · CONTINUA',640,425,26,'#fff06a')}
 this.text(m.pen.stage==='result'?'ESITO DEL RIGORE':shooterHuman?'FRECCE · 9 POSIZIONI   '+(window.S9ArcadeControls?.padConnected?'A':'Z')+' · TIRA':'FRECCE · 9 POSIZIONI   '+(window.S9ArcadeControls?.padConnected?'B / X':'X / C')+' · TUFFO DOPO IL TIRO',640,640,22,'#ffe55b');
};
const replayDraw=S9ArcadeEngine.ReplayManager.prototype.draw;
S9ArcadeEngine.ReplayManager.prototype.draw=function(m,renderer,dt){renderer.replayMode=true;try{return replayDraw.call(this,m,renderer,dt)}finally{renderer.replayMode=false}};
// Referee has a world position and runs after play; never glued to the camera corner.
R.updateReferee=function(m){
 const time=this.animationTime??m.presentationTime??m.elapsed;
 this.referee=this.referee||{role:'REF',action:'idle',team:{},face:{x:1,y:0},x:40,y:26,time};const ref=this.referee;
 const dir=m.ball.owner?.team.dir??m.teams[m.ball.lastTeam||0].dir;
 const tx=Math.max(8,Math.min(92,m.ball.x-dir*3.5)),ty=Math.max(10,Math.min(52,m.ball.y+(m.ball.y<31?2.5:-2.5)));
 const dt=Math.max(0,Math.min(.1,time-ref.time));ref.time=time;const dx=tx-ref.x,dy=ty-ref.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-2),dt*15);
 if(step){ref.x+=dx/d*step;ref.y+=dy/d*step;if(Math.abs(dx)>.4)ref.face={x:Math.sign(dx),y:dy/d}}
 ref.action=m.messageTime>0&&/RED/.test(m.message)?'red':m.messageTime>0&&/YELLOW/.test(m.message)?'yellow':m.messageTime>0&&/FOUL|PENALTY/.test(m.message)?'whistle':m.phase==='RESTART'?'point':step>.01?'run':'idle';return ref;
};
R.draw=function(m){if(m.phase==='PENALTIES'){this.drawPenalty(m);return}const c=this.ctx;c.clearRect(0,0,1280,720);this.pitch();
 const ref=this.updateReferee(m);
 for(const p of [...m.players,ref].sort((a,b)=>a.y-b.y)){const pr=this.project(p.x,p.y);c.fillStyle='#07152266';c.beginPath();c.ellipse(pr.x+7,pr.y+5,12*pr.scale,4*pr.scale,0,0,7);c.fill();const ph=humanOf(m,p);if(ph){c.strokeStyle=ph.color;c.lineWidth=3;c.beginPath();c.ellipse(pr.x,pr.y+6,14*pr.scale,5*pr.scale,0,0,7);c.stroke();this.text(ph.label,pr.x,pr.y-75*pr.scale,22,ph.color)}c.save();c.translate(pr.x,pr.y);if(p.face?.x<0)c.scale(-1,1);this.sprite(p,m,pr);c.restore();if(m.debug&&p.role!=='REF')this.text(p.keeperState||p.role,pr.x,pr.y-65,11)}
 const b=m.ball,held=!!b.owner&&b.controlMode==='HANDS',lift=b.owner?.role==='GK'?40:75.3,p=this.project(held?b.owner.x:b.x,held?b.owner.y:b.y);if(!held&&b.owner?.action==='run'){const age=(this.animationTime??m.elapsed)-(this.poseStates?.get(b.owner)?.start??m.elapsed),phase=Math.floor(Math.max(0,age)*10)%8,tap=phase===2||phase===6?-4:phase===3||phase===7?3:0;p.x+=b.owner.face.x*tap;p.y+=b.owner.face.y*tap*.65}c.fillStyle='#0007';c.beginPath();c.ellipse(p.x,p.y+5,8,4,0,0,7);c.fill();this.drawBall(p.x,p.y-(held?lift*p.scale:b.z*Math.max(8,(this.camera?.zoom||26)*.4)),Math.max(8,4.6*p.scale),m);this.setPieceArrow?.(m);this.hud(m);
 if(m.phase==='FINISHED')this.resultScreen(m);const rd=m.restarts?.data;if(m.phase==='RESTART'&&rd&&(m.humans||[]).some(h=>h.team===rd.team)){const pad=window.S9ArcadeControls?.padConnected;this.text(rd.type==='KICKOFF'?(pad?'B / X · ':'C / X · ')+'CALCIO D’INIZIO':rd.type+' · '+(rd.aim?.button?'TIENI PER LA POTENZA · RILASCIA':(pad?'A/B/X':'Z/C/X')+' FERMA LA FRECCIA'),640,640,23,'#fff06b')}
};
})();
