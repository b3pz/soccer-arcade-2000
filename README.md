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

## Aggiornamento Arcade Evolution
Dal menu principale apri **PARTITA RAPIDA · NUOVE MODALITÀ · IMPOSTAZIONI** per entrare nel Centro Arcade.

- Partita rapida con squadre, difficoltà e modulo ricordati, ricerca, preferite, recenti e rivincita.
- Sfide: rimonta da 0–2, gol al volo e resistenza in dieci; accademia di passaggi, difesa e dribbling con medaglie.
- Campionato a sei squadre e cinque giornate; torneo locale a quattro partecipanti (semifinali e finale); survival con avversari e difficoltà crescenti.
- Regole speciali: golden goal immediato, niente falli, super portieri, pallone veloce.
- Campionato, torneo locale e survival condividono uno slot di ripresa automatico. Avviare una nuova competizione sostituisce lo slot; uscire da una partita senza risultato non avanza il calendario.
- **SHIFT** cambia il difensore; **U** per 2P; **LB** sul joypad. I tasti 1P sono personalizzabili. Menu e navigazione conservano Z/Invio e X/Esc.
- Camera ravvicinata, panoramica o larga; radar disattivabile; indicatori di selezione, destinatario del passaggio e recupero della finta. Barra di tiro fissa per ciascun giocatore.
- **ESC**, poi **P**, apre le impostazioni durante la pausa. Volume, camera, radar, effetti e vibrazione cambiano subito; nuovi tasti dalla partita successiva. La vibrazione richiede un joypad/browser compatibile.
- Gli allenamenti sui calci piazzati durano cinque tentativi: 1 gol assegna bronzo, 3 argento, 5 oro.
- Ogni partita completata assegna 20 XP; sfida/allenamento superati 50 XP, non superati 5 XP. Spogliatoio: pallone oro (100), campo notturno (200), divisa neon (300), coriandoli (400). Gli sblocchi sono cosmetici.

Preferenze, medaglie e progressi sono locali al browser (`sa2000:preferences`, `sa2000:progress`, `sa2000:evolutionRun`). Le coppe esistenti mantengono il proprio salvataggio.

## Fantasia arcade
- Carica il tiro fino al **100%**: aura sul giocatore, **FIRE SHOT!**, pallone infuocato con scia e scintille. Funziona anche nei rigori e nelle punizioni dirette a piena potenza.
- Un tiro al volo a piena potenza diventa **METEOR VOLLEY!**, con scia viola.
- Il dribbling speciale lascia scie turchesi; un gol su tiro infuocato durante il gioco normale produce **SUPER GOAL!** e un'onda d'urto grafica.
- In Impostazioni, **Fantasia arcade** attiva/disattiva questi effetti; **Flash e scanline** ne regola anche l'intensità. A zero gli effetti sono spenti.
- Fiamme e impatti vengono registrati nei replay. Si spengono quando la palla viene ricevuta, parata, rimbalza o si riprende il gioco. La presentazione non modifica la fisica dei tiri.

### Stanze online e pubblico

Stanze private per due giocatori, con codice/link invito e scelta cooperativa o uno contro uno. Il pubblico ora sventola bandiere animate nei colori delle squadre, con stemmi nelle inquadrature ravvicinate. Per collegare il gioco su GitHub al servizio stanze, segui [online/README.md](online/README.md); la configurazione Render è in `render.yaml`. Il servizio deve essere pubblicato separatamente.

### Comandi personalizzati

In Arcade Evolution → Impostazioni puoi rimappare movimento e azioni di entrambe le tastiere, menu/intro, pausa, impostazioni, schermo intero e pulsanti dei quattro joypad. I profili si salvano sul dispositivo. Nello stesso profilo un comando occupato si scambia; i conflitti fra tastiere e comandi generali vengono segnalati. Per assegnare Tab clicca prima sul campo. Le azioni di gioco usano il nuovo profilo dalla prossima partita. Il pulsante Ripristina comandi ripristina tutti i profili.

### Presentazione partita

- **Calcio d'inizio** in stile cabinato: la camera parte stretta sul pallone a centrocampo e si allarga lentamente (circa 2,6 s) fino all'inquadratura di gioco; il calcio d'inizio parte a movimento concluso.
- **Tabellone compatto** in alto a sinistra: stemma, sigla a tre lettere, punteggio, tempo e cartellini. Radar piccolo in basso a destra (disattivabile).
- **Esultanza della curva**: immagine pixel-art (`arcade/assets/crowd-celebration.png`, 4 frame) colorata con la maglia della squadra che segna. Generatore: `tools/generate-crowd-celebration.py`.
- **Marcatore**: sotto la scritta GOAL! compaiono numero e nome di chi ha segnato.
- **Barriera**: se il tiro la colpisce, il pallone si ferma sulla barriera e rimbalza; la scritta compare dopo.
- **Nomi**: tutti i giocatori hanno nomi inventati (`tools/fictional-player-names.py`), con sonorità coerenti con la nazione della squadra.
