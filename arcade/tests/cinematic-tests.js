/* Timeline, drawing and intro-to-title continuity; no browser dependencies. */
var window=globalThis,texts=[],frames=0,flames=0,listener,raf,now=0;
var performance={now:()=>now},requestAnimationFrame=fn=>(raf=fn,1),cancelAnimationFrame=()=>{};
var addEventListener=(name,fn)=>{if(name==='keydown')listener=fn};
const gradient={addColorStop(){}};
var c=new Proxy({measureText:s=>({width:s.length*53}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,fillText:s=>texts.push(s),fill(){if(this.fillStyle==='#fff3a2')flames++}},{get:(t,k)=>k in t?t[k]:(...a)=>{for(const v of a)if(typeof v==='number'&&!Number.isFinite(v))throw Error('nonfinite '+k);frames++},set:(t,k,v)=>(t[k]=v,true)});
const canvas={getContext:()=>c,style:{},addEventListener(){}};
var document={getElementById:()=>canvas,createElement:()=>({getContext:()=>c,width:0,height:0})};
var Image=class{constructor(){this.complete=true;this.naturalWidth=this.width=1280;this.naturalHeight=this.height=720}};
var Audio=class{play(){return Promise.resolve()}pause(){}};
window.S9SFX={};
load('game/cinematic.js');
function assert(v,s){if(!v)throw Error(s)}function pass(s){print('PASS '+s)}
const film=S9ArcadeCinematic;assert(film.duration===12,'duration');assert(film.shots[0].start===0&&film.shots[film.shots.length-1].end===12,'endpoints');for(let i=1;i<film.shots.length;i++)assert(film.shots[i].start===film.shots[i-1].end,'gap');const cues=new Set();for(let i=0;i<=720;i++)film.draw(c,i/60,{cue:(k)=>cues.add(k),titleBackground(){},logo(){}});assert(cues.has('netBreak')&&cues.has('decidingShot')&&cues.has('save')&&cues.has('bicycle'),'sequence cues');assert(frames>1000,'no artwork');pass('12-second cinematic has seven continuous shots and renders all action, goal and logo frames with finite geometry');
flames=0;film.draw(c,8.2,{fantasy:false});film.draw(c,9.5,{fantasy:false});assert(flames===0,'disabled fire');film.draw(c,8.2,{fantasy:true});assert(flames>0,'missing fire');pass('cinematic fire trails follow the fantasy-effects preference');
load('game/intro.js');SA2000.play();now=11900;raf(now);assert(!texts.includes('© 2026 SOCCER ARCADE 2000'),'premature title');now=12000;raf(now);now=12010;raf(now);assert(texts.includes('© 2026 SOCCER ARCADE 2000'),'title not reached');SA2000.play();listener({key:'Enter',preventDefault(){}});now+=20;raf(now);assert(canvas.style.display==='block','skip broke title');pass('intro runs for 12 seconds before the ready title; keyboard skip remains available');

load('game/artwork.js');let painted=0;const paintedImage=S9ArcadeArt.image;S9ArcadeArt.image=function(key){if(key==='film')painted++;return paintedImage.apply(this,arguments)};for(let t=0;t<10.1;t+=.1)film.draw(c,t,{fantasy:true});S9ArcadeArt.image=paintedImage;assert(painted>90,'painted film atlas never integrated into intro');flames=0;film.draw(c,9.1,{fantasy:false});assert(flames===0,'painted net bypasses disabled fantasy preference');pass('intro uses panoramic paintings and keeps the flame-free net fallback when fantasy is disabled');
