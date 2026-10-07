/* Original synthesized arcade menu loop; never plays during a match. */
(function(){let track=null;const enabled=()=>localStorage.getItem('s9MenuMusicOff')!=='1';
function stop(){track?.pause()}
function start(){if(!enabled()||window.S9ArcadeMusicMuted||!window.S9ArcadeMenuOpen)return;if(!track){track=new Audio('arcade/assets/cabinet-theme.wav');track.loop=true;track.volume=.10*(window.S9ArcadeEvolution?.settings.volume??1);track.preload='auto'}track.play().catch(()=>{})}
window.S9ArcadeMusic={start,stop,setVolume(){if(track)track.volume=.10*(window.S9ArcadeEvolution?.settings.volume??1)},get playing(){return !!track&&!track.paused},get track(){return 'arcade/assets/cabinet-theme.wav'}};
})();
