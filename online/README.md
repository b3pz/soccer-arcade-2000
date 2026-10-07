# Stanze private per due giocatori

Il gioco può restare su GitHub Pages. Il servizio Python in questa cartella gestisce i codici invito e lo scambio iniziale dei messaggi WebRTC. GitHub Pages serve file statici e non esegue questo servizio.

## Pubblicare il servizio su Render

1. Carica nel repository GitHub anche `online/server.py` e `render.yaml`.
2. Su Render scegli **New → Blueprint**, collega il repository `b3pz/soccer-arcade-2000` e usa il file `render.yaml` presente nella radice.
3. Avvia il servizio e copia il suo indirizzo HTTPS, per esempio `https://soccer-arcade-2000-online.onrender.com` (usa l'indirizzo realmente assegnato).
4. Nel gioco apri **ARCADE EVOLUTION → ONLINE · STANZA PRIVATA**, inserisci quell'indirizzo nel campo server e crea una stanza.
5. Condividi il codice o il link invito. Il secondo giocatore apre lo stesso gioco, entra nella stanza e attiva audio/video. Chi crea la stanza sceglie e avvia le partite.

`SA2000_ALLOWED_ORIGINS` è già configurato per `https://b3pz.github.io`. Modificalo se usi un dominio diverso; più origini si separano con una virgola. I servizi gratuiti possono sospendersi quando inattivi: il primo accesso potrebbe richiedere il risveglio del servizio.

## Connessioni fra reti diverse

La configurazione predefinita usa STUN. Alcune reti aziendali, mobili e firewall richiedono anche un servizio TURN. Imposta `SA2000_ICE_SERVERS` nelle variabili d'ambiente del servizio con l'array JSON fornito dal tuo gestore TURN, per esempio:

```json
[{"urls":"stun:stun.cloudflare.com:3478"},{"urls":"turn:TURN_HOST:3478","username":"TURN_USER","credential":"TURN_PASSWORD"}]
```

Usa credenziali dedicate e limitate; per un servizio pubblico preferisci credenziali TURN temporanee. Questi dati vengono trasmessi ai browser perché WebRTC li usa per collegarsi. Non inserire segreti di amministrazione o chiavi API nel repository o in questo array.

## Modalità e funzionamento

- Amichevoli: due giocatori nella stessa squadra oppure uno contro uno.
- Coppa, campionato, sopravvivenza e sfide: due giocatori insieme contro la CPU.
- Allenamenti: turni alternati per rigori, punizioni e prove con palla.
- Torneo locale: le partite con due avversari umani restano uno contro uno; gli altri incontri consentono la cooperazione.

Il browser dell'host esegue la simulazione e trasmette il canvas e l'audio del gioco. L'ospite invia i comandi tramite WebRTC. Non si usano webcam o microfono. L'ospite vede anche replay, effetti, pubblico e risultati; può mettere in pausa e continuare. Il ritardo dipende dalla connessione e include la trasmissione video. Competizioni e salvataggi restano sul dispositivo dell'host; XP e medaglie della singola partita vengono assegnati anche all'ospite quando si continua dal risultato.

Una disconnessione mette in pausa la partita. Ricrea la stanza se il collegamento non torna. Le stanze sono in memoria: un riavvio del server le elimina. Mantieni una sola istanza del servizio. Il codice stanza è un invito: condividilo solo con il compagno.

## Eseguire e verificare

Richiede Python 3.9 o successivo, senza pacchetti aggiuntivi:

```sh
python3 online/server.py --host 127.0.0.1 --port 8080
python3 online/test_server.py
python3 tools/run-arcade-tests.py
```

I test automatici verificano autenticazione, capienza, segnalazione, scadenza, comandi remoti, pause, pacchetti obsoleti e premi duplicati. La verifica effettiva fra due browser su reti diverse va eseguita dopo aver pubblicato il servizio e configurato TURN se necessario.

Riferimenti: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Render Blueprint](https://render.com/docs/blueprint-spec), [Cloudflare STUN/TURN](https://developers.cloudflare.com/realtime/turn/).
