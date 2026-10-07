/* Save artwork metadata only: keeper reach and ball outcomes stay in the simulation. */
(function(){
'use strict';
const E=S9ArcadeEngine,duration=.8;
function classify(height,speed,tip=false){return tip?'tip':height>=3.8?'punch':'stretch'}
function pose(p,m,time=m.elapsed){if(p.role!=='GK')return null;const saved=p.saveAnimation;if(saved&&time>=saved.start&&time<saved.start+saved.duration)return 'save_'+saved.kind+'_'+saved.side;
 if(p.keeperState!=='GK_DIVING')return null;const cell=m.pen?.diveCell,target=cell!=null&&E.PenaltyTargets?.cell(cell),height=target?.z??(m.fk?m.fk.power*5:0),kind=height>=3.8?'tip':'stretch',side=(target?target.col-1:p.face?.y||p.y-31)<0?'left':'right';return 'save_'+kind+'_'+side}
const update=E.Goalkeeper.prototype.update;
E.Goalkeeper.prototype.update=function(m,dt){const before=m.stats.teams[this.team.id].saves,b=m.ball,height=b.z,speed=Math.hypot(b.vx,b.vy),side=(b.y-this.y||b.vy||this.face?.y||1)<0?'left':'right';update.call(this,m,dt);if(m.stats.teams[this.team.id].saves>before&&this.keeperState==='GK_DIVING'){this.saveAnimation={kind:classify(height,speed,m.message==='IN CORNER!'),side,start:m.elapsed,duration}}};
window.S9ArcadeSaves={duration,classify,pose};
})();
