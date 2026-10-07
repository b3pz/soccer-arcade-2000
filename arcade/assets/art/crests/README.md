# Stemmi arcade

145 stemmi distinti delle squadre del catalogo, più quello dei Jurassic Kickers della finale segreta. PNG trasparenti 320×320, con margine di sicurezza e dimensioni uniformi. Stile pixel art da cabinato 1998–2000: contorni marcati, silhouette compatte, colori saturi, ombre a campiture nette e simboli senza nomi o marchi reali.

- `team-000.png` … `team-144.png`: immagini effettivamente usate da selezione e tabellone.
- `jurassic.png`: stemma della squadra segreta.
- `manifest.json`: corrispondenza tra ID stabile, nome della squadra e immagine.
- `gallery.jpg`: galleria completa con i nomi per controllare le assegnazioni.
- `sources/page-00.png` … `sources/page-09.png`: atlanti originali, ciascuno con sedici emblemi.
- `sources/jurassic.png`: sorgente dello stemma della finale segreta.
- `sources/prompts.json`: prompt completi dei dieci atlanti. La richiesta comune è una griglia 4×4 trasparente di emblemi originali, contorni scuri a gradini, tre toni, palette vivaci, simbolo dominante e pallone, leggibili a 32 pixel, senza lettere o marchi reali.
- `sources/jurassic-prompt.txt`: prompt del simbolo T-Rex e struzzo, magenta/ciano/giallo.

Generazione: skill imagegen, strumento integrato; nessuna API o chiave esterna. `python3 tools/install-arcade-crests.py` esegue soltanto ritaglio, ridimensionamento, confezionamento PNG e assegnazione al catalogo. Conserva ID, nomi, rose, attributi e salvataggi. `tools/fictionalize-roster.py` mantiene la stessa assegnazione anche se si rigenera il catalogo.

I test verificano trasparenza, dimensioni, margini, 145 contenuti bitmap distinti e corrispondenza unica degli stemmi nel catalogo. La galleria è un controllo degli asset, non una schermata di browser.
