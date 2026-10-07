# Arcade Evolution — 7 ottobre 2026

## Interfaccia e controlli
Centro Arcade con ricerca squadre, preferiti e recenti, partita rapida, rivincita, impostazioni e spogliatoio. Configurazione dei tasti condivisa fra input 1P, istruzioni e HUD; cambio manuale con SHIFT/U/LB, selezione riservata per 1,2 secondi e rispetto dei compagni in co-op. Preferenze persistenti, tre camere, radar esistente disattivabile, volume generale, effetti e vibrazione. Impostazioni accessibili con P dalla pausa; nuovi tasti applicati dalla partita successiva.

Indicatore del destinatario del passaggio e del prossimo difensore. Pannelli separati per quattro giocatori in basso, senza coprire il timer. Potenza del tiro in posizione fissa indipendente dalla camera. Risultati con tiri, parate, passaggi completati/precisione, contrasti, pali, MVP e medaglie. Il valore MVP combina gol, assist, passaggi, tiri e parate.

## Giocabilità
Gli assist esistenti su passaggio, ricezione e tiro sono conservati. Stili CPU deterministici per squadra: pressing a tre, contropiede e possesso con preferenza per compagni liberi a distanza breve. Nei match dell'app Evolution ripristina gli attributi originali dei giocatori dopo l'applicazione della difficoltà: differenze soprattutto in reazione, attesa del contrasto e precisione della conclusione. Feedback sonoro e vibrazione su tiri, passaggi, contrasti, parate, gol e pali. Pali/traversa producono rimbalzi durante il gioco normale; rigori e punizioni mantengono il proprio calcolo dell'esito.

## Modalità e progressione
Sfide rimonta, gol al volo e inferiorità numerica. Accademia con obiettivi misurati sulle azioni reali: otto passaggi ricevuti, tre contrasti vinti, sei finte. Allenamenti sui calci piazzati da cinque tentativi. Medaglie persistenti e ricompense XP.

Campionato da sei squadre con calendario round robin di cinque giornate, classifica a 3/1 punti, differenza reti e gol fatti. Torneo locale da quattro squadre distinte, due semifinali e finale, assegnazione tastiere/joypad a ogni gara. Survival con avversari ordinati per forza, difficoltà crescente, record e uscita alla prima sconfitta. Tutti usano uno slot di ripresa distinto dalle coppe esistenti; annullare non registra risultati. Quattro regole speciali e quattro cosmetici da sbloccare/equipaggiare.

## Verifica
Verifica completata con `python3 tools/run-arcade-tests.py`: 177 righe PASS, tutte le suite completate. Report in `arcade/tests/LAST_RUN.txt`. Copertura: suite precedenti, sintassi, risorse, nuovi test di motore e flussi UI con modello DOM. Le nuove verifiche coprono cambi manuali/co-op, rimappatura, obiettivi/medaglie, statistiche di ricezione, regole speciali, rimbalzi, cinque turni completi del campionato, trasferta, annullamento, torneo locale completo, survival/ripresa, rendering senza mutazioni e barra di tiro indipendente dalla camera.

La verifica visiva nel browser non è stata completata: la policy del browser ha rifiutato l'apertura dell'URL locale `file://`. I test del rendering usano un contesto canvas simulato; non attestano la resa visiva su un browser reale. Restano da valutare giocando il bilanciamento dei nuovi stili CPU e il feedback dei joypad fisici.

## Fantasia arcade — tiro infuocato
Nuovo modulo `arcade/engine/fantasy.js`: fiamme arancio/gialle sui tiri al 100%, scie viola sui tiri al volo alla massima carica, aura di preparazione, scintille, scie di dribbling, impatti radiali e annuncio SUPER GOAL. Suono sintetizzato per il tiro speciale. Particelle procedurali a numero fisso, animate dal tempo della partita e controllate dalle preferenze; nessun nuovo asset esterno.

Punizioni dirette e rigori a piena carica usano lo stesso effetto sul pallone. Replay registrano stato del tiro, velocità e impatto e ripristinano lo stato live anche in caso di errore del renderer. Gli effetti delle punizioni usano il tempo della sequenza registrata.

Suite completa aggiornata: **186 righe PASS**. I nove nuovi controlli verificano soglia, buffer, volley, spegnimento, gol speciali, invarianza fisica, punizioni, replay ed effetti disattivati. Verifica visiva nel browser ancora non completata per il blocco degli URL locali già descritto.

## HUD più pulito
Rimossa la barra permanente dei comandi in basso (Z tiro, C passa, X alto, ecc.) durante la partita.

## Stanze private e bandiere

- Bandiere animate dei tifosi e bandiere più grandi della squadra che segna nelle esultanze.
- Stanza privata a codice e link invito, comandi remoti e trasmissione WebRTC della partita con audio, pausa e gestione disconnessioni.
- Cooperazione nelle competizioni e sfide, turni alternati negli allenamenti e partite contro un altro giocatore.
- Servizio stanze Python senza dipendenze e blueprint Render; frontend compatibile con GitHub Pages. Pubblicazione del servizio e prova reale fra due browser ancora da eseguire.

## Selezione squadre: galleria degli stemmi

Le squadre si scelgono da tessere con stemmi da 76 px e nome sotto, con bordo giallo sulla selezione. La scheda mostra anche lo stemma da 140 px; la mappa occupa meno spazio e si nasconde sugli schermi stretti per dare priorità alle squadre. Il renderer del menu disegna le tessere e mantiene le proporzioni originali degli stemmi.

## Intro cinematografica Inter–Milan

Intro di 12 secondi con sette inquadrature: finale sul 2–2, dribbling, rovesciata, parata in volo, dettaglio di uno scarpino neutro, pallone che lacera la rete e transizione nella O di SOCCER. Grafica canvas originale con figure articolate e sfumate, luci da stadio, scie e detriti, indipendente dagli sprite di gioco. Le fiamme seguono la preferenza fantasy; intro saltabile con tastiera, clic o comandi esistenti. Nessun filmato esterno: funziona offline.

## Rimappatura completa

Profili persistenti per movimento e azioni della tastiera 1P e 2P, navigazione menu/intro, pausa, impostazioni e schermo intero. Pulsanti configurabili separatamente per quattro joypad e per i menu. Le assegnazioni nello stesso profilo scambiano i comandi occupati; i conflitti fra tastiere e tasti globali vengono segnalati. Anche Tab è assegnabile cliccando prima sul campo. Ripristino unico dei comandi originali. I pacchetti online continuano a usare azioni logiche: ciascun giocatore mantiene la propria configurazione.

## Sprite per le parate spettacolari

Sei nuove animazioni, otto pose distinte ciascuna: tuffo a mano aperta, deviazione con le dita e respinta a due pugni, sia a destra sia a sinistra. Figure complete con guanti, spinta, volo, contatto, atterraggio e recupero. Selezione automatica durante le vere parate, rigori e punizioni; metadati salvati nei replay. Il rendering non modifica raggio di intervento, traiettorie, punteggio o recupero fisico del portiere. Atlas e pacchetto offline aggiornati.
