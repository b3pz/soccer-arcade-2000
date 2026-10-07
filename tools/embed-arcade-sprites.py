"""Package unmodified sprite PNGs for palette swaps when index.html is opened via file://."""
from pathlib import Path
import base64, json
root=Path(__file__).resolve().parents[1]
images={key:'data:image/png;base64,'+base64.b64encode((root/path).read_bytes()).decode('ascii') for key,path in {'players':'arcade/assets/animations.png','creatures':'arcade/assets/jurassic-players.png'}.items()}
source='/* Exact PNG bytes embedded for origin-clean local-file palette reads. Regenerate with tools/embed-arcade-sprites.py. */\n(function(){const embedded='+json.dumps(images,separators=(',',':'))+';window.S9ArcadeSpriteSource=function(key,fallback){return window.location?.protocol===\'file:\'?embedded[key]||fallback:fallback};})();\n'
p=root/'arcade/assets/offline-sprites.js';temporary=p.with_suffix('.atomic');temporary.write_text(source);temporary.replace(p)
