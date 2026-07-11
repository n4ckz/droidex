/* =========================================================================
   DONNÉES DE JEU — Star Wars: Droid Tycoon (Fortnite, FOAD/Blzn Studios)
   =========================================================================
   Ce fichier isole toutes les données susceptibles d'évoluer avec les
   mises à jour du jeu. Pour ajouter un droïde ou corriger une exigence de
   renaissance, ne modifier QUE ce fichier.

   Sources communautaires :
   - Droidex complet : https://insider-gaming.com/fortnite-star-wars-droid-tycoon-droidex-all-droids/
   - Renaissances 1–23 : https://star-wars-droid-tycoon.fandom.com/wiki/Rebirths
   - Mythiques : https://www.fdaytalk.com/fortnite-droid-tycoon-mythic-droids/
   - Événements / Iconiques : https://droidtycoonguide.com/events/
   ========================================================================= */

/* Les libellés de variantes et de raretés (dépendants de la langue) sont dans i18n.js.
   Index des variantes : 0=Basic, 1=Or/Gold, 2=Diamant/Diamond, 3=Arc-en-ciel/Rainbow, 4=Beskar. */

/* reqs: [rebirthLevel, tierIndex] — une variante supérieure valide l'exigence */
const DROIDS = [
 /* Common */
 {id:'mouse',n:'Mouse',t:'Worker',r:'Common'},
 {id:'pit',n:'Pit',t:'Worker',r:'Common',reqs:[[1,0]]},
 {id:'gonk',n:'Gonk',t:'Worker',r:'Common'},
 {id:'cb',n:'CB',t:'Astromech',r:'Common',reqs:[[1,0]]},
 {id:'cb23',n:'CB-23',t:'Astromech',r:'Common'},
 {id:'r3',n:'R3',t:'Astromech',r:'Common'},
 {id:'r5',n:'R5',t:'Astromech',r:'Common'},
 {id:'r8',n:'R8',t:'Astromech',r:'Common'},
 {id:'improbe',n:'Imperial Probe',t:'Battle',r:'Common'},
 {id:'b1battle',n:'B1 Battle',t:'Battle',r:'Common'},
 {id:'drk1',n:'DRK-1 Probe',t:'Battle',r:'Common',reqs:[[1,0]]},
 {id:'id10',n:'ID10',t:'Battle',r:'Common'},
 /* Rare */
 {id:'bdx',n:'BDX Explorer',t:'Worker',r:'Rare',reqs:[[2,0]]},
 {id:'arg',n:'ARG',t:'Worker',r:'Rare',reqs:[[4,1],[6,2]]},
 {id:'senate',n:'Senate Hovercam',t:'Worker',r:'Rare'},
 {id:'bu4d',n:'BU-4D',t:'Worker',r:'Rare',reqs:[[3,0],[5,1],[7,2]]},
 {id:'balcore',n:'Bal-Core',t:'Worker',r:'Rare',reqs:[[2,0]]},
 {id:'rollr',n:'ROLL-R',t:'Worker',r:'Rare'},
 {id:'2bb',n:'2BB',t:'Astromech',r:'Rare',reqs:[[2,0]]},
 {id:'alt',n:'A-LT',t:'Astromech',r:'Rare',reqs:[[3,0],[6,2]]},
 {id:'r4',n:'R4',t:'Astromech',r:'Rare'},
 {id:'r9',n:'R9',t:'Astromech',r:'Rare',reqs:[[3,1],[5,2]]},
 {id:'b1sec',n:'B1 Security',t:'Battle',r:'Rare',reqs:[[4,1],[7,2]]},
 {id:'navex',n:'NAV-EX',t:'Battle',r:'Rare'},
 {id:'vectarm',n:'VECT-Arm',t:'Battle',r:'Rare'},
 {id:'hovr',n:'HOV-R',t:'Battle',r:'Rare',reqs:[[5,1],[8,2]]},
 /* Epic */
 {id:'groundmech',n:'Groundmech',t:'Worker',r:'Epic',reqs:[[4,0],[6,1],[9,3],[21,4]]},
 {id:'lo',n:'LO',t:'Worker',r:'Epic',reqs:[[8,1],[10,3]]},
 {id:'amp',n:'AMP Walker',t:'Worker',r:'Epic',reqs:[[11,3],[22,4]]},
 {id:'sentri',n:'SEN-TRI',t:'Worker',r:'Epic'},
 {id:'optipod',n:'Opti-Pod',t:'Worker',r:'Epic'},
 {id:'gunrunner',n:'Gunrunner',t:'Worker',r:'Epic'},
 {id:'bb',n:'BB',t:'Astromech',r:'Epic',reqs:[[7,1],[21,4]]},
 {id:'r2',n:'R2',t:'Astromech',r:'Epic'},
 {id:'r6',n:'R6',t:'Astromech',r:'Epic',reqs:[[9,1]]},
 {id:'trakr',n:'TRAK-R',t:'Astromech',r:'Epic',reqs:[[9,1]]},
 {id:'orbwalker',n:'ORB-Walker',t:'Astromech',r:'Epic',reqs:[[21,4]]},
 {id:'utiltec',n:'Util-Tec (Ulti-Tech)',t:'Astromech',r:'Epic',reqs:[[8,1]]},
 {id:'b1heavy',n:'B1 Heavy',t:'Battle',r:'Epic',reqs:[[11,3],[22,4]]},
 {id:'b2super',n:'B2 Super',t:'Battle',r:'Epic'},
 {id:'b2heavy',n:'B2 Heavy',t:'Battle',r:'Epic'},
 {id:'strikeorb',n:'Strike-Orb',t:'Battle',r:'Epic',reqs:[[10,1]]},
 {id:'haulr',n:'Haul-R',t:'Battle',r:'Epic',reqs:[[10,3]]},
 {id:'lngshot',n:'LNG-Shot',t:'Battle',r:'Epic'},
 {id:'protoroller',n:'Proto-Roller',t:'Battle',r:'Epic',reqs:[[12,1],[16,2],[19,3],[22,4]]},
 /* Legendary */
 {id:'mechadroid',n:'Mecha-Droid',t:'Worker',r:'Legendary',reqs:[[12,0],[14,1],[17,2],[20,3]]},
 {id:'monowlkr',n:'Mono-WLKR',t:'Worker',r:'Legendary',reqs:[[12,0],[14,1],[16,2],[18,3],[23,4]]},
 {id:'bb9',n:'BB9',t:'Astromech',r:'Legendary',reqs:[[11,0],[15,1],[18,2]]},
 {id:'r7',n:'R7',t:'Astromech',r:'Legendary',reqs:[[13,0],[15,1],[18,2],[20,3],[23,4]]},
 {id:'b2rp',n:'B2-RP',t:'Battle',r:'Legendary',reqs:[[13,0],[15,1],[17,2],[19,3]]},
 {id:'cyclograv',n:'Cyclo-Grav',t:'Battle',r:'Legendary',reqs:[[13,0],[17,2],[19,3]]},
 {id:'optistrk',n:'Opti-STRK',t:'Battle',r:'Legendary',reqs:[[14,0],[16,1],[20,3],[23,4]]},
 /* Mythic — uniquement au Sandcrawler, 5 variantes */
 {id:'snowmouse',n:'Snow Mouse',t:'Worker',r:'Mythic'},
 {id:'ric',n:'RIC',t:'Worker',r:'Mythic'},
 {id:'ric1200',n:'RIC-1200',t:'Worker',r:'Mythic'},
 {id:'lep',n:'LEP',t:'Worker',r:'Mythic'},
 {id:'loadlifter',n:'Loadlifter',t:'Worker',r:'Mythic'},
 {id:'motrak',n:'MO-TRAK',t:'Astromech',r:'Mythic'},
 {id:'tritek',n:'TRI-TEK',t:'Astromech',r:'Mythic'},
 {id:'cyclens',n:'CYCLENS',t:'Astromech',r:'Mythic'},
 {id:'drftr',n:'DRFT-R',t:'Battle',r:'Mythic'},
 {id:'kx',n:'KX',t:'Battle',r:'Mythic'},
 {id:'ig',n:'IG',t:'Battle',r:'Mythic'},
 /* Iconic — droïdes d'événement, pas de variantes, possédé ou non */
 {id:'bb8',n:'BB-8',t:'Astromech',r:'Iconic',iconic:true},
 {id:'misterbones',n:'Mister Bones',t:'Battle',r:'Iconic',iconic:true},
 {id:'ig11',n:'IG-11 Marshal',t:'Battle',r:'Iconic',iconic:true},
 {id:'djr3x',n:'DJ R-3X',t:'Astromech',r:'Iconic',iconic:true},
 {id:'r2d2',n:'R2-D2',t:'Astromech',r:'Iconic',iconic:true},
];

const RB_CREDITS = {1:'10K',2:'150K',3:'975K',4:'2,95M',5:'5,35M',6:'9,85M',7:'14,5M',8:'36M',
 9:'89M',10:'220M',11:'550M',12:'1,36B',13:'3,40B',14:'8,45B',15:'21B',16:'52B',17:'130B',
 18:'325B',19:'810B',20:'2T',21:'3T',22:'4,5T',23:'6T'};

const RARITY_ORDER = ['Common','Rare','Epic','Legendary','Mythic','Iconic'];
