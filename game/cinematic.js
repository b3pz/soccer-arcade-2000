/* Opening film: original shaded canvas artwork, independent from gameplay sprites. */
(function(){
'use strict';
const W=1280,H=720,DURATION=12;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,p)=>a+(b-a)*p,smooth=p=>p*p*(3-2*p);
const shots=[{name:'final',start:0,end:1.6},{name:'dribble',start:1.6,end:3.6},{name:'bicycle',start:3.6,end:5.5},{name:'save',start:5.5,end:7},{name:'anonymous',start:7,end:8.35},{name:'net',start:8.35,end:10.3},{name:'logo',start:10.3,end:12}];
function sceneAt(t){return shots.find(s=>t<s.end)||shots[shots.length-1]}
function poly(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill()}
function grad(c,x,y,x2,y2,colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g}
function line(c,pts,width,col){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=width;c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';c.stroke()}
function title(c,s,x,y,size,color='#fff'){c.font='italic 900 '+size+'px Impact, Arial Black, sans-serif';c.textAlign='center';c.lineWidth=5;c.strokeStyle='#030712';c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y)}
function streaks(c,t,accent,intensity=1){c.save();c.globalAlpha=.35*intensity;for(let i=0;i<32;i++){const y=(i*83+Math.sin(i)*27)%620+50,x=((i*173-t*950)%1500+1500)%1500;line(c,[[x,y],[x+100+(i%4)*60,y-14]],1+i%3,accent)}c.restore()}
function stadium(c,t,close=false){
 c.fillStyle=grad(c,0,0,0,H,['#020613','#152848','#030b1d']);c.fillRect(0,0,W,H);
 const horizon=close?360:425;
 for(let row=0;row<5;row++){const y=160+row*45;c.fillStyle=row%2?'#101e36':'#182b47';c.fillRect(0,y,W,42);for(let i=0;i<85;i++){const x=i*16+(row%2)*8,col=i<43?['#2b84dd','#66bfff','#030814']:['#e33138','#ff6868','#08090e'];c.fillStyle=col[(i*7+row)%3];c.fillRect(x,y+Math.sin(i*12+row)*3,4,5)}}
 for(let i=0;i<12;i++){const x=i*113+20,y=195+(i%3)*45;poly(c,[[x,y],[x+32,y+Math.sin(t*5+i)*5],[x+28,y+18],[x,y+16]],i<6?'#268afa':'#e62c3d');line(c,[[x,y-3],[x,y+38]],2,'#d7e6ff')}
 c.fillStyle=grad(c,0,horizon,0,H,['#227361','#063b35','#082b27']);c.fillRect(0,horizon,W,H-horizon);
 for(let i=0;i<9;i++){c.fillStyle=i%2?'#ffffff05':'#00000005';poly(c,[[640+(i-4)*35,horizon],[640+(i-3)*35,horizon],[640+(i-3)*225,H],[640+(i-4)*225,H]],c.fillStyle)}
 line(c,[[0,670],[1280,510]],3,'#b9efda88');
 c.save();c.globalCompositeOperation='lighter';for(const x of [90,1190]){poly(c,[[x-30,70],[x+30,70],[x+390,620],[x-240,620]],grad(c,x,70,x,650,['#b9eaff24','#b9eaff00']));for(let i=0;i<8;i++){c.shadowColor='#d7f5ff';c.shadowBlur=20;c.fillStyle='#e3faff';c.fillRect(x-38+i*11,72,8,8)}}c.restore();
}
// Articulated shaded figures; sizes and poses deliberately differ from the match sprites.
function player(c,x,y,scale,kit,pose,t,flip=1){
 c.save();c.translate(x,y);c.scale(scale*flip,scale);
 const phase=t*10,run=pose==='run',kick=pose==='kick',jump=pose==='bicycle',save=pose==='save';
 const hip=[0,-70],head=[-4,-164];
 const knees=save?[[45,-55],[-32,-38]]:jump?[[44,-120],[-42,-67]]:kick?[[40,-55],[-23,-42]]:run?[[Math.sin(phase)*36,-38],[-Math.sin(phase)*34,-35]]:[[20,-36],[-15,-38]];
 const feet=save?[[84,-41],[-65,-4]]:jump?[[70,-165],[-69,-30]]:kick?[[82,-48],[-35,0]]:run?[[Math.sin(phase+.5)*55,0],[-Math.sin(phase+.5)*49,-5]]:[[28,0],[-23,0]];
 const skin=grad(c,-20,-160,25,-50,['#f2c6a1','#b46d49','#653b32']);
 for(let i=1;i>=0;i--){line(c,[hip,knees[i],feet[i]],15,'#070c15');line(c,[hip,knees[i],feet[i]],11,skin);line(c,[knees[i],feet[i]],12,kit==='keeper'?'#acde31':'#101827');line(c,[[feet[i][0]-8,feet[i][1]+3],[feet[i][0]+12,feet[i][1]+2]],10,'#182233');line(c,[[feet[i][0]-5,feet[i][1]],[feet[i][0]+11,feet[i][1]-1]],3,'#d4f3ff')}
 const shirt=kit==='inter'?'#1477dc':kit==='milan'?'#e13643':'#c4f238';
 poly(c,[[-23,-142],[20,-140],[26,-91],[16,-72],[-18,-73],[-28,-102]],grad(c,-30,-135,35,-85,[shirt,shirt,'#071122']),'#081123');
 if(kit!=='keeper'){for(let i=0;i<3;i++)poly(c,[[-19+i*14,-141],[-12+i*14,-141],[-7+i*13,-76],[-15+i*13,-76]],'#080d18');line(c,[[-24,-135],[18,-135]],2,shirt);poly(c,[[-13,-142],[0,-133],[9,-141]],'#f3ece4')}
 poly(c,[[-18,-79],[18,-79],[27,-57],[1,-52],[-27,-61]],grad(c,-25,-75,25,-52,['#293547','#080d16']),'#030713');
 const hands=save?[[77,-170],[-69,-164]]:jump?[[-62,-119],[53,-99]]:run?[[35,-100],[-40,-125]]:[[-46,-105],[44,-114]];
 for(let i=0;i<2;i++){const shoulder=[i?18:-20,-132],elbow=[hands[i][0]*.63,(hands[i][1]-132)/2];line(c,[shoulder,elbow,hands[i]],13,'#101725');line(c,[shoulder,elbow,hands[i]],9,skin);oval(c,hands[i][0],hands[i][1],6,6,save?'#eefcff':skin)}
 line(c,[[0,-141],[-2,-153]],13,skin);oval(c,...head,16,21,skin);poly(c,[[-20,-166],[-16,-184],[4,-186],[14,-174],[10,-166],[-2,-174]],'#111521');line(c,[[-14,-175],[-7,-179],[5,-179]],2,'#718194');line(c,[[0,-162],[10,-160]],2,'#472b28');
 c.restore();
}
function ball(c,x,y,r,t,fire=false,dx=1,fx=1){
 if(fire){c.save();c.globalCompositeOperation='lighter';for(let i=15;i>=0;i--){const k=i/15,xx=x-dx*(r*2+260)*k,yy=y+Math.sin(t*22-i*.9)*r*.4*k;c.globalAlpha=(1-k)*.7*fx;oval(c,xx,yy,r*(1-k*.8),r*(1-k*.7),i<4?'#fff3a2':i<9?'#ffae26':'#ff4b0c')}c.restore()}
 c.save();c.translate(x,y);c.rotate(t*3);c.shadowColor=fire?'#ff9b28':'#b3dfff';c.shadowBlur=fire?25*fx:8;oval(c,0,0,r,r,grad(c,-r,-r,r,r,['#ffffff','#dce6ef','#65849e']));c.shadowBlur=0;
 for(let i=0;i<6;i++){const a=i*Math.PI/3,rr=i?r*.74:0;let pts=[];for(let j=0;j<5;j++){const b=j*Math.PI*2/5+.1;pts.push([Math.cos(a)*rr+Math.cos(b)*r*.24,Math.sin(a)*rr+Math.sin(b)*r*.24])}poly(c,pts,'#142338');if(i)line(c,[[0,0],[Math.cos(a)*rr,Math.sin(a)*rr]],r*.025,'#405a70')}
 oval(c,-r*.35,-r*.4,r*.15,r*.08,'#ffffffbd');c.restore();
}
function goal(c,t,broken=false,p=0){
 const tl=[380,205],tr=[1050,205],br=[1145,610],bl=[280,610];
 c.save();c.globalAlpha=.8;
 for(let i=0;i<=24;i++){const k=i/24,x=mix(tl[0],tr[0],k),bx=mix(bl[0],br[0],k);if(broken&&k>.35&&k<.67){const rip=Math.sin(k*25)*60*p;line(c,[[x,205],[mix(x,bx,.35),340-rip]],1.5,'#c7e7f9');line(c,[[mix(x,bx,.8)+rip,530+70*p],[bx,610]],1.5,'#c7e7f9')}else line(c,[[x,205],[bx,610]],1,'#d7eaf585')}
 for(let i=0;i<=14;i++){const k=i/14,l=mix(380,280,k),r=mix(1050,1145,k),y=mix(205,610,k);if(broken&&k>.25&&k<.8){line(c,[[l,y],[610-100*p,y+Math.sin(k*20)*35*p]],1.4,'#e0f5ff');line(c,[[820+95*p,y-20*p],[r,y]],1.4,'#e0f5ff')}else line(c,[[l,y],[r,y]],1,'#d7eaf585')}
 c.restore();line(c,[bl,tl,tr,br],14,'#283c52');line(c,[[283,610],[382,202],[1052,202],[1148,610]],7,'#ebf7ff');
}
function logoTarget(c){c.save();c.font='italic 900 85px "Arial Black","Impact","Helvetica Neue",sans-serif';const parts='SoCCER'.split('').map(ch=>ch==='o'?119:(c.measureText(ch).width+4.25)*2);c.restore();return {x:640-parts.reduce((a,b)=>a+b,0)/2+parts[0]+parts[1]/2,y:182,r:61.2}}
function cue(h,key,at,t,kind){if(t>=at)h.cue?.(key,kind)}
function draw(c,t,h={}){
 t=clamp(t,0,DURATION);const scene=sceneAt(t),u=(t-scene.start)/(scene.end-scene.start),fx=h.effects??1,fire=h.fantasy!==false;
 c.save();c.imageSmoothingEnabled=true;
 if(scene.name==='logo'){
  const p=smooth(clamp(u/.72)),target=logoTarget(c);h.titleBackground?.(t);
  h.logo?.(clamp(u*2));const x=mix(710,target.x,p),y=mix(360,target.y,p),r=mix(72,target.r,p);
  ball(c,x,y,r,t,fire&&u<.75,-1,fx);
  if(u<.65){c.save();c.globalAlpha=(1-u/.65)*fx;for(let i=0;i<18;i++){const a=i*2.399,radius=80+u*400;oval(c,x+Math.cos(a)*radius,y+Math.sin(a)*radius,3,2,i%2?'#ffb51b':'#e5f6ff')}c.restore()}
 }else{
  stadium(c,t,scene.name!=='final');
  if(scene.name==='final'){
   const z=1+u*.13;c.save();c.translate(640,360);c.scale(z,z);c.translate(-640,-360);goal(c,t);player(c,240,600,1.7,'inter','run',.12);player(c,1050,615,1.7,'milan','run',.2,-1);c.restore();
   title(c,'INTER  ×  MILAN',640,115,58);title(c,'LA FINALE',640,166,22,'#e7bf68');title(c,'89:59   •   2 – 2',640,658,24,'#e7bf68');
   c.fillStyle='rgba(0,0,0,'+(1-clamp(u*4))+')';c.fillRect(0,0,W,H);cue(h,'whistle',.6,t,'whistle');
  }else if(scene.name==='dribble'){
   streaks(c,t,'#75dfff',fx);const x=420+u*260;
   player(c,x-160,640,2,'milan','run',t,-1);player(c,x+90,615,2.45,'inter','run',t);player(c,1040-u*500,645,2,'milan','kick',t,-1);
   ball(c,x+145+Math.sin(u*Math.PI*4)*40,620-Math.abs(Math.sin(u*Math.PI*4))*28,23,t);
   for(let i=0;i<12;i++){c.fillStyle='#c9fff766';c.fillRect(460+i*13-u*90,650+Math.sin(i)*9,5,2)}
   cue(h,'dribble1',2.05,t,'kick');cue(h,'dribble2',2.8,t,'kick');
  }else if(scene.name==='bicycle'){
   streaks(c,t,'#ff647c',fx);player(c,345,655,1.9,'inter','run',t);player(c,1030,640,1.8,'inter','run',t,-1);
   c.save();c.translate(660,465-Math.sin(u*Math.PI)*120);c.rotate(-.4-u*1.55);player(c,0,0,2.3,'milan','bicycle',t);c.restore();
   ball(c,mix(550,1100,u),250-Math.sin(u*Math.PI)*80,27,t);cue(h,'bicycle',4.35,t,'powerShot');
  }else if(scene.name==='save'){
   goal(c,t);c.save();c.translate(670+u*210,510-Math.sin(u*Math.PI)*120);c.rotate(mix(-.1,1.15,u));player(c,0,0,2,'keeper','save',t);c.restore();
   const p=clamp(u/.6);ball(c,mix(300,940,p),mix(350,255,p)-Math.sin(p*Math.PI)*50,29,t);cue(h,'save',6.25,t,'saveSound');
   if(u>.6){c.save();c.globalAlpha=(1-u)*fx;streaks(c,t,'#e5ff9b',1);c.restore()}
  }else if(scene.name==='anonymous'){
   // No shirt, badge, face or team-colored sock is visible in the deciding shot.
   c.fillStyle=grad(c,0,0,W,H,['#02050ce8','#152231a0','#02050ce8']);c.fillRect(0,0,W,H);
   streaks(c,t,'#a3daff',fx);const k=smooth(clamp((u-.18)/.55));
   c.save();c.translate(mix(145,675,k),mix(350,480,k));c.rotate(mix(-.45,.08,k));poly(c,[[-245,-35],[-100,-52],[25,-25],[90,18],[82,68],[-82,60],[-245,24]],grad(c,-220,-40,80,60,['#0a101a','#3c4c61','#0a111b']),'#6e8398');line(c,[[-128,54],[74,56]],9,'#bdd2df');for(let i=0;i<5;i++)line(c,[[-55+i*17,-14],[-65+i*17,7]],4,'#abc0d1');c.restore();
   const kicked=u>.7,bp=clamp((u-.7)/.3);ball(c,710+bp*450,500-bp*250,64-bp*25,t,kicked&&fire,1,fx);cue(h,'decidingShot',7.945,t,'powerShot');
  }else if(scene.name==='net'){
   const impact=clamp((u-.38)/.25);goal(c,t,u>.38,impact);
   player(c,1100,620,1.8,'keeper','save',t);const k=clamp(u/.43);ball(c,mix(90,710,k),mix(560,360,k)-Math.sin(k*Math.PI)*70,mix(100,72,k),t,fire,1,fx);
   if(u>.38){cue(h,'netBreak',9.091,t,'slam');h.impact?.(impact);for(let i=0;i<45;i++){const a=i*2.399,dist=impact*(100+(i%9)*28),x=710+Math.cos(a)*dist,y=360+Math.sin(a)*dist+impact*impact*95;line(c,[[x,y],[x+Math.cos(a)*16,y+Math.sin(a)*18]],1.6,i%3?'#e4f8ff':'#ffba47')}c.save();c.globalAlpha=(1-impact)*.3*fx;c.fillStyle='#fff4bc';c.fillRect(0,0,W,H);c.restore()}
  }
 }
 // Widescreen framing and subtle vignette, without the gameplay pixel/CRT pass.
 const shade=c.createRadialGradient(640,340,230,640,340,750);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#01040bc0');c.fillStyle=shade;c.fillRect(0,0,W,H);c.fillStyle='#02040b';c.fillRect(0,0,W,36);c.fillRect(0,H-36,W,36);
 if(scene.name!=='logo'&&t>1.6){c.save();c.globalAlpha=.5;title(c,'FINALE • MILANO',155,65,16,'#d6e7ff');c.restore()}
 c.restore();return scene.name;
}
window.S9ArcadeCinematic={duration:DURATION,shots,sceneAt,draw,logoTarget,ball};
})();
