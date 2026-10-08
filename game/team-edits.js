/* Team editor data: the player's changes to team names, kit colours and player names, kept in localStorage
   (sa2000:teamEdits) and applied to the catalog at start-up, before the roster and the menus read it. */
(function(){
'use strict';
const KEY='sa2000:teamEdits';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}};
const write=edits=>{try{localStorage.setItem(KEY,JSON.stringify(edits))}catch(e){}};
const original=new Map();// id -> {name, kit, players:{pid:name}} as shipped
function teams(){const c=window.SA2000_CATALOG;return c?[...c.club,...c.national]:[]}
function remember(t){if(!original.has(t.id))original.set(t.id,{name:t.name,kit:{...t.arcadeKit},players:Object.fromEntries(t.players.map(p=>[p.id,p.name]))})}
// Apply one team's edits to a catalog object (and to the roster's copy, which shares the players).
function applyTo(t,e){remember(t);const o=original.get(t.id);t.name=e?.name||o.name;t.arcadeKit={...o.kit,...(e?.kit||{})};for(const p of t.players)p.name=e?.players?.[p.id]||o.players[p.id]}
function apply(id){const e=read()[id];for(const t of teams())if(!id||t.id===id)applyTo(t,id?e:read()[t.id]);const r=window.S9ArcadeRoster?.get?.(id);if(id&&r){r.name=teams().find(t=>t.id===id)?.name;r.arcadeKit=teams().find(t=>t.id===id)?.arcadeKit}}
function set(id,patch){const edits=read(),e=edits[id]||{};if('name' in patch)e.name=patch.name||undefined;if(patch.kit)e.kit={...(e.kit||{}),...patch.kit};if(patch.player)e.players={...(e.players||{}),[patch.player.id]:patch.player.name||undefined};edits[id]=e;write(edits);apply(id)}
function reset(id){const edits=read();delete edits[id];write(edits);apply(id)}
function edited(id){return !!read()[id]}
apply();
window.S9ArcadeTeamEdits={set,reset,edited,apply,original:id=>original.get(id)};
})();
