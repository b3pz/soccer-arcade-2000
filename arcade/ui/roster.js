/* Soccer Arcade 2000 catalog: one entry per club / national team, read from game/catalog.js. */
(function(){
 let catalog=null;const lookup=new Map();
 function build(){if(catalog)return catalog;const data=window.SA2000_CATALOG||{club:[],national:[]};catalog={club:data.club.map(t=>({...t})),national:data.national.map(t=>({...t}))};for(const t of [...catalog.club,...catalog.national])lookup.set(t.id,t);return catalog}
 function pool(category){return build()[category]||[]}
 function get(id){build();return lookup.get(id)}
 function simulate(h,a,draw){const home=get(h),away=get(a),bias=((home?.strength||75)-(away?.strength||75))/22;const goals=b=>Math.max(0,Math.min(5,Math.floor(Math.random()*3.6+b)));const hg=goals(bias),ag=goals(-bias);return {hg,ag,winner:hg===ag?(draw?null:Math.random()<(1/(1+Math.exp(-bias)))?h:a):hg>ag?h:a}}
 window.S9ArcadeRoster={build,pool,get,simulate};
})();
