/* Bitmap cabinet art for in-match overlays: frames are the drawn bezel sprite, crests are the team patches. */
(function(){
const R=S9ArcadeEngine.Renderer.prototype,cache=new Map(),BEZEL='arcade/assets/drawn-panel.png?v=drawn-1';
function bitmap(src){if(!src||typeof Image!=='function')return null;let im=cache.get(src);if(im===undefined){try{im=new Image();im.src=src}catch(e){im=null}cache.set(src,im)}return im}
const ready=im=>!!(im&&im.complete&&im.naturalWidth);
bitmap(BEZEL);
R.bitmap=bitmap;
// Nine-slice of the drawn panel, same source rectangle as the menu skin.
R.panel=function(x,y,w,h,edge=16){if(window.S9ArcadeArt?.panel(this.ctx,x,y,w,h,edge))return;const c=this.ctx,im=bitmap(BEZEL);if(w<=0||h<=0)return;if(!ready(im)){c.fillStyle='#071933';c.fillRect(x,y,w,h);return}
 const sw=im.naturalWidth,sy=im.naturalHeight*.074,sh=im.naturalHeight*.85,s=sw*.12,dx=Math.min(edge,w/3),dy=Math.min(edge,h/3),xs=[0,s,sw-s,sw],ys=[sy,sy+s,sy+sh-s,sy+sh],xd=[x,x+dx,x+w-dx,x+w],yd=[y,y+dy,y+h-dy,y+h],smooth=c.imageSmoothingEnabled;
 c.imageSmoothingEnabled=false;for(let j=0;j<3;j++)for(let i=0;i<3;i++)c.drawImage(im,xs[i],ys[j],xs[i+1]-xs[i],ys[j+1]-ys[j],xd[i],yd[j],xd[i+1]-xd[i],yd[j+1]-yd[j]);c.imageSmoothingEnabled=smooth};
R.crestSource=team=>{const src=team?.source?.crest||(team?.source?.id&&!team.source.arcadeCreatures?'assets/crests/italian/'+team.source.id+'.png':null);return src&&src+'?v=crest-3'};
// Team patch, contained in the box; falls back to the pixel shirt while loading or for crest-less teams.
R.teamCrest=function(team,x,y,w,h){const c=this.ctx,im=bitmap(R.crestSource(team));if(ready(im)){const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*k,ih=im.naturalHeight*k,smooth=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;c.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);c.imageSmoothingEnabled=smooth;return true}
 const kit=team?.kit||{},cx=x+w/2,cy=y+h/2,u=Math.min(w,h)/40;c.fillStyle='#071326';c.fillRect(cx-13*u,cy-14*u,26*u,30*u);c.fillStyle=kit.shirtPrimary||'#24bdff';c.fillRect(cx-11*u,cy-12*u,22*u,26*u);c.fillRect(cx-17*u,cy-12*u,34*u,9*u);c.fillStyle=kit.shirtSecondary||'#fff';c.fillRect(cx-8*u,cy-7*u,16*u,4*u);return false};
R.controlsHint=function(m){const pad=!!window.S9ArcadeControls?.padConnected;if(m.phase==='PENALTIES')return pad?'FRECCE/STICK MIRA · A TIRA · B/X TUFFO':'FRECCE MIRA · Z TIRA · X/C TUFFO';
 return pad?'A TIRO  B PASSA  X ALTO  Y DRIBBLING  ·  B/X SCIVOLATA  ·  START PAUSA':'Z TIRO  C PASSA  X ALTO  V DRIBBLING  ·  X/C SCIVOLATA  ·  ESC PAUSA  F SCHERMO'};
// Swinging set-piece arrow: stops when a button is pressed, grows and turns red with power.
R.setPieceArrow=function(m){const d=m.restarts?.data;if(m.phase!=='RESTART'||!d?.aim||!(m.humans||[]).some(h=>h.selected===d.taker))return;const c=this.ctx,a=d.aim,p=this.project(d.taker.x,d.taker.y),dx=Math.cos(a.angle),dy=Math.sin(a.angle)*.65,n=Math.hypot(dx,dy)||1,ux=dx/n,uy=dy/n,len=70+a.power*130,x0=p.x+ux*18,y0=p.y-10+uy*18,x1=x0+ux*len,y1=y0+uy*len,color=a.power>.8?'#ff5a36':a.power>.45?'#ffe23d':'#7dff6a';
 c.save();c.lineCap='round';c.strokeStyle='#061021';c.lineWidth=13;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.strokeStyle=color;c.lineWidth=7;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
 c.fillStyle=color;c.strokeStyle='#061021';c.lineWidth=3;c.beginPath();c.moveTo(x1+ux*22,y1+uy*22);c.lineTo(x1-uy*14,y1+ux*14);c.lineTo(x1+uy*14,y1-ux*14);c.closePath();c.fill();c.stroke();c.restore();
 if(a.button){const x=Math.max(70,Math.min(1090,p.x-60)),y=Math.max(130,p.y-95*p.scale);this.panel(x-16,y-34,152,62,10);for(let i=0;i<12;i++){c.fillStyle=i<Math.ceil(a.power*12)?i>8?'#ff6436':i>4?'#ffe44a':'#79e752':'#253c50';c.fillRect(x+i*10,y,8,16)}this.text('POTENZA',x+60,y-10,15,'#ffe569')}};
// Pixel-art match ball: truncated-icosahedron panels lit from the top-left, rendered per size, spin step and roll axis.
const ICO=(()=>{const t=(1+Math.sqrt(5))/2;return [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>{const l=Math.hypot(...v);return v.map(c=>c/l)})})(),ballCache=new Map();
function ballSprite(d,step,axisStep){const key=d+':'+step+':'+axisStep;let cv=ballCache.get(key);if(cv)return cv;if(typeof document==='undefined'||!document.createElement)return null;cv=document.createElement('canvas');cv.width=cv.height=d;const q=cv.getContext?.('2d');if(!q)return null;const img=q.createImageData?.(d,d);if(!img?.data)return null;const r=d/2,ang=step*Math.PI/8,phi=axisStep*Math.PI/4,ax=Math.cos(phi),ay=Math.sin(phi),cs=Math.cos(ang),sn=Math.sin(ang),L=[-.45,-.6,.66];
 for(let j=0;j<d;j++)for(let i=0;i<d;i++){const nx=(i+.5-r)/r,ny=(j+.5-r)/r,rr=nx*nx+ny*ny;if(rr>1)continue;const nz=Math.sqrt(1-rr),dot=ax*nx+ay*ny;
  const v=[nx*cs+(ay*nz)*sn+ax*dot*(1-cs),ny*cs+(-ax*nz)*sn+ay*dot*(1-cs),nz*cs+(ax*ny-ay*nx)*sn];let best=-1;for(const p of ICO){const k=p[0]*v[0]+p[1]*v[1]+p[2]*v[2];if(k>best)best=k}
  const light=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]),shade=.5+.5*light,edge=rr>(1-1.6/d)**2,spec=light>.96&&best<.95;let col=best>.962?[30,34,48]:[248,248,240];if(best>.948&&best<=.962)col=[160,164,176];
  col=spec?[255,255,255]:col.map(c=>Math.round(c*shade));if(edge)col=[20,26,44];const o=(j*d+i)*4;img.data[o]=col[0];img.data[o+1]=col[1];img.data[o+2]=col[2];img.data[o+3]=255}
 q.putImageData(img,0,0);ballCache.set(key,cv);return cv}
R.drawBall=function(x,y,radius,m){const c=this.ctx,b=m?.ball,d=Math.max(8,Math.round(radius*2));if(b&&!b.owner){const last=this.ballTrack||{x:b.x,y:b.y},moved=Math.hypot(b.x-last.x,b.y-last.y);if(moved<5){this.ballSpin=(this.ballSpin||0)+moved/.33;if(moved>.01)this.ballAxis=Math.round((Math.atan2(b.vy,b.vx)+Math.PI/2)/(Math.PI/4))}}else if(b?.owner&&b.owner.action==='run')this.ballSpin=(this.ballSpin||0)+.25;if(b)this.ballTrack={x:b.x,y:b.y};
 const sprite=ballSprite(d,((Math.floor((this.ballSpin||0)/(Math.PI/8))%16)+16)%16,(((this.ballAxis||2)%8)+8)%8);if(!sprite){c.fillStyle='#fff';c.beginPath();c.arc(x,y,radius,0,7);c.fill();return}const smooth=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(sprite,Math.round(x-d/2),Math.round(y-d/2));c.imageSmoothingEnabled=smooth};
R.resultScreen=function(m){const c=this.ctx,age=(m.presentationTime??m.elapsed)-m.elapsed,pad=!!window.S9ArcadeControls?.padConnected;
 c.fillStyle='#02061299';c.fillRect(0,0,1280,720);this.panel(250,160,780,410,30);this.text('MATCH RESULT',640,224,36,'#ffe55a');
 for(const i of [0,1]){const cx=i?850:430,t=m.teams[i];this.teamCrest(t,cx-58,250,116,150);this.text(t.name,cx,432,Math.min(22,300/Math.max(1,t.name.length)*1.6),i?'#ff8294':'#81bcff')}
 this.text(m.rules.score.join(' : '),640,350,70,'#fff');if(m.pen&&!m.pen.single)this.text('RIGORI '+m.pen.goals.join(' - '),640,392,22,'#ffe55a');
 this.text(m.message,640,482,24,'#75dbff');if(age>.8&&Math.floor(age*2.5)%2===0)this.text('{m:confirm} CONTINUA',640,530,22,'#ffe55a')};
R.pauseScreen=function(m){const c=this.ctx,pad=!!window.S9ArcadeControls?.padConnected;c.fillStyle='#02061299';c.fillRect(0,0,1280,720);this.panel(330,200,620,320,26);
 this.text('PAUSA',640,268,44,'#ffe55a');this.text(m.teams[0].name+'  '+m.rules.score.join(' : ')+'  '+m.teams[1].name,640,314,20,'#b3eaff');
 const items=['RIPRENDI','OPZIONI','ESCI SENZA REGISTRARE'],at=this.pauseIndex||0;items.forEach((label,i)=>{const y=372+i*44;if(i===at){c.fillStyle='#ffe44730';c.fillRect(400,y-28,480,38);c.fillStyle='#ffe447';c.fillRect(400,y-28,6,38)}this.text(label,640,y,i===at?26:22,i===at?'#fff':i===2?'#ff8294':'#9fc2d4')});
 const B=window.S9ArcadeBindings,P=window.S9ArcadeOptions,first=pad&&[...(navigator.getGamepads?.()||[])].find(Boolean),name=a=>first&&P?P.buttonName(B.map('padmenu')[a],first):B?B.label(B.key(a,'menu')):a.toUpperCase();this.text('{arrows} SCEGLI    {m:confirm} CONFERMA    {m:back} RIPRENDI',640,500,16,'#ffe55b')};
})();
