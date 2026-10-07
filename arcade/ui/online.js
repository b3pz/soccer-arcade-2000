/* Private two-player rooms. The host simulates; WebRTC carries game video/audio and guest input. */
(function(){
'use strict';
const ACTIONS=new Set(['arrowup','arrowdown','arrowleft','arrowright','z','c','x','v','switch']);
const M=S9ArcadeEngine.Match.prototype;
const penaltyHumans=M.penaltyHumans;if(penaltyHumans)M.penaltyHumans=function(){const pair=penaltyHumans.call(this);if(this.training){const list=this.humansOf(this.pen.turn%2);if(list.length>1)pair.shooter=list[Math.max(0,this.training.attempts-1)%list.length]}return pair};
const fkHumans=M.fkHumans;if(fkHumans)M.fkHumans=function(){const pair=fkHumans.call(this);if(this.training){const list=this.humansOf(this.fk.team);if(list.length>1)pair.shooter=list[Math.max(0,this.training.attempts-1)%list.length]}else pair.shooter=this.humanOf(this.fk.taker)||pair.shooter;return pair};
const trainingTick=M.trainingTick;if(trainingTick)M.trainingTick=function(dt){const before=this.training?.attempts;trainingTick.call(this,dt);if(this.training&&this.training.attempts!==before&&this.ball.owner){const list=this.humansOf(this.ball.owner.team);if(list.length>1){const chosen=list[(this.training.attempts-1)%list.length],previous=this.humanOf(this.ball.owner);if(previous&&previous!==chosen){const selected=chosen.selected;chosen.selected=this.ball.owner;previous.selected=selected}}}};
let session=null,roomPanel=null,returnToMenu=null;
const prefs=()=>window.S9ArcadeEvolution?.settings||{};
function serverURL(value){const u=new URL(value||location.origin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Usa un indirizzo HTTPS valido per il server online.');if(location.protocol==='https:'&&u.protocol!=='https:')throw Error('Il server online deve usare HTTPS.');return u.href.replace(/\/$/,'')}
function playersFor(config,mode){const mine=config.players?.[0]?.team??0,versus=mode==='versus'||config.players?.some(p=>p.team!==mine);return [{team:mine,device:'all'},{team:versus?1-mine:mine,device:'remote'}]}
function applyInput(input,keys){if(!input.active){input.onBlur();return}const wanted=new Set(keys.filter(k=>ACTIONS.has(k)));for(const k of ACTIONS){if(wanted.has(k))input.press(k,'remote');else input.release(k,'remote')}}
const node=(tag,text,parent)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(parent)parent.append(n);return n};
const button=(parent,text,fn)=>{const n=node('button',text,parent);n.type='button';n.onclick=fn;return n};

class Session {
 constructor(credentials,base,mode='coop'){
  Object.assign(this,credentials);this.base=base;this.mode=mode;this.closed=false;this.connected=false;this.since=0;this.sequence=0;this.receivedSequence=-1;this.generation=0;this.pendingICE=[];this.rewarded=new Set();this.requests=new Set();this.timers=new Set();this.lastInput=0;this.lastMeta='';
 }
 later(fn,delay){const id=setTimeout(()=>{this.timers.delete(id);if(!this.closed)fn()},delay);this.timers.add(id);return id}
 async api(path,method='GET',data){
  const controller=new AbortController();this.requests.add(controller);const timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch(this.base+path,{method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.token},body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,cache:'no-store'});let value;try{value=await response.json()}catch(_){throw Error('Server online non configurato: inserisci l’indirizzo del servizio stanze.')}if(!response.ok)throw Error(value.error||'Errore del servizio stanze.');return value}finally{clearTimeout(timer);this.requests.delete(controller)}
 }
 async signal(message){if(this.closed)return;return this.api('/api/rooms/'+this.code+'/signal','POST',message)}
 send(message){if(this.channel?.readyState==='open'&&this.channel.bufferedAmount<64000)this.channel.send(JSON.stringify(message))}
 status(text){this.message=text;updateBadge();if(this.onStatus)this.onStatus(text)}
 async init(){
  if(typeof RTCPeerConnection==='undefined')throw Error('Questo browser non supporta le stanze online.');
  this.peer=new RTCPeerConnection({iceServers:this.iceServers||[]});
  this.peer.onicecandidate=e=>{if(e.candidate)this.signal({type:'candidate',candidate:e.candidate.toJSON()}).catch(e=>this.status(e.message))};
  this.peer.onconnectionstatechange=()=>{
   const state=this.peer.connectionState;if(this.closed)return;
   if(state==='connected'){this.connected=true;this.status('2 giocatori collegati');if(this.game)this.bindMatch(this.game,false)}
   else if(state==='disconnected'){this.connected=false;this.game?.control?.('pause',true);this.game?.inputs[1]?.onBlur();this.status('Collegamento interrotto · partita in pausa');this.later(()=>{if(this.peer.connectionState==='disconnected')this.close('Connessione persa. Ricrea la stanza.')},8000)}
   else if(state==='failed')this.close('Collegamento non riuscito. Il server può richiedere una configurazione TURN.');
  };
  if(this.role==='host'){
   this.canvas=document.createElement('canvas');this.canvas.width=1280;this.canvas.height=720;
   if(!this.canvas.captureStream)throw Error('Questo browser non supporta la trasmissione della partita.');
   this.stream=this.canvas.captureStream(30);for(const track of this.stream.getTracks())this.peer.addTrack(track,this.stream);
   const audio=window.S9SFX?.stream?.();if(audio)for(const track of audio.getAudioTracks())this.peer.addTrack(track,audio);
   this.attachChannel(this.peer.createDataChannel('arcade-controls',{ordered:true}));
   this.mirror();
  }else{
   this.peer.ondatachannel=e=>this.attachChannel(e.channel);
   this.peer.ontrack=e=>{this.media=this.media||new MediaStream();if(!this.media.getTracks().some(t=>t.id===e.track.id))this.media.addTrack(e.track);if(this.video){this.video.srcObject=this.media;this.video.play().catch(()=>this.status('Premi ATTIVA AUDIO E VIDEO per vedere la partita.'))}};
  }
  this.status(this.role==='host'?'In attesa del secondo giocatore':'Collegamento alla stanza…');if(this.role==='guest')this.connectionDeadline();this.poll();return this;
 }
 connectionDeadline(){this.later(()=>{if(!this.connected)this.close('Collegamento non riuscito. Verifica il servizio TURN sul server.')},45000)}
 attachChannel(channel){
  this.channel=channel;channel.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>4096)return;try{this.receive(JSON.parse(e.data))}catch(_){}};
  channel.onopen=()=>{this.connected=true;this.status('2 giocatori collegati');if(this.role==='host'&&this.game)this.bindMatch(this.game,false)};
  channel.onclose=()=>{if(!this.closed)this.close('L’altro giocatore ha lasciato la stanza.')};
 }
 receive(message){
  if(!message||typeof message!=='object')return;
  if(this.role==='host'){
   if(message.type==='input'&&message.match===this.generation&&Number.isSafeInteger(message.sequence)&&message.sequence>this.receivedSequence&&Array.isArray(message.keys)&&message.keys.length<=ACTIONS.size){this.receivedSequence=message.sequence;this.lastInput=performance.now();if(this.game?.inputs[1])applyInput(this.game.inputs[1],message.keys)}
   else if(message.type==='inputreset'&&message.match===this.generation)this.game?.inputs[1]?.onBlur();
   else if(message.type==='control'&&message.match===this.generation&&['pause','resume','continue','skip'].includes(message.action))this.game?.control?.(message.action);
   else if(message.type==='ping')this.send({type:'pong',time:message.time});
  }else{
   if(message.type==='match'){
    if(this.generation!==message.match)this.input?.onBlur();this.generation=message.match;this.matchState=message;
    if(this.input){this.input.context={phase:message.phase,pen:{stage:message.penStage}};this.input.active=!!message.active&&!message.paused&&!message.finished;if(!this.input.active)this.input.onBlur()}
    this.status(message.active?(message.finished?'Partita conclusa':message.paused?'Partita in pausa':message.title+' · '+(message.side==='coop'?'CO-OP':'1 CONTRO 1')):'L’host sta scegliendo la prossima partita');
   }else if(message.type==='result'&&message.match===this.generation&&!this.rewarded.has(message.match)){this.rewarded.add(message.match);const progress=window.S9ArcadeEvolution?.progress,reward=message.reward;if(progress&&reward&&Number.isInteger(reward.xp)&&reward.xp>=0&&reward.xp<=50){progress.xp+=reward.xp;if(typeof reward.key==='string'&&reward.key.length<40&&Number.isInteger(reward.medal)&&reward.medal>=0&&reward.medal<=3)progress.medals[reward.key]=Math.max(progress.medals[reward.key]||0,reward.medal);window.S9ArcadeEvolution.save()}if(this.onResult)this.onResult(message);
   }else if(message.type==='pong'&&typeof message.time==='number'){this.latency=Math.round(performance.now()-message.time);if(this.onLatency)this.onLatency(this.latency)}
  }
 }
 async poll(){
  if(this.closed)return;
  try{
   const reply=await this.api('/api/rooms/'+this.code+'/events?since='+this.since);this.failures=0;
   for(const event of reply.events){this.since=Math.max(this.since,event.id);await this.processSignal(event.message)}
  }catch(e){if(this.closed)return;this.failures=(this.failures||0)+1;this.status(e.message);if(this.failures>=3){this.close(e.message);return}}
  this.later(()=>this.poll(),700);
 }
 async processSignal(message){
  if(message.type==='joined'&&this.role==='host'){this.connectionDeadline();const offer=await this.peer.createOffer();await this.peer.setLocalDescription(offer);await this.signal({type:'offer',description:this.peer.localDescription.toJSON()})}
  else if(message.type==='offer'&&this.role==='guest'){await this.peer.setRemoteDescription(message.description);await this.flushICE();const answer=await this.peer.createAnswer();await this.peer.setLocalDescription(answer);await this.signal({type:'answer',description:this.peer.localDescription.toJSON()})}
  else if(message.type==='answer'&&this.role==='host'){await this.peer.setRemoteDescription(message.description);await this.flushICE()}
  else if(message.type==='candidate'){if(this.peer.remoteDescription)await this.peer.addIceCandidate(message.candidate);else this.pendingICE.push(message.candidate)}
  else if(message.type==='left')this.close('Il secondo giocatore ha lasciato la stanza.');
 }
 async flushICE(){for(const candidate of this.pendingICE)await this.peer.addIceCandidate(candidate);this.pendingICE=[]}
 bindMatch(active,newMatch=true){
  this.game=active;if(newMatch){this.generation++;this.receivedSequence=-1;this.lastInput=performance.now();this.lastMeta=''}
  this.sendMeta();
 }
 unbindMatch(active){if(this.game===active){const m=active.match,r=m.resultSummary;if(active.finished&&r)this.send({type:'result',match:this.generation,score:[r.homeGoals,r.awayGoals],mvp:r.mvp,objective:r.objective,reward:{xp:r.objective?r.objective.success?50:5:20,key:m.objective?.key||(m.training?'training:'+m.training.drill:null),medal:r.objective?.medal||0}});this.game=null;this.lastMeta='';this.sendMeta()}}
 sendMeta(){
  const game=this.game,m=game?.match;
  const meta={type:'match',match:this.generation,active:!!game,title:m?m.teams.map(t=>t.name).join(' VS '):'',phase:m?.phase,penStage:m?.pen?.stage,paused:!!game?.paused,finished:!!game?.finished,side:m&&m.humans[0].team===m.humans[1]?.team?'coop':'versus'};
  const text=JSON.stringify(meta);if(text!==this.lastMeta){this.send(meta);if(this.channel?.readyState==='open')this.lastMeta=text}
 }
 mirror(){
  if(this.closed)return;
  const now=performance.now();if(!this.lastMirror||now-this.lastMirror>=32){
   this.lastMirror=now;const c=this.canvas.getContext('2d'),source=this.game?.renderer?.c;
   if(source)c.drawImage(source,0,0,1280,720);else{c.fillStyle='#071329';c.fillRect(0,0,1280,720);c.fillStyle='#ffe767';c.font='bold 32px monospace';c.textAlign='center';c.fillText('STANZA '+this.code,640,320);c.font='22px monospace';c.fillText('L’host sta scegliendo la prossima partita',640,370)}
   this.sendMeta();
   if(this.game&&!this.game.finished&&now-this.lastInput>2000&&this.connected){this.game.inputs[1]?.onBlur();this.game.control?.('pause',true);this.status('Comandi 2P interrotti · partita in pausa')}
  }
  this.raf=requestAnimationFrame(()=>this.mirror());
 }
 enableGuest(video){
  this.video=video;if(this.media){video.srcObject=this.media;video.play().catch(()=>{})}
  this.input=new S9ArcadeEngine.InputManager({keys:'arrows',pads:'all'});this.input.active=false;
  const intercept=(e,up)=>{
   if(/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName))return;const key=e.key.toLowerCase(),logical=this.input.keymap?.[key],B=window.S9ArcadeBindings,menuAction=B?B.keyboard('menu',key):['z','enter',' '].includes(key)?'confirm':null,systemAction=B?B.keyboard('system',key):key==='escape'?'pause':null;
   if(!logical&&!menuAction&&systemAction!=='pause')return;e.preventDefault();e.stopImmediatePropagation();
   if(!up&&!e.repeat){if(systemAction==='pause'){this.send({type:'control',match:this.generation,action:this.matchState?.paused?'resume':'pause'});return}if(this.matchState?.finished&&menuAction==='confirm'){this.send({type:'control',match:this.generation,action:'continue'});return}if(this.matchState?.paused&&menuAction==='confirm'){this.send({type:'control',match:this.generation,action:'resume'});return}}
   if(up)this.input.onUp(e);else this.input.onDown(e);this.sendKeys();
  };
  this.keyDown=e=>intercept(e,false);this.keyUp=e=>intercept(e,true);this.blur=()=>{this.input.onBlur();this.send({type:'inputreset',match:this.generation})};
  addEventListener('keydown',this.keyDown,true);addEventListener('keyup',this.keyUp,true);addEventListener('blur',this.blur);
  const tick=()=>{if(this.closed)return;this.input.poll();this.sendKeys();this.input.end(1/30);this.later(tick,33)};tick();
 }
 sendKeys(){this.send({type:'input',match:this.generation,sequence:++this.sequence,keys:[...this.input.down]});if(this.role==='guest'&&(!this.lastPing||performance.now()-this.lastPing>1000)){this.lastPing=performance.now();this.send({type:'ping',time:this.lastPing})}}
 async close(reason='Stanza chiusa'){
  if(this.closed)return;this.closed=true;this.connected=false;this.status(reason);
  for(const id of this.timers)clearTimeout(id);this.timers.clear();cancelAnimationFrame(this.raf);
  for(const controller of this.requests)controller.abort();this.requests.clear();
  this.game?.inputs[1]?.onBlur();this.game?.control?.('cancel');this.game=null;
  this.input?.dispose();if(this.keyDown)removeEventListener('keydown',this.keyDown,true);if(this.keyUp)removeEventListener('keyup',this.keyUp,true);if(this.blur)removeEventListener('blur',this.blur);
  this.channel?.close();this.peer?.close();this.stream?.getTracks().forEach(t=>t.stop());if(this.video){this.video.pause();this.video.srcObject=null}
  if(session===this){session=null;updateBadge()}
  try{fetch(this.base+'/api/rooms/'+this.code+'/leave',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.token},body:'{}',keepalive:true}).catch(()=>{})}catch(_){}
 }
}
function updateBadge(){let badge=document.getElementById('arcade-online-badge');if(!session){badge?.remove();return}if(!badge){badge=node('button',undefined,document.body);badge.id='arcade-online-badge';badge.type='button';badge.onclick=()=>open()}badge.textContent='ONLINE · '+session.code+' · '+(session.message||'collegamento…')}
function open(onClose){
 if(roomPanel)return;
 returnToMenu=onClose||null;const panel=roomPanel=node('div',undefined,document.body);panel.id='arcade-online';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Stanza privata online');const disposeArt=window.S9ArcadeDrawnMenu?.mount(panel);const main=node('main',undefined,panel);node('h1','ONLINE · STANZA PRIVATA',main);
 const closePanel=()=>{disposeArt?.();panel.remove();roomPanel=null;returnToMenu?.();returnToMenu=null};
 if(session){renderRoom(session);return}
 node('p','Crea una stanza e condividi il codice. L’host sceglie le modalità e conserva il progresso.',main);
 const label=node('label','Server stanze',main),server=node('input',undefined,label);server.type='url';server.value=prefs().onlineServer||((location.protocol==='http:'||location.protocol==='https:')?location.origin:'http://localhost:8080');server.placeholder='https://server-online.example';
 node('p','Se il gioco è su GitHub Pages, inserisci qui l’indirizzo del servizio online.',main);
 const mode=node('select',undefined,main);for(const [id,text] of [['coop','CO-OP · insieme contro CPU'],['versus','1 CONTRO 1']]){const option=node('option',text,mode);option.value=id}
 node('p','Coppe, campionato, survival, sfide e allenamento: co-op. Amichevoli e torneo locale: anche 1 contro 1.',main);
 const status=node('p','',main);status.setAttribute('role','status');const code=node('input',undefined,main);code.placeholder='CODICE STANZA';code.maxLength=6;code.setAttribute('aria-label','Codice stanza');
 async function connect(join){
  if(session)return;const controls=[...main.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);status.textContent='Collegamento al server…';let created;
  try{
   if(typeof RTCPeerConnection==='undefined')throw Error('Usa un browser con supporto WebRTC.');
   const base=serverURL(server.value),room=code.value.trim().toUpperCase();if(join&&!/^[A-Z2-9]{6}$/.test(room))throw Error('Inserisci il codice di sei caratteri.');
   const response=await fetch(base+(join?'/api/rooms/'+room+'/join':'/api/rooms'),{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});let credentials;try{credentials=await response.json()}catch(_){throw Error('Il servizio stanze non è disponibile a questo indirizzo.')}if(!response.ok)throw Error(credentials.error||'Collegamento non riuscito.');
   prefs().onlineServer=base;window.S9ArcadeEvolution?.save();created=session=new Session(credentials,base,mode.value);await created.init();renderRoom(created);
  }catch(e){if(created)await created.close(e.message);status.textContent=e.message;controls.forEach(b=>b.disabled=false)}
 }
 button(main,'CREA STANZA',()=>connect(false));button(main,'ENTRA CON CODICE',()=>connect(true));button(main,'MENU',closePanel);
 function renderRoom(current){
  main.replaceChildren();node('h1','STANZA '+current.code,main);const state=node('p',current.message||'Collegamento…',main);state.setAttribute('role','status');current.onStatus=text=>state.textContent=text;
  if(current.role==='host'){
   node('p','Condividi questo codice con l’altro giocatore. Poi torna ai menu per scegliere la partita.',main);
   const invite=new URL(location.href);invite.searchParams.set('room',current.code);invite.searchParams.set('server',current.base);const link=node('input',undefined,main);link.value=invite.href;link.readOnly=true;link.setAttribute('aria-label','Link invito');
   button(main,'COPIA INVITO',async()=>{try{await navigator.clipboard.writeText(invite.href);state.textContent='Invito copiato'}catch(_){link.select();state.textContent='Seleziona e copia il link'}});
   const play=button(main,'CONTINUA AI MENU',closePanel);play.disabled=!current.connected;const previous=current.onStatus;current.onStatus=text=>{previous(text);play.disabled=!current.connected};
  }else{
   const video=node('video',undefined,main);video.autoplay=true;video.playsInline=true;video.muted=true;video.setAttribute('aria-label','Partita dell’host');current.enableGuest(video);
   const latency=node('p','',main);current.onLatency=n=>latency.textContent='Ritardo collegamento: '+n+' ms';const result=node('p','',main);current.onResult=message=>{result.textContent='ULTIMO RISULTATO: '+message.score.join(' : ')+(message.objective?' · '+message.objective.name:'')};
   button(main,'ATTIVA AUDIO E VIDEO',()=>{video.muted=false;video.play().catch(()=>{})});
   button(main,'PAUSA / RIPRENDI',()=>current.send({type:'control',match:current.generation,action:current.matchState?.paused?'resume':'pause'}));
   button(main,'CONTINUA / SALTA REPLAY',()=>current.send({type:'control',match:current.generation,action:current.matchState?.finished?'continue':'skip'}));
  }
  button(main,'LASCIA STANZA',async()=>{await current.close();closePanel()});
 }
}
const original=window.launchArcadeMatch;
window.launchArcadeMatch=function(config){
 if(!session)return original(config);
 if(session.role!=='host')return Promise.reject(Error('Le partite vengono avviate dal giocatore che ha creato la stanza.'));
 if(config.players?.length>2)return Promise.reject(Error('Le stanze online supportano due giocatori.'));
 if(!session.connected)return Promise.reject(Error('Attendi il secondo giocatore prima di avviare la partita.'));
 const mode=(config.onlineMode==='coop'||config.challenge||config.training)?'coop':session.mode;
 if((config.challenge||config.training)&&session.mode==='versus')session.status('Questa modalità si gioca insieme contro la CPU');
 return original({...config,players:playersFor(config,mode),onlineSession:session});
};
window.S9ArcadeOnline={open,Session,playersFor,applyInput,serverURL,get session(){return session}};
if(typeof location!=='undefined'&&location.search){const params=new URLSearchParams(location.search);if(params.has('room'))setTimeout(()=>{open();const fields=roomPanel?.querySelectorAll('input');if(fields?.length>=2){if(params.has('server'))fields[0].value=params.get('server');fields[1].value=params.get('room')}},0)}
})();
