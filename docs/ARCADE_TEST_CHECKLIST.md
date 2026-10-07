# Checklist Arcade — 30 test richiesti

Eseguita il **5 ottobre 2026**, macOS/JavaScriptCore e Chrome locale.

**PASS** indica uno scenario verificato con assert sul codice reale o una verifica UI documentata nella colonna evidenza. I test automatici usano adattatori browser/DOM; non equivalgono a trenta sessioni manuali complete. Il test 30 combina il ciclo di vita del bridge e la registrazione del risultato nelle funzioni correnti della carriera; non è una stagione intera giocata nel browser.

| # | Test richiesto | Esito | Evidenza |
|---|---|---|---|
| 1 | SerieASim originale si avvia | PASS | Chrome: intro e menu originali; sintassi degli script inline |
| 2 | Modalità SIM funziona | PASS | Chrome: SIM della carriera QA; builder originale ancora chiamato senza parametro Arcade |
| 3 | Calendario continua a funzionare | PASS | Chrome G0→G1, data 06/09→13/09; assert incremento giornata |
| 4 | Salvataggi esistenti non deliberatamente distrutti | PASS | Nome/versione/schema IndexedDB conservati; nessuna cancellazione; caricamento della carriera QA |
| 5 | Arcade Match parte | PASS | Chrome: partita libera, dalla carriera e dalla coppa |
| 6 | 11 vs 11 | PASS | Assert 22 giocatori, 11 per squadra, portiere separato |
| 7 | Kickoff corretto | PASS | Tempo fermo fino a Z; passaggio e avvio PLAY |
| 8 | Z passa con possesso valido | PASS | Scenario con avversario vicino; palla in PASS e destinatario selezionato |
| 9 | Ricevitore si muove verso il passaggio | PASS | receiverIntent, receiveState e velocità verificati |
| 10 | X tira immediatamente | PASS | Tiro immediato e buffer alla ricezione |
| 11 | Volley possibile | PASS | Palla alta vicino al controllato; tiro potente senza stop |
| 12 | C tackle | PASS | Recupero palla, active frames e recovery |
| 13 | V con palla = dribbling | PASS | Burst e cooldown |
| 14 | V senza palla = tackle duro | PASS | Tackle duro libera la palla; movimento e recupero maggiori |
| 15 | Portiere para | PASS | Tiro veloce respinto, GK_DIVING e REBOUND |
| 16 | Portiere blocca | PASS | Cattura lenta/vicina, owner portiere e HANDS |
| 17 | Durante GK_HOLDING non si può rubare la palla | PASS | Tackle duro sul keeper: proprietario invariato; FREE dopo distribuzione |
| 18 | Rimessa laterale verso un altro giocatore | PASS | Battitore fuori campo, ricevitore distinto e lancio dentro il campo |
| 19 | Corner | PASS | Uscita sul fondo con ultimo tocco del difendente; restart CORNER |
| 20 | Goal kick | PASS | Uscita sul fondo con ultimo tocco attaccante; restart GOAL KICK |
| 21 | IA attaccante si muove senza palla | PASS | Almeno cinque giocatori in movimento nello scenario ATTACKING |
| 22 | IA difensiva scala e pressa | PASS | Stato DEFENDING, pressione/copertura e movimento della struttura |
| 23 | Camera segue la palla ed è ravvicinata | PASS | Assert follow/zoom; Chrome: sprite grandi e porzione limitata del campo |
| 24 | Pareggio finale → Golden Goal immediato | PASS | REGULAR→GOLDEN, PLAY automatico senza menu o conferma kickoff |
| 25 | Golden Goal dura 30 secondi | PASS | Assert iniziale 30, ancora GOLDEN a 29.999, rigori al termine |
| 26 | Pareggio dopo Golden Goal → rigori | PASS | Stato PENALTIES e prima battuta preparata |
| 27 | Rigori realmente giocabili | PASS | Assert freccia sinistra/X; Chrome: vista frontale e tiro X; conclusione matematica/oltranza |
| 28 | Arcade Cup da 8 squadre | PASS | Tabellone completo 8→4→2→1 con squadra scelta mantenuta |
| 29 | Arcade Cup da 16 squadre | PASS | Tabellone completo 16→8→4→2→1; Chrome: creazione, salvataggio, ripresa e avvio ottavi |
| 30 | Arcade dalla stagione restituisce e registra il risultato | PASS | Bridge reale restituisce 3–1 e smonta input/UI; assert classifica, marcatori, archivio, calendario e chiamata save senza risimulazione |

## Comandi ed evidenza conservata

`python3 tools/run-arcade-tests.py`

Output: `arcade/tests/LAST_RUN.txt`. Sono inclusi anche replay, moduli/valori del database, annullamento senza risultato, primo gol in Golden Goal, uscita in dribbling e regole di andata/ritorno con aggregato/gol fuori casa.

La pagina `http://127.0.0.1:8765/arcade/tests/visual.html` permette di ispezionare i rigori e il risultato del bridge con le rose dell'app originale, senza registrare gare nella carriera. I comandi “SOLO TEST” appartengono esclusivamente a questa pagina.

Verifica manuale completa del feeling, campagne prolungate e tornei interamente giocati dall'inizio alla finale non certificati da questa checklist. Le limitazioni del dataset e delle animazioni sono riportate nel changelog.
