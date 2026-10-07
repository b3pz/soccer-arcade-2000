# Integrazione Arcade — 5 ottobre 2026

## Avvio locale

Dalla root: `python3 -m http.server 8765 --bind 127.0.0.1`.
Aprire **http://127.0.0.1:8765/** in Chrome desktop. È sufficiente Python; nessuna installazione npm.
Il gioco rimane statico e gli asset Arcade sono locali. Per conservare i salvataggi usare sempre lo stesso indirizzo/porta del browser.

Menu: **Modalità carriera**, **Partita Arcade**, **Coppa Arcade**. Nella carriera il pulsante **SIMULA** conserva il motore precedente; **GIOCA ARCADE** usa la rosa della partita. La squadra umana è collocata internamente sul lato 1P; il bridge riconverte correttamente casa/ospite prima della registrazione.

Controlli: frecce, Z passaggio/ripresa, X tiro/volley, C tackle, V burst o tackle duro. D abilita il debug; R riparte solo quando il debug è attivo. Nella serie di rigori: frecce per mira/tuffo, X per tirare. Z salta il replay.

## Analisi e base utilizzata

L'entry point originale è `index.html`; molti componenti di presentazione e gestione gare sono in `js/`. Le rose e gli identificativi storici vengono letti da `teams`, `T()` e dagli stati della carriera. Calendario/classifica: `nextUserGame`, `updateLeague`, `s9SimulateUserMatch`; coppe: sistema V10; salvataggi: `S9Save` e IndexedDB `SerieA9000_DB`.

I nomi delle cartelle fornite differiscono dal prompt: il prototipo funzionante è `neo_arcade_soccer_v10`; gli atlanti sono in `serieasim_arcade_sprite_pack`. Entrambi sono stati conservati. Il prototipo è stato portato nel modulo interno, senza sostituire l'applicazione principale.

## File creati

- `arcade/engine/core.js`: InputManager, Ball, Player, Goalkeeper, Team, TeamAI, MatchRules, RestartManager, Match, Renderer; passo fisso 120 Hz.
- `arcade/engine/controllers.js`: CameraController, ReplayManager, PenaltyManager; classificazione deterministica dei falli e ripresa del rigore.
- `arcade/bridge.js`: API `launchArcadeMatch(config)`, adattamento rose/valori/moduli/morale, registrazione in campionato e coppe.
- `arcade/ui/menu.js`: selezione stagione, mappa, preview maglia e valori per reparto; tornei da 8/16, ripresa e albo delle coppe Arcade.
- `arcade/assets/animations.png`, `animations.json`, `animations.js`: 126 frame trasparenti in celle 128×128; 21 gruppi di animazione, baseline comune. Vengono disegnati singoli frame.
- `arcade/assets/blue.png`, `red.png`, `keeper.png`: copie degli asset legacy del prototipo conservate per confronto; il renderer principale usa l'atlante estratto.
- `arcade/assets/italy.geo.json`, `italy-map.js`, `ATTRIBUTION.md`: geometria italiana Natural Earth e proiezione coerente con i marker delle città.
- `tools/prepare-arcade-frames.py`: estrazione riproducibile degli sprite e rimozione dei frammenti delle pose adiacenti.
- `tools/run-arcade-tests.py`: verifiche del motore, sintassi e integrazione; usa JavaScriptCore disponibile su macOS.
- `arcade/tests/core-tests.js`, `integration-tests.js`, `visual.html`, `LAST_RUN.txt`: scenari automatici, pagina QA visiva e risultato dell'ultima esecuzione.
- `ARCADE_TEST_CHECKLIST.md` e questo changelog.

## File modificati

- `index.html`: caricamento dei moduli; parametro opzionale a `s9SimulateUserMatch` per accettare un risultato Arcade senza rigenerarlo; messaggio e archivio riconoscono la modalità. Senza parametro continua il percorso SIM precedente. Riferimenti agli script versionati per evitare cache obsolete.
- `js/v10-release.js`: piccola interfaccia verso le funzioni tornei già esistenti; opzione isolata della simulazione CPU per i tornei Arcade liberi, senza modificare la carriera attiva.
- `js/save-manager.js`: `getSetting`/`putSetting` nello store `settings` già esistente. Nessuna modifica di nome/versione/schema del database; nessuna cancellazione o migrazione dei salvataggi.

## Architettura e comportamento

Il database di squadre/rose resta quello originale. `setupTeam` sceglie l'XI dalla formazione salvata, oppure costruisce un 4-4-2 dalla rosa originale. I valori speed/control/passing/shooting/defending/goalkeeping sono normalizzati a 1–100. Velocità, ricezione, passaggio, tiro, tackle e capacità del portiere dipendono dai valori. Il morale modifica la velocità; il modulo modifica i riferimenti tattici e la mentalità il posizionamento di squadra.

Passaggio con destinatario e intento di ricezione, tiro immediato/buffer di 280 ms, volley, tackle con recupero e burst contestuale. Gli stati tattici sono ATTACKING, DEFENDING, TRANSITION_ATTACK, TRANSITION_DEFEND e LOOSE_BALL. Due giocatori al massimo inseguono una palla libera; gli altri mantengono la struttura.

Il portiere usa stati dedicati. Un blocco imposta `controlMode=HANDS` e `canBeStolen=false`; il tackle non può sottrarre la palla. Distribuzione corta/lunga e rilascio ripristinano FREE. Il portiere umano può muoversi lentamente nell'area, con limite di possesso automatico.

Calcio d'inizio a tempo fermo fino al passaggio; rimesse reali a un altro giocatore; corner, rinvii, punizioni e rigori. Anche uscire dalla linea in dribbling provoca una ripresa. I falli duri da dietro sono valutati geometricamente, senza random.

Camera ravvicinata ball-centric, look-ahead e interpolazione; zoom dinamico, vista frontale dedicata per la serie di rigori. Replay registrato in un ring buffer di 90 frame (circa tre secondi), con posizioni, pose e camera: non risimula l'azione.

La durata base del prototipo è mantenuta: 120 secondi di gioco effettivo. Pareggio: Golden Goal avviato automaticamente e **30 secondi esatti** di gioco; poi rigori realmente giocati, cinque alternati e oltranza, con conclusione matematica anticipata. Nelle coppe di carriera a due gare sono preservati pareggio all'andata, risultato aggregato e regola dei gol fuori casa quando prevista.

Il risultato libero è indipendente dalla carriera. In campionato il risultato Arcade entra nello stesso percorso di registrazione della simulazione: classifica, marcatori, altre partite, giornata, archivio e salvataggio. Le coppe di stagione usano `processTournamentResult` del sistema originale. La Coppa Arcade usa gli stessi identificativi/rose e il simulatore CPU originale, salvando tabellone e risultati nello store `settings`; una coppa può essere ripresa dal menu.

## Verifiche eseguite

Comando: `python3 tools/run-arcade-tests.py`.
31 scenari core, 2 scenari di ciclo di vita del bridge, 4 scenari d'integrazione, controllo sintattico di tutti gli script inline originali/moduli modificati, controllo presenza degli asset. Esito dettagliato in `arcade/tests/LAST_RUN.txt`.

Le funzioni di registrazione nei test vengono estratte dall'`index.html` corrente a ogni esecuzione. Il DOM e alcune dipendenze di contorno sono adattatori di test; non si certifica una stagione intera giocata manualmente.

Chrome locale: avvio originale, nuova carriera di verifica **Arcade QA locale**, salvataggio e ricaricamento della stessa alla giornata 2, SIM con avanzamento G0→G1, presenza delle opzioni SIM/Arcade, match libero e match dalla carriera, kickoff, rendering con maglie e camera vicina, annullamento senza avanzamento della giornata, mappa e preview, formato 16, salvataggio/ripresa della coppa, match dal torneo. La pagina QA ha verificato la vista frontale dei rigori, il tiro con X e il risultato del bridge (conclusione forzata soltanto nel banco QA, non una gara intera giocata). Nessun errore console nella verifica finale della versione corretta; gli errori di sintassi/cache incontrati durante lo sviluppo sono stati risolti.

## Limiti della verifica e del dataset

Il database originale contiene selezioni di squadre storiche, non rose complete da 16 club per ogni singola annata. Un formato viene disabilitato se non ci sono abbastanza squadre nell'annata scelta: **TUTTE LE STAGIONI** rende disponibili entrambi i formati senza inventare squadre o duplicare il database.

Gli atlanti generati hanno spaziature irregolari: alcuni frame aggiuntivi conservano differenze di proporzione/posa, pur essendo normalizzati e trasparenti. Il bilanciamento del gameplay richiede ulteriori sessioni umane; i test geometrici e funzionali non certificano da soli il feeling. La serie di rigori usa tiro immediato e mira: non implementa la carica opzionale con pressione prolungata di X. Il calendario resta quello originale; non sono state ricostruite tutte le annate storiche.

La pagina `arcade/tests/visual.html` è un banco QA che incorpora l'app originale e le sue rose, non un secondo progetto di gioco. I pulsanti di test non compaiono nel menu del gioco.

Nessun commit, push o modifica del remote è stato effettuato.
