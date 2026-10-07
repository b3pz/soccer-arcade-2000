from pathlib import Path
import json,re,math,html
root=Path('.')
# Authored arcade identities and approximate city/capital coordinates; stats are game tuning, not historical claims.
clubs=[
('napoli','Napoli','Napoli',14.27,40.85,'italy',84,'#29b9ed','#ffffff','trim'),('atalanta','Atalanta','Bergamo',9.67,45.70,'italy',81,'#2070dd','#111111','vertical_stripes'),('bologna','Bologna','Bologna',11.34,44.49,'italy',77,'#dc2234','#183180','vertical_stripes'),('cagliari','Cagliari','Cagliari',9.12,39.22,'italy',76,'#da2336','#172b65','halves'),
('psg','Paris Saint-Germain','Parigi',2.35,48.86,'a',85,'#153580','#e8223b','horizontal_band'),('atletico','Atlético Madrid','Madrid',-3.70,40.42,'a',84,'#eb293c','#ffffff','vertical_stripes'),('sporting','Sporting Lisbona','Lisbona',-9.14,38.72,'a',81,'#21aa64','#ffffff','horizontal_band'),('psv','PSV Eindhoven','Eindhoven',5.48,51.44,'b',82,'#e82639','#ffffff','vertical_stripes'),('rangers','Rangers','Glasgow',-4.25,55.86,'b',80,'#235bda','#ffffff','trim'),('fener','Fenerbahçe','Istanbul',29.03,41.01,'c',81,'#ffd52d','#17317d','vertical_stripes'),
('boca','Boca Juniors','Buenos Aires',-58.38,-34.60,'n-south',86,'#153f9c','#ffda28','horizontal_band'),('river','River Plate','Buenos Aires',-58.38,-34.60,'n-south',86,'#ffffff','#ed2639','horizontal_band'),('flamengo','Flamengo','Rio de Janeiro',-43.17,-22.91,'n-south',85,'#e82c35','#111111','horizontal_band'),('santos','Santos','Santos',-46.33,-23.96,'n-south',83,'#ffffff','#111111','trim'),('saopaulo','São Paulo','São Paulo',-46.63,-23.55,'n-south',84,'#ffffff','#d52337','horizontal_band'),('corinthians','Corinthians','São Paulo',-46.63,-23.55,'n-south',83,'#ffffff','#111111','trim'),('palmeiras','Palmeiras','São Paulo',-46.63,-23.55,'n-south',84,'#159549','#ffffff','trim'),('penarol','Peñarol','Montevideo',-56.16,-34.90,'n-south',82,'#ffd82c','#111111','vertical_stripes'),('nacional','Nacional','Montevideo',-56.16,-34.90,'n-south',81,'#ffffff','#16438c','trim'),
('america','Club América','Città del Messico',-99.13,19.43,'n-north',82,'#ffdf6b','#163785','trim'),('chivas','Guadalajara','Guadalajara',-103.35,20.67,'n-north',80,'#ed293b','#ffffff','vertical_stripes'),('galaxy','LA Galaxy','Los Angeles',-118.24,34.05,'n-north',78,'#ffffff','#143a86','trim'),('dcunited','DC United','Washington',-77.04,38.91,'n-north',77,'#151515','#ffffff','trim'),
('alahly','Al Ahly','Il Cairo',31.24,30.04,'n-africa',83,'#ed293b','#ffffff','trim'),('zamalek','Zamalek','Il Cairo',31.24,30.04,'n-africa',80,'#ffffff','#e6243b','horizontal_band'),('raja','Raja Casablanca','Casablanca',-7.59,33.57,'n-africa',80,'#16a866','#ffffff','trim'),('sundowns','Mamelodi Sundowns','Pretoria',28.19,-25.75,'n-africa',79,'#ffdb28','#189553','trim'),
('alhilal','Al Hilal','Riyad',46.72,24.71,'n-asia',82,'#216be3','#ffffff','trim'),('kashima','Kashima Antlers','Kashima',140.64,35.97,'n-asia',80,'#db2340','#133968','trim'),('urawa','Urawa Reds','Saitama',139.65,35.86,'n-asia',79,'#e32738','#111111','trim'),('jeonbuk','Jeonbuk Motors','Jeonju',127.15,35.82,'n-asia',78,'#28b453','#153979','trim'),('shanghai','Shanghai Shenhua','Shanghai',121.47,31.23,'n-asia',76,'#205de0','#e1283c','trim'),
('sydney','Sydney FC','Sydney',151.21,-33.87,'n-oceania',77,'#78d8f4','#15376a','trim'),('auckland','Auckland City','Auckland',174.76,-36.85,'n-oceania',74,'#164590','#ffffff','trim')]
nations=[
('canada','Canada','Ottawa',-75.70,45.42,'Canada','n-north',76,'#e52b3d','#ffffff'),('jamaica','Giamaica','Kingston',-76.79,17.97,'Jamaica','n-north',75,'#ffdc28','#19944a'),('honduras','Honduras','Tegucigalpa',-87.21,14.08,'Honduras','n-north',73,'#ffffff','#2671ce'),('panama','Panama','Panama',-79.52,8.98,'Panama','n-north',73,'#eb2d3b','#235cc3'),
('ecuador','Ecuador','Quito',-78.47,-.18,'Ecuador','n-south',79,'#ffdc28','#1e4599'),('peru','Perù','Lima',-77.04,-12.05,'Peru','n-south',77,'#ffffff','#df2941'),('venezuela','Venezuela','Caracas',-66.90,10.48,'Venezuela','n-south',74,'#8e193c','#ffffff'),('bolivia','Bolivia','La Paz',-68.12,-16.50,'Bolivia','n-south',72,'#16974f','#ffffff'),
('egypt','Egitto','Il Cairo',31.24,30.04,'Egypt','n-africa',79,'#ed293b','#ffffff'),('algeria','Algeria','Algeri',3.06,36.75,'Algeria','n-africa',79,'#ffffff','#1b9b58'),('tunisia','Tunisia','Tunisi',10.18,36.81,'Tunisia','n-africa',77,'#ed293b','#ffffff'),('mali','Mali','Bamako',-8.00,12.64,'Mali','n-africa',76,'#ffdb29','#249e55'),('congo','RD Congo','Kinshasa',15.27,-4.33,'Democratic Republic of the Congo','n-africa',76,'#25a6e5','#ffd72b'),('zambia','Zambia','Lusaka',28.28,-15.39,'Zambia','n-africa',74,'#20a253','#ff8a25'),
('iran','Iran','Teheran',51.39,35.69,'Iran','n-asia',79,'#ffffff','#e22d41'),('china','Cina','Pechino',116.41,39.90,'China','n-asia',74,'#e72b3b','#ffda27'),('qatar','Qatar','Doha',51.53,25.29,'Qatar','n-asia',75,'#8b1a43','#ffffff'),('uae','Emirati Arabi Uniti','Abu Dhabi',54.37,24.45,'United Arab Emirates','n-asia',74,'#ffffff','#e7283b'),('iraq','Iraq','Baghdad',44.37,33.32,'Iraq','n-asia',75,'#269b53','#ffffff'),('uzbek','Uzbekistan','Tashkent',69.24,41.30,'Uzbekistan','n-asia',75,'#ffffff','#2c9bd5'),('newzealand','Nuova Zelanda','Wellington',174.78,-41.29,'New Zealand','n-oceania',74,'#ffffff','#111111')]
def roster(key,strength):
 roles=['GK','GK']+['DF']*6+['MF']*6+['ST']*4
 return [dict(id=f'{key}_{i+1:02}',name=f'{"Portiere" if pos=="GK" else "Difensore" if pos=="DF" else "Centrocampista" if pos=="MF" else "Attaccante"} {i+1}',pos=pos,overall=min(95,strength+(i%5)-2),stats={k:max(40,min(95,strength+(i%5)-2+(3 if k in ['speed','physical'] else 0))) for k in ['speed','technique','passing','dribbling','shooting','defending','heading','physical','vision','positioning','crossing']}) for i,pos in enumerate(roles)]
def team(row,category):
 if category=='club':key,name,city,lon,lat,zone,strength,c1,c2,pattern=row
 else:key,name,city,lon,lat,country,zone,strength,c1,c2=row;pattern='trim'
 id='arc_'+category+'_'+key
 # PNG crest in the shared club patch style: run tools/generate-coherent-crests.py after this script.
 crest='arcade/assets/crests/'+id+'.png'
 return dict(id=id,name=name,season='',strength=strength,players=roster(id,strength),crest=crest,arcadeRegion=zone,arcadeLocation=dict(city=city,lon=lon,lat=lat),arcadeKit=dict(shirtPrimary=c1,shirtSecondary=c2,shorts=c2,socks=c1,pattern=pattern),arcadeGeneric=True)
new=[team(r,'club') for r in clubs]+[team(r,'national') for r in nations]
Path('arcade/assets/world-roster.js').write_text('/* Arcade-only expansion. Generic fictional players and authored game ratings. */\nwindow.S9ArcadeRosterData='+json.dumps({'clubs':new[:len(clubs)],'nations':new[len(clubs):]},ensure_ascii=False,separators=(',',':'))+';\n')
# Reproject world zones and expand highlights for new nations and club countries.
p=Path('arcade/assets/regional-maps.js');s=p.read_text();national=json.loads(re.search(r'const nationalRegions=(\[.*?\]);',s)[1]);config=json.load(open('arcade/assets/national-map-config.json'))
for key,name,city,lon,lat,country,zone,*_ in nations:config['nations'][key]=[city,lon,lat,country,zone]
extra={'n-north':['Canada','Jamaica','Honduras','Panama'],'n-south':['Ecuador','Peru','Venezuela','Bolivia'],'n-africa':['Egypt','Algeria','Tunisia','Mali','Democratic Republic of the Congo','Zambia'],'n-asia':['Iran','China','Qatar','United Arab Emirates','Iraq','Uzbekistan'],'n-oceania':['New Zealand']}
bounds={'n-north':(-128,-58,6,57),'n-south':(-83,-34,-57,14),'n-africa':(-20,40,-36,38),'n-asia':(36,147,0,53),'n-oceania':(110,179,-48,-8)}
features=json.load(open('arcade/assets/world-countries.geo.json'))['features']
def merc(lat):return math.log(math.tan(math.pi/4+math.radians(max(-80,min(80,lat)))/2))
for z in national:
 if z['id'] not in bounds:continue
 west,east,south,north=bounds[z['id']];scale=min(380/math.radians(east-west),460/(merc(north)-merc(south)));ox=(420-math.radians(east-west)*scale)/2;oy=(500-(merc(north)-merc(south))*scale)/2;z['projection']=dict(west=west,northM=merc(north),scale=scale,offsetX=ox,offsetY=oy);z['countries']=sorted(set(z['countries']+extra[z['id']]));z['paths']=[]
 for f in features:
  polys=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']];commands=[]
  for rings in polys:
   for ring in rings:
    if not any(west<=a<=east and south<=b<=north for a,b,*_ in ring):continue
    commands.append('M'+'L'.join(f'{ox+math.radians(a-west)*scale:.1f},{oy+(merc(north)-merc(b))*scale:.1f}' for a,b,*_ in ring)+'Z')
  if commands:z['paths'].append(dict(name=f['properties']['ADMIN'],selected=f['properties']['ADMIN'] in z['countries'],d=''.join(commands)))
s=re.sub(r'const nationalRegions=\[.*?\];','const nationalRegions='+json.dumps(national,ensure_ascii=False,separators=(',',':'))+';',s)
s=re.sub(r'const nations=\{.*?\};function regionFor','const nations='+json.dumps(config['nations'],ensure_ascii=False,separators=(',',':'))+';function regionFor',s)
s=s.replace('const key=t.id.split("_")[0];','if(t.arcadeRegion)return t.arcadeRegion;const key=t.id.split("_")[0];')
s=s.replace('category==="national"?nationalRegions:regions','category==="national"?nationalRegions:[...regions,...nationalRegions.filter(r=>!r.id.startsWith("n-a")&&!r.id.startsWith("n-b")&&!r.id.startsWith("n-c"))]') # n-africa begins n-a! use explicit IDs below
s=s.replace('!r.id.startsWith("n-a")&&!r.id.startsWith("n-b")&&!r.id.startsWith("n-c")','!["n-a","n-b","n-c"].includes(r.id)')
q=p.with_suffix('.atomic');q.write_text(s);q.replace(p);Path('arcade/assets/national-map-config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
print('Added',len(clubs),'clubs and',len(nations),'nations')
