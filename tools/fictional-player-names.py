"""Replace every player name in game/catalog.js with an invented one.

Names are deterministic (seeded by player id) and flavoured by the team's country,
so a Brazilian squad still sounds Brazilian. Surnames are assembled from syllables,
and any surname that matches a real one from the original data is rejected.
Run: python3 tools/fictional-player-names.py
"""
from pathlib import Path
import json, random, re

root = Path(__file__).resolve().parents[1]
path = root / 'game/catalog.js'
source = path.read_text()
start, end = source.index('{'), source.rindex('}') + 1
data = json.loads(source[start:end])

# first names, surname heads, surname tails
L = {
 'it': (['Marco','Luca','Paolo','Dario','Fabio','Sandro','Ivano','Remo','Tullio','Nando','Gino','Elio','Corrado','Renzo','Mirko','Ugo','Silvio','Aldo','Bruno','Ettore','Livio','Oreste','Piero','Walter'],
        ['Bell','Cast','Ferr','Mor','Ross','Sant','Carp','Fior','Gall','Lomb','Marz','Pell','Tors','Vann','Zan','Bocc','Corv','Dell','Gherm','Spad'],
        ['ardi','ucci','etti','ini','oni','ello','asco','ieri','otto','anti','esi','uzzi','ola','avia','ero']),
 'es': (['Javier','Rodrigo','Mateo','Esteban','Gonzalo','Hernán','Lisandro','Matías','Ramiro','Tomás','Ulises','Rubén','Saúl','Ignacio','Bruno','Facundo','Julián','Néstor'],
        ['Albar','Bel','Cabr','Dom','Echev','Fuen','Garr','Iba','Lar','Mend','Olm','Pared','Quir','Sald','Tor','Valv','Zab','Arr'],
        ['ado','ez','era','ino','uela','ales','ueta','ano','ón','illa','oza','ido']),
 'pt': (['Tiago','Rafael','Bruno','Caio','Diogo','Everton','Fábio','Gilson','Hélio','Jair','Leandro','Márcio','Nelson','Otávio','Renan','Sérgio','Vítor','Wellington'],
        ['Alme','Barr','Carv','Dutr','Fern','Gou','Lim','Marq','Nasc','Pinh','Quei','Rib','Sant','Tav','Vasc','Brag'],
        ['eira','oso','alho','inho','ão','elo','ares','ida','ês','ota','ura']),
 'en': (['Gary','Neil','Darren','Craig','Lee','Stuart','Wayne','Kevin','Mark','Dean','Ross','Jamie','Scott','Owen','Callum','Tony','Rory','Glenn'],
        ['Ash','Black','Brad','Cart','Fen','Hal','Kemp','Lang','Mar','Pen','Thorn','Whit','Brook','Hart','Stan','Wins'],
        ['ford','ley','wick','ton','by','ridge','well','more','ham','shaw','field','croft']),
 'de': (['Jörg','Uwe','Dirk','Stefan','Thorsten','Markus','Lars','Ralf','Holger','Sven','Kai','Jens','Florian','Torben','Mirko','Bernd'],
        ['Brand','Eich','Fall','Grün','Hart','Kess','Lind','Maur','Ober','Reit','Schm','Stein','Wall','Zim','Hoff','Kranz'],
        ['mann','ner','berg','hoff','ler','bach','inger','hausen','ert','mayer','feld']),
 'nl': (['Dennis','Ruud','Jaap','Wim','Sander','Bart','Kees','Joris','Pim','Thijs','Arjen','Niels','Koen','Stijn'],
        ['van der Ber','de Wo','van Hal','Ste','Kui','van Dij','Brou','Vli','van Mee','de Gra','Ho'],
        ['gen','uter','st','kema','per','ker','wer','eger','ren','af','ndijk']),
 'fr': (['Thierry','Laurent','Didier','Fabien','Olivier','Cédric','Julien','Sylvain','Régis','Yannick','Bastien','Lilian','Mathis','Pascal'],
        ['Bel','Char','Dub','Font','Gir','Lamb','Mar','Perr','Roch','Vall','Bou','Chev','Leg'],
        ['ard','ier','ois','eau','and','ot','elle','ine','oux','et','ière']),
 'nordic': (['Lars','Henrik','Mikkel','Anders','Jesper','Ole','Tore','Stig','Rune','Bjørn','Erik','Niklas','Fredrik','Kasper'],
            ['Berg','Dahl','Holm','Lund','Strand','Nord','Fjell','Sand','Vik','Ek','Hag','Sol'],
            ['gren','qvist','sen','strøm','by','vall','ström','heim','rud','lien']),
 'slav': (['Dmitri','Igor','Andrej','Pavel','Bojan','Goran','Marek','Tomasz','Zoran','Vlado','Oleg','Milan','Jiri','Stanislav','Darko','Radek'],
          ['Kov','Petr','Mil','Sok','Vuk','Dra','Bor','Nov','Jank','Ras','Zel','Krav','Lub','Hor'],
          ['ačić','enko','ović','ski','ev','in','ić','ák','ov','evski','ešić','czak']),
 'ro': (['Gheorghe','Florin','Dorin','Ionuț','Marius','Sorin','Cosmin','Bogdan','Ciprian','Viorel'],
        ['Pop','Dum','Rad','Stan','Mun','Ilie','Cris','Neg','Bal','Tud'],
        ['escu','eanu','ică','aru','oiu','ache','ean']),
 'gr': (['Nikos','Giorgos','Kostas','Theo','Stelios','Vasilis','Dimitris','Angelos','Petros','Christos'],
        ['Karag','Papad','Kost','Anton','Charal','Vlach','Mitr','Spyr','Zaf','Dimopo'],
        ['iannis','opoulos','akis','idis','ou','elis','atos','oglou']),
 'tr': (['Emre','Burak','Tolga','Serkan','Ümit','Hakan','Volkan','Ozan','Selçuk','Mert','Arda','Kaan'],
        ['Yıl','Kar','Ak','Demir','Öz','Ar','Çel','Tun','Bal','Koç','Şah'],
        ['maz','kaya','soy','ci','oğlu','dağ','tekin','türk','han','alp']),
 'ar': (['Karim','Nabil','Samir','Youssef','Tarek','Hamza','Walid','Ziad','Rachid','Omar','Bilal','Fares','Anis','Hichem'],
        ['El Am','Ben Sal','Ham','Bou','Al Kha','Mans','Har','Ab','Laz','Saad'],
        ['rani','ida','dani','zid','ouri','alla','imi','ady','ouni']),
 'af': (['Kwame','Emeka','Sékou','Moussa','Ibrahim','Chidi','Yaw','Kofi','Abdou','Bakary','Joseph','Samuel','Patrice','Thabo'],
        ['Ok','Diall','Mens','Tour','Ab','Kan','Ndi','Ow','Bam','Kou','Ess','Mbe'],
        ['onkwo','ah','uba','é','ayo','oro','ye','iba','aké','ongo','ien']),
 'jp': (['Hiroshi','Kenta','Daisuke','Takumi','Shota','Yuto','Ryo','Kazuki','Masato','Naoki','Sho','Tatsuya'],
        ['Taka','Naka','Hoshi','Mori','Yama','Ishi','Kura','Fuji','Asa','Tsuru'],
        ['hara','zawa','mura','gawa','moto','shita','oka','da','kawa']),
 'kr': (['Min-jun','Ji-hoon','Sung-ho','Dong-wook','Hyun-woo','Jae-sung','Tae-yang','Kyung-soo','Young-min','Seung-ho'],
        ['Kw','Ry','Ch','Y','J','B','S','H'],
        ['on','ang','oo','eon','ung','ae','im']),
 'cn': (['Wei','Lei','Jun','Hao','Bo','Tao','Jian','Long','Ming','Peng','Xin','Yong'],
        ['Zh','L','W','Ch','X','G','Q','T'],
        ['ao','eng','ang','ui','ian','ong','in']),
}
NATION = {
 'ITA':'it','ESP':'es','ARG':'es','CHI':'es','COL':'es','CRC':'es','MEX':'es','PAR':'es','URU':'es','POR':'pt','BRA':'pt',
 'ENG':'en','SCO':'en','IRL':'en','USA':'en','AUS':'en','RSA':'en','GER':'de','AUT':'de','SUI':'de','NED':'nl','BEL':'nl',
 'FRA':'fr','DEN':'nordic','NOR':'nordic','SWE':'nordic','RUS':'slav','BUL':'slav','CRO':'slav','YUG':'slav','POL':'slav','CZE':'slav',
 'ROU':'ro','GRE':'gr','TUR':'tr','KSA':'ar','MAR':'ar','CMR':'af','CIV':'af','GHA':'af','NGA':'af','SEN':'af','JPN':'jp','KOR':'kr',
}
BY_NAME = {
 'Algeria':'ar','Egitto':'ar','Emirati Arabi Uniti':'ar','Iraq':'ar','Iran':'ar','Qatar':'ar','Tunisia':'ar','Bolivia':'es','Ecuador':'es',
 'Honduras':'es','Panama':'es','Perù':'es','Venezuela':'es','Canada':'en','Giamaica':'en','Nuova Zelanda':'en','Mali':'af','RD Congo':'af',
 'Zambia':'af','Cina':'cn','Uzbekistan':'slav',
}
CITY = {
 'Il Cairo':'ar','Riyad':'ar','Casablanca':'ar','Istanbul':'tr','Buenos Aires':'es','Montevideo':'es','Madrid':'es','Città del Messico':'es',
 'Guadalajara':'es','São Paulo':'pt','Rio de Janeiro':'pt','Santos':'pt','Lisbona':'pt','Washington':'en','Los Angeles':'en','Auckland':'en',
 'Sydney':'en','Glasgow':'en','Pretoria':'en','Jeonju':'kr','Kashima':'jp','Saitama':'jp','Shanghai':'cn','Eindhoven':'nl','Parigi':'fr',
}

def flavour(team):
    return NATION.get(team.get('country')) or BY_NAME.get(team['name']) or CITY.get((team.get('arcadeLocation') or {}).get('city')) or 'it'

teams = [t for group in data.values() for t in group]
real_full = {p['name'] for t in teams for p in t['players']}
real_parts = {w.lower() for name in real_full for w in re.split(r"[\s\-’']+", name) if len(w) > 2}
used = set()

def invent(team, player):
    first, heads, tails = L[flavour(team)]
    rng = random.Random(player['id'])
    for _ in range(500):
        surname = rng.choice(heads) + rng.choice(tails)
        name = rng.choice(first) + ' ' + surname
        if surname.split()[-1].lower() in real_parts or name in used:
            continue
        used.add(name)
        return name
    raise SystemExit('no free name for ' + player['id'])

# Names chosen by the project owner, kept on every run (player id -> name).
NAMED = {}
for team in data['club']:
    if team['id'].startswith('fiorentina'):
        NAMED[[p for p in team['players'] if p['pos'] == 'ST'][0]['id']] = 'Marco Paolini'
    if team['id'].startswith('inter_'):
        strikers = [p for p in team['players'] if p['pos'] == 'ST']
        NAMED[strikers[0]['id']] = 'Francesco Infusini'
        NAMED[strikers[1]['id']] = 'Giuseppe Milano'
used.update(NAMED.values())

for team in teams:
    for player in team['players']:
        player['name'] = NAMED.get(player['id']) or invent(team, player)

leftover = (real_full & {p['name'] for t in teams for p in t['players']}) - set(NAMED.values())
assert not leftover, leftover
path.write_text(source[:start] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + source[end:])
print('renamed', sum(len(t['players']) for t in teams), 'players')
