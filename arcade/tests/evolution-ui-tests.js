/* DOM model tests exercise the actual hub handlers; no browser or saved user data. */
var window=globalThis,storage={},document;
var localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v};
function assert(v,s){if(!v)throw Error(s)}function pass(s){print('PASS '+s)}
class Node {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.attrs={};this._value='';this._text='';this.disabled=false}
 append(...ns){for(const n of ns){n.parent=this;this.children.push(n)}}
 replaceChildren(...ns){this.children=[];this.append(...ns)}
 set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ')}
 get options(){return this.children.filter(n=>n.tagName==='OPTION')}
 get value(){return this._value||(this.tagName==='SELECT'?this.options[0]?.value||'':'')}set value(v){this._value=String(v)}
 setAttribute(k,v){this.attrs[k]=v}remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)}
 focus(){document.activeElement=this}
 querySelectorAll(selector){const tags=selector.split(',').map(s=>s.toUpperCase());let out=[];for(const n of this.children){if(tags.includes(n.tagName))out.push(n);out=out.concat(n.querySelectorAll(selector))}return out}
}
document={body:new Node('body'),createElement:t=>new Node(t),addEventListener(){},removeEventListener(){}};
const settings={keys:{z:'z',c:'c',x:'x',v:'v',switch:'shift'},camera:'panoramic',volume:.65,effects:.5},progress={xp:0,medals:{},bestSurvival:0};
window.S9ArcadeEvolution={settings,progress,save(){},commands:[],cosmetics:[],challenges:{comeback:{name:'Rimonta',description:'rimonta'},volley:{name:'Volo',description:'volo'},resist:{name:'Difendi',description:'difendi'},passing:{name:'Passaggi',description:'passa'},defending:{name:'Difesa',description:'difendi'},dribbling:{name:'Finte',description:'finta'}}};
const teams=Array.from({length:8},(_,i)=>({id:'t'+i,name:'Squadra '+i,strength:65+i*3}));
window.S9ArcadeRoster={pool:()=>teams,get:id=>teams.find(t=>t.id===id),simulate:(h,a)=>({hg:1,ag:0,winner:h})};window.S9ArcadeDifficulty={order:['facile','normale','difficile'],LEVELS:{facile:{label:'FACILE'},normale:{label:'NORMALE'},difficile:{label:'DIFFICILE'}}};var navigator={getGamepads:()=>[]};
let configs=[],cancel=false,lose=false;
window.launchArcadeMatch=async config=>{configs.push(config);if(cancel){cancel=false;return null}return {homeGoals:lose?0:2,awayGoals:lose?2:0,winner:lose?config.away.id:config.home.id,stats:{teams:[{},{}]},xp:20}};
load('arcade/ui/evolution-hub.js');
const buttons=()=>document.body.querySelectorAll('button');
async function click(text){const b=buttons().find(b=>b._text===text);assert(b,'missing button '+text);await b.onclick()}
const run=()=>JSON.parse(storage['sa2000:evolutionRun']);
async function checks(){
 S9ArcadeHub.open();await click('PARTITA RAPIDA');await click('AVVIA');assert(configs[0].home.id!==configs[0].away.id,'quick distinct teams');await click('RIVINCITA / RIPROVA');assert(configs.length===2&&configs[0]===configs[1],'rematch preserves configuration');await click('CENTRO ARCADE');pass('quick match and immediate rematch handlers');
 await click('CAMPIONATO BREVE');await click('AVVIA');cancel=true;await click('GIOCA');assert(run().round===0&&run().results.length===0,'cancel must not advance');for(let i=0;i<5;i++){await click('GIOCA');const c=configs[configs.length-1],r=run();assert(c.players[0].team===(c.home.id===r.user?0:1),'human must control selected team in away fixtures')}assert(run().done&&run().results.length===15,'league complete');pass('full five-round league, cancellation and away-side control');
 await click('MENU');S9ArcadeHub.open();await click('TORNEO LOCALE');await click('AVVIA');await click('GIOCA');await click('GIOCA');assert(run().round===1&&!run().done,'final after two semis');await click('GIOCA');assert(run().done&&run().results.length===3,'local final');assert(configs[configs.length-1].players.map(p=>p.team).join(',')==='0,1','local sides');pass('local tournament semifinals, final and keyboard assignments');
 await click('MENU');S9ArcadeHub.open();await click('SURVIVAL');await click('AVVIA');for(let i=0;i<3;i++)await click('GIOCA');assert(run().wins===3&&progress.bestSurvival===3,'survival score');assert(configs[configs.length-1].difficulty==='normale','difficulty increases');await click('TORNA AL CENTRO · SALVATO');await click('MENU');S9ArcadeHub.open();await click('RIPRENDI SURVIVAL');lose=true;await click('GIOCA');assert(run().done&&run().wins===3,'survival loss');pass('survival difficulty, record, resume and elimination');
 await click('MENU');S9ArcadeHub.open();await click('SFIDE ARCADE');await click('AVVIA');assert(configs[configs.length-1].challenge==='comeback','challenge launched');pass('challenge menu forwards the selected objective');
}
checks().catch(e=>{print(e.stack);throw e});
