/* Opening film, built from the game's bitmaps: stadium paintings, the goal backdrop, the celebrating
   crowd sheet, the ball sprite and the real player sprites (fictional kits), staged with camera moves. */
(function(){
'use strict';
const W=1280,H=720,DURATION=12;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,p)=>a+(b-a)*p,smooth=p=>p*p*(3-2*p),ease=p=>1-(1-p)*(1-p);
// Painted cut: the blue 10 dribbles and strikes, the keeper saves, the red 9 wins it with an overhead kick into the net.
const shots=[{name:'final',start:0,end:1.5},{name:'dribble',start:1.5,end:3.2},{name:'anonymous',start:3.2,end:4.3},{name:'save',start:4.3,end:5.8},{name:'bicycle',start:5.8,end:7.9},{name:'net',start:7.9,end:10.1},{name:'logo',start:10.1,end:12}];
// Camera per painting (cell of the 3x2 sheet): zoom and focus point (0..1 of the cell) from start to end, plus impact time (u).
const MOVES={final:{cell:0,z:[1.05,1.32],f:[[.5,.62],[.5,.8]]},dribble:{cell:1,z:[1.5,1.12],f:[[.75,.62],[.45,.5]],hit:.55},anonymous:{cell:4,z:[1.6,1.15],f:[[.4,.45],[.62,.55]],hit:.42},save:{cell:3,z:[1.15,1.55],f:[[.3,.6],[.72,.3]],hit:.62},bicycle:{cell:2,z:[1.55,1.1],f:[[.45,.7],[.75,.25]],hit:.55},net:{cell:5,z:[1.7,1.08],f:[[.62,.5],[.5,.5]],hit:.2}};
function painting(c,name,u,t,fx){const A=window.S9ArcadeArt,im=A?.image('film'),mv=MOVES[name];if(!mv||!A?.ready(im))return false;
 const fw=im.naturalWidth/3,fh=im.naturalHeight/2,e=smooth(u),zoom=mix(mv.z[0],mv.z[1],e),fxp=mix(mv.f[0][0],mv.f[1][0],e),fyp=mix(mv.f[0][1],mv.f[1][1],e),
  hit=mv.hit!=null?Math.max(0,1-Math.abs(u-mv.hit)/.08):0,shake=hit*14*fx,sw=fw/zoom,sh=sw*9/16>fh/zoom?fh/zoom:sw*9/16,cx=(mv.cell%3)*fw,cy=Math.floor(mv.cell/3)*fh;
 const sx=cx+clamp(fxp*fw-sw/2,0,fw-sw),sy=cy+clamp(fyp*fh-sh/2,0,fh-sh);c.save();c.imageSmoothingEnabled=true;c.translate(Math.sin(t*90)*shake,Math.cos(t*77)*shake);c.drawImage(im,sx,sy,sw,sh,-20,-12,1320,744);c.restore();
 if(hit>0)flash(c,hit*.45*fx,'#fff4d0');if(u<.08)flash(c,(1-u/.08)*.6*fx,'#ffffff');
 if(['dribble','bicycle','net'].includes(name))streaks(c,t,name==='net'?'#ffb347':'#e8f4ff',fx*(.4+.6*e));return true}
function sceneAt(t){return shots.find(s=>t<s.end)||shots[shots.length-1]}
const cache={},img=src=>{if(!(src in cache)){try{const i=new Image();i.src=src;cache[src]=i}catch(e){cache[src]=null}}return cache[src]};
const ready=i=>!!(i&&i.complete&&i.naturalWidth);
const ART={night:'arcade/assets/arcade-menu-background.png',goal:'arcade/assets/freekick-backdrop.png?v=fk-1',crowd:'arcade/assets/crowd-celebration.png?v=crowd-1',ball:'arcade/assets/ball.png?v=ball-1'};
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
// Cell pixel (px,py) of an atlas frame -> offset from the figure's feet, for a sprite drawn at this scale
// (the renderer draws the 128 px cell at 90·scale, feet 3·scale above the cell bottom line).
const cellPoint=(px,py,S)=>({x:(px*90/128-45)*S,y:(py*90/128-83)*S});
// Measured on the atlas: kicking boot of shoot frames 2 (ground strike) and 3 (leg straight out); top glove of the tip-over save, frame 4.
const BOOT_LOW=[83.3,106.1],BOOT_HIGH=[94.6,56.4],GLOVE_TIP=[83.5,8.3],GLOVE_STRETCH=[111.8,48.3];
// One exact atlas frame (anim row, index), so contacts can be timed to the frame.
function frame(c,key,x,y,scale,anim,k,kit,t,opts){const F=window.S9ArcadeFrames;if(F?.[anim])F['cine_'+key]=[F[anim][Math.max(0,Math.min(F[anim].length-1,k))]];sprite(c,key,x,y,scale,'cine_'+key,kit,t,opts)}
function sprite(c,key,x,y,scale,action,kit,t,{flip=false,rot=0,shadow=true,silhouette=false,alpha=1}={}){
 if(!renderer&&window.S9ArcadeEngine&&c.canvas)try{renderer=new S9ArcadeEngine.Renderer(c.canvas)}catch(e){renderer=null}
 if(shadow)oval(c,x,y+4,34*scale/3,8*scale/3,'#0006');if(!renderer)return;
 let p=figures.get(key);if(!p){p={role:'ST',team:{},face:{x:1,y:0},number:7};figures.set(key,p)}p.action=action;p.actionTime=action==='shoot'||action==='volley'?.42:action.startsWith('save_')||action.startsWith('dive')?.7:.5;p.team={kit};
 renderer.ctx=c;renderer.animationTime=t;c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;if(silhouette)c.filter='brightness(0) saturate(0)';c.translate(x,y);if(flip)c.scale(-1,1);if(rot)c.rotate(rot);
 try{renderer.sprite(p,{elapsed:t,presentationTime:t,ball:{owner:null},phase:'PLAY',humans:[]},{scale})}catch(e){}c.restore()}
// Ball: the pixel sprite sheet, spinning; optional comet of fire behind it.
function ball(c,x,y,r,t,fire=false,dx=1,fx=1){
 if(fire&&!window.S9ArcadeArt?.effectTrail(c,'fire',x,y,r,dx,0,t,fx)){c.save();c.globalCompositeOperation='lighter';for(let i=15;i>=0;i--){const k=i/15,xx=x-dx*(r*2+260)*k,yy=y+Math.sin(t*22-i*.9)*r*.4*k;c.globalAlpha=(1-k)*.7*fx;oval(c,xx,yy,r*(1-k*.8),r*(1-k*.7),i<4?'#fff3a2':i<9?'#ffae26':'#ff4b0c')}c.restore()}
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
  const p=smooth(clamp(u/.72)),target=window.S9ArcadeArt?.ready(S9ArcadeArt.image('logo'))?S9ArcadeArt.logoTarget():logoTarget(c);h.titleBackground?.(t);
  h.logo?.(clamp(u*2),u);const x=mix(710,target.x,p),y=mix(360,target.y,p),r=mix(72,target.r,p);
  c.save();c.globalAlpha*=u>.75?clamp((1-u)/.25):1;ball(c,x,y,r,t,fire&&u<.75&&!!window.S9ArcadeArt?.ready(S9ArcadeArt.image('fire')),-1,fx);c.restore();
  if(u<.65){c.save();c.globalAlpha=(1-u/.65)*fx;for(let i=0;i<18;i++){const a=i*2.399,radius=80+u*400;oval(c,x+Math.cos(a)*radius,y+Math.sin(a)*radius,3,2,i%2?'#ffb51b':'#e5f6ff')}c.restore()}
 }else if((scene.name!=='net'||fire)&&painting(c,scene.name,u,t,fx)){
  if(scene.name==='final'){title(c,'LA FINALE',640,125,46,'#ffe36b');title(c,'INTERNOVA × MILARA · 89:59 · 2–2',640,178,24,'#d6e7ff');flash(c,1-clamp(u*4),'#000')}
  for(const [key,when,kind] of [['whistle',.6,'whistle'],['dribble1',2.1,'kick'],['dribble2',2.45,'kick'],['decidingShot',3.66,'powerShot'],['save',5.23,'saveSound'],['bicycle',6.95,'powerShot'],['netBreak',8.34,'slam']])cue(h,key,when,t,kind);
  if(scene.name==='net'){const impact=clamp((u-.2)/.25);h.impact?.(impact)}
 }else if(scene.name==='final'){
  // One night, one stadium for the whole film: wide push-in on the final's last minute.
  shot(c,ART.night,1+u*.12,.5,.62,0,.15);title(c,'LA FINALE',640,150,64,'#ffe36b');title(c,'89:59   •   2 – 2',640,205,26,'#d6e7ff');
  flash(c,1-clamp(u*4),'#000');cue(h,'whistle',.6,t,'whistle');
 }else if(scene.name==='dribble'){
  // Pitch level, tracking: the blue 10 runs at the red slider, taps the ball on, then flicks it over him.
  shot(c,ART.night,1.7,.5,.9,-u*300,.05);streaks(c,t,'#cfe6ff',fx*.6);const ground=690,x=360+u*360,S=7.6;
  sprite(c,'chaser',x-600-clamp((u-.6)/.4)*160+u*10,ground-6,6.8,'run',RED,t);
  // The slider comes from the right along the grass and ends up beyond the 10, on the left: nobody passes through anybody.
  const slide=clamp((u-.3)/.36),after=clamp((u-.66)/.34),slider=u<.66?mix(1350,x-270,slide):x-270-ease(after)*120;
  // He slides along a line a little deeper than the 10's (higher in frame, slightly smaller): the 10 runs in front of him and hops the outstretched leg.
  const lane=ground-46;if(u<.3)sprite(c,'slider',slider,lane,6.6,'run',RED,t,{flip:true});else if(u<.66)sprite(c,'slider',slider,lane,6.6,'hard_tackle',RED,t,{flip:true});else frame(c,'slider',slider,lane,6.6,'fall',5,RED,t,{flip:true}); // stays down after missing
  // The 10 flicks the ball first (u=.40), then hurdles the tackle: the bodies cross at u≈.57 and overlap in x for u .51-.62.
  const hurdle=Math.sin(clamp((u-.47)/.2)*Math.PI)*90;sprite(c,'star',x,ground-hurdle,S,'dribble',BLUE,t);
  const foot=x+17*S+22,flick=clamp((u-.40)/.60),tap=Math.abs(Math.sin(t*Math.PI*5))*14;
  // Flick: straight up fast (well clear of the sliding body), then on and out of the top of the frame.
  ball(c,flick?foot+flick*flick*320:foot,flick?ground-24-ease(clamp(flick/.25))*430-flick*380:ground-24-tap,34,t);
  cue(h,'dribble1',2.1,t,'kick');cue(h,'dribble2',2.45,t,'kick');
 }else if(scene.name==='bicycle'){
  // Same night, low angle: the ball drops in from the right; the 10 leans back and meets it with the leg straight up.
  shot(c,ART.night,1.5,.5,.55,0,.05);streaks(c,t,'#ffe9a8',fx*.5);const S=8,uc=.5;
  const jump=smooth(clamp((u-.2)/.3)),fall=clamp((u-.62)/.38),lift=jump*190-fall*fall*190,a=-1.05*jump+.5*fall,pivot={x:700,y:600-lift};
  // Frame by time: run-up, wind-up, leg out exactly at contact (u=.5), follow-through.
  const k=u<.2?-1:u<uc-.12?1:u<uc-.04?2:u<uc+.08?3:Math.min(7,4+Math.floor((u-uc-.08)/.08));
  const hip=30*S,b=cellPoint(...BOOT_HIGH,S),boot={x:pivot.x+b.x*Math.cos(a)-(b.y+hip)*Math.sin(a),y:pivot.y+b.x*Math.sin(a)+(b.y+hip)*Math.cos(a)};
  c.save();c.translate(pivot.x,pivot.y);c.rotate(a);if(k<0)frame(c,'star',0,hip,S,'run',Math.floor(t*10)%8,BLUE,t,{shadow:false});else frame(c,'star',0,hip,S,'shoot',k,BLUE,t,{shadow:false});c.restore();oval(c,pivot.x,700,110,14,'#0006');
  if(u<uc){const q=clamp(u/uc);ball(c,mix(1350,boot.x,q),mix(-60,boot.y,q*q),30,t)}
  else{const q=clamp((u-uc)/(1-uc));ball(c,mix(boot.x,-120,q),mix(boot.y,140,q)-Math.sin(q*Math.PI)*40,30-q*8,t,fire,-1,fx)}
  if(u>uc&&u<uc+.06)flash(c,(uc+.06-u)*8*fx);cue(h,'bicycle',6.95,t,'powerShot');
 }else if(scene.name==='save'){
  // Towards the goal: the overhead kick dips under the bar and the keeper tips it over with his top glove.
  const v=shot(c,ART.goal,1.45,.5,.42);goalStand(c,v,t,false);const S=3.2,uc=.58,line=at(v,640,430),bar=at(v,880,262);
  const k=u<.1?0:u<uc?Math.min(4,1+Math.floor((u-.1)/(uc-.1)*4)):Math.min(7,4+Math.floor((u-uc)/.1)),g=cellPoint(...GLOVE_TIP,S),touch={x:bar.x-30,y:bar.y+22};
  const feet={x:touch.x-g.x,y:line.y},start={x:line.x,y:line.y},dive=smooth(clamp((u-.1)/(uc-.1))),kx=mix(start.x,feet.x,dive);
  if(k===0)sprite(c,'keeper',start.x,start.y,S,'gk_idle',KEEPER,t);else frame(c,'keeper',kx,feet.y,S,'save_tip_right',k,KEEPER,t);
  const tipped=u>=uc,q=clamp((u-uc)/(1-uc)),p=clamp(u/uc);ball(c,tipped?mix(touch.x,touch.x+90,q):mix(-40,touch.x,p),tipped?mix(touch.y,-60,q)-Math.sin(q*Math.PI)*30:mix(140,touch.y,p)-Math.sin(p*Math.PI)*60,17,t,!tipped&&fire,1,fx);
  if(tipped&&q<.2)flash(c,(.2-q)*2*fx);cue(h,'save',5.23,t,'saveSound');
 }else if(scene.name==='anonymous'){
  // The corner comes back in: the same 10, in full colour, meets it on the half-volley.
  const v=shot(c,ART.goal,1.08,.5,.5,0,.2);goalStand(c,v,t,false);const S=6.2,uc=.55,x=360,y=700,corner=at(v,880,262),b=cellPoint(...BOOT_LOW,S),boot={x:x+b.x,y:y+b.y};
  const k=u<.3?-1:u<uc-.12?0:u<uc-.05?1:u<uc+.04?2:Math.min(7,3+Math.floor((u-uc-.04)/.09));
  if(k<0)sprite(c,'striker',x-(.3-u)*300,y,S,'run',BLUE,t);else frame(c,'striker',x,y,S,'shoot',k,BLUE,t);
  if(u<uc){const q=clamp(u/uc);ball(c,mix(boot.x+520,boot.x,q),mix(-40,boot.y,q*q),26,t)} // dropping in front of him, never across his body
  else{const q=ease(clamp((u-uc)/(1-uc)));ball(c,mix(boot.x,corner.x,q),mix(boot.y,corner.y,q),mix(26,13,q),t,fire,1,fx)}
  cue(h,'decidingShot',3.66,t,'powerShot');
 }else if(scene.name==='net'){
  // Top corner: the keeper stretches and misses, the net bellies, the end erupts.
  const impact=clamp((u-.38)/.25),view=shot(c,ART.goal,1.9,.62,.33);goalStand(c,view,t,u>.38);const corner=at(view,860,275);
  if(u>.38&&view){c.save();c.beginPath();c.ellipse(corner.x,corner.y,170,120,0,0,Math.PI*2);c.clip();const s=1+.14*Math.sin(impact*Math.PI),im=img(ART.goal);c.translate(corner.x,corner.y);c.scale(s,s);c.translate(-corner.x,-corner.y);c.imageSmoothingEnabled=false;c.drawImage(im,view.x,view.y,im.naturalWidth*view.k,im.naturalHeight*view.k);c.restore()}
  const foot=at(view,700,430),S=4.1,d=clamp(u/.42),kf=Math.min(5,Math.floor(d*5)+1);if(u<.62){if(d<.05)sprite(c,'keeper',foot.x-260,foot.y,S,'gk_idle',KEEPER,t);else frame(c,'keeper',mix(foot.x-260,corner.x-cellPoint(...GLOVE_STRETCH,S).x-40,smooth(d)),foot.y,S,'save_stretch_right',kf,KEEPER,t)}
  const k=clamp(u/.4);ball(c,u<.38?mix(-60,corner.x,k):corner.x+Math.sin(impact*9)*8*(1-impact),u<.38?mix(620,corner.y,k):corner.y,36,t,fire&&u<.38,1,fx);
  if(u>.38){cue(h,'netBreak',8.34,t,'slam');h.impact?.(impact);flash(c,(1-impact)*.5*fx);const rise=ease(clamp((u-.45)/.3));crowd(c,0,H-rise*360,W,t);if(u>.55)sprite(c,'star',360,H+40-rise*60,9,'celebrate',BLUE,t,{shadow:false})}
 }
 // Widescreen bars and vignette (not on the title, which has its own frame).
 if(scene.name!=='logo'){const shade=c.createRadialGradient(640,340,260,640,340,760);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#01040b99');c.fillStyle=shade;c.fillRect(0,0,W,H);c.fillStyle='#02040b';c.fillRect(0,0,W,36);c.fillRect(0,H-36,W,36)}
 c.restore();return scene.name;
}
window.S9ArcadeCinematic={duration:DURATION,shots,sceneAt,draw,logoTarget,ball};
})();
