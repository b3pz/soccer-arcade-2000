/* Shared physical bindings; simulation and network packets retain logical actions. */
(function(){
'use strict';
const V=window.S9ArcadeEvolution,S=V.settings;
const play=[['arrowup','Su'],['arrowdown','Giù'],['arrowleft','Sinistra'],['arrowright','Destra'],['z','Tiro'],['c','Passaggio'],['x','Passaggio alto / scivolata'],['v','Dribbling / contrasto'],['switch','Cambio giocatore']];
const menu=[['arrowup','Menu: su'],['arrowdown','Menu: giù'],['arrowleft','Menu: sinistra'],['arrowright','Menu: destra'],['confirm','Conferma / continua / salta intro'],['back','Indietro / esci'],['previous','Area precedente'],['next','Area successiva']];
const system=[['pause','Pausa'],['settings','Impostazioni dalla pausa'],['fullscreen','Schermo intero']];
const defaults={p1:{arrowup:'arrowup',arrowdown:'arrowdown',arrowleft:'arrowleft',arrowright:'arrowright',z:'z',c:'c',x:'x',v:'v',switch:'shift'},p2:{arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d',z:'j',c:'k',x:'l',v:'i',switch:'u'},menu:{arrowup:'arrowup',arrowdown:'arrowdown',arrowleft:'arrowleft',arrowright:'arrowright',confirm:'z',back:'x',previous:'q',next:'e'},system:{pause:'escape',settings:'p',fullscreen:'f'}};
const padDefault={arrowup:12,arrowdown:13,arrowleft:14,arrowright:15,z:0,c:1,x:2,v:3,switch:4,pause:9,settings:6,fullscreen:8};
const padMenuDefault={arrowup:12,arrowdown:13,arrowleft:14,arrowright:15,confirm:0,back:1,previous:4,next:5,pause:9,settings:6,fullscreen:8};
S.keys={...defaults.p1,...S.keys};S.keys2={...defaults.p2,...S.keys2};S.menuKeys={...defaults.menu,...S.menuKeys};S.systemKeys={...defaults.system,...S.systemKeys};S.padKeys=Array.from({length:4},(_,i)=>({...padDefault,...S.padKeys?.[i]}));S.padMenuKeys={...padMenuDefault,...S.padMenuKeys};
const map=group=>group==='p1'?S.keys:group==='p2'?S.keys2:group==='menu'?S.menuKeys:group==='system'?S.systemKeys:group==='padmenu'?S.padMenuKeys:S.padKeys[Number(group.slice(3))];
const normalize=key=>String(key).toLowerCase();
function label(key){return key===' '?'SPAZIO':({arrowup:'↑',arrowdown:'↓',arrowleft:'←',arrowright:'→',escape:'ESC',control:'CTRL',meta:'CMD'})[key]||String(key).toUpperCase()}
function keyboard(group,key){const value=normalize(typeof key==='object'?key.key:key);return Object.keys(map(group)).find(a=>map(group)[a]===value)||null}
function key(action,group='system'){return map(group)[action]}
function set(group,action,value){const target=map(group);if(!(action in target))throw Error('Comando sconosciuto');value=group.startsWith('pad')?Number(value):normalize(value);if(group.startsWith('pad')){if(!Number.isInteger(value)||value<0||value>31)throw Error('Pulsante non valido')}else{if(!value||['dead','unidentified'].includes(value))throw Error('Tasto non riconosciuto');const others=group==='system'?['p1','p2','menu']:group==='menu'?['system']:group==='p1'?['p2','system']:['p1','system'];for(const other of others)if(Object.values(map(other)).includes(value))throw Error('Tasto già usato in '+other.toUpperCase()+': modifica prima quel comando')}
 const conflict=Object.keys(target).find(a=>a!==action&&target[a]===value);if(conflict)target[conflict]=target[action];target[action]=value;V.save();return conflict;
}
function reset(){S.keys={...defaults.p1};S.keys2={...defaults.p2};S.menuKeys={...defaults.menu};S.systemKeys={...defaults.system};S.padKeys=Array.from({length:4},()=>({...padDefault}));S.padMenuKeys={...padMenuDefault};V.save()}
function padAction(button,index=0,scope='play'){const target=scope==='menu'?S.padMenuKeys:S.padKeys[index]||S.padKeys[0];return Object.keys(target).find(action=>target[action]===button)||null}
function keymap(group){return Object.fromEntries(Object.entries(map(group)).map(([action,key])=>[key,action]))}
function format(text){if(typeof text!=='string')return text;return text.replace(/Z \/ INVIO/g,label(S.menuKeys.confirm)).replace(/\bFRECCE\b/g,['arrowup','arrowdown','arrowleft','arrowright'].map(a=>label(S.menuKeys[a])).join(' ')).replace(/\b(Z|X|Q|E|ESC|INVIO|F|P)(?= ·| PAUSA| FULL| SCHERMO| IMPOSTAZIONI| \/ INVIO)/g,token=>label(({Z:S.menuKeys.confirm,X:S.menuKeys.back,Q:S.menuKeys.previous,E:S.menuKeys.next,ESC:S.systemKeys.pause,INVIO:S.menuKeys.confirm,F:S.systemKeys.fullscreen,P:S.systemKeys.settings})[token]));}
window.S9ArcadeBindings={play,menu,system,defaults,map,set,reset,key,keyboard,keymap,label,padAction,format};V.save();
})();
