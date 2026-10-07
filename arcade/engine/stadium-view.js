/* Stadium around the pitch: grass apron, 3D advertising boards, athletics track, benches, wall and stands; detailed goals. */
(function(){
const E=window.S9ArcadeEngine,R=E.Renderer.prototype;
const SKIN=['#ecc39a','#cf8550','#9a5d3e','#f4d6b4'],SHIRTS=['#ffcb44','#56caff','#f2536b','#ddd7bf','#7be37a','#ffffff'],ADS=['SUPER FOOTBALL','PUSH START','ARCADE LEAGUE','INSERT COIN','ARCADE CUP'];
function turf(r){if(r.turf)return r.turf;const t=document.createElement('canvas');t.width=1000;t.height=620;const q=t.getContext('2d');let seed=1998;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};q.fillStyle='#238f38';q.fillRect(0,0,1000,620);for(let i=0;i<10;i++){q.fillStyle=i%2?'#299b40':'#218536';q.fillRect(i*100,0,100,620)}for(let i=0;i<75000;i++){q.fillStyle=rand()>.5?'#8cda4933':'#043f3138';q.fillRect(Math.floor(rand()*1000),Math.floor(rand()*620),1+Math.floor(rand()*3),1)}return r.turf=t}
// Supporters: seat index anchored to the stand edge so the crowd scrolls with the pitch; scarves in the scoring kit.
R.crowdBlock=function(x0,x1,y0,rows,anchor,dirY,time,celebrating){const c=this.ctx,kit=this.stadiumKit;const k0=Math.max(0,Math.ceil((-16-(x0-anchor))/12)),start=anchor+k0*12;
 for(let row=0;row<rows;row++){const y=y0+dirY*row*13;if(y<-14||y>734)continue;c.fillStyle=row%2?'#1d2740':'#222d4a';c.fillRect(x0,y-2,x1-x0,13);
  for(let k=k0,x=start;x<Math.min(x1,1296);k++,x+=12){if(x<x0)continue;const seat=Math.abs(k*31+row*17+(dirY>0?5:0));if(seat%29<2)continue;const jump=celebrating?-Math.abs(Math.round(Math.sin(time*13+seat)*5)):seat%9===0?Math.round(Math.sin(time*4+seat)):0;
   c.fillStyle=celebrating&&seat%3===0?(kit?.shirtPrimary||'#ffdb29'):SHIRTS[seat%SHIRTS.length];c.fillRect(x+1,y+4+jump,7,6);c.fillStyle=SKIN[seat%4];c.fillRect(x+2,y+jump,5,4);
   if(celebrating&&seat%4===1||seat%23===0){c.fillStyle=celebrating?(kit?.shirtSecondary||'#fff'):'#eacc3f';c.fillRect(x-1,y-3+jump,11,2)}if(seat%13===0&&row%2===0)this.supporterFlag?.(x+5,y-20+jump,22,13,this.supporterTeam?.(seat,celebrating),time,seat,celebrating)}}};
R.bench=function(cx,y,team,label){const c=this.ctx,kit=team?.kit||{},w=210;
 c.fillStyle='#0006';c.fillRect(cx-w/2+6,y+52,w,8);c.fillStyle='#16304d';c.fillRect(cx-w/2,y,w,54);c.fillStyle='#24507a';c.fillRect(cx-w/2,y,w,6);
 for(let i=0;i<8;i++){const x=cx-w/2+14+i*24;c.fillStyle='#0d1b2c';c.fillRect(x-2,y+30,20,16);c.fillStyle=SKIN[i%4];c.fillRect(x+3,y+12,8,8);c.fillStyle=kit.shirtPrimary||'#3a73b2';c.fillRect(x,y+20,14,12);c.fillStyle=kit.shirtSecondary||'#fff';c.fillRect(x+5,y+22,4,3);c.fillStyle=kit.shorts||'#eee';c.fillRect(x+1,y+32,12,6)}
 c.fillStyle='#bfe7ffaa';c.fillRect(cx-w/2-6,y-12,w+12,10);c.strokeStyle='#e6f6ff';c.lineWidth=2;c.strokeRect(cx-w/2-6,y-12,w+12,10);c.fillStyle='#8fc8e0';c.fillRect(cx-w/2-6,y-2,4,56);c.fillRect(cx+w/2+2,y-2,4,56);
 // coach standing in front of the dugout
 const kx=cx+w/2-26;c.fillStyle=SKIN[0];c.fillRect(kx,y+40,8,8);c.fillStyle='#1b1f2e';c.fillRect(kx-2,y+48,12,16);c.fillStyle='#d8d8d8';c.fillRect(kx+3,y+49,2,6);c.fillStyle='#11141f';c.fillRect(kx-1,y+64,4,8);c.fillRect(kx+5,y+64,4,8);
 this.text(label,cx,y-15,12,'#ffe36b')};
R.adBoards=function(x0,x1,y,h){const c=this.ctx;c.fillStyle='#030b16';c.fillRect(x0,y,x1-x0,h);let i=0;for(let x=x0;x<x1;x+=230,i++){c.fillStyle=i%2?'#0b2140':'#102b52';c.fillRect(x+2,y+2,226,h-4);c.fillStyle='#ffcd39';c.fillRect(x+2,y+2,226,2);this.text(ADS[Math.abs(i)%ADS.length],x+115,y+h/2+5,14,i%2?'#fcdf66':'#7fe6ff')}c.fillStyle='#000a';c.fillRect(x0,y+h,x1-x0,4)};
R.pitch=function(){const c=this.ctx,a=this.project(0,0),b=this.project(100,62),time=this.sceneTime||0,celebrating=!!this.stadiumCelebration,m=this.currentMatch;
 const track={l:a.x-200,r:b.x+200,t:a.y-168,b:b.y+150},apron={l:a.x-84,r:b.x+84,t:a.y-70,b:b.y+56};
 c.fillStyle='#141c33';c.fillRect(0,0,1280,720);
 // Stands beyond the wall on every side
 this.crowdBlock(track.l-60,track.r+60,track.t-22,9,a.x-200,-1,time,celebrating);this.crowdBlock(track.l-60,track.r+60,track.b+14,6,a.x-200,1,time,celebrating);
 for(const [x0,x1] of [[track.l-320,track.l-12],[track.r+12,track.r+320]])if(x1>-20&&x0<1300)this.crowdBlock(x0,x1,track.t-20,Math.ceil((track.b-track.t+40)/13),x0,1,time,celebrating);
 // Wall and athletics track with lanes
 c.fillStyle='#6b7385';c.fillRect(track.l-12,track.t-12,track.r-track.l+24,track.b-track.t+24);c.fillStyle='#aab1c0';c.fillRect(track.l-12,track.t-12,track.r-track.l+24,3);
 c.fillStyle='#b4553d';c.fillRect(track.l,track.t,track.r-track.l,track.b-track.t);c.strokeStyle='#f6e2d4aa';c.lineWidth=1.5;
 for(let i=1;i<6;i++){const k=i/6;c.strokeRect(track.l+(apron.l-track.l)*k,track.t+(apron.t-track.t)*k,track.r-track.l-(track.r-apron.r+apron.l-track.l)*k,track.b-track.t-(track.b-apron.b+apron.t-track.t)*k)}
 // Grass apron, boards, benches
 c.fillStyle='#1d7533';c.fillRect(apron.l,apron.t,apron.r-apron.l,apron.b-apron.t);
 this.adBoards(a.x-60,b.x+60,a.y-52,24);this.adBoards(a.x-60,b.x+60,b.y+26,24);
 for(const [x,id] of [[38,0],[62,1]]){const p=this.project(x,0);this.bench(p.x,track.t+28,m?.teams?.[id],(m?.teams?.[id]?.name||(id?'OSPITI':'CASA')).toUpperCase())}
 c.fillStyle='#8c9880';c.fillRect(a.x-6,a.y-6,b.x-a.x+12,b.y-a.y+12);c.drawImage(turf(this),a.x,a.y,b.x-a.x,b.y-a.y);
 const cam=this.camera||{zoom:36},line=pts=>{c.beginPath();pts.forEach(([x,y],i)=>{const p=this.project(x,y);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.strokeStyle='#173e2444';c.lineWidth=5;c.stroke();c.strokeStyle='#f1f1cb';c.lineWidth=2.7;c.stroke()};
 line([[0,0],[100,0],[100,62],[0,62],[0,0]]);line([[50,0],[50,62]]);const mid=this.project(50,31);c.strokeStyle='#f1f1cb';c.lineWidth=2.7;c.beginPath();c.ellipse(mid.x,mid.y,9.15*cam.zoom,9.15*cam.zoom*.65,0,0,Math.PI*2);c.stroke();
 for(const x of [0,100]){line([[x,14],[x?84:16,14],[x?84:16,48],[x,48]]);line([[x,23],[x?94:6,23],[x?94:6,39],[x,39]]);const p=this.project(x?89:11,31);c.fillStyle='#f1f1cb';c.fillRect(p.x-2,p.y-2,4,4);this.goal(x)}
 // corner flags
 for(const [x,y] of [[0,0],[100,0],[0,62],[100,62]]){const p=this.project(x,y);c.fillStyle='#e8e8e8';c.fillRect(p.x-1,p.y-30,3,30);c.fillStyle='#ff4b3a';c.fillRect(p.x+2,p.y-30,12,8)}};
// Goal seen from the side: shaded posts and bar, net panels with mesh, back sag, stanchions and ground shadow.
function mesh(c,P,n1,n2,color){const lerp=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});c.strokeStyle=color;c.lineWidth=1;c.beginPath();for(let i=0;i<=n1;i++){const t=i/n1,p=lerp(P[0],P[1],t),q=lerp(P[3],P[2],t);c.moveTo(p.x,p.y);c.lineTo(q.x,q.y)}for(let i=0;i<=n2;i++){const t=i/n2,p=lerp(P[0],P[3],t),q=lerp(P[1],P[2],t);c.moveTo(p.x,p.y);c.lineTo(q.x,q.y)}c.stroke()}
function poly(c,P,fill){c.beginPath();P.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=fill;c.fill()}
R.goal=function(x){const c=this.ctx,z=this.camera?.zoom||36,dir=x?1:-1,A=this.project(x,25),B=this.project(x,37),H=Math.round(z*2),D=Math.round(z*1.7),up=Math.round(z*.3),sag=Math.round(H*.72);
 const At={x:A.x,y:A.y-H},Bt={x:B.x,y:B.y-H},bA={x:A.x+dir*D,y:A.y-up},bB={x:B.x+dir*D,y:B.y-up},bAt={x:bA.x,y:bA.y-sag},bBt={x:bB.x,y:bB.y-sag};
 poly(c,[A,{x:bA.x+dir*14,y:bA.y+10},{x:bB.x+dir*14,y:bB.y+10},B],'#06201266');
 poly(c,[bAt,bBt,bB,bA],'#d9ecf022');mesh(c,[bAt,bBt,bB,bA],14,5,'#cfe4e899');
 poly(c,[At,Bt,bBt,bAt],'#e6f3f52a');mesh(c,[At,Bt,bBt,bAt],14,4,'#d9ecf0aa');
 poly(c,[At,bAt,bA,A],'#d9ecf030');mesh(c,[At,bAt,bA,A],4,5,'#cfe4e8aa');
 c.strokeStyle='#7f8b96';c.lineWidth=3;c.beginPath();c.moveTo(At.x,At.y);c.lineTo(bA.x,bA.y);c.moveTo(Bt.x,Bt.y);c.lineTo(bB.x,bB.y);c.moveTo(bA.x,bA.y);c.lineTo(bB.x,bB.y);c.stroke();
 poly(c,[Bt,bBt,bB,B],'#e6f3f526');mesh(c,[Bt,bBt,bB,B],4,5,'#e0f0f3bb');
 // frame: dark outline, white tube, grey shade side
 const tube=(p,q,w)=>{c.lineCap='square';c.strokeStyle='#16273a';c.lineWidth=w+4;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.strokeStyle='#fffbe9';c.lineWidth=w;c.stroke();c.strokeStyle='#b9c2c8';c.lineWidth=2;c.beginPath();c.moveTo(p.x+dir*(w/2-1),p.y);c.lineTo(q.x+dir*(w/2-1),q.y);c.stroke()};
 tube({x:A.x,y:A.y},At,7);tube(At,Bt,6);tube({x:B.x,y:B.y},Bt,7);c.fillStyle='#16273a';c.fillRect(A.x-5,A.y-2,10,4);c.fillRect(B.x-5,B.y-2,10,4)};
const draw=R.draw;R.draw=function(m){this.currentMatch=m;return draw.call(this,m)};
})();
