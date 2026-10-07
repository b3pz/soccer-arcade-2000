# Direzione artistica arcade 1998–2000

Il tema usa immagini raster locali: blu cobalto, oro, luci notturne, stemmi fantastici, sponsor inventati e illustrazioni sportive da sala giochi. Nessuna dipendenza da servizi esterni durante la partita.

## Asset integrati

- `title-logo.png`: titolo trasparente. Il pallone occupa la O; la sequenza finale dell'intro porta il pallone animato nello stesso punto.
- `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`: icone del gioco.
- `stadium-menu.png`: fondale del titolo, selezione, opzioni e centro Arcade.
- `cinematic-wide-sheet.png`: sei inquadrature 16:9 per l'intro da 12 secondi: finale, dribbling, rovesciata, parata, scarpa anonima, rete strappata. Il codice gestisce tagli, pan, zoom, suoni e raccordo al logo. È una sequenza illustrata animata, non un filmato video.
- `ceremonies.png`: quattro fondali per moneta, rigori/punizioni, premiazione e cartellini. I giocatori, arbitro, pallone e coppa rimangono sprite animati.
- `crowd-sheet.png`: quattro immagini del tifo con bandiere e sciarpe, usate sia negli spalti sia nel primo piano dell'esultanza.
- `sponsors.png`: NOVA KICK, VOLTIX, KAZAN SPORT, ORBIT COLA. Quattro strisce complete sui pannelli a bordo campo; le scritte non vengono ricostruite con font.
- `world-map.png` e `maps/*.png`: mappa panoramica e dodici mappe regionali. Le mappe regionali sono esportate dalle geometrie esistenti con `python3 tools/bake-arcade-maps.py`; marker e selezione rimangono interattivi.
- `crests/team-000.png` … `crests/team-144.png`: 145 stemmi arcade distinti, uno per squadra; `crests/jurassic.png` per la finale segreta. PNG trasparenti 320×320. Galleria, assegnazioni e prompt in [crests/README.md](crests/README.md).
- `review/asset-contact-sheet.jpg`: tavola di controllo degli asset, non schermata del gioco.

`game/artwork.js` centralizza caricamento e ritaglio. `arcade/engine/raster-theme.js` integra pubblico, sponsor e fondali. `arcade/ui/drawn-menu.js` dipinge menu e controlli con il pannello bitmap del cabinato: il DOM resta uno strato invisibile per layout, accessibilità e input. Campo, telecamera, testi dinamici, fisica ed effetti continuano a essere gestiti dal codice.

Il catalogo contiene 145 nomi di squadra e 2.493 nomi di calciatore inventati. `game/fictional-identities.js` protegge anche le vecchie formazioni salvate. Gli identificatori interni e i dati di gioco restano stabili; i nomi geografici delle aree e delle città servono alla navigazione delle mappe.

## Verifica

`python3 tools/run-arcade-tests.py` controlla logica, sprite, atlanti, icone, mappe, identità, HUD, intro e barriera. La barriera reagisce con lo sprite del difensore colpito; il pallone resta sul contatto prima di rimbalzare. Il calcio d'inizio apre dal pallone e si allontana in 3,2 secondi senza consumare tempo di partita.

Gli asset sono stati ispezionati come immagini. Il playback effettivo nel browser e un joypad fisico non sono stati verificati in questa sessione, perché il browser non può aprire il gioco locale. Le modifiche sono locali, non pubblicate su GitHub Pages.
