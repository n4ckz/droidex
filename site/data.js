/* =========================================================================
   DONNÉES DE JEU — Star Wars: Droid Tycoon (Fortnite, FOAD/Blzn Studios)
   =========================================================================
   Ce fichier isole toutes les données susceptibles d'évoluer avec les
   mises à jour du jeu. Pour ajouter un droïde ou corriger une exigence de
   renaissance, ne modifier QUE ce fichier.

   Sources communautaires (recoupées le 11/07/2026) :
   - Exigences de renaissance (4 cycles × 27) et value list :
     https://tycoon-tools.com/droid-tycoon/ — le cycle 1 (RB 1-23) a été
     vérifié identique à nos données validées en jeu réel
   - Droidex : https://insider-gaming.com/fortnite-star-wars-droid-tycoon-droidex-all-droids/
   - Wiki : https://star-wars-droid-tycoon.fandom.com/wiki/
   - Événements / Iconiques : https://droidtycoonguide.com/events/

   inc: revenus crédits/s par variante [Basic, Or, Diamant, Arc-en-ciel, Beskar]
   bskCost: coût de l'amélioration Beskar ; perk: bonus passif (termes du jeu)
   Les Iconiques rapportent +15%/s (pas de variantes).
   ========================================================================= */

/* Les libellés de variantes et de raretés (dépendants de la langue) sont dans i18n.js.
   Index des variantes : 0=Basic, 1=Or/Gold, 2=Diamant/Diamond, 3=Arc-en-ciel/Rainbow, 4=Beskar. */

const DROIDS = [
 /* Common */
 {id:'gonk',n:'Gonk',t:'Worker',r:'Common',inc:[4,8,16,32,48],bskCost:'48K',perk:'10% craft speed'},
 {id:'mouse',n:'Mouse',t:'Worker',r:'Common',inc:[2,4,8,16,24],bskCost:'15.2K',perk:'10% craft speed'},
 {id:'pit',n:'Pit',t:'Worker',r:'Common',inc:[2,4,8,16,24],bskCost:'17.6K',perk:'10% craft speed'},
 {id:'r8',n:'R8',t:'Astromech',r:'Common',inc:[4,8,16,32,48],bskCost:'48K',perk:'+1 pickaxe'},
 {id:'cb',n:'CB',t:'Astromech',r:'Common',inc:[3,6,12,24,36],bskCost:'32K',perk:'+1 pickaxe'},
 {id:'r3',n:'R3',t:'Astromech',r:'Common',inc:[3,6,12,24,36],bskCost:'32K',perk:'+1 pickaxe'},
 {id:'r5',n:'R5',t:'Astromech',r:'Common',inc:[3,6,12,24,36],bskCost:'32K',perk:'+1 pickaxe'},
 {id:'improbe',n:'Imperial Probe',t:'Battle',r:'Common',inc:[6,12,24,48,72],bskCost:'80K',perk:'+20 max HP'},
 {id:'b1battle',n:'B1 Battle',t:'Battle',r:'Common',inc:[5,10,20,40,60],bskCost:'64K',perk:'+20 max HP'},
 {id:'id10',n:'ID10',t:'Battle',r:'Common',inc:[4,8,16,32,48],bskCost:'64K',perk:'+20 max HP'},
 {id:'drk1',n:'DRK-1 Probe',t:'Battle',r:'Common',inc:[3,6,12,24,36],bskCost:'48K',perk:'+20 max HP'},
 /* Rare */
 {id:'bu4d',n:'BU-4D',t:'Worker',r:'Rare',inc:[58,116,232,464,696],bskCost:'2.08M',perk:'15% craft speed'},
 {id:'senate',n:'Senate Hovercam',t:'Worker',r:'Rare',inc:[46,92,184,368,552],bskCost:'1.6M',perk:'15% craft speed'},
 {id:'arg',n:'ARG',t:'Worker',r:'Rare',inc:[42,84,168,336,504],bskCost:'1.41M',perk:'15% craft speed'},
 {id:'rollr',n:'ROLL-R',t:'Worker',r:'Rare',inc:[31,62,124,248,372],bskCost:'992K',perk:'15% craft speed'},
 {id:'balcore',n:'Bal-Core',t:'Worker',r:'Rare',inc:[23,46,92,184,276],bskCost:'688K',perk:'15% craft speed'},
 {id:'bdx',n:'BDX Explorer',t:'Worker',r:'Rare',inc:[15,30,60,120,180],bskCost:'400K',perk:'15% craft speed'},
 {id:'r9',n:'R9',t:'Astromech',r:'Rare',inc:[54,108,216,432,648],bskCost:'1.92M',perk:'+2 pickaxe'},
 {id:'r4',n:'R4',t:'Astromech',r:'Rare',inc:[50,100,200,400,600],bskCost:'1.76M',perk:'+2 pickaxe'},
 {id:'alt',n:'A-LT',t:'Astromech',r:'Rare',inc:[36,72,144,288,432],bskCost:'1.18M',perk:'+2 pickaxe'},
 {id:'2bb',n:'2BB',t:'Astromech',r:'Rare',inc:[17,34,68,136,204],bskCost:'480K',perk:'+2 pickaxe'},
 {id:'b1sec',n:'B1 Security',t:'Battle',r:'Rare',inc:[66,132,264,528,792],bskCost:'2.4M',perk:'+40 max HP'},
 {id:'hovr',n:'HOV-R',t:'Battle',r:'Rare',inc:[62,124,248,496,774],bskCost:'2.24M',perk:'+40 max HP'},
 {id:'vectarm',n:'VECT-Arm',t:'Battle',r:'Rare',inc:[27,54,108,216,324],bskCost:'832K',perk:'+40 max HP'},
 {id:'navex',n:'NAV-EX',t:'Battle',r:'Rare',inc:[18,36,72,144,216],bskCost:'576K',perk:'+40 max HP'},
 /* Epic */
 {id:'gunrunner',n:'Gunrunner',t:'Worker',r:'Epic',inc:[660,1300,2600,5300,22400],bskCost:'787.5M',perk:'20% craft speed'},
 {id:'amp',n:'AMP Walker',t:'Worker',r:'Epic',inc:[570,1100,2300,4600,19400],bskCost:'675M',perk:'20% craft speed'},
 {id:'sentri',n:'SEN-TRI',t:'Worker',r:'Epic',inc:[510,1000,2000,4100,17300],bskCost:'600M',perk:'20% craft speed'},
 {id:'optipod',n:'Opti-Pod',t:'Worker',r:'Epic',inc:[390,780,1600,3100,13300],bskCost:'450M',perk:'20% craft speed'},
 {id:'lo',n:'LO',t:'Worker',r:'Epic',inc:[240,480,960,1900,8200],bskCost:'262.5M',perk:'20% craft speed'},
 {id:'groundmech',n:'Groundmech',t:'Worker',r:'Epic',inc:[120,240,480,960,4100],bskCost:'112.5M',perk:'20% craft speed'},
 {id:'r2',n:'R2',t:'Astromech',r:'Epic',inc:[360,720,1400,2900,12200],bskCost:'412.5M',perk:'+3 pickaxe'},
 {id:'trakr',n:'TRAK-R',t:'Astromech',r:'Epic',inc:[330,660,1300,2600,11200],bskCost:'375M',perk:'+3 pickaxe'},
 {id:'r6',n:'R6',t:'Astromech',r:'Epic',inc:[300,600,1200,2400,10200],bskCost:'337.5M',perk:'+3 pickaxe'},
 {id:'utiltec',n:'Util-Tec (Ulti-Tech)',t:'Astromech',r:'Epic',inc:[210,420,840,1700,7100],bskCost:'225M',perk:'+3 pickaxe'},
 {id:'orbwalker',n:'ORB-Walker',t:'Astromech',r:'Epic',inc:[180,360,720,1400,6100],bskCost:'187.5M',perk:'+3 pickaxe'},
 {id:'bb',n:'BB',t:'Astromech',r:'Epic',inc:[150,300,600,1200,5100],bskCost:'150M',perk:'+3 pickaxe'},
 {id:'b1heavy',n:'B1 Heavy',t:'Battle',r:'Epic',inc:[630,1300,2500,4800,20400],bskCost:'750M',perk:'+60 max HP'},
 {id:'strikeorb',n:'Strike-Orb',t:'Battle',r:'Epic',inc:[540,1100,2200,4300,18400],bskCost:'637.5M',perk:'+60 max HP'},
 {id:'b2heavy',n:'B2 Heavy',t:'Battle',r:'Epic',inc:[480,960,1900,3800,16300],bskCost:'562.5M',perk:'+60 max HP'},
 {id:'lngshot',n:'LNG-Shot',t:'Battle',r:'Epic',inc:[450,900,1800,3600,15300],bskCost:'525M',perk:'+60 max HP'},
 {id:'b2super',n:'B2 Super',t:'Battle',r:'Epic',inc:[420,840,1700,3400,14300],bskCost:'487.5M',perk:'+60 max HP'},
 {id:'haulr',n:'Haul-R',t:'Battle',r:'Epic',inc:[270,540,1100,2200,9200],bskCost:'300M',perk:'+60 max HP'},
 /* Legendary */
 {id:'monowlkr',n:'Mono-WLKR',t:'Worker',r:'Legendary',inc:[1500,3000,6000,12000,36000],bskCost:'14.8B',perk:'25% craft speed'},
 {id:'mechadroid',n:'Mecha-Droid',t:'Worker',r:'Legendary',inc:[1200,2500,5000,9900,29900],bskCost:'11.6B',perk:'25% craft speed'},
 {id:'protoroller',n:'Proto-Roller',t:'Worker',r:'Legendary',inc:[972,1900,3900,7800,23300],bskCost:'8.8B',perk:'25% craft speed'},
 {id:'r7',n:'R7',t:'Astromech',r:'Legendary',inc:[1500,3000,6000,12000,36000],bskCost:'14.8B',perk:'+4 pickaxe'},
 {id:'bb9',n:'BB9',t:'Astromech',r:'Legendary',inc:[1300,2600,5200,10400,31200],bskCost:'11.2B',perk:'+4 pickaxe'},
 {id:'optistrk',n:'Opti-STRK',t:'Battle',r:'Legendary',inc:[1500,3000,6000,12000,36000],bskCost:'14.8B',perk:'+80 max HP'},
 {id:'b2rp',n:'B2-RP',t:'Battle',r:'Legendary',inc:[1300,2600,5200,10400,31300],bskCost:'12.4B',perk:'+80 max HP'},
 {id:'cyclograv',n:'Cyclo-Grav',t:'Battle',r:'Legendary',inc:[1300,2500,5000,10100,30200],bskCost:'12B',perk:'+80 max HP'},
 /* Mythic */
 {id:'loadlifter',n:'Loadlifter',t:'Worker',r:'Mythic',inc:[7200,14400,28800,57600,115200],bskCost:'240B'},
 {id:'lep',n:'LEP',t:'Worker',r:'Mythic',inc:[6500,13000,26000,52000,104000],bskCost:'201.6B'},
 {id:'ric1200',n:'RIC-1200',t:'Worker',r:'Mythic',inc:[5800,11600,23200,46400,92800],bskCost:'182.4B'},
 {id:'ric',n:'RIC',t:'Worker',r:'Mythic',inc:[5100,10200,20400,40800,81600],bskCost:'163.2B'},
 {id:'snowmouse',n:'Snow Mouse',t:'Worker',r:'Mythic',inc:[4400,8800,17600,35200,70400],bskCost:'144B'},
 {id:'motrak',n:'MO-TRAK',t:'Astromech',r:'Mythic',inc:[7200,14400,28800,57600,115200],bskCost:'240B'},
 {id:'tritek',n:'TRI-TEK',t:'Astromech',r:'Mythic',inc:[6500,13000,26000,52000,104000],bskCost:'201.6B'},
 {id:'drftr',n:'DRFT-R',t:'Astromech',r:'Mythic',inc:[5800,11600,23200,46400,92800],bskCost:'182.4B'},
 {id:'cyclens',n:'CYCLENS',t:'Astromech',r:'Mythic',inc:[4400,8800,17600,35200,70400],bskCost:'144B'},
 {id:'kx',n:'KX',t:'Battle',r:'Mythic',inc:[7200,14400,28800,57600,115200],bskCost:'240B'},
 {id:'ig',n:'IG',t:'Battle',r:'Mythic',inc:[5800,11000,23200,46400,92800],bskCost:'182.4B'},
 /* Iconic */
 {id:'djr3x',n:'DJ R-3X',t:'Worker',r:'Iconic',iconic:true,perk:'2× world-quest rewards'},
 {id:'bb8',n:'BB-8',t:'Astromech',r:'Iconic',iconic:true,perk:'100% upgrade chips'},
 {id:'cb23',n:'CB-23',t:'Astromech',r:'Iconic',iconic:true,perk:'secret astromech mission'},
 {id:'r2d2',n:'R2-D2',t:'Astromech',r:'Iconic',iconic:true},
 {id:'ig11',n:'IG-11 Marshal',t:'Battle',r:'Iconic',iconic:true,perk:'blueprint shield'},
 {id:'misterbones',n:'Mister Bones',t:'Battle',r:'Iconic',iconic:true,perk:'×2 damage'},
];

/* Crédits requis par renaissance (identiques pour les 4 cycles) */
const RB_CREDITS = {1:'10K',2:'150K',3:'975K',4:'2.95M',5:'5.35M',6:'9.85M',7:'14.5M',8:'36M',9:'89M',10:'220M',11:'550M',12:'1.36B',13:'3.40B',14:'8.45B',15:'21B',16:'52B',17:'130B',18:'325B',19:'810B',20:'2T',21:'3T',22:'4.5T',23:'6T',24:'9T',25:'13.5T',26:'21T',27:'32T'};

/* Exigences de renaissance : REBIRTHS[cycle][niveau] = [[idDroïde, variante] ×3]
   Une variante supérieure valide toujours l'exigence. Après la renaissance 27
   (ou dès la 12 en « super-renaissance »), on passe au cycle suivant (4 → 1). */
const REBIRTHS = {
 1: {
  1:[['cb',0],['pit',0],['drk1',0]],
  2:[['bdx',0],['2bb',0],['balcore',0]],
  3:[['alt',0],['bu4d',0],['r9',1]],
  4:[['arg',1],['b1sec',1],['groundmech',0]],
  5:[['bu4d',1],['hovr',1],['r9',2]],
  6:[['alt',2],['arg',2],['groundmech',1]],
  7:[['bu4d',2],['b1sec',2],['bb',1]],
  8:[['hovr',2],['lo',1],['utiltec',1]],
  9:[['trakr',1],['r6',1],['groundmech',3]],
  10:[['strikeorb',1],['haulr',3],['lo',3]],
  11:[['amp',3],['b1heavy',3],['bb9',0]],
  12:[['protoroller',1],['mechadroid',0],['monowlkr',0]],
  13:[['r7',0],['cyclograv',0],['b2rp',0]],
  14:[['optistrk',0],['monowlkr',1],['mechadroid',1]],
  15:[['b2rp',1],['bb9',1],['r7',1]],
  16:[['optistrk',1],['monowlkr',2],['protoroller',2]],
  17:[['b2rp',2],['cyclograv',2],['mechadroid',2]],
  18:[['bb9',2],['r7',2],['monowlkr',3]],
  19:[['b2rp',3],['cyclograv',3],['protoroller',3]],
  20:[['r7',3],['optistrk',3],['mechadroid',3]],
  21:[['bb',4],['orbwalker',4],['groundmech',4]],
  22:[['amp',4],['b1heavy',4],['protoroller',4]],
  23:[['optistrk',4],['monowlkr',4],['r7',4]],
  24:[['bb9',4],['cyclograv',4],['motrak',0]],
  25:[['b2rp',4],['ig',0],['drftr',1]],
  26:[['cyclens',1],['loadlifter',2],['ric1200',3]],
  27:[['kx',2],['tritek',3],['snowmouse',4]],
 },
 2: {
  1:[['id10',0],['mouse',0],['gonk',0]],
  2:[['rollr',0],['senate',0],['navex',0]],
  3:[['r4',0],['vectarm',0],['bdx',1]],
  4:[['2bb',1],['balcore',1],['orbwalker',0]],
  5:[['r4',1],['vectarm',1],['navex',1]],
  6:[['gunrunner',0],['2bb',2],['balcore',2]],
  7:[['rollr',2],['bdx',2],['r2',1]],
  8:[['r4',2],['b2super',1],['gunrunner',1]],
  9:[['navex',3],['strikeorb',1],['amp',1]],
  10:[['vectarm',3],['r2',2],['b2super',2]],
  11:[['strikeorb',2],['b2heavy',2],['balcore',3]],
  12:[['orbwalker',3],['r2',3],['bb9',0]],
  13:[['b2super',3],['mechadroid',0],['protoroller',0]],
  14:[['b2heavy',3],['b2rp',0],['r7',1]],
  15:[['strikeorb',3],['bb9',1],['protoroller',1]],
  16:[['amp',3],['mechadroid',1],['b2rp',2]],
  17:[['optipod',3],['monowlkr',1],['r7',2]],
  18:[['utiltec',3],['bb9',2],['protoroller',2]],
  19:[['mechadroid',2],['r7',3],['b2rp',3]],
  20:[['monowlkr',3],['optistrk',3],['cyclograv',3]],
  21:[['lo',4],['r6',4],['haulr',4]],
  22:[['sentri',4],['strikeorb',4],['protoroller',4]],
  23:[['bb9',4],['cyclograv',4],['b2rp',4]],
  24:[['optistrk',4],['b2rp',4],['snowmouse',0]],
  25:[['monowlkr',4],['tritek',1],['ric1200',0]],
  26:[['kx',1],['drftr',2],['ig',3]],
  27:[['lep',2],['loadlifter',3],['motrak',4]],
 },
 3: {
  1:[['mouse',0],['pit',0],['gonk',0]],
  2:[['r3',0],['2bb',0],['senate',0]],
  3:[['r8',0],['r5',0],['r4',0]],
  4:[['b1battle',1],['r9',1],['b1sec',1]],
  5:[['r3',1],['2bb',1],['senate',1]],
  6:[['r5',2],['r4',2],['bdx',2]],
  7:[['r8',2],['b1battle',2],['r9',2]],
  8:[['r3',3],['b1sec',3],['2bb',3]],
  9:[['r5',3],['r4',3],['bdx',3]],
  10:[['senate',3],['groundmech',0],['trakr',0]],
  11:[['b2heavy',0],['b2super',0],['utiltec',0]],
  12:[['balcore',3],['groundmech',1],['trakr',1]],
  13:[['b2super',3],['mechadroid',0],['protoroller',0]],
  14:[['b2heavy',3],['b2rp',0],['r7',1]],
  15:[['strikeorb',3],['bb9',1],['protoroller',1]],
  16:[['amp',3],['mechadroid',1],['b2rp',2]],
  17:[['optipod',3],['monowlkr',1],['r7',2]],
  18:[['utiltec',3],['bb9',2],['protoroller',2]],
  19:[['mechadroid',2],['r7',3],['b2rp',3]],
  20:[['monowlkr',3],['optistrk',3],['cyclograv',3]],
  21:[['b2super',4],['optipod',4],['r2',4]],
  22:[['gunrunner',4],['lngshot',4],['b2rp',4]],
  23:[['monowlkr',4],['cyclograv',4],['mechadroid',4]],
  24:[['bb9',4],['b2rp',4],['ric',0]],
  25:[['protoroller',4],['loadlifter',0],['motrak',1]],
  26:[['lep',1],['tritek',2],['snowmouse',3]],
  27:[['ric1200',2],['ig',3],['drftr',4]],
 },
 4: {
  1:[['id10',0],['pit',0],['drk1',0]],
  2:[['r3',0],['2bb',0],['senate',0]],
  3:[['r5',1],['r8',1],['r4',0]],
  4:[['b1battle',1],['r9',1],['b1sec',1]],
  5:[['r3',1],['2bb',1],['senate',1]],
  6:[['r5',2],['r4',2],['bdx',2]],
  7:[['r8',2],['b1battle',2],['r9',2]],
  8:[['r3',3],['b1sec',3],['2bb',3]],
  9:[['r5',3],['r4',3],['bdx',3]],
  10:[['senate',3],['groundmech',0],['trakr',0]],
  11:[['b2heavy',0],['b2super',0],['utiltec',0]],
  12:[['balcore',3],['groundmech',1],['trakr',1]],
  13:[['b2super',3],['mechadroid',0],['protoroller',0]],
  14:[['balcore',2],['groundmech',2],['trakr',3]],
  15:[['b2heavy',2],['b2super',3],['b2rp',0]],
  16:[['utiltec',3],['bb9',0],['r7',1]],
  17:[['optistrk',0],['cyclograv',1],['mechadroid',1]],
  18:[['b2rp',1],['bb9',1],['r7',2]],
  19:[['mechadroid',2],['r7',3],['b2rp',3]],
  20:[['monowlkr',3],['optistrk',3],['cyclograv',3]],
  21:[['amp',4],['groundmech',4],['haulr',4]],
  22:[['gunrunner',4],['strikeorb',4],['b2super',4]],
  23:[['monowlkr',4],['cyclograv',4],['b2rp',4]],
  24:[['mechadroid',4],['protoroller',4],['motrak',0]],
  25:[['optistrk',4],['tritek',0],['drftr',1]],
  26:[['cyclens',1],['lep',2],['motrak',3]],
  27:[['ric1200',2],['snowmouse',3],['loadlifter',4]],
 },
};

/* Emplacements débloqués (cycle 1 uniquement) */
const RB_UNLOCKS = {1:'Worker Slot',2:'Astromech Slot',3:'Battle Slot',4:'Worker Slot',5:'Astromech Slot',6:'Battle Slot',7:'Worker Slot',8:'Astromech Slot',9:'Battle Slot',10:'Worker Slot',11:'Astromech Slot',12:'Worker Slot',13:'Astromech Slot',14:'Worker Slot',15:'Astromech Slot',16:'Worker Slot',17:'Lounge Slot',18:'Lounge Slot',19:'Lounge Slot',20:'Lounge Slot'};

const RARITY_ORDER = ['Common','Rare','Epic','Legendary','Mythic','Iconic'];
