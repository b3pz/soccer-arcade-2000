# Arcade Visual Pass — animazioni, cartellini e tiro a carica

## Risultato

Il tiro umano ora avviene al rilascio di X: un tap produce un tiro rapido e meno potente, una pressione prolungata aumenta la velocità reale della palla. I cartellini hanno una sequenza arcade animata collegata ai falli, con fischio, indicazione, braccio alzato, carta e nome del giocatore. Sprite, stadio, selezione squadra e replay ricevono un secondo passaggio di coerenza.

Le modifiche al gameplay riguardano le funzionalità richieste: carica del tiro e disciplina. Non è stato rifatto il core di AI, collisioni, ricezione, competizioni o salvataggi.

## Tiro

- X premuto: carica; X rilasciato: tiro. Carica massima dopo 0,85 secondi, mantenibile fino al rilascio.
- Indicatore a 12 segmenti, colori verde/giallo/rosso e MAX POWER; posa di preparazione quando il giocatore è fermo.
- Velocità di base moltiplicata per `0.68 + 0.52 × carica`, oltre agli attributi di tiro e potenza fisica del giocatore. I tiri CPU conservano la velocità precedente.
- Carica applicata anche a rigori, tiri su ripartenza e conclusioni al volo; conservato il buffer di 0,28 secondi per la ricezione.
- Pressioni ripetute automaticamente dalla tastiera non azzerano la carica. Passaggio, perdita del focus, uscita e scena del cartellino la annullano.
- La tastiera misura la durata della pressione, non la forza fisica del dito.

## Cartellini

- Contrasto duro da dietro: giallo; secondo giallo: rosso; contrasto duro da dietro contro un avversario in special dribble: rosso diretto.
- Sequenza di 2,4 secondi: fischio, indicazione e carta alzata. Overlay con colori dedicati, numero, nome e squadra.
- Arbitro e giocatore hanno la stessa scala corporea anche nella scena. Ombre e baseline comuni.
- Timer e fisica si fermano durante la scena; poi si riprende dalla punizione o dal rigore assegnato.
- Espulsi esclusi da movimento, collisioni, selezione, passaggi e battitori. Un portiere espulso viene sostituito temporaneamente da un giocatore di movimento nella stessa partita.
- Indicatori gialli/rossi nel tabellone e riepilogo serializzabile in `stats.cards`.
- La disciplina riguarda la singola partita Arcade: non introduce squalifiche nella carriera.

## Sprite e transizioni

- Atlante ricompilato: 148 celle referenziate, 128×128; foglio 1024×2432. Le 28 sequenze richieste totalizzano 162 esposizioni, con i conteggi originali.
- Atlas C usato per le silhouette comuni: giocatori, arbitro e portiere condividono riferimento corporeo e dettaglio. Rimossa la dipendenza dai ritagli etichettati che contenevano palloni isolati o frammenti.
- Riferimento di altezza corporeo fisso di circa 95 pixel, baseline a y=118. Le pose accovacciate non vengono ingrandite fino all’altezza di quelle in piedi.
- Arbitro: quattro bitmap distinte per idle, point, whistle, yellow e red, ottenute con torso e braccio articolati sul corpo sorgente. Non sono più quattro esposizioni dello stesso disegno.
- Portiere: presa, possesso e lancio con guanti e braccia articolati, mantenendo corpo e divisa verde; rinvio lungo coerente con il corpo comune.
- Esposizioni intermedie per le azioni che hanno meno pose sorgente del conteggio richiesto. `animation-audit.json` distingue pose sorgente e pose derivate; non vengono dichiarati nuovi disegni originali presenti negli atlanti.
- RUN → PASS/SHOOT/TACKLE: breve posa iniziale di appoggio, clock locale e follow-through leggibile. Orientamento del calcio mantenuto durante l’azione anche se cambia la direzione di movimento.
- CATCH → HOLD → DISTRIBUTE funziona anche per il portiere controllato dall’utente, senza essere bloccato da uno stato di presa precedente.
- Celebrazioni in loop; animazioni continuano nella schermata risultato fino a CONTINUA.
- Palette solid, vertical stripes, band, halves e trim; fase delle strisce per cella. Pattern del profilo squadra rispettato quando disponibile.

## Stadio, campo e camera

- Prato raster deterministico, bande di taglio, fili d’erba e vernice leggermente interrotta conservati.
- Pubblico con volti, varianti di colore, corridoi e sciarpe animate; panchine con coperture e sedute.
- Porte con pannelli della rete, profondità laterale, pali illuminati e ombre.
- Camera ravvicinata e proiezione del campo conservate. Il canvas mantiene il rapporto 16:9 senza deformare corpi e geometria nelle finestre basse.
- Pallone in possesso del portiere rappresentato tra le mani, mantenendo le coordinate fisiche esistenti.

## UI, selezione e momenti decisivi

- Cornici bevel, pannelli scuri, colori saturi, display typography e scanline del primo pass conservati.
- Italia geografica completa con Sicilia/Sardegna, mare scuro, bordo luminoso, città e marker 1P; halo pulsante sulla selezione.
- Sprite della squadra più grande e animato; statistiche ATT/MID/DEF/GK e controlli accanto all’anteprima. Entrata del pannello in quattro scatti, rispettando la preferenza di movimento ridotto per gli effetti CSS.
- GOAL! e GOLDEN GOAL con lettering disegnato a canvas, contorni, flash, piccolo zoom e ingresso a scatti.
- Breve celebrazione del gol di 0,65 secondi prima del replay, con fisica e cronometro fermi.
- Replay con cornice e didascalia dedicate. Riproduce pose, orientamento, possesso, selezione e camera registrati; ripristina lo stato live anche se il disegno fallisce.
- Vittoria al golden goal con enfasi dedicata; risultato e rigori conservano le rispettive skin.

## Verifica

Comando: `python3 tools/run-arcade-tests.py`.

- Regressione gameplay e bridge: kickoff, passaggi, ricezioni, contrasti, portieri, rigori, golden goal, annullamento e risultato.
- Integrazione SIM, calendario, classifica, archivio, salvataggi e coppe da 8/16 squadre.
- Test nuovi: tap/carica media/piena, rilascio singolo, cap, auto-repeat, blur, annullamento passando, attributo fisico, CPU, volley e potenza effettiva nei rigori.
- Giallo su fallo reale, pausa del timer, secondo giallo, espulsione e sostituzione temporanea del portiere.
- Transizioni del portiere umano, ripristino del replay anche su errore e celebrazione del gol senza avanzare la simulazione.
- Audit dei 28 conteggi, baseline, silhouette complete e bitmap distinte dei gesti dell’arbitro e delle azioni con guanti del portiere.
- Sintassi di tutti i moduli e degli script inline originali; asset e cache versionati insieme.
- Verifica in Chrome: avvio partita con Z, scala comune sul campo, giallo/rosso, carica a 100% e velocità al rilascio, selezione completa, tribune/panchine, porta e replay. Screenshot in `arcade/tests/screenshots/`.

Nessun commit, push o pubblicazione. Il report di esecuzione è `arcade/tests/LAST_RUN.txt`.

- Passaggio e dribbling usano pose complete senza palloni incorporati: il pallone viene disegnato separatamente, con piccoli tocchi visivi durante il dribbling.

## Passaggio alto

- A esegue il passaggio alto verso un compagno, con traiettoria aerea e animazione di calcio; Z mantiene il passaggio rasoterra. Disponibile anche sulle riprese di gioco.
- Il passaggio alto annulla una carica X in corso, evitando tiri involontari al rilascio. Comandi aggiornati nel menu e HUD.

## Arcade puro · Club / Nazionali

Questa revisione sostituisce il precedente menu Arcade con un solo ingresso ARCADE FOOTBALL.

- Club → Champions; Nazionali → Mondiale. Nelle coppe: nessun filtro stagioni, scelta di formato 8/16 o doppia selezione delle squadre. Una voce per club/nazionale: la variante più forte del database fornisce la rosa senza esporre le annate.
- Torneo fisso da 16 squadre: quattro gironi da quattro, tre partite con avversarie diverse, classifica a 3/1 punti. Passano le prime due; quarti, semifinale, finale a gara secca con Golden Goal e rigori.
- Criteri della classifica: punti, differenza reti, gol segnati; a completa parità vale l'ordine del sorteggio.
- Scelta della formazione 4-4-2, 4-3-3, 3-5-2, 5-3-2 con disposizione sul campo. Modulo applicato a posizioni e ruoli in partita.
- Schermata HOW TO PLAY con pulsanti da cabinato e comandi reali: X tiro caricato, Z passaggio, A passaggio alto, C scivolata, V contrasto duro / dribbling speciale.
- Griglia squadre paginata con stemma, maglia animata e ATT/MID/DEF/GK. Nei tornei Arcade anche l'HUD usa nomi senza stagioni.
- Salvataggio e ripresa separati nel nuovo slot arcadePureCup, con avanzamento dopo un risultato confermato. Annullare una partita mantiene la stessa gara. Le vecchie coppe Arcade restano nei dati ma non vengono caricate nel nuovo formato.
- Corretto il portiere che oscillava attorno al target: soglia di arresto e velocità limitata alla distanza residua; direzione stabile verso il campo. Il tuffo mantiene il proprio stato fino alla fine dell'azione.
- Ricomposta la sequenza del tuffo: attesa, spinta, estensione, atterraggio; rimossa la posa di rinvio estranea alla parata. Corretto il colore dei pantaloncini nel rinvio.
- L'arbitro segue l'azione con una propria posizione nel mondo e velocità di corsa, senza essere incollato a un offset della palla e della camera.
- Verifiche: tornei completi Champions/Mondiale, tre gare del girone, pareggi, qualificazione, eliminazione, ripresa, arresto del portiere, persistenza del tuffo, movimento dell'arbitro e test precedenti di SIM/carriera/coppe.

## Correzioni camera, rigori e accesso Arcade

- Un solo pulsante ARCADE FOOTBALL nel menu principale. All'interno: Amichevole (partita Arcade, scelta 1P/CPU) oppure Coppa; poi Club / Nazionali.
- Camera centrata sulla palla, zoom fisso 136: inquadratura entro circa cinque metri per lato, senza allargamento sui palloni alti. Sprite e pallone crescono con lo zoom mantenendo una scala comune.
- Rigori: nove bersagli reali, tre colonne e tre altezze. Frecce per scegliere, X tenuto/rilasciato per la potenza del tiro. La traiettoria fisica raggiunge la casella selezionata.
- Portiere fermo al centro prima del tiro. Nella difesa del rigore, frecce per scegliere la casella e X per tuffarsi dopo il tiro; la CPU reagisce dopo il calcio e non oscilla sulla linea.
- Esito GOAL / PARATO / FUORI persistente. Z continua dopo una pausa minima di 0,7 secondi: nessun cambio automatico del tiratore. Anche il rigore assegnato durante una partita usa questa presentazione e torna poi alle regole del match.
- CPU: niente pressing o scivolate sul portiere con palla in mano; si allontana per lasciare spazio alla distribuzione. Un contrasto sul portiere protetto assegna punizione, con cartellino per un contrasto duro.
- Maglie di club esteri e nazionali: colore principale dai profili degli asset locali, evitando le divise generiche basate sul paese del club.
- Test aggiunti per nove traiettorie distinte, portiere fermo prima del tiro, permanenza dell'esito, ritorno dal rigore singolo, protezione del portiere e raggio della camera.

- Controllo nel browser completato: amichevole 1P/CPU, mira nella casella 3, esito persistente del rigore, ripresa della coppa e avanzamento girone → quarti → semifinale → finale → campione. L'avanzamento UI è stato verificato con risultati prefissati della pagina SOLO TEST. Titoli e pulsante MENU visibili anche nelle finestre basse. Nessun errore JavaScript rilevato nella prova finale.

## Ripresa · rifiniture camera e rigori

- Barra di potenza in una posizione fissa dell'HUD: resta visibile con la camera stretta e non copre lo sprite del giocatore.
- Altezza, profondità e ombra delle porte scalano con lo zoom, insieme agli sprite; la geometria delle regole resta invariata.
- Freccia e X premuti nello stesso aggiornamento durante un rigore difensivo applicano prima la nuova casella, poi il tuffo.
- Pagina di prova: vista porta portata entro la nuova inquadratura e rimosso il vecchio messaggio del calcio d'inizio dalle viste ferme.
- Verifica visiva nel browser senza errori JavaScript; due controlli aggiunti per tuffo simultaneo e posizione della barra.

## Europa e sfondo comune — 6 ottobre 2026

- Sfondo stadio originale generato con imagegen integrato in tutte le schermate del menu Arcade; asset locale e prompt conservati in `arcade/assets/`.
- Selezione Club con mappa europea Natural Earth, mare blu, terreno verde, confini luminosi, marker città, selezione 1P/CPU e nome città. Include club italiani ed esteri, dalla penisola iberica a Mosca e Istanbul.
- Maglie animate e ATT/MID/DEF/GK restano nel pannello squadra; frecce e Z mantengono il flusso amichevole/coppa. Club condividenti la stessa città usano lo stesso punto geografico.
- Griglia club da 8 squadre per pagina e altezza mappa adattiva per rendere leggibili i comandi anche nella finestra 1028×611. Reset dello scorrimento fra schermate.
- Test per tutti i 64 record club italiani/esteri, punti entro mappa, ordine geografico e confini richiesti. Suite Arcade completa superata; conferma Z verso la selezione modulo verificata nel browser.
- Cache asset aggiornata a `europe-1`. Nessuna modifica alla simulazione o alle regole partita.
- Anteprime: `arcade/tests/screenshots/europe-team-select.jpg` e `europe-menu-background.jpg`.

## Menu disegnati e musica partita — 6 ottobre 2026

- La musica menu e quella degli eventi vengono fermate all'avvio di ogni partita Arcade; tutte le funzioni di riproduzione bloccano il riavvio finché il match è aperto. Fine partita, annullamento ed errori nel loop ripristinano il menu rispettando MUSICA OFF.
- Nuova presentazione `arcade/ui/drawn-menu.js`: menu, categorie, team select, formazione, comandi, gironi, tabellone e risultati sono dipinti su canvas. Il DOM resta uno strato invisibile per controlli, layout e accessibilità.
- Cornice bitmap originale in nove sezioni, sfondo stadio e nuovo sfondo trofeo generati con imagegen; niente caselle HTML visibili nella selezione squadre. Stemmi, nomi, selezione, statistiche e maglie animate sono disegnati nel canvas.
- Il canvas menu si nasconde durante i match e viene smontato alla chiusura con rimozione degli observer e dei listener. Ripiego sulla UI esistente se le immagini non caricano.
- Verificati in browser: selezione Benfica, conferma Z, schermata comandi, creazione girone e avvio/uscita partita. Test automatici su musica reale del root, preferenza OFF, lifecycle del bridge e presentazione canvas.
- Cache aggiornata a `drawn-2`. Core gameplay invariato.
- Asset: `drawn-panel.png`, `cup-background.png`; prompt: `DRAWN_PANEL_PROMPT.md`, `CUP_BACKGROUND_PROMPT.md`. Anteprime: `drawn-main-menu.jpg`, `drawn-team-select.jpg`, `drawn-cup.jpg`.

## Vittoria torneo, bonus e Final Showdown — 6 ottobre 2026

- Dopo la vittoria di Champions o Mondiale: scena su canvas con squadra in maglia, animazione di esultanza, alzata della coppa, podio e coriandoli. Rimane visibile fino a Z / NUOVA PARTITA.
- Bonus arcade: campione 10.000, finale 5.000, 1.000 per vittoria e 250 per gol segnato nel torneo. Totale e record personale sono mostrati nella premiazione; salvataggio del record e del torneo vinto, recuperabile con RIPRENDI TORNEO senza assegnare nuovamente punti.
- Solo l'ultima gara del torneo usa FINAL SHOWDOWN: introduzione di 2,2 secondi con gioco e cronometro sospesi, HUD dedicato e un SUPER SHOT per squadra. Il giocatore lo attiva con carica X almeno al 95%; la CPU può usarlo dopo 20 secondi e in zona tiro. Velocità +22%, traiettoria e parate restano fisiche.
- Disponibilità READY/USED visibile nel match. Nessun tiro speciale durante i rigori; regole ordinarie in amichevoli, gironi, quarti e semifinali.
- Verificato percorso reale: finale salvata → avvio match → risultato 2–1 → vittoria → premiazione e bonus 24.000. Prova controllata tramite fixture, con ripristino del torneo e del record originali.
- Test: finale esclusiva, bonus persistenti, pausa intro, carica minima, consumo singolo per entrambe le squadre, esclusione rigori e incontri ordinari. Cache `final-1`.
- Screenshot: `arcade/tests/screenshots/tournament-victory.jpg`, `final-showdown.jpg`.

## Mappe Italia / Europa A, B, C — 6 ottobre 2026

- Quattro selettori di zona: Italia dedicata; Europa A (Spagna, Portogallo, Francia); Europa B (Regno Unito, Paesi Bassi, Germania); Europa C (Russia e Turchia).
- Ogni mappa ha un viewport geografico ravvicinato, proporzioni Mercator uniformi, paesi della zona evidenziati e vicini attenuati. Club e marker sono filtrati per la zona; nomi città, maglia e statistiche restano leggibili.
- Mappa verticale accanto all'elenco club, senza caselle HTML visibili; zona selezionabile con mouse o Q/E, squadre con frecce, Z conferma e X indietro.
- Amichevoli possono abbinare club di zone differenti. Il torneo usa sempre l'intero pool di club, quindi Champions mantiene gironi e tabellone internazionali.
- Test su partizione completa e senza duplicati dei club, coordinate dentro ogni mappa, paesi presenti e pool Champions completo. Cache `regions-1`; gameplay invariato.

## Cabinato, nazionali e Jurassic Kickers — 7 ottobre 2026

- Controlli confermati Z/X/C/V: Z carica/rilascia il tiro; X passaggio alto/scivolata; C passaggio basso/scivolata; V dribbling/contrasto duro. Conferma dei risultati rigori con Z, senza attivare una nuova carica.
- Nazionali divise in otto zone: Europa A/B/C, Nord America, Sud America, Africa, Asia e Oceania. Tutti i 61 record del database hanno capitale, coordinate e zona; Italia conserva la mappa club dedicata.
- Nuovo stadio bitmap dai colori saturi, coppa trasparente dettagliata e atlante originale con dodici pose complete di T-rex e struzzi. Prompt conservati in arcade/assets.
- La finale segreta è ora contro Jurassic Kickers: squadra originale di T-rex e struzzi, portiere incluso. Sostituisce il precedente SUPER SHOT; mantiene fisica ordinaria, golden goal e rigori. Intro di 2,2 secondi con cronometro fermo.
- Maglie simili: cambia soltanto la CPU/2P, preferendo il bianco; quando anche questo confonde, usa un colore contrastante. Database originale invariato.
- Cutscene generica con maglia della squadra vincente: primo piano della coppa, ingresso squadra, alzata del trofeo e coriandoli. Bonus e record restano persistenti.
- Musica originale sintetizzata da cabinato, soltanto nei menu, rispettando MUSICA OFF. Stop durante ogni partita e ripresa all'uscita.
- Cache aggiornata a cabinet-2. Verifica automatica: 100 PASS, inclusi percorsi asset, dodici silhouette complete, trasparenza trofeo, audio, controlli, finale e copertura delle mappe nazionali. Report: arcade/tests/LAST_RUN.txt.
- Limite della verifica: il collaudo visivo di questa versione non è stato completato; Chrome disponibile è fermo sulla scelta iniziale del motore di ricerca. Nessuna impostazione browser modificata. Le precedenti immagini di anteprima non documentano questa nuova versione.

## Camera, radar e passaggi alti assistiti — 7 ottobre 2026

- Camera allargata da zoom 136 a 64: circa 10 metri laterali attorno alla palla, con sprite ancora grandi. Sostituisce il precedente vincolo dei cinque metri.
- Radar in basso a destra: campo completo, giocatori 1P blu e CPU rossi, palla bianca e contorno giallo sul giocatore controllato. Invisibile nella schermata rigori.
- X seleziona automaticamente un compagno nella direzione delle frecce (direzione del corpo se non premute), escludendo portiere e giocatori espulsi. Forza e parabola dipendono dalla distanza, con anticipo sul movimento del destinatario; la palla resta intercettabile. Passaggio basso C invariato.
- Cache radar-1. 103 controlli automatici superati, inclusi direzione assistita, atterraggio dei lanci a tre distanze e radar indipendente dalla camera. Verifica visiva browser non completata per il limite Chrome già descritto sopra.

## Calcio d'inizio e leggibilità camera — 7 ottobre 2026

- Corretto posizionamento avversari: fuori dal cerchio centrale (almeno 10 unità dal centro), nella propria metà campo. Prima potevano partire a soli tre metri dal battitore.
- Primo passaggio di kickoff destinato al compagno di appoggio, cinque metri dietro la palla; evita che il selettore ordinario scelga un destinatario lontano e una traiettoria subito intercettabile. Correzione simmetrica per entrambe le squadre, anche dopo un gol. Nessuna invulnerabilità aggiunta.
- Zoom camera ridotto da 64 a 36: circa 37 metri visibili orizzontalmente e circa 27 nella zona di gioco verticale. Radar mantenuto.
- 105 controlli automatici superati, inclusi distanza degli avversari, destinazione del kickoff per entrambe le squadre e ricezione del passaggio iniziale prima della CPU. Cache kickoff-1. Verifica visiva browser ancora soggetta al limite già documentato.

## Catalogo Arcade mondiale — 7 ottobre 2026

- Catalogo separato dal database SIM: una voce per club/nazionale, senza stagione nella selezione. Per le squadre esistenti conserva la versione con forza maggiore. Le vecchie versioni restano risolvibili per riprendere i tornei salvati, senza cambiare gli ID dei risultati.
- 80 club: 46 identità esistenti + 34 nuove. Italia dedicata, Europa A/B/C, Nord/Centro America, Sud America, Africa, Asia e Oceania: nove zone selezionabili con mappe e marker città.
- 65 nazionali: 44 identità esistenti + 21 nuove. Aggiunte Canada, Giamaica, Honduras, Panama, Ecuador, Perù, Venezuela, Bolivia, Egitto, Algeria, Tunisia, Mali, RD Congo, Zambia, Iran, Cina, Qatar, Emirati Arabi Uniti, Iraq, Uzbekistan e Nuova Zelanda.
- Nuove squadre con 18 giocatori generici, attributi di gioco originali, maglie a palette e stemmi SVG locali. Nessuna rose storiche inventate presentate come autentiche.
- Mondiale nuovo a 32 partecipanti: otto gironi di quattro, tre gare per squadra, prime due agli ottavi, quarti, semifinale e finale segreta. I vecchi salvataggi a 16 continuano a funzionare.
- Coppa club rinominata WORLD CLUB CUP, con 16 partecipanti. I sorteggi delle due competizioni garantiscono rappresentanza di tutte le zone; rimangono golden goal, rigori, Jurassic Kickers e premiazione.
- Simulazione degli incontri CPU del catalogo Arcade indipendente dagli ID storici, così anche le squadre aggiunte funzionano in coppa. Gameplay delle partite e modalità SIM invariati.
- Mappe aggiornate per nuovi paesi, con confini Natural Earth locali e generatore riproducibile tools/prepare-world-roster.py. Cache world-1.
- 113 controlli automatici superati: unicità, completezza rose, marker entro mappa, paesi evidenziati, compatibilità salvataggi, sorteggi mondiali, intero percorso Mondiale e avvio partita reale per ogni nuova squadra nei quattro moduli. Collaudo visivo browser ancora non completato per il limite Chrome già documentato.

## Stadio vivo e boato al gol — 7 ottobre 2026

- Rumore reale del pubblico in loop durante il match Arcade, a volume moderato. Riusa assets/audio/stadium-ambience.mp3 già presente nel progetto; nessuna musica durante la partita.
- Gol: boato immediato dalla registrazione esistente goal-boato.mp3, iniziando a 5,1 secondi; riproduzione una sola volta per gol, inclusi golden goal decisivo e rigori segnati. Effetti di parata e fischio finale collegati al sistema SFX esistente.
- Tifosi sugli spalti saltano e alzano sciarpe nei colori della squadra che ha segnato. Breve inquadratura disegnata degli spalti con bandiere e pubblico in festa, visibile anche se gli spalti del campo sono fuori camera.
- Esultanza prima del replay estesa a 1,4 secondi. Reazione del pubblico di 3,2 secondi; audio fermato quando si esce dal match o si torna al menu. Retry dell'ambiente dopo input se il browser blocca la riproduzione iniziale; listener rimossi alla chiusura.
- Nessun cambiamento a punteggio, cronometro, possesso o fisica. Cache stadium-1.
- 116 controlli automatici superati, inclusi avvio/stop dell'audio nel bridge reale, gol decisivo, rigori, eventi singoli, callback audio tardive e cutaway indipendente dalla camera. Prova visiva e d'ascolto browser ancora non completata per il limite Chrome già documentato.

## HUD ispirato al riferimento arcade fornito — 7 ottobre 2026

- Radar spostato in alto al centro, con timer giallo subito sotto. Campo miniaturizzato, aree e cerchio centrale proporzionati alla minimappa; squadre, palla e selezione restano leggibili.
- Due pannelli laterali con punteggi gialli grandi, 1P/1UP e CPU/2UP, nome squadra, modulo e icona della maglia. Nomi lunghi ridimensionati per evitare sovrapposizioni.
- Messaggi partita spostati sotto la minimappa. Radar nascosto nei rigori e nel replay per non sovrapporre i rispettivi controlli e la didascalia.
- Camera larga, stadio ed effetti appena aggiunti preservati. Nessun asset copiato dall'immagine di riferimento. Cache hud-90s-1.
- 118 controlli automatici superati; verificati collocazione radar/timer, punteggi separati e compatibilità replay. Verifica visiva nel browser ancora da completare.

## Avvio da file locale: canvas tainted — 7 ottobre 2026

- Risolto il percorso che causava SecurityError su getImageData aprendo index.html direttamente con file://: gli atlanti per palette umane e Jurassic sono incorporati come PNG data URI nel pacchetto offline-sprites.js. Le immagini restano identiche byte per byte agli originali.
- Su HTTP/HTTPS restano i percorsi PNG ordinari. Nessun flag di sicurezza del browser richiesto, nessuna rinuncia ai colori o alle maglie della squadra. Pacchetto rigenerabile con tools/embed-arcade-sprites.py.
- Fixture standalone arcade/tests/offline-sprites.html verifica i due palette swap e la successiva lettura dei canvas senza iframe, anche con apertura file locale.
- Cache offline-1. 120 controlli automatici superati, inclusi selezione sorgenti per protocollo, corrispondenza esatta dei PNG e sintassi della nuova fixture. Collaudo browser non completato: l'interazione UI è stata interrotta dai cambi di finestra mentre l'utente giocava.

## Aree selezionabili con le frecce — 7 ottobre 2026

- Entrando nella selezione, le frecce muovono tra le aree geografiche; Z apre la scelta delle squadre nell'area. Indicatore ▶ e istruzioni contestuali rendono visibile quale selettore è attivo.
- Nella griglia squadre, ↑ dalla prima riga torna alle aree. Le frecce spostano le aree nella griglia a quattro colonne; ↓ dall'ultima riga, Z o X rientrano nella scelta squadra. Mouse e scorciatoie Q/E conservati.
- Funziona per club, nazionali e selezione CPU, senza cambiare i controlli della partita. Cache area-keys-1.
- 121 controlli automatici superati, inclusa navigazione solo con frecce fino all'Oceania, separazione area/squadra e conferma Z senza selezione prematura della squadra.

## CPU eccessivamente efficace sotto porta — 7 ottobre 2026

- Mira CPU separata dalle frecce del giocatore. Precisione variabile con attributo tiro, distanza, angolo e difensori vicini; il bersaglio può finire fuori dai pali invece di essere sempre limitato allo specchio.
- CPU tira da una zona più favorevole (entro 24 unità e con angolo contenuto), altrimenti passa; cooldown del tiro aumentato a 1,65 secondi.
- Portiere: sui tiri diretti in porta resta vicino alla linea e segue il punto d'intercettazione dopo 120 ms. Prima rincorreva la palla uscendo dalla porta anche contro i tiri veloci. Raggio di parata sui tiri ridotto rispetto alle palle vaganti, per evitare un portiere invincibile.
- Corretto anche il blocco iniziale del pallone: dopo 100 ms il portiere può parare un tiro in arrivo, senza attendere il lock ordinario di ricezione. Questo lock rendeva i tiri molto ravvicinati imparabili perché la palla passava il portiere prima dello sblocco.
- Correzione simmetrica dei portieri, tiro/carica del giocatore e rigori a nove celle preservati. Cache cpu-balance-1.
- 126 controlli automatici superati. Prove isolate: 60 tiri centrali da distanza con/senza pressione producono 46 parate e 14 errori; 40 occasioni ravvicinate producono 23 gol. Sono scenari controllati di tiro, non una previsione del punteggio delle partite reali. Verificati anche indipendenza dalle frecce, pressione e scelta di passare da posizione laterale.

## Ribattute del portiere e copertura difensiva — 7 ottobre 2026

- Recupero palla libera: due compagni automatici inseguono la ribattuta; il giocatore controllato manualmente non consuma più uno di questi due incarichi. Prima restava un solo compagno attivo quando il selezionato era il più vicino.
- In zona pericolosa, difensori e centrocampisti centrali coprono anche la zona tra palla e porta. Questa copertura resta attiva sulle palle vaganti, anziché lasciare che il cambio di ultimo tocco del portiere li faccia ripartire in attacco.
- Portiere respinge lateralmente, scegliendo il lato con più distanza dagli avversari e più supporto dei compagni; eliminata la ribattuta quasi sempre centrale.
- Ricezione palla libera assegnata al giocatore eleggibile più vicino, senza dipendere dall'ordine delle squadre nella lista.
- Recuperare la propria ribattuta non azzera più il cooldown di tiro della CPU. Nessuna assegnazione automatica del possesso alla difesa: gli avversari possono ancora vincere una ribattuta arrivando prima.
- Cache rebound-1. 130 controlli automatici superati, inclusi due recuperatori AI con difensore controllato vicino, copertura area, lato della respinta, ricezione basata sulla distanza e cooldown persistente.

## Bilanciamento verificato su partite complete — 7 ottobre 2026

- Aggiunte prove complete di due minuti Atalanta–Bari nei quattro moduli, con controller principiante fermo che effettua soltanto passaggi. I test di tiro isolato non erano sufficienti a validare il ritmo reale della partita.
- Pressing automatico assegnato ai compagni AI anche quando il difensore più vicino è quello controllato dal giocatore. Il vecchio ramo cercava il primo giocatore di una lista che comprendeva il selezionato, poi lo saltava: la pressione sul portatore poteva sparire.
- Linea difensiva meno schiacciata sul fondo, con spostamento relativo al centrocampo limitato a dieci unità. Cambio automatico giocatore più pronto: margine di distanza 1,2 e cooldown 250 ms.
- Portiere può raccogliere la palla dai piedi di un attaccante vicinissimo. Prima interveniva solo sulle palle senza proprietario e lasciava attraversare la porta da chi dribblava.
- CPU in possesso rallentata (velocità base 9), pausa di controllo palla di 280 ms e attesa minima di 1,1 secondi dopo la ricezione. Movimento manuale del giocatore invariato.
- Nei benchmark completi iniziali, CPU 9–11 gol; dopo le correzioni 0–2 gol: 4-4-2 0–2, 4-3-3 0–0, 3-5-2 0–1, 5-3-2 0–0. Scenari deterministici senza movimento né contrasti manuali, non una garanzia sui risultati delle partite reali.
- 134 controlli automatici superati, inclusi quattro match completi, raccolta ai piedi, pressione con difensore selezionato e tempo di ricezione CPU. Cache match-balance-1.

## Controlli assistiti, grafica solo bitmap, stemmi uniformi, schermo intero e joypad — 7 ottobre 2026

- Nuovo modulo arcade/engine/assist.js, solo per il lato umano: scivolata orientata automaticamente sul portatore entro 7 unità e portata +0,7; palla appena conquistata protetta 0,7 s; portatore in corsa protegge la palla dai contrasti CPU da dietro (e durante lo scatto V). La CPU ritenta il contrasto sul giocatore ogni 1,5 s invece di 0,9.
- Passaggi assistiti: la direzione delle frecce sceglie il settore, poi vince il compagno più libero con linea di passaggio sicura (calcolo che tiene conto di quanto il difensore può correre prima che passi la palla). Rasoterra +10% di velocità. Lancio alto: parabola più alta, mai su compagni a meno di 12 unità, punto di caduta spostato lontano dal marcatore; il ricevitore corre al punto di caduta e ha priorità sulla palla se nessun avversario è chiaramente prima. Z premuto durante il passaggio = tiro al volo del ricevitore.
- Tiro assistito: senza frecce mira all'angolo lontano dal portiere, con frecce palo alto/basso.
- Portiere umano: presa più facile (limite di velocità +14, altezza 3,2), non rimane mai selezionato senza palla (prima la sua IA di parata veniva saltata).
- Misure sul bot di 4 partite complete: lanci alti completati 52% → 78%, rasoterra 52% → 84%, palle perse su contrasto CPU 178 → 60–106. Portiere umano: 40/40 prese su tiri CPU nel test dedicato.
- HUD, radar, timer, messaggi, barra comandi, cartellini, replay, rigori, finale segreta, premiazione e prompt del menu disegnati con lo sprite drawn-panel.png a nove sezioni; stemmi delle due squadre nel tabellone e nella schermata MATCH RESULT. Rimossi il pulsante HTML ESCI/CONTINUA e la cornice CSS del canvas; il layer DOM del menu non è mai visibile, nemmeno durante il caricamento.
- Pausa disegnata: ESC/START pausa, Z riprende, X esce senza registrare. Fine partita: Z/INVIO/A continua. Canvas a tutto schermo.
- Stemmi: tools/generate-coherent-crests.py rigenera in stile patch ricamata dei club (320×480) tutte le nazionali e le 55 squadre Arcade aggiunte (prima SVG piatti con iniziali). tools/normalize-club-crests.py porta i club italiani allo stesso formato. Originali salvati in assets/crests/national/previous-style e assets/crests/italian/previous-style.
- arcade/ui/controls.js: F (o pulsante nel menu) schermo intero; joypad standard (partita: A tiro, B passa/scivolata, X alto/scivolata, Y dribbling/duro, START pausa; menu: A conferma, B indietro, LB/RB zone); fuori dall'Arcade frecce/joypad spostano il fuoco tra i comandi e INVIO/A li attiva. Nel menu Arcade ↓ seleziona RIPRENDI TORNEO, X da NEXT MATCH torna alla scelta squadre.
- 141 controlli automatici superati, incluso il nuovo arcade/tests/assist-tests.js. Screenshot headless di HUD, pausa e risultato verificati; prova con joypad fisico non eseguita.

## Co-op e 2 contro 2, difficoltà con gettoni, calci piazzati, punizioni dal limite, allenamento, stadio — 7 ottobre 2026

- Motore multi-giocatore: da 1 a 4 umani, ognuno con il proprio input (tastiera FRECCE + Z X C V, tastiera W A S D + J K L I, o joypad letto direttamente). Modalità 1 GIOCATORE, CO-OP (1P+2P contro CPU, anche in coppa), 1 CONTRO 1, 2 CONTRO 2. Anelli ed etichette 1P–4P colorate, passaggio di controllo al giocatore che ha passato, rigori con tiratore/portiere umani a turno.
- Difficoltà FACILE / NORMALE / DIFFICILE (arcade/engine/difficulty.js): indebolisce solo la squadra CPU (velocità, contrasti, reazione, mira, portiere). In coppa dà 5 / 3 / 1 gettoni: dopo una sconfitta schermata CONTINUE? con conto alla rovescia, un gettone rigioca la partita. DIFFICILE corrisponde al vecchio comportamento.
- Calci piazzati (arcade/engine/setpieces.js): freccia oscillante, premi per fermarla, tieni per la potenza, rilascia; punizioni, angoli, rimesse e rinvii. Rimessa laterale con le mani dietro la linea. Portieri fermi in porta e squadre disposte secondo il modulo durante le ripartenze; area affollata sui corner.
- Falli: contrasti CPU da dietro sul portatore umano fischiati (rigore in area), entrate dure CPU vicino alla propria area. Sequenza: fischio, scritta FALLO!, un secondo di pausa, giocatori che si sistemano, il battitore va sul pallone.
- Punizioni dal limite (arcade/engine/freekick.js): scena dietro al battitore con fondale pixel-art nuovo (tools/generate-freekick-backdrop.py → arcade/assets/freekick-backdrop.png), barriera di 4 giocatori della squadra in difesa che salta, portiere, mira oscillante, potenza ed effetto con ←/→. Portiere umano con frecce/tuffo, barriera umana salta con Z. Replay del gol su punizione.
- Allenamento (arcade/engine/training.js): punizione diretta, indiretta, calcio d'angolo, rigori, tentativi infiniti con contatore, senza cronometro.
- Stadio (arcade/engine/stadium-view.js): fascia d'erba, cartelloni con spessore, pista di atletica a corsie tutto intorno, muretto, spalti su quattro lati, due panchine con giocatori seduti e allenatore, bandierine. Pubblico ancorato al campo, telecamera ammorbidita. Porte nuove: pali ombreggiati, rete a maglie, sostegni, ombra.
- Pallone pixel-art a pentagoni che ruota mentre rotola. Carnagioni per giocatore secondo la provenienza della squadra. Schermata del modulo ridisegnata con campo e sprite reali.
- Portiere CPU non riprende più i propri rinvii; avversari a distanza mentre ha la palla in mano. Tiri forti o alti deviati sopra la traversa e deviazioni dei difensori: circa 4 angoli a partita.
- 168 controlli automatici (nuovo arcade/tests/coop-tests.js). Screenshot headless di HUD, stadio, porte, rimessa, punizione, pallone, carnagioni e modulo verificati; joypad fisici non provati.

## Soccer Arcade 2000: gioco autonomo e intro — 7 ottobre 2026

- Separato da Soccer Sim: cartella `soccer-arcade-2000/` con pagina propria, catalogo squadre statico (`game/catalog.js`: 80 club, 65 nazionali con giocatori, stemmi, maglie, zone e città), salvataggi in localStorage (`sa2000:`), fischio ed effetti sonori propri (`game/shim.js`). Rimossi carriera e pulsanti di integrazione.
- Intro cutscene (`game/intro.js`): schermata PREMI UN TASTO, stadio notturno che si accende, dribbling con scivolata saltata, tiro verso lo schermo, lampo e fischio, titolo SOCCER ARCADE 2000 lettera per lettera (la O è il pallone), bollo 2000 con boato e musica, PREMI START. Ogni tasto salta; dopo 30 secondi sul titolo riparte l'intro. MENU riporta al titolo.
- Soccer Sim non carica più alcun file Arcade.
- Test autonomi: 152 controlli, inclusi catalogo, stemmi, mappe, salvataggi e avvio di ogni squadra.
