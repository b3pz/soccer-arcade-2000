/* CPU difficulty: only teams without humans are weakened; humans get a small pace bonus on easier levels. */
(function(){
const LEVELS={
 facile:{label:'FACILE',coins:5,pace:.8,tackleWait:1.9,react:.6,aimError:4,reach:.6,humanPace:1.08,attr:{defending:-14,tackleStrength:-14,goalkeeping:-16,speed:-10,shooting:-10,passing:-8,control:-6}},
 normale:{label:'NORMALE',coins:3,pace:.9,tackleWait:1.4,react:.3,aimError:2,reach:.3,humanPace:1.04,attr:{defending:-7,tackleStrength:-7,goalkeeping:-8,speed:-5,shooting:-5,passing:-4,control:-3}},
 difficile:{label:'DIFFICILE',coins:1,pace:1,tackleWait:1,react:0,aimError:0,reach:0,humanPace:1,attr:{}}};
function apply(m,level){const L=LEVELS[level]||LEVELS.facile;
 for(const t of m.teams){if(m.teamHasHumans(t)){t.humanPace=L.humanPace;t.cpu=null;continue}
  t.cpu={pace:L.pace,tackleWait:L.tackleWait,react:L.react,aimError:L.aimError,reach:L.reach};
  for(const p of t.players)if(p.attributes)for(const [k,v] of Object.entries(L.attr))if(k in p.attributes)p.attributes[k]=Math.max(30,p.attributes[k]+v)}
 m.difficulty=LEVELS[level]?level:'facile';return L}
window.S9ArcadeDifficulty={LEVELS,order:['facile','normale','difficile'],apply};
})();
