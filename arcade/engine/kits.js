/* Resolve kit clashes before kickoff without mutating the team database. */
(function(){const rgb=h=>{h=(h||'#237cec').replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
function similar(a,b){const x=rgb(a),y=rgb(b);return Math.sqrt(x.reduce((n,v,i)=>n+(v-y[i])**2,0))<150}
function colors(k){return k.pattern==='solid'||k.pattern==='trim'?[k.shirtPrimary]:[k.shirtPrimary,k.shirtSecondary||k.shirtPrimary]}
function resolve(home,away){const a=colors(home),b=colors(away),clash=a.some(x=>b.some(y=>similar(x,y)));if(!clash)return {...away};const chosen=['#ffffff','#102b73','#ff7c12','#00edff','#ee00ff'].find(color=>a.every(x=>!similar(x,color)))||'#ff7c12';return {...away,shirtPrimary:chosen,shirtSecondary:chosen,shorts:chosen==='#ffffff'?'#102b73':'#ffffff',socks:chosen,pattern:'solid',clashResolved:true}}
window.S9ArcadeKits={resolve,similar};})();
