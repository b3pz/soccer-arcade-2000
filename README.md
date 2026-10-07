# Soccer Arcade 2000

Gioco di calcio arcade stile anni '90, indipendente da Soccer Sim.

## Avvio
Apri `index.html` nel browser (doppio clic va bene: funziona anche da file locale). Premi un tasto, guarda l'intro, poi START.

## Controlli
- **1P tastiera:** frecce per muovere · Z tiro (tieni per caricare) · C passaggio · X lancio alto · V dribbling. In difesa X/C scivolata, V contrasto duro.
- **2P tastiera:** W A S D · J tiro · K passaggio · L alto · I dribbling.
- **Joypad:** A tiro · B passaggio · X alto · Y dribbling · START pausa · BACK schermo intero.
- **Calci piazzati:** premi Z/C/X per fermare la freccia, tieni premuto per la potenza, rilascia. Nelle punizioni dal limite ←/→ danno l'effetto.
- **Sempre:** ESC pausa · F schermo intero.

## Modalità
Amichevole (1 giocatore, co-op, 1 contro 1, 2 contro 2) · Coppa (World Club Cup / Mondiale, con difficoltà e gettoni) · Allenamento (punizioni dirette e indirette, angoli, rigori).

## Struttura
- `index.html`: pagina del gioco.
- `game/`: avvio, intro, salvataggi, suoni, catalogo squadre (`catalog.js`).
- `arcade/engine/`: motore di gioco.
- `arcade/ui/`: menu e torneo.
- `arcade/assets/`: sprite, mappe, musica, fondali.
- `assets/`: stemmi e audio dello stadio.
- `tools/`: generatori di asset e test (`python3 tools/run-arcade-tests.py`, serve macOS).
- `docs/`: changelog.

I salvataggi stanno nel browser, nel `localStorage` con prefisso `sa2000:`.
