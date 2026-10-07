/* Cabinet presentation: animation, stadium and overlays, separate from simulation. */
(function(){
const E=window.S9ArcadeEngine,R=E.Renderer.prototype,draw=R.draw,hud=R.hud,pitch=R.pitch,text=R.text;
R.pitch=function(){pitch.call(this);const c=this.ctx,a=this.project(0,0),b=this.project(100,62),time=this.sceneTime||0,celebrating=!!this.stadiumCelebration;
 // Individual supporters, aisle breaks and raised scarves, using a stable seat hash.
 for(const side of [-1,1]){const y=side<0?a.y-105:b.y+70,x0=a.x-80,k0=Math.max(0,Math.ceil((-30-x0)/14));for(let row=0;row<4;row++)for(let k=k0,x=x0+k0*14;x<Math.min(1310,b.x+80);k++,x+=14){const seat=Math.abs(k*17+row*29+side*7),jump=celebrating?-Math.abs(Math.round(Math.sin(time*13+seat)*7)):seat%7===0?Math.floor(Math.sin(time*5+seat)*2):0;if(seat%19<2){c.fillStyle='#26344a';c.fillRect(x,y+row*11-3,12,12);continue}c.fillStyle=['#cf8550','#ecc39a','#9a5d3e'][seat%3];c.fillRect(x+2,y+row*11+jump-3,4,3);if(celebrating||seat%9===0){c.fillStyle=celebrating?(this.stadiumKit?.shirtPrimary||'#ffdb29'):seat%2?'#eacc3f':'#83d9f4';c.fillRect(x-2,y+row*11+jump-6,12,2);c.fillStyle='#252536';c.fillRect(x,y+row*11-4,2,6);c.fillRect(x+7,y+row*11-4,2,6)}}}
 // Dugouts and seats on the upper concourse, visible when the camera reaches the sideline.
 for(const x of [35,65]){const p=this.project(x,0);c.fillStyle='#0b2438';c.fillRect(p.x-80,p.y-83,160,35);c.strokeStyle='#8fc8e0';c.lineWidth=3;c.strokeRect(p.x-80,p.y-83,160,35);c.fillStyle='#295c83';c.fillRect(p.x-80,p.y-83,160,7);for(let i=0;i<7;i++){c.fillStyle='#c78f64';c.fillRect(p.x-63+i*19,p.y-67,5,5);c.fillStyle=i%2?'#e0b42f':'#3a73b2';c.fillRect(p.x-65+i*19,p.y-61,9,8)}}
};
R.goal=function(x){const c=this.ctx,a=this.project(x,25),b=this.project(x,37),dir=x?1:-1,zoom=this.camera?.zoom||26,factor=Math.max(1,zoom/26),depth=58*factor,h=52*factor,near=0;
 const front=[[a.x,a.y-h],[b.x+dir*near,b.y-h],[b.x+dir*near,b.y],[a.x,a.y]],back=front.map(([px,py])=>[px+dir*depth,py-13*factor]);
 const poly=points=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath()};
 c.fillStyle='#06152166';poly([[a.x,a.y],[a.x+dir*90*factor,a.y+20*factor],[b.x+dir*95*factor,b.y+20*factor],[b.x+dir*near,b.y]]);c.fill();
 c.fillStyle='#dcecf129';poly(back);c.fill();c.strokeStyle='#c0dfe478';c.lineWidth=1;
 for(let i=0;i<=10;i++){const t=i/10;const p=front[0].map((v,k)=>v+(front[1][k]-v)*t),q=front[3].map((v,k)=>v+(front[2][k]-v)*t);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+dir*depth,p[1]-13*factor);c.lineTo(q[0]+dir*depth,q[1]-13*factor);c.lineTo(q[0],q[1]);c.stroke()}
 for(let i=0;i<=6;i++){const t=i/6;c.beginPath();c.moveTo(back[0][0],back[0][1]+h*t);c.lineTo(back[1][0],back[1][1]+h*t);c.stroke()}
 c.strokeStyle='#213348';c.lineWidth=9;c.beginPath();c.moveTo(front[3][0],front[3][1]);c.lineTo(front[0][0],front[0][1]);c.lineTo(front[1][0],front[1][1]);c.lineTo(front[2][0],front[2][1]);c.stroke();c.strokeStyle='#fff5d5';c.lineWidth=5;c.stroke();
};
R.arcadeBanner=function(label,color='#ffe745',y=225,age=1){const c=this.ctx,step=Math.max(0,5-Math.floor(age*30)),scale=age<.1?1.1:1;c.save();c.translate(640+step*35,y+(age<.16?-5:0));c.scale(scale,scale);
 c.fillStyle='#090e24e8';c.beginPath();c.moveTo(-470,-62);c.lineTo(490,-62);c.lineTo(460,35);c.lineTo(-490,35);c.closePath();c.fill();
 c.strokeStyle=color;c.lineWidth=3;c.stroke();c.font='italic 900 '+(label.length>14?44:70)+'px monospace';c.textAlign='center';c.lineJoin='miter';c.strokeStyle='#050916';c.lineWidth=13;c.strokeText(label,0,5);c.strokeStyle='#c63c29';c.lineWidth=7;c.strokeText(label,0,5);c.fillStyle=color;c.fillText(label,0,0);c.restore()};
// One shot-power gauge above each charging human's player.
R.chargeMeter=function(m){if(m.phase==='FINISHED'||m.phase==='PENALTIES')return;for(const h of m.humans||[]){const p=h.selected,input=h.input;if(!p||!input)continue;const recent=m.lastShot?.player===p&&m.elapsed-m.lastShot.time<.45;if(!input.shotCharging&&!recent)continue;
 const q=input.shotCharging?input.shotCharge:m.lastShot.charge,pr=this.project(p.x,p.y),c=this.ctx,x=Math.max(70,Math.min(1090,pr.x-60)),y=Math.max(130,pr.y-95*pr.scale);
 this.panel(x-16,y-34,152,62,10);for(let i=0;i<12;i++){c.fillStyle=i<Math.ceil(q*12)?i>8?'#ff6436':i>4?'#ffe44a':'#79e752':'#253c50';c.fillRect(x+i*10,y,8,16)}this.text(q>.98?'MAX POWER!':h.label+' POWER',x+60,y-10,15,h.color)}};
R.hud=function(m){hud.call(this,this.replayMode?{...m,messageTime:0}:m);if(!this.replayMode)this.chargeMeter(m);
 const teams=m.teams||[];for(const t of teams){const warned=t.players.filter(p=>(p.yellowCards||0)>0&&!p.sentOff),off=t.players.filter(p=>p.sentOff),c=this.ctx,x=t.id?1120:85;for(let i=0;i<Math.min(5,warned.length);i++){c.fillStyle='#ffe340';c.fillRect(x+i*12,58,8,13)}for(let i=0;i<Math.min(5,off.length);i++){c.fillStyle='#fa4151';c.fillRect(x+i*12,74,8,10)}}
};
R.cardCutscene=function(m){const scene=m.cardScene,c=this.ctx,age=scene.age,color=scene.card==='RED'?'#ff425b':'#ffe447';
 this.panel(80,105,1120,520,26);
 this.cardRef=this.cardRef||{role:'REF',team:{},face:{x:1,y:0}};const ref=this.cardRef;ref.action=age<.45?'whistle':age<.85?'point':scene.card==='RED'?'red':'yellow';
 c.fillStyle='#0006';for(const x of [370,885]){c.beginPath();c.ellipse(x,548,52,10,0,0,Math.PI*2);c.fill()}c.save();c.translate(370,545);this.sprite(ref,m,{scale:4});c.restore();c.save();c.translate(885,545);c.scale(-1,1);this.sprite({...scene.player,stun:0,burst:0,action:'idle',actionTime:0},m,{scale:4});c.restore();
 if(age<.5){const n=Math.floor(age*14);c.strokeStyle='#a0edff';c.lineWidth=3;c.beginPath();c.arc(435,300,12+n*4,-.7,.7);c.stroke();this.text('PHEEEET!',620,210,24,'#a0edff')}
 if(age>=.85){const lift=Math.min(1,(age-.85)/.25),x=610,y=420-lift*120;c.fillStyle='#071022';c.fillRect(x-6,y-6,102,146);c.fillStyle=color;c.fillRect(x,y,90,134);c.fillStyle=scene.card==='RED'?'#ff8b89':'#fff89e';c.fillRect(x+6,y+6,78,8);if(age<1.03&&(window.S9ArcadeEvolution?.settings.effects??1)>0){c.fillStyle='rgba(255,255,255,'+(.09*(window.S9ArcadeEvolution?.settings.effects??1))+')';c.fillRect(90,115,1100,500)}}
 this.text(scene.secondYellow?'2ND YELLOW → RED':scene.card==='RED'?'RED CARD!':'YELLOW CARD!',640,165,36,color);this.text('#'+scene.number+'  '+scene.name.toUpperCase(),640,580,24,'#fff');this.text(scene.team,640,605,17,'#91ddff');
};
// Brief goal cutaway keeps the celebrating stands visible even with a midfield camera.
R.crowdCutaway=function(m){const c=this.ctx,event=this.stadiumCelebration;if(!event||event.age>1.4)return;const x=110,y=410,w=830,h=155,kit=m.teams?.[event.team]?.kit||{},time=event.age;this.panel(x-18,y-38,w+36,h+56,14);this.text('GOAL! · '+(m.teams?.[event.team]?.name||'')+' · GLI SPALTI ESPLODONO',x+w/2,y-7,17,'#ffe94b');c.fillStyle='#263653';c.fillRect(x,y,w,h);for(let row=0;row<4;row++)for(let seat=0;seat<38;seat++){const px=x+8+seat*22,py=y+24+row*34,jump=-Math.abs(Math.round(Math.sin(time*14+seat*.7+row)*9));c.fillStyle='#121c30';c.fillRect(px-2,py+10,17,17);c.fillStyle=seat%3?'#edbf98':'#a96345';c.fillRect(px+4,py+jump-7,7,7);c.fillStyle=kit.shirtPrimary||'#29c6ff';c.fillRect(px+1,py+jump,13,13);c.fillStyle=kit.shirtSecondary||'#ffe037';c.fillRect(px-3,py+jump-13,21,4);c.fillStyle='#edbf98';c.fillRect(px-2,py+jump-9,3,13);c.fillRect(px+14,py+jump-9,3,13);if(seat%6===0)this.supporterFlag?.(px+16,py+jump-29,34,21,m.teams?.[event.team],time,seat+row*38,true)}};
R.draw=function(m){this.stadiumKit=m.teams?.[this.stadiumCelebration?.team]?.kit;this.sceneTime=m.presentationTime??m.elapsed;draw.call(this,m);if(this.stadiumCelebration&&!m.cardScene)this.crowdCutaway(m);if(this.replayMode){const c=this.ctx;c.strokeStyle='#f2b83d';c.lineWidth=6;for(const [x,y,dx,dy] of [[14,104,1,1],[1266,104,-1,1],[14,654,1,-1],[1266,654,-1,-1]]){c.beginPath();c.moveTo(x+dx*60,y);c.lineTo(x,y);c.lineTo(x,y+dy*40);c.stroke()}this.text('INSTANT REPLAY',1200,637,17,'#ffe45a','right')}else if(m.cardScene)this.cardCutscene(m);else if(m.phase==='FINISHED'&&m.rules.period==='GOLDEN'&&(m.presentationTime??m.elapsed)-m.elapsed<1.2)this.arcadeBanner('GOLDEN GOAL WIN!','#ffba39',185,(m.presentationTime??m.elapsed)-m.elapsed);else if(m.phase==='RESTART'&&m.restarts?.data?.foul&&m.restarts.data.age<1.5)this.arcadeBanner(m.restarts.data.type==='PENALTY'?'RIGORE!':'FALLO!','#ff6b6b',235,m.restarts.data.age);else if(m.messageTime>0&&m.phase!=='FINISHED'&&m.phase!=='PENALTIES'){
 const label=/^GOAL!/.test(m.message)?'GOAL!':m.message==='GOLDEN GOAL!'?'GOLDEN GOAL!':null;if(label)this.arcadeBanner(label,label==='GOAL!'?'#ffe447':'#ffba39',235,m.elapsed-(this.eventStart??m.elapsed));
 }
};
// Replace the old duplicate replay caption with one consistent cabinet strip.
R.text=function(s,x,y,size,color,align){if(s==='REPLAY · Z SALTA'){this.panel(430,160,420,58,12);return this.text('REPLAY · {p:z} SALTA',640,197,25,'#ffde4b')}return text.call(this,s,x,y,size,color,align)};
})();
