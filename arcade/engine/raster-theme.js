/* Cabinet environments use raster artwork. Geometry remains for cameras, simulation and live markers. */
(function(){
'use strict';
const R=S9ArcadeEngine.Renderer.prototype,A=window.S9ArcadeArt;
if(!A)return;
const crowd=R.crowdBlock;
R.crowdBlock=function(x0,x1,y0,rows,anchor,dirY,time,celebrating){const im=A.image('crowd');if(!A.ready(im))return crowd.call(this,x0,x1,y0,rows,anchor,dirY,time,celebrating);const height=Math.max(24,rows*13),top=dirY<0?y0-height:y0,c=this.ctx;
 // Tiles at the picture's own proportions (never stretched), anchored to the stand so they scroll with the pitch.
 const th=Math.min(height,120),tw=th*(im.naturalWidth/2)/(im.naturalHeight/2),start=anchor+Math.floor((x0-anchor)/tw)*tw,t=celebrating?time:Math.floor(time/3)*.125;c.save();c.beginPath();c.rect(x0,top,x1-x0,height);c.clip();
 for(let y=top;y<top+height;y+=th)for(let x=start;x<x1;x+=tw)if(x+tw>-10&&x<1290&&y+th>-10&&y<730)A.crowd(c,t,x,y,tw,th);c.restore()};
R.adBoards=function(x0,x1,y,h){const c=this.ctx;c.fillStyle='#060d19';c.fillRect(x0,y,x1-x0,h);let i=0;for(let x=x0;x<x1;x+=230,i++)A.sponsor(c,i,x+2,y+2,Math.min(226,x1-x-2),h-4)};
R.chargeMeter=function(m){if(this.replayMode||m.phase==='FINISHED'||m.phase==='PENALTIES')return;const c=this.ctx;for(const h of m.humans||[]){if(!h.input.shotCharging)continue;const p=this.project(h.selected.x,h.selected.y),w=48,x=p.x-w/2,y=p.y-88*p.scale,q=h.input.shotCharge;c.fillStyle='#071020';c.fillRect(x-2,y-2,w+4,8);c.fillStyle=q>.98?'#ff692b':'#ffe75a';c.fillRect(x,y,w*q,4)}};
const card=R.cardCutscene;
R.cardCutscene=function(m){const s=m.cardScene;if(!s)return;const c=this.ctx;
 if(!A.ready(A.image('ceremonies.png')))return card.call(this,m);
 A.frame(c,'ceremonies.png',3,2,2,0,0,1280,720);const ref={role:'REF',team:{},face:{x:1,y:0},action:s.age<.5?'whistle':s.age<.85?'point':s.card==='RED'?'red':'yellow'};
 c.save();c.translate(380,620);this.sprite(ref,m,{scale:4.5});c.restore();c.save();c.translate(900,620);c.scale(-1,1);this.sprite({...s.player,stun:0,burst:0,action:'idle'},m,{scale:4});c.restore();this.text(s.secondYellow?'2ND YELLOW → RED':s.card==='RED'?'RED CARD!':'YELLOW CARD!',640,150,40,s.card==='RED'?'#ff5b6a':'#ffe64a');this.text('#'+s.number+' '+s.name.toUpperCase(),640,670,25,'#fff');
};
// Let existing sprite actors and timing play over the new ceremony scenery.
const penalty=R.drawPenalty,fk=R.drawFreeKick;
// Cache the decoded backdrop once rather than allocating a canvas on every frame.
let goalBackdrop=null;
function goalPicture(draw,m){const im=A.image('ceremonies.png');if(!A.ready(im))return draw.call(this,m);if(!goalBackdrop){goalBackdrop=document.createElement('canvas');goalBackdrop.width=1280;goalBackdrop.height=720;A.frame(goalBackdrop.getContext('2d'),'ceremonies.png',1,2,2,0,0,1280,720);goalBackdrop.complete=true;goalBackdrop.naturalWidth=1280}const bitmap=this.bitmap;this.bitmap=function(src){return src?.includes('freekick-backdrop')?goalBackdrop:bitmap.call(this,src)};try{return draw.call(this,m)}finally{this.bitmap=bitmap}}
R.drawPenalty=function(m){return goalPicture.call(this,penalty,m)};R.drawFreeKick=function(m){return goalPicture.call(this,fk,m)};
})();
