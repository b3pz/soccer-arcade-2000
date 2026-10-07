/* Original synthesized menu soundtrack; never plays during a match. Tracks rotate: each ends and the next begins. */
(function(){const TRACKS=['arcade/assets/cabinet-theme.wav','arcade/assets/music/kick-off.wav','arcade/assets/music/world-tour.wav','arcade/assets/music/night-final.wav','arcade/assets/music/extra-time.wav'];
let track=null,index=0;const enabled=()=>localStorage.getItem('s9MenuMusicOff')!=='1',volume=()=>.10*(window.S9ArcadeEvolution?.settings.volume??1);
// Each track plays twice through, then the next one in the list.
function load(i){track?.pause();index=(i+TRACKS.length)%TRACKS.length;let plays=0;const t=new Audio(TRACKS[index]);t.volume=volume();t.preload='auto';t.addEventListener?.('ended',()=>{if(t!==track)return;if(++plays<2){t.currentTime=0;t.play().catch(()=>{})}else{load(index+1);start()}});track=t}
function stop(){track?.pause()}
function start(){if(!enabled()||window.S9ArcadeMusicMuted||!window.S9ArcadeMenuOpen)return;if(!track)load(0);track.play().catch(()=>{})}
function next(){load(index+1);start()}
window.S9ArcadeMusic={start,stop,next,tracks:TRACKS,setVolume(){if(track)track.volume=volume()},get playing(){return !!track&&!track.paused},get track(){return TRACKS[index]}};
})();
