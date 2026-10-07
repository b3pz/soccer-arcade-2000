/* Pure Arcade tournament: four groups of four, three games, then knockout. */
(function(){
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const schedule=[[ [0,1],[2,3] ],[ [0,2],[3,1] ],[ [0,3],[1,2] ]];
 function pool(all,ids){const chosen=new Map();for(const t of all){if(!ids.includes(t.id))continue;const key=t.name.trim().toLowerCase();if(!chosen.has(key)||(t.strength||0)>(chosen.get(key).strength||0))chosen.set(key,t)}return [...chosen.values()].sort((a,b)=>a.name.localeCompare(b.name))}
 function create(category,ids,user,formation='4-4-2',zones=null){
  if(!ids.includes(user)||new Set(ids).size<16)throw Error('Servono 16 squadre distinte');
  const size=category==='national'&&new Set(ids).size>=32?32:16;const rest=shuffle([...new Set(ids)].filter(id=>id!==user)),reserved=[];if(zones){const seen=new Set([zones[user]]);for(const id of rest){const zone=zones[id];if(zone&&!seen.has(zone)){seen.add(zone);reserved.push(id)}}}const participants=[user,...reserved,...rest.filter(id=>!reserved.includes(id))].slice(0,size);
  return {version:2,category,user,formation,groups:Array.from({length:size/4},(_,g)=>participants.slice(g*4,g*4+4)),round:0,stage:'groups',results:[],bracket:null};
 }
 function standings(c,g){const rows=c.groups[g].map(id=>({id,played:0,points:0,gf:0,ga:0}));for(const r of c.results.filter(r=>r.stage==='groups'&&r.group===g)){const h=rows.find(t=>t.id===r.h),a=rows.find(t=>t.id===r.a);h.played++;a.played++;h.gf+=r.hg;h.ga+=r.ag;a.gf+=r.ag;a.ga+=r.hg;h.points+=r.hg>r.ag?3:r.hg===r.ag?1:0;a.points+=r.ag>r.hg?3:r.hg===r.ag?1:0}return rows.sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||c.groups[g].indexOf(a.id)-c.groups[g].indexOf(b.id))}
 function fixture(c){if(c.stage==='groups'){const g=c.groups.findIndex(ids=>ids.includes(c.user)),ids=c.groups[g];const pair=schedule[c.round].find(p=>p.map(i=>ids[i]).includes(c.user));return {h:ids[pair[0]],a:ids[pair[1]],group:g,allowDraw:true}}if(c.stage==='knockout'){if(c.bracket.length===2)return {h:c.user,a:'arcade_jurassic',allowDraw:false,specialFinal:true,bonusFinal:true};const i=c.bracket.indexOf(c.user);return {h:c.bracket[i-i%2],a:c.bracket[i-i%2+1],allowDraw:false,specialFinal:c.bracket.length===2}}return null}
 function advance(c,result,simulate){
  const f=fixture(c);if(f?.bonusFinal)c.bracket=[c.user,'arcade_jurassic'];if(!f)throw Error('Torneo concluso');
  if(c.stage==='groups'){
   c.groups.forEach((ids,g)=>schedule[c.round].forEach(pair=>{const h=ids[pair[0]],a=ids[pair[1]],r=h===c.user||a===c.user?result:simulate(h,a,true);c.results.push({stage:'groups',group:g,round:c.round,h,a,hg:r.homeGoals??r.hg,ag:r.awayGoals??r.ag})}));c.round++;
   if(c.round===3){const ranks=c.groups.map((_,g)=>standings(c,g));if(!ranks.some(rows=>rows.slice(0,2).some(t=>t.id===c.user))){c.stage='out';return c}c.bracket=[];for(let g=0;g<ranks.length;g+=2)c.bracket.push(ranks[g][0].id,ranks[g+1][1].id,ranks[g+1][0].id,ranks[g][1].id);c.stage='knockout';c.round=0}
  }else{
   const winners=[];for(let i=0;i<c.bracket.length;i+=2){const h=c.bracket[i],a=c.bracket[i+1],r=h===c.user||a===c.user?result:simulate(h,a,false);if(r.winner!==h&&r.winner!==a)throw Error('Vincitore eliminazione diretta non valido');winners.push(r.winner);c.results.push({stage:'knockout',round:c.round,h,a,hg:r.homeGoals??r.hg,ag:r.awayGoals??r.ag,winner:r.winner})}c.bracket=winners;c.round++;c.stage=!winners.includes(c.user)?'out':winners.length===1?'won':'knockout';
  }if(c.stage==='won')c.bonus=bonus(c);return c;
 }
 function bonus(c){const played=c.results.filter(r=>r.h===c.user||r.a===c.user),wins=played.filter(r=>r.winner===c.user||(r.h===c.user?r.hg>r.ag:r.ag>r.hg)).length,goals=played.reduce((n,r)=>n+(r.h===c.user?r.hg:r.ag),0);return {champion:10000,finalShowdown:5000,wins:wins*1000,goals:goals*250,total:15000+wins*1000+goals*250}}
 window.S9ArcadeTournament={pool,create,standings,fixture,advance,bonus};
})();
