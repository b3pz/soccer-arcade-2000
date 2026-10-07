/* Supporter flags use the participating kits and club/national crests. */
(function(){
'use strict';
const R=S9ArcadeEngine.Renderer.prototype;
R.supporterFlag=function(x,y,w,h,team,time=0,seed=0,celebrating=false){
 const c=this.ctx,kit=team?.kit||{},primary=kit.shirtPrimary||'#298aff',secondary=kit.shirtSecondary||'#fff';
 const amplitude=h*(celebrating?.16:.09),phase=time*(celebrating?9:4.5)+seed*.71;
 c.save();c.strokeStyle='#d4dae7';c.lineWidth=w>25?2:1;c.beginPath();c.moveTo(x,y-2);c.lineTo(x,y+h+14);c.stroke();
 for(let i=0;i<8;i++){
  const u=i/8,shift=Math.sin(phase-u*5)*amplitude*u,sw=w/8+1;
  c.fillStyle=kit.pattern==='vertical_stripes'?(i%2?secondary:primary):kit.pattern==='halves'&&i>=4?secondary:primary;
  c.fillRect(x+1+i*w/8,y+shift,sw,h);
  if(kit.pattern==='horizontal_band'||kit.pattern==='trim'||kit.pattern==='solid'||!kit.pattern){c.fillStyle=secondary;c.fillRect(x+1+i*w/8,y+shift+h*.42,sw,h*.2)}
  c.fillStyle=Math.cos(phase-u*5)>0?'#ffffff20':'#00000028';c.fillRect(x+1+i*w/8,y+shift,sw,h);
 }
 if(w>=28){const src=this.crestSource?.(team),im=src&&this.bitmap?.(src);if(im?.complete&&im.naturalWidth){const size=h*.72,cy=y+h*.5+Math.sin(phase-2.5)*amplitude*.5;c.fillStyle='#ffffffd9';c.beginPath();c.arc(x+w*.52,cy,size*.56,0,Math.PI*2);c.fill();const scale=Math.min(size/im.naturalWidth,size/im.naturalHeight);c.drawImage(im,x+w*.52-im.naturalWidth*scale/2,cy-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale)}}
 c.restore();
};
R.supporterTeam=function(seed,celebrating=false){const m=this.currentMatch;if(celebrating&&this.stadiumCelebration?.team!=null)return m?.teams?.[this.stadiumCelebration.team];return m?.teams?.[seed%3===0?1:0]};
})();
