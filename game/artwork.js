/* Shared raster art for cabinet screens, film shots, supporters and pitch boards. */
(function(){
'use strict';
const ROOT='arcade/assets/art/',cache=new Map(),paths={logo:'title-logo.png',stadium:'stadium-menu.png',crowd:'crowd-sheet.png',film:'cinematic-wide-sheet.png',sponsors:'sponsors.png',world:'world-map.png',ceremonies:'ceremonies.png'};
function image(key){const file=paths[key]||key;if(!cache.has(file)){const im=new Image();im.src=ROOT+file+'?v=art-1';cache.set(file,im)}return cache.get(file)}
const ready=im=>!!im?.complete&&im.naturalWidth>0;
function cover(c,key,x=0,y=0,w=1280,h=720,alpha=1){const im=image(key);if(!ready(im))return false;const k=Math.max(w/im.naturalWidth,h/im.naturalHeight),sw=w/k,sh=h/k;c.save();c.globalAlpha*=alpha;c.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-sh)/2,sw,sh,x,y,w,h);c.restore();return true}
function frame(c,key,index,cols,rows,x,y,w,h,zoom=1,pan=0){const im=image(key);if(!ready(im))return false;const fw=im.naturalWidth/cols,fh=im.naturalHeight/rows,ratio=w/h,sw=Math.min(fw,fh*ratio)/zoom,sh=sw/ratio,sx=(index%cols)*fw+(fw-sw)/2+pan*Math.max(0,(fw-sw)/2),sy=Math.floor(index/cols)*fh+(fh-sh)/2;c.drawImage(im,sx,sy,sw,sh,x,y,w,h);return true}
function logoBox(box={x:100,y:90,w:1080,h:450}){const im=image('logo'),k=ready(im)?Math.min(box.w/im.naturalWidth,box.h/im.naturalHeight):box.w/1983,w=ready(im)?im.naturalWidth*k:box.w,h=ready(im)?im.naturalHeight*k:box.w*793/1983;return {x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h}}
function logoTarget(){const b=logoBox();return {x:b.x+b.w*.29,y:b.y+b.h*.337,r:b.w*.079}}
function logo(c,{box,hole=false,alpha=1}={}){const im=image('logo');if(!ready(im))return false;const b=logoBox(box);c.save();c.globalAlpha*=alpha;if(hole){const p=logoTarget();c.beginPath();c.rect(0,0,1280,720);c.arc(p.x,p.y,p.r*1.015,0,Math.PI*2,true);c.clip('evenodd')}c.imageSmoothingEnabled=true;c.drawImage(im,b.x,b.y,b.w,b.h);c.restore();return true}
const shots={final:0,dribble:1,bicycle:2,save:3,anonymous:4,net:5};
function cinematic(c,name,u){if(!(name in shots))return false;return frame(c,'film',shots[name],3,2,0,0,1280,720,1.025+u*.055,(u-.5)*.7)}
function crowd(c,time,x,y,w,h){return frame(c,'crowd',Math.floor(time*8)%4,2,2,x,y,w,h)}
function sponsor(c,index,x,y,w,h){const im=image('sponsors');if(!ready(im))return false;const fh=im.naturalHeight/4;c.drawImage(im,0,(Math.abs(index)%4)*fh,im.naturalWidth,fh,x,y,w,h);return true}
Object.keys(paths).forEach(image);
window.S9ArcadeArt={image,ready,cover,frame,logo,logoBox,logoTarget,cinematic,crowd,sponsor};
})();
