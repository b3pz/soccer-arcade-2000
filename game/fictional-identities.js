/* Protect presentation against names stored by earlier versions or supplied by legacy lineups. */
(function(){
'use strict';
const players=new Map(),teams=new Map();for(const t of [...SA2000_CATALOG.club,...SA2000_CATALOG.national]){teams.set(t.id,t);for(const p of t.players)players.set(p.id,p)}
function player(p,index=0){return {...p,name:players.get(p?.id)?.name||('Veyko '+['Zorvan','Ryxel','Kavren','Lorvak'][index%4])}}
function team(t){const canonical=teams.get(t?.id);return {...t,name:canonical?.name||(t?.arcadeCreatures?'Jurassic Kickers':'Veyra All Stars'),crest:canonical?.crest||(t?.arcadeCreatures?'arcade/assets/art/crests/jurassic.png':'arcade/assets/art/crests/team-000.png'),players:(t?.players||canonical?.players||[]).map(player)}}
window.S9ArcadeFiction={player,team};
})();
