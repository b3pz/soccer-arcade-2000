/* Cabinet environments use raster artwork. Geometry remains for cameras, simulation and live markers. */
(function(){
'use strict';
const R=S9ArcadeEngine.Renderer.prototype,A=window.S9ArcadeArt;
if(!A)return;
const crowd=R.crowdBlock;
R.crowdBlock=function(x0,x1,y0,rows,anchor,dirY,time,celebrating){const im=A.image('crowd');if(!A.ready(im))return crowd.call(this,x0,x1,y0,rows,anchor,dirY,time,celebrating);const height=Math.max(24,rows*13),top=dirY<0?y0-height:y0,c=this.ctx;
 // Tiles at the picture's own proportions (never stretched), anchored to the stand so they scroll with the pitch.
 const th=Math.min(height,46*((this.camera?.zoom||36)/36)),tw=th*(im.naturalWidth/2)/(im.naturalHeight/2),start=anchor+Math.floor((x0-anchor)/tw)*tw,t=celebrating?time:Math.floor(time/3)*.125;c.save();c.beginPath();c.rect(x0,top,x1-x0,height);c.clip();
 for(let y=top;y<top+height;y+=th)for(let x=start;x<x1;x+=tw)if(x+tw>-10&&x<1290&&y+th>-10&&y<730)A.crowd(c,t,x,y,tw,th);c.restore()};
// Board strips keep their 12:1 proportions; numbering is anchored to the board start so they scroll with the pitch.
R.adBoards=function(x0,x1,y,h){const c=this.ctx,tw=(h-4)*12;c.fillStyle='#060d19';c.fillRect(x0,y,x1-x0,h);c.fillStyle='#00000066';c.fillRect(x0,y+h,x1-x0,Math.max(3,h*.12));let i=0;for(let x=x0;x<x1;x+=tw+4,i++)if(x+tw>-20&&x<1300)A.sponsor(c,i,x+2,y+2,Math.min(tw,x1-x-2),h-4)};
const oldBench=R.bench;
function benchPalette(renderer,kit){renderer.bitmapBenches=renderer.bitmapBenches||new Map();const color=kit?.shirtPrimary||'#237cec';if(renderer.bitmapBenches.has(color))return renderer.bitmapBenches.get(color);const im=A.image('benches');let result=null;try{const cv=document.createElement('canvas');cv.width=Math.round(im.naturalWidth/2);cv.height=Math.round(im.naturalHeight/2);const q=cv.getContext('2d');A.blit(q,'benches',0,2,2,0,0,cv.width,cv.height);const pixels=q.getImageData(0,0,cv.width,cv.height),d=pixels.data,hex=color.length===4?'#'+color.slice(1).split('').map(v=>v+v).join(''):color,rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));for(let y=Math.floor(cv.height*.44);y<cv.height*.78;y++)for(let x=0;x<cv.width;x++){const o=(y*cv.width+x)*4,r=d[o],g=d[o+1],b=d[o+2];if(d[o+3]>40&&b>r*1.45&&b>g*1.1){const shade=.3+b/255*.7;for(let j=0;j<3;j++)d[o+j]=Math.round(rgb[j]*shade)}}q.putImageData(pixels,0,0);result=cv}catch(e){}renderer.bitmapBenches.set(color,result);return result}
R.bench=function(cx,y,team,label){if(!A.ready(A.image('benches')))return oldBench?.call(this,cx,y,team,label);const c=this.ctx,z=(this.camera?.zoom||36)/36,w=260*z,h=130*z,paint=benchPalette(this,team?.kit);// Canopy and frame still; the seated reserves (lower part, in vertical strips) fidget, and jump up on a goal.
 const src=paint||null,t=this.sceneTime||0,cheer=this.stadiumCelebration?.team===(team?.id||0),top=y-24*z;
 if(!src)A.blit(c,'benches',team?.id?1:0,2,2,cx-w/2,top,w,h);else{const sw=src.width,sh=src.height,cut=.42;c.drawImage(src,0,0,sw,sh*cut,cx-w/2,top,w,h*cut);const n=9;for(let i=0;i<n;i++){const bob=cheer?-Math.abs(Math.sin(t*12+i*1.7))*9*z:Math.round(Math.sin(t*2.3+i*2.1)*1.4*z+(Math.sin(t*.7+i)>.92?-3*z:0));c.drawImage(src,sw*i/n,sh*cut,sw/n+1,sh*(1-cut),cx-w/2+w*i/n,top+h*cut+bob,w/n+1,h*(1-cut))}}
 const im=A.image('coach');if(!A.ready(im))return;const time=this.sceneTime||0,m=this.currentMatch,side=team?.id||0,won=this.stadiumCelebration?.team===side,lost=this.stadiumCelebration&&!won,attacking=m?.ball?.lastTeam===side,frame=won?5+Math.floor(time*5)%2:lost?7:attacking?2+Math.floor(time*3)%2:Math.floor(time*2)%2,meta=A.metadata('coach'),height=70*z*(256/(meta?.idleHeight||175)),baseline=y+91*z,foot=meta?.anchorY??.93;A.blit(c,'coach',frame,4,2,cx+w/2+12*z-height/2,baseline-height*foot,height,height)};
R.chargeMeter=function(m){if(this.replayMode||m.phase==='FINISHED'||m.phase==='PENALTIES')return;const c=this.ctx;for(const h of m.humans||[]){if(!h.input.shotCharging)continue;const p=this.project(h.selected.x,h.selected.y),w=48,x=p.x-w/2,y=p.y-88*p.scale,q=h.input.shotCharge;c.fillStyle='#071020';c.fillRect(x-2,y-2,w+4,8);c.fillStyle=q>.98?'#ff692b':'#ffe75a';c.fillRect(x,y,w*q,4)}};
const card=R.cardCutscene;
R.cardCutscene=function(m){const s=m.cardScene;if(!s)return;const c=this.ctx;
 if(!A.ready(A.image('ceremonies.png')))return card.call(this,m);
 A.frame(c,'ceremonies.png',3,2,2,0,0,1280,720);// Same referee object for the whole scene: the sprite clock needs it to play whistle → point → card up to the end.
 if(this.rasterCardScene!==s){this.rasterCardScene=s;this.rasterCardRef={role:'REF',team:{},face:{x:1,y:0}}}const ref=this.rasterCardRef;ref.action=s.age<.5?'whistle':s.age<.85?'point':s.card==='RED'?'red':'yellow';
 c.save();c.translate(380,620);this.sprite(ref,m,{scale:4.5});c.restore();
 // Flash as the card goes up (the card is in the referee sprite's hand).
 if(s.age>=.85&&s.age<1.1&&(window.S9ArcadeEvolution?.settings.effects??1)>0){c.fillStyle='rgba(255,255,255,'+(.25*(1.1-s.age)/.25)+')';c.fillRect(0,0,1280,720)}c.save();c.translate(900,620);c.scale(-1,1);this.sprite({...s.player,stun:0,burst:0,action:'idle'},m,{scale:4});c.restore();this.text(s.secondYellow?'2ND YELLOW → RED':s.card==='RED'?'RED CARD!':'YELLOW CARD!',640,150,40,s.card==='RED'?'#ff5b6a':'#ffe64a');this.text('#'+s.number+' '+s.name.toUpperCase(),640,670,25,'#fff');
};
// Let existing sprite actors and timing play over the new ceremony scenery.
const penalty=R.drawPenalty,fk=R.drawFreeKick;
// Cache the decoded backdrop once rather than allocating a canvas on every frame.
let goalBackdrop=null;
function goalPicture(draw,m){const im=A.image('ceremonies.png');if(!A.ready(im))return draw.call(this,m);if(!goalBackdrop){goalBackdrop=document.createElement('canvas');goalBackdrop.width=1280;goalBackdrop.height=720;A.frame(goalBackdrop.getContext('2d'),'ceremonies.png',1,2,2,0,0,1280,720);goalBackdrop.complete=true;goalBackdrop.naturalWidth=1280}const bitmap=this.bitmap;this.bitmap=function(src){return src?.includes('freekick-backdrop')?goalBackdrop:bitmap.call(this,src)};try{return draw.call(this,m)}finally{this.bitmap=bitmap}}
R.drawPenalty=function(m){return goalPicture.call(this,penalty,m)};R.drawFreeKick=function(m){return goalPicture.call(this,fk,m)};
})();
