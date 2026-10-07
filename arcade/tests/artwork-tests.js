var window=globalThis;
var Image=class{constructor(){this.complete=true;this.naturalWidth=2048;this.naturalHeight=768}set src(v){this.url=v;if(v.includes('title-logo')){this.naturalWidth=1983;this.naturalHeight=793}if(v.includes('sponsors')){this.naturalWidth=2172;this.naturalHeight=724}}};
load('game/artwork.js');load('game/catalog.js');load('game/fictional-identities.js');
function assert(v,s){if(!v)throw Error(s)}
const calls=[],ctx=new Proxy({globalAlpha:1,drawImage:function(){calls.push(Array.from(arguments))}},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)}),A=S9ArcadeArt;
for(const key of ['final','dribble','bicycle','save','anonymous','net'])assert(A.cinematic(ctx,key,.5),'missing cinematic '+key);
for(const args of calls){assert(args.slice(1).every(Number.isFinite),'non-finite cinematic crop');assert(args[1]>=0&&args[2]>=0&&args[1]+args[3]<=args[0].naturalWidth+.01&&args[2]+args[4]<=args[0].naturalHeight+.01,'cinematic crosses atlas cells')}
assert(calls.every(a=>a[0].url.includes('cinematic-wide-sheet')),'intro still uses cropped square artwork');
calls.length=0;for(let i=0;i<4;i++)A.sponsor(ctx,i,0,0,226,20);assert(calls.every(a=>a[3]===2172&&a[4]===181),'sponsor words cropped');
const target=A.logoTarget();assert(target.x>100&&target.x<1180&&target.y>90&&target.y<540&&target.r>50,'logo ball misses artwork');assert(A.logo(ctx,{hole:true}),'image title not drawn');
print('PASS panoramic film crops, full sponsor strips and image-logo landing target');
const teams=[...SA2000_CATALOG.club,...SA2000_CATALOG.national];assert(new Set(teams.map(t=>t.name)).size===teams.length,'duplicate club identities');assert(teams.every(t=>t.arcadeFictional&&t.crest),'identity or crest missing');assert(new Set(teams.map(t=>t.crest)).size===teams.length,'team crests are still shared');
const t=teams[0],legacy={...t,name:'Real Club',players:t.players.map(p=>({...p,name:'Real Player'}))},fixed=S9ArcadeFiction.team(legacy);assert(fixed.name===t.name&&fixed.players.every((p,i)=>p.name===t.players[i].name),'legacy names leak');assert(fixed.players.every((p,i)=>p.id===legacy.players[i].id&&p.rating===legacy.players[i].rating),'identity migration changes player performance');assert(S9ArcadeFiction.team({name:'Real Club',players:[{name:'Real Player'}]}).players[0].name!=='Real Player','unknown legacy name leaks');
print('PASS fictional teams, bitmap crests and legacy-name migration preserve player identities and ratings');
