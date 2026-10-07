/* Shared raster art for cabinet screens, film shots, supporters and pitch boards. */
(function(){
'use strict';
const ROOT='arcade/assets/art/',cache=new Map(),paths={logo:'title-logo.png',stadium:'stadium-menu.png',crowd:'crowd-sheet.png',film:'cinematic-wide-sheet.png',sponsors:'sponsors.png',world:'world-map.png',ceremonies:'ceremonies.png',turf:'world/pitch-turf.png',track:'world/track-floor.png',benches:'world/bench-sheet.png',coach:'world/coach-sheet.png',panel:'ui/panel.png',fire:'effects/fire-sheet.png',meteor:'effects/meteor-sheet.png',speed:'effects/speed-sheet.png',impacts:'effects/impact-sheet.png'};
function image(key){const file=paths[key]||key;if(!cache.has(file)){const im=new Image();im.src=ROOT+file+'?v=art-2';cache.set(file,im)}return cache.get(file)}
const ready=im=>!!im?.complete&&im.naturalWidth>0;
function cover(c,key,x=0,y=0,w=1280,h=720,alpha=1){const im=image(key);if(!ready(im))return false;const k=Math.max(w/im.naturalWidth,h/im.naturalHeight),sw=w/k,sh=h/k;c.save();c.globalAlpha*=alpha;c.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-sh)/2,sw,sh,x,y,w,h);c.restore();return true}
function frame(c,key,index,cols,rows,x,y,w,h,zoom=1,pan=0){const im=image(key);if(!ready(im))return false;const fw=im.naturalWidth/cols,fh=im.naturalHeight/rows,ratio=w/h,sw=Math.min(fw,fh*ratio)/zoom,sh=sw/ratio,sx=(index%cols)*fw+(fw-sw)/2+pan*Math.max(0,(fw-sw)/2),sy=Math.floor(index/cols)*fh+(fh-sh)/2;c.drawImage(im,sx,sy,sw,sh,x,y,w,h);return true}
// Full-cell sprite blit: transparent effects and actors must never be center-cropped like scenery.
function blit(c,key,index,cols,rows,x,y,w,h){const im=image(key);if(!ready(im)||w<=0||h<=0)return false;const fw=im.naturalWidth/cols,fh=im.naturalHeight/rows,cell=((Math.floor(index)%(cols*rows))+cols*rows)%(cols*rows);c.drawImage(im,cell%cols*fw,Math.floor(cell/cols)*fh,fw,fh,x,y,w,h);return true}
function panel(c,x,y,w,h,edge=16){const im=image('panel');if(!ready(im)||w<=0||h<=0)return false;const sw=im.naturalWidth,sh=im.naturalHeight,s=Math.min(sw*.13,sh*.3),dx=Math.min(edge,w/3),dy=Math.min(edge,h/3),xs=[0,s,sw-s,sw],ys=[0,s,sh-s,sh],xd=[x,x+dx,x+w-dx,x+w],yd=[y,y+dy,y+h-dy,y+h];c.save();c.imageSmoothingEnabled=false;for(let j=0;j<3;j++)for(let i=0;i<3;i++)c.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],xd[i],yd[j],xd[i+1]-xd[i],yd[j+1]-yd[j]);c.restore();return true}
function effectTrail(c,kind,x,y,r,dx,dy,time,strength=1){if(strength<=0)return true;const key=kind==='meteor'?'meteor':'fire';if(!ready(image(key)))return false;c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));c.globalAlpha*=.7+Math.min(1,strength)*.3;const len=r*(16+strength*8),h=len*.7;blit(c,key,Math.floor(time*12),4,2,-len+r*.6,-h/2,len,h);c.restore();return true}
function motion(c,x,y,dx,dy,scale,time,power=1){if(power<=0)return true;if(!ready(image('speed')))return false;c.save();c.translate(x,y-30*scale);c.rotate(Math.atan2(dy,dx));c.globalAlpha*=Math.min(.8,power);blit(c,'speed',Math.floor(time*12),4,2,-120*scale,-34*scale,110*scale,61*scale);c.restore();return true}
function effect(c,kind,index,x,y,w,h){const base={charge:0,impact:4,contact:8,dust:12}[kind];return base!==undefined&&blit(c,'impacts',base+Math.max(0,Math.min(3,Math.floor(index))),4,4,x,y,w,h)}
function metadata(key){return window.S9ArcadeArtManifest?.assets?.[key]||null}
function logoBox(box={x:100,y:90,w:1080,h:450}){const im=image('logo'),k=ready(im)?Math.min(box.w/im.naturalWidth,box.h/im.naturalHeight):box.w/1983,w=ready(im)?im.naturalWidth*k:box.w,h=ready(im)?im.naturalHeight*k:box.w*793/1983;return {x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h}}
function logoTarget(){const b=logoBox();return {x:b.x+b.w*.29,y:b.y+b.h*.337,r:b.w*.079}}
function logo(c,{box,hole=false,alpha=1}={}){const im=image('logo');if(!ready(im))return false;const b=logoBox(box);c.save();c.globalAlpha*=alpha;if(hole){const p=logoTarget();c.beginPath();c.rect(0,0,1280,720);c.arc(p.x,p.y,p.r*1.015,0,Math.PI*2,true);c.clip('evenodd')}c.imageSmoothingEnabled=true;c.drawImage(im,b.x,b.y,b.w,b.h);c.restore();return true}
const shots={final:0,dribble:1,bicycle:2,save:3,anonymous:4,net:5};
function cinematic(c,name,u){if(!(name in shots))return false;return frame(c,'film',shots[name],3,2,0,0,1280,720,1.025+u*.055,(u-.5)*.7)}
function crowd(c,time,x,y,w,h){return frame(c,'crowd',Math.floor(time*8)%4,2,2,x,y,w,h)}
// Board strips are 2172x181 each; their count follows the sheet height. Order scrambled so neighbours differ.
function sponsor(c,index,x,y,w,h){const im=image('sponsors');if(!ready(im))return false;const n=Math.max(1,Math.round(im.naturalHeight/181)),fh=im.naturalHeight/n,row=(Math.abs(index)*5+3)%n;c.drawImage(im,0,row*fh,im.naturalWidth,fh,x,y,w,h);return true}
Object.keys(paths).forEach(image);
window.S9ArcadeArt={image,ready,cover,frame,blit,panel,effectTrail,motion,effect,metadata,logo,logoBox,logoTarget,cinematic,crowd,sponsor};
})();
