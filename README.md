# Soccer Arcade 2000

Gioco di calcio arcade stile anni '90, indipendente da Soccer Sim. Sviluppato da B3pZ.

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
- Carica il tiro fino al **95%** (circa 0,6 s tenendo premuto TIRO): aura sul giocatore, **FIRE SHOT!**, pallone infuocato con scia e scintille. Funziona anche nei rigori e nelle punizioni dirette a piena potenza.
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
- **Demo**: restando fermi sulla schermata del titolo per circa 20 secondi parte una partita dimostrativa (75 secondi di gioco). Il giocatore 1P è guidato da un bot che usa i comandi veri e una didascalia mostra il tasto usato (passaggio, tiro caricato, cross dal fondo, tiro al volo, scivolata, calci piazzati). Un tasto qualsiasi, un clic o un pulsante del joypad riporta al titolo; a fine demo riparte l'intro.
- **Cross e tiri al volo**: le ali della CPU scendono sul fondo e crossano verso un compagno in area, mentre punte e centrocampisti attaccano primo palo, secondo palo e dischetto. Sui cross gli attaccanti della CPU calciano spesso al volo. Quando crossi tu, il controllo passa al compagno che riceve appena il pallone sta per arrivare: tieni premuto **Z** e il tiro al volo parte da solo. Il portiere esce solo sui cross diretti nell'area piccola.

### Opzioni, joypad e difficoltà

- **OPZIONI** si apre dal menu principale (voce *OPZIONI · COMANDI · JOYPAD*), dal Centro Arcade e dalla pausa. È tutta navigabile col joypad: croce/stick per muoversi, A conferma, B indietro, LB/RB cambiano scheda (GIOCO, JOYPAD, TASTIERA 1P, TASTIERA 2P, MENU · SISTEMA).
- **Configura joypad** (OPZIONI → JOYPAD, prima voce): per i joypad che il browser non riconosce come standard, come quello della PlayStation Classic, il controller disegnato fa lampeggiare un tasto alla volta (↑ ↓ ← → ✕ ○ □ △ L1 R1 L2 R2 SELECT START): premilo e passa al successivo. START è l'ultimo tasto: dopo averlo premuto il gioco aspetta che tu rilasci tutto prima di riprendere a leggere il joypad; la prova finale si chiude con ○. Il profilo viene salvato per quel modello di joypad e usato ovunque: partita, menu e opzioni. Un joypad non standard mai configurato apre la procedura da solo alla prima pressione. Nella scheda JOYPAD ogni tasto premuto si illumina sul disegno.
- **Mappatura per pressione**: scegli un comando e premi il pulsante (o il tasto) da assegnargli. I pulsanti compaiono con il nome stampato sul joypad: A/B/X/Y/LB… su Xbox e compatibili, ✕/○/□/△/L1… su PlayStation. Se il pulsante è già usato nello stesso profilo, i due comandi si scambiano.
- **Pausa** (START/ESC): menu con cursore RIPRENDI / OPZIONI / ESCI SENZA REGISTRARE. B riprende la partita, non la abbandona.
- **Camera**: in *campo largo* giocatori e pallone si rimpiccioliscono in proporzione.
- **Difficoltà**: la CPU protegge palla e scatta via quando è pressata, passa in avanti al compagno libero, tira dal limite e difende tra il portatore e la porta. Portieri CPU più reattivi in *normale* e *difficile*. Il raggio dei contrasti umani e la precisione dei tiri da lontano dipendono dal livello.

### Intro

Il filmato d'apertura (12 s) racconta un'azione continua in un'unica notte, sempre con lo stesso numero 10: dribbling e salto sulla scivolata, rovesciata, parata sulla traversa, tiro di controbalzo, gol ed esultanza. Ogni contatto (scarpa–pallone, guanto–pallone) usa un fotogramma preciso dell'atlante, misurato in pixel, nell'istante del colpo. È montato con le immagini del gioco: stadio notturno, porta con curva in pixel-art, sprite dei giocatori ingranditi con divise di fantasia, pallone pixel-art (`arcade/assets/ball.png`, generatore `tools/generate-ball-sprite.py`) e curva in festa.

### Portiere e campo

- Le parate in tuffo, in volo sulla traversa e in stacco verticale usano i fotogrammi originali del portiere (tuffo, presa, attesa), ruotati e riallineati (`tools/add-keeper-save-frames.py`). Valgono anche in partita.
- In partita il tiro al volo usa il fotogramma della gamba tesa invece della corsa.
- Le aree di rigore hanno la lunetta.

### Icone dei tasti

Ogni indicazione di comando mostra il tasto della tastiera e, con un joypad collegato, l'icona vera del pulsante: ✕ ○ □ △ colorati, L1/R1, START e croce direzionale sui PlayStation, A B X Y colorati sugli Xbox. Le icone seguono i comandi personalizzati. Sul titolo START del joypad avvia il gioco. Lo schermo intero da SELECT funziona solo subito dopo un tasto della tastiera o un clic, perché il browser non lo concede al solo joypad: se viene rifiutato, il gioco lo attiva al primo tasto o clic successivo e lo segnala.

### Scatto, lancio, difesa

- **Scatto (tasto speciale: V, △ / Y sul joypad):** toccalo ripetutamente, come a Track & Field: fino a circa +40% di velocità già nel primo secondo, con scie dietro al giocatore e una barra azzurra; cala se smetti. Con la palla e un avversario davanti fa il dribbling (ricarica 2,3 s).
- **Lancio a pressione (passaggio alto: X, □ sul joypad):** tieni premuto e rilascia, da circa 15 m a 50 m nella direzione delle frecce; il compagno più vicino al punto di caduta ci corre incontro.
- **Difesa:** V o X vicino al portatore = **scivolata** (può essere fallo se arriva da dietro). C (○ sul joypad) **toccato** = contrasto in piedi; **tenuto premuto** = pressing: il tuo uomo si mette tra il portatore e la porta e lo segue (scritta PRESSING); intanto puoi tentare la scivolata.
- La CPU ha la scritta **CPU** sul giocatore che sta comandando.

### Prima del calcio d'inizio e rallenty

- **Lancio della moneta:** scegli TESTA o CROCE con le frecce e conferma; chi vince sceglie se attaccare a sinistra o a destra, l'altra squadra batte il calcio d'inizio. Il campo scelto specchia immagine e comandi (la simulazione non cambia). Non c'è in demo, allenamento, sfide, finale segreta e online.
- I tasti già premuti quando parte la partita vengono ignorati finché non li rilasci (prima il pulsante usato per avviare poteva battere il calcio d'inizio da solo).
- **Rallenty:** quando un tiro sta per arrivare nello specchio della porta (gol o parata) la partita rallenta per circa un secondo, con bande nere da cinema.

### Tema grafico arcade

Logo e favicon originali, fondali illustrati, intro panoramica da 12 secondi, pubblico bitmap con bandiere, dodici mappe PNG, stemmi fantastici e quattro sponsor inventati sono integrati nel gioco. Il tabellone mostra soltanto sigle, punteggi e tempo; il radar è piccolo e in basso. Il calcio d'inizio parte dal pallone e apre la telecamera in 3,2 secondi. Sulle punizioni, un colpo sulla barriera mostra reazione, contatto e rimbalzo prima del messaggio.

Squadre e calciatori hanno nomi inventati, inclusi quelli delle vecchie formazioni caricate. Il rendering dei menu usa immagini e canvas; il DOM serve come strato invisibile per input e accessibilità. Dettagli e asset in [arcade/assets/art/README.md](arcade/assets/art/README.md).

### Campo da destra a sinistra, falli, musica

- Scegliendo di attaccare verso sinistra, immagine e comandi vengono ribaltati in modo coerente: porte con la rete verso l'esterno, pista e tribune dietro le porte, frecce dei calci piazzati, movimento. Le regole della partita non cambiano.
- La CPU non entra più in scivolata alle spalle del giocatore umano: prima erano circa 7 falli a partita, ora meno di uno.
- **HOW TO PLAY** mostra i comandi attuali (scatto, lancio a pressione, pressing, scivolata) con le icone del joypad.
- **Musica dei menu:** cinque brani originali sintetizzati (`cabinet-theme` più `arcade/assets/music/`, generatore `tools/create-arcade-soundtracks.py`) che si alternano; in OPZIONI → GIOCO, *MUSICA DEI MENU* passa al brano successivo.

### Stemmi

Ogni squadra ha il suo stemma ricamato (scudo con bordo oro) con il **nome arcade** in alto, sigla nel medaglione, colori della maglia o della bandiera e anno: `arcade/assets/crests-arcade/`, generati da `tools/rename-crests.py` con lo stesso disegno di `tools/generate-coherent-crests.py`. Gli stemmi originali restano in `assets/crests/` e `arcade/assets/crests/` (il catalogo ne conserva il percorso in `crestOriginal`).

### Mobile

Su telefono e tablet (schermo touch) in partita compaiono una levetta virtuale a sinistra (appare dove appoggi il pollice) e i pulsanti TIRO, PASSA, LANCIO, SCATTO a destra, più CAMBIO e PAUSA in alto. Funzionano come i tasti: TIRO e LANCIO si tengono premuti per caricare, SCATTO si tocca ripetutamente. In pausa la levetta sposta il cursore. Un tocco sull'intro equivale a START; nei menu si tocca direttamente la voce. In verticale compare l'invito a girare il telefono. I menu si adattano allo schermo e i testi non escono dai riquadri.

### Novità: telecronaca, meteo, marcatori, replay, editor

- **Telecronaca** (OPZIONI → GIOCO → TELECRONACA: SCRITTE / SCRITTE + VOCE / NO): commento su gol (con il nome del marcatore, pareggio, sorpasso, goleada), parate, pali, occasioni sfumate, falli, rigori, cartellini, inizio e fine. La voce usa la sintesi vocale italiana del browser. Il pubblico fa "ooh" sulle occasioni, applaude le parate e batte le mani a ritmo quando una squadra è avanti di due.
- **Meteo** (OPZIONI → GIOCO → METEO: CASUALE / SERENO / NOTTE / PIOGGIA): notturna sotto i riflettori; con la pioggia il pallone scorre circa il 16% in più sull'erba bagnata.
- **Coppa:** tabella MARCATORI durante il torneo e CAPOCANNONIERE alla fine.
- **Replay:** durante il replay il passaggio alto cambia inquadratura (TV, RAVVICINATA, CONTROCAMPO), il passaggio salva il gol. Centro Arcade → **GOL SALVATI** per rivederli (fino a 8).
- **Editor squadre** (Centro Arcade → EDITOR SQUADRE): nome della squadra, nomi dei giocatori, colori di maglia, secondo colore, pantaloncini e calzettoni, con anteprima; RIPRISTINA torna all'originale. Lo stemma resta quello originale.
- **Centro Arcade:** scelta delle squadre con griglia di stemmi; le pagine si adattano allo schermo. OPZIONI si usa anche col tocco (✕ in alto a destra per uscire).
