/* Commentary and crowd: a telecronista caption (optionally spoken in Italian by the browser voice) on goals,
   saves, woodwork, near misses, fouls, cards, kick-off and full time; the crowd answers with an "ooh" on near misses,
   applause on saves and rhythmic clapping when a side leads by two. OPZIONI -> TELECRONACA: SCRITTE / VOCE / NO. */
(function(){
'use strict';
const E=window.S9ArcadeEngine,M=E.Match.prototype,R=E.Renderer.prototype;
const mode=()=>window.S9ArcadeEvolution?.settings.commentary||'scritte';
const surname=p=>{const n=(p?.source?.name||'').trim().split(/\s+/);return (n.length>1?n.slice(1).join(' '):n[0]||'').toUpperCase()};
const pickOne=(m,list)=>list[Math.floor(((Math.sin((m.elapsed+list.length)*12.9898)*43758.5453)%1+1)%1*list.length)];
const LINES={
 goal:['GOOOL! {P}!','RETE DI {P}!','{P}! CHE GOL!','LA METTE DENTRO {P}!','{P}, IMPARABILE!'],
 equal:['PAREGGIO! {P} RIMETTE TUTTO IN DISCUSSIONE!','{P} FIRMA IL PAREGGIO!'],
 lead:['{P} PORTA IN VANTAGGIO {T}!','SORPASSO! {P}!'],
 rout:['{T} DILAGA! ANCORA {P}!','GOLEADA! {P}!'],
 save:['PARATA DI {K}!','{K} DICE NO!','CHE INTERVENTO DI {K}!','{K} SALVA TUTTO!'],
 post:['PALO! CHE SFORTUNA!','LEGNO PIENO!','COLPITO IL PALO!'],
 bar:['TRAVERSA! INCREDIBILE!','SULLA TRAVERSA!'],
 wide:['FUORI DI POCO!','SFIORA IL PALO!','ALTO SOPRA LA TRAVERSA!','CI HA PROVATO {P}!'],
 foul:['FALLO! L\'ARBITRO FISCHIA.','INTERVENTO IN RITARDO!','FISCHIO DELL\'ARBITRO.'],
 yellow:['CARTELLINO GIALLO PER {P}.','AMMONITO {P}!'],red:['ESPULSO! ROSSO PER {P}!'],
 penalty:['CALCIO DI RIGORE!','RIGORE! TUTTO LO STADIO TRATTIENE IL FIATO.'],
 kickoff:['SI COMINCIA!','FISCHIO D\'INIZIO!','PALLA AL CENTRO, SI PARTE!'],
 end:['FINISCE QUI!','TRIPLICE FISCHIO!']};
// ---------------------------------------------------------------- crowd sound
let ooh=null,ctxA=null;
function crowdOoh(vol=.35){try{if(!ooh){ooh=new Audio('assets/audio/goal-boato.mp3');ooh.preload='auto'}ooh.volume=vol*(window.S9ArcadeEvolution?.settings.volume??1);ooh.currentTime=5.4;ooh.play().catch(()=>{});clearTimeout(ooh.t);ooh.t=setTimeout(()=>{try{ooh.pause()}catch(_){}},1300)}catch(e){}}
function claps(pattern=[0,.32,.64,.8,.96]){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ctxA=ctxA||new A();const a=ctxA,v=.18*(window.S9ArcadeEvolution?.settings.volume??1);for(const at of pattern){const len=Math.floor(a.sampleRate*.09),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/len*7);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=buf;f.type='bandpass';f.frequency.value=1400;f.Q.value=.7;g.gain.value=v;s.connect(f);f.connect(g);g.connect(a.destination);s.start(a.currentTime+at)}}catch(e){}}
// ---------------------------------------------------------------- speaking
function speak(text){if(mode()!=='voce'||typeof speechSynthesis==='undefined')return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/!+/g,'!').toLowerCase());u.lang='it-IT';u.rate=1.15;u.pitch=1.05;u.volume=Math.min(1,window.S9ArcadeEvolution?.settings.volume??1);const v=speechSynthesis.getVoices().find(x=>/^it/i.test(x.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
function say(m,kind,{P='',K='',T=''}={},sound){if(mode()==='no'||m.demo&&kind!=='goal')return;const text=pickOne(m,LINES[kind]).replace('{P}',P||'IL NUMERO '+(m.lastShooter?.number||'')).replace('{K}',K||'IL PORTIERE').replace('{T}',T);m.commentary={text,age:0,kind};speak(text);sound?.()}
// ---------------------------------------------------------------- event detection (presentation only: reads the match state)
const update=M.update;
M.update=function(dt){const before=this.commentWatch||(this.commentWatch={goals:this.rules.score[0]+this.rules.score[1],saves:0,message:'',phase:this.phase,cards:0,restart:null,claps:0});
 const r=update.call(this,dt);if(!this.humans||this.training)return r;const w=this.commentWatch;if(this.commentary)this.commentary.age+=dt;
 const goals=this.rules.score[0]+this.rules.score[1],saves=(this.stats?.teams||[]).reduce((n,t)=>n+(t.saves||0),0),cards=(this.discipline||[]).length,msg=this.message||'';
 if(goals>w.goals){const s=this.scorers?.[this.scorers.length-1],team=this.teams[s?.team??0],[a,b]=this.rules.score,mine=s?.team===0?a:b,theirs=s?.team===0?b:a,P=(s?.name||'').split(/\s+/).slice(1).join(' ').toUpperCase()||surname(this.lastShooter);
  say(this,mine===theirs?'equal':mine-theirs>=3?'rout':mine-theirs===1&&theirs>0?'lead':'goal',{P,T:(team?.name||'').toUpperCase()})}
 else if(saves>w.saves){const k=this.players.filter(p=>p.role==='GK').sort((x,y)=>Math.hypot(x.x-this.ball.x,x.y-this.ball.y)-Math.hypot(y.x-this.ball.x,y.y-this.ball.y))[0];say(this,'save',{K:surname(k)},()=>claps([0,.15,.3,.45,.6,.75]))}
 else if(msg!==w.message&&this.messageTime>0){
  if(/PALO/.test(msg))say(this,'post',{},()=>crowdOoh());else if(/TRAVERSA/.test(msg))say(this,'bar',{},()=>crowdOoh());
  else if(/FOUL|FALLO/.test(msg))say(this,'foul');else if(/PENALTY|RIGORE!/.test(msg))say(this,'penalty');}
 if(cards>w.cards){const c=this.discipline[this.discipline.length-1];say(this,c?.card==='RED'?'red':'yellow',{P:(c?.name||'').split(/\s+/).slice(1).join(' ').toUpperCase()})}
 // A shot that ends as a goal kick or corner within a second: near miss.
 const rd=this.restarts?.data;if(rd&&rd!==w.restart&&(rd.type==='GOAL KICK'||rd.type==='CORNER')&&this.lastShot&&this.elapsed-this.lastShot.time<1.6&&goals===w.goals)say(this,'wide',{P:surname(this.lastShot.player)},()=>crowdOoh(.3));
 if(rd&&rd!==w.restart&&rd.type==='KICKOFF'&&goals===0&&this.elapsed<1)say(this,'kickoff');
 if(this.phase==='FINISHED'&&w.phase!=='FINISHED')say(this,'end');
 // Two goals up: the leading end claps a rhythm now and then.
 if(Math.abs(this.rules.score[0]-this.rules.score[1])>=2&&this.phase==='PLAY'&&this.elapsed-w.claps>18){w.claps=this.elapsed;claps()}
 Object.assign(w,{goals,saves,cards,message:msg,phase:this.phase,restart:rd});return r};
// ---------------------------------------------------------------- caption
const draw=R.draw;
R.draw=function(m){const r=draw.call(this,m);const cm=m.commentary;if(!cm||cm.age>3.2||this.replayMode||m.cardScene||m.phase==='PENALTIES'||m.phase==='FREEKICK'||m.demo)return r;
 const c=this.ctx,shown=cm.text.slice(0,Math.ceil(cm.age*40)),w=Math.min(900,cm.text.length*15+70),x=640-w/2,y=114;c.save();c.globalAlpha=cm.age>2.8?Math.max(0,(3.2-cm.age)/.4):1;
 this.panel(x,y,w,40,8);c.fillStyle='#ffe447';c.fillRect(x+12,y+12,16,16);c.fillStyle='#0a1430';c.fillRect(x+16,y+16,8,8);this.text(shown,640+14,y+27,18,cm.kind==='goal'||cm.kind==='lead'||cm.kind==='equal'||cm.kind==='rout'?'#ffe447':'#fff');c.restore();return r};
window.S9ArcadeCommentary={LINES,say};
})();
