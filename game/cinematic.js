/* Opening film, built from the game's bitmaps: stadium paintings, the goal backdrop, the celebrating
   crowd sheet, the ball sprite and the real player sprites (fictional kits), staged with camera moves. */
(function(){
'use strict';
const W=1280,H=720,DURATION=12;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,p)=>a+(b-a)*p,smooth=p=>p*p*(3-2*p),ease=p=>1-(1-p)*(1-p);
const shots=[{name:'final',start:0,end:1.6},{name:'dribble',start:1.6,end:3.6},{name:'bicycle',start:3.6,end:5.5},{name:'save',start:5.5,end:7},{name:'anonymous',start:7,end:8.35},{name:'net',start:8.35,end:10.3},{name:'logo',start:10.3,end:12}];
function sceneAt(t){return shots.find(s=>t<s.end)||shots[shots.length-1]}
const cache={},img=src=>{if(!(src in cache)){try{const i=new Image();i.src=src;cache[src]=i}catch(e){cache[src]=null}}return cache[src]};
const ready=i=>!!(i&&i.complete&&i.naturalWidth);
const ART={night:'arcade/assets/arcade-menu-background.png',day:'arcade/assets/cabinet-90s.png',goal:'arcade/assets/freekick-backdrop.png?v=fk-1',crowd:'arcade/assets/crowd-celebration.png?v=crowd-1',ball:'arcade/assets/ball.png?v=ball-1'};
for(const src of Object.values(ART))img(src);
// Fictional finalists.
const BLUE={shirtPrimary:'#2f6fe4',shirtSecondary:'#ffffff',shorts:'#ffffff',socks:'#2f6fe4',pattern:'trim'},RED={shirtPrimary:'#d22b2b',shirtSecondary:'#ffffff',shorts:'#1b1b1f',socks:'#d22b2b',pattern:'trim'},KEEPER={shirtPrimary:'#9bd424',shirtSecondary:'#1b1b1f',shorts:'#1b1b1f',socks:'#9bd424',pattern:'solid'};

function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill()}
function title(c,s,x,y,size,color='#fff'){c.font='italic 900 '+size+'px Impact, Arial Black, sans-serif';c.textAlign='center';c.lineWidth=Math.max(4,size/9);c.strokeStyle='#030712';c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y)}
// A painting framed by the camera: zoom about a point of the picture, optional pan in screen pixels.
function shot(c,src,zoom=1,fx=.5,fy=.5,pan=0,dark=0){const im=img(src);if(!ready(im)){c.fillStyle='#071226';c.fillRect(0,0,W,H);return}const k=Math.max(W/im.naturalWidth,H/im.naturalHeight)*zoom,w=im.naturalWidth*k,h=im.naturalHeight*k;
 const x=clamp(W/2-fx*w+pan,W-w,0),y=clamp(H/2-fy*h,H-h,0),s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(im,x,y,w,h);c.imageSmoothingEnabled=s;if(dark){c.fillStyle='rgba(2,5,14,'+dark+')';c.fillRect(0,0,W,H)}return {x,y,k}}
function streaks(c,t,color,amount=1){c.save();c.globalAlpha=.3*amount;c.fillStyle=color;for(let i=0;i<26;i++){const y=(i*83+Math.sin(i)*27)%600+60,x=((i*173-t*1300)%1500+1500)%1500;c.fillRect(x,y,90+(i%4)*50,2+i%2)}c.restore()}

// Real player sprites through the match renderer (kit recolour, timed animation rows).
let renderer=null;const figures=new Map();
function sprite(c,key,x,y,scale,action,kit,t,{flip=false,rot=0,shadow=true,silhouette=false,alpha=1}={}){
 if(!renderer&&window.S9ArcadeEngine&&c.canvas)try{renderer=new S9ArcadeEngine.Renderer(c.canvas)}catch(e){renderer=null}
 if(shadow)oval(c,x,y+4,34*scale/3,8*scale/3,'#0006');if(!renderer)return;
 let p=figures.get(key);if(!p){p={role:'ST',team:{},face:{x:1,y:0},number:7};figures.set(key,p)}p.action=action;p.actionTime=action==='shoot'||action==='volley'?.42:action.startsWith('save_')||action.startsWith('dive')?.7:.5;p.team={kit};
 renderer.ctx=c;renderer.animationTime=t;c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;if(silhouette)c.filter='brightness(0) saturate(0)';c.translate(x,y);if(flip)c.scale(-1,1);if(rot)c.rotate(rot);
 try{renderer.sprite(p,{elapsed:t,presentationTime:t,ball:{owner:null},phase:'PLAY',humans:[]},{scale})}catch(e){}c.restore()}
// Ball: the pixel sprite sheet, spinning; optional comet of fire behind it.
function ball(c,x,y,r,t,fire=false,dx=1,fx=1){
 if(fire){c.save();c.globalCompositeOperation='lighter';for(let i=15;i>=0;i--){const k=i/15,xx=x-dx*(r*2+260)*k,yy=y+Math.sin(t*22-i*.9)*r*.4*k;c.globalAlpha=(1-k)*.7*fx;oval(c,xx,yy,r*(1-k*.8),r*(1-k*.7),i<4?'#fff3a2':i<9?'#ffae26':'#ff4b0c')}c.restore()}
 const im=img(ART.ball);if(ready(im)){const f=((Math.floor(t*14)%8)+8)%8,s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(im,f*64,0,64,64,Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));c.imageSmoothingEnabled=s}else oval(c,x,y,r,r,'#f2f6fa')}
// Celebrating end, tinted with the blue kit (same masks as the match cutaway).
let crowdSheet=null;
function crowd(c,x,y,w,t){const im=img(ART.crowd);if(!ready(im))return;if(!crowdSheet&&typeof document!=='undefined'){const out=document.createElement('canvas');out.width=420;out.height=480;const o=out.getContext('2d'),l=document.createElement('canvas');l.width=420;l.height=480;const q=l.getContext('2d');if(o&&q){o.drawImage(im,0,0,420,480,0,0,420,480);[BLUE.shirtPrimary,BLUE.shirtSecondary].forEach((color,i)=>{q.globalCompositeOperation='source-over';q.clearRect(0,0,420,480);q.drawImage(im,420*(i+1),0,420,480,0,0,420,480);q.globalCompositeOperation='multiply';q.fillStyle=color;q.fillRect(0,0,420,480);q.globalCompositeOperation='destination-in';q.drawImage(im,420*(i+1),0,420,480,0,0,420,480);o.drawImage(l,0,0)});crowdSheet=out}}
 const f=Math.floor(t*9)%4,s=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(crowdSheet||im,0,f*120,420,120,x,y,w,w*120/420);c.imageSmoothingEnabled=s}
// Picture coordinates -> screen, for a framing returned by shot().
const at=(v,ix,iy)=>v?{x:v.x+ix*v.k,y:v.y+iy*v.k}:{x:ix,y:iy};
// The goal backdrop's stand is coarse up close: the detailed supporters sheet is laid over it.
function goalStand(c,v,t,team){if(!v)return;const a=at(v,0,4),b=at(v,1280,222),h=b.y-a.y,w=h*420/120;c.save();c.beginPath();c.rect(a.x,a.y,b.x-a.x,h);c.clip();for(let x=a.x;x<b.x;x+=w)crowd(c,x,a.y,w,team?t:0);c.restore()}
function flash(c,a,color='#fff7d0'){if(a<=0)return;c.save();c.globalAlpha=clamp(a);c.fillStyle=color;c.fillRect(0,0,W,H);c.restore()}
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
 }else if(scene.name==='final'){
  // Night stadium, slow push in; the scoreboard of the final.
  shot(c,ART.night,1+u*.12,.5,.62,0,.15);title(c,'LA FINALE',640,150,64,'#ffe36b');title(c,'89:59   •   2 – 2',640,205,26,'#d6e7ff');
  flash(c,1-clamp(u*4),'#000');cue(h,'whistle',.6,t,'whistle');
 }else if(scene.name==='dribble'){
  // Tracking shot along the touchline: the blue 10 takes on two red defenders.
  shot(c,ART.day,1.7,.5,.8,-u*320);streaks(c,t,'#ffffff',fx);const x=470+u*220,ground=700;
  sprite(c,'chaser',x-330+u*70,ground-10,7.4,'run',RED,t);
  const slide=clamp((u-.28)/.45),slider=1320-slide*760;
  sprite(c,'star',x,ground,8.4,'dribble',BLUE,t);sprite(c,'slider',slider,ground+8,7.8,u<.28?'run':u<.73?'hard_tackle':'fall',RED,t,{flip:true});
  const hop=Math.abs(Math.sin(u*Math.PI*5));ball(c,x+190,ground-28-hop*(slide>0&&slide<.7?190:40),40,t);
  cue(h,'dribble1',2.05,t,'kick');cue(h,'dribble2',2.8,t,'kick');
 }else if(scene.name==='bicycle'){
  // Low angle into the floodlights: overhead kick.
  shot(c,ART.night,1.75,.16+u*.08,.3);streaks(c,t,'#ffe9a8',fx);const lift=Math.sin(clamp(u*1.15)*Math.PI);
  sprite(c,'star',660,620-lift*150,8.6,'volley',BLUE,t,{rot:-.5-u*2.6,shadow:false});
  const hit=u>.45,k=clamp(u/.45),b=hit?clamp((u-.45)/.55):0;ball(c,hit?mix(560,1300,b):mix(-40,560,k),hit?mix(250,40,b):mix(560,250,k)-Math.sin(k*Math.PI)*80,40,t,hit&&fire,1,fx);
  if(u>.45&&u<.55)flash(c,(.55-u)*4*fx);cue(h,'bicycle',4.35,t,'powerShot');
 }else if(scene.name==='save'){
  // From behind the goal line: the keeper flies and tips it over.
  const v=shot(c,ART.goal,1.45,.5,.42);goalStand(c,v,t,false);const p=clamp(u/.58),k=ease(clamp(u/.6)),line=at(v,640,430),corner=at(v,880,262);
  sprite(c,'keeper',mix(line.x,corner.x-40,k),line.y-k*70,5.2,u<.12?'gk_idle':'save_tip_right',KEEPER,t,{rot:-k*.25});
  const tipped=u>.58,q=clamp((u-.58)/.42);ball(c,tipped?mix(corner.x+30,corner.x+160,q):mix(200,corner.x+30,p),tipped?mix(corner.y-40,-40,q):mix(700,corner.y-40,p)-Math.sin(p*Math.PI)*80,38,t);
  if(tipped&&q<.25)flash(c,(.25-q)*2*fx);cue(h,'save',6.25,t,'saveSound');
 }else if(scene.name==='anonymous'){
  // The deciding strike, seen as a silhouette against the lit goal.
  const v=shot(c,ART.goal,1.08,.5,.5,0,.35);goalStand(c,v,t,false);c.fillStyle='rgba(2,5,14,.35)';c.fillRect(0,0,W,H*.2);
  sprite(c,'taker',330,760,9,u<.5?'idle':'shoot',null,t,{silhouette:true,shadow:false});
  if(u>.55){const b=ease(clamp((u-.55)/.45));ball(c,mix(470,700,b),mix(650,300,b),mix(30,16,b),t,fire,1,fx)}else ball(c,470,660,30,0);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.25*fx;oval(c,640,240,420,160,'#ffe8a8');c.restore();cue(h,'decidingShot',7.945,t,'powerShot');
 }else if(scene.name==='net'){
  // Top corner: the net bellies, the keeper is beaten, the end erupts.
  const impact=clamp((u-.38)/.25),view=shot(c,ART.goal,1.9,.62,.33);goalStand(c,view,t,u>.38);const corner=at(view,860,275);
  if(u>.38&&view){c.save();c.beginPath();c.ellipse(corner.x,corner.y,170,120,0,0,Math.PI*2);c.clip();const s=1+.14*Math.sin(impact*Math.PI),im=img(ART.goal);c.translate(corner.x,corner.y);c.scale(s,s);c.translate(-corner.x,-corner.y);c.imageSmoothingEnabled=false;c.drawImage(im,view.x,view.y,im.naturalWidth*view.k,im.naturalHeight*view.k);c.restore()}
  const foot=at(view,700,430);if(u<.6)sprite(c,'keeper',mix(foot.x-260,foot.x-60,clamp(u/.45)),foot.y-clamp(u/.45)*60,5.6,'save_stretch_right',KEEPER,t,{rot:-.15});
  const k=clamp(u/.4);ball(c,u<.38?mix(-60,corner.x,k):corner.x+Math.sin(impact*9)*8*(1-impact),u<.38?mix(620,corner.y,k):corner.y,40,t,fire&&u<.38,1,fx);
  if(u>.38){cue(h,'netBreak',9.091,t,'slam');h.impact?.(impact);flash(c,(1-impact)*.5*fx);const rise=ease(clamp((u-.45)/.3));crowd(c,0,H-rise*360,W,t);if(u>.55)sprite(c,'star',360,H+40-rise*60,9,'celebrate',BLUE,t,{shadow:false})}
 }
 // Widescreen bars and vignette (not on the title, which has its own frame).
 if(scene.name!=='logo'){const shade=c.createRadialGradient(640,340,260,640,340,760);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#01040b99');c.fillStyle=shade;c.fillRect(0,0,W,H);c.fillStyle='#02040b';c.fillRect(0,0,W,36);c.fillRect(0,H-36,W,36)}
 c.restore();return scene.name;
}
window.S9ArcadeCinematic={duration:DURATION,shots,sceneAt,draw,logoTarget,ball};
})();
