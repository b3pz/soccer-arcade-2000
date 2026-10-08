var window=globalThis,store={},localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}};
load('game/catalog.js');load('game/team-edits.js');
function assert(v,s){if(!v)throw Error(s)}
const T=S9ArcadeTeamEdits,t=SA2000_CATALOG.club[0],p=t.players[3],name0=t.name,pname0=p.name,kit0=t.arcadeKit.shirtPrimary;
T.set(t.id,{name:'Amici FC'});T.set(t.id,{kit:{shirtPrimary:'#123456'}});T.set(t.id,{player:{id:p.id,name:'Mario Rossi'}});
assert(t.name==='Amici FC'&&t.arcadeKit.shirtPrimary==='#123456'&&p.name==='Mario Rossi','edits not applied');
assert(JSON.parse(store['sa2000:teamEdits'])[t.id].players[p.id]==='Mario Rossi','edits not saved');
T.reset(t.id);assert(t.name===name0&&t.arcadeKit.shirtPrimary===kit0&&p.name===pname0,'reset did not restore');
print('PASS team editor: team name, kit colours and player names are saved and applied; reset restores the original');
