#!/usr/bin/env python3
"""Régénère site/data.js depuis tycoon-tools.com (source de vérité communautaire).

Usage :
    python3 tools/update-gamedata.py            # télécharge, parse, réécrit site/data.js
    python3 tools/update-gamedata.py --check    # vérifie sans réécrire (sortie 1 si écart)

Après exécution, relire le diff (`git diff site/data.js`) avant de commiter :
- un nouveau droïde inconnu fait échouer le script (ajouter son id dans NAME2ID
  et DISPLAY ci-dessous, puis relancer) ;
- un changement d'exigences/valeurs apparaît proprement dans le diff.

Source validée le 11/07/2026 : le cycle 1 (RB 1-23) correspondait 23/23 à nos
données vérifiées en jeu réel. Penser à incrémenter APP_VERSION (site/version.js)
et à compléter CHANGELOG.md après toute mise à jour.
"""
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

BASE = 'https://tycoon-tools.com/droid-tycoon'
OUT = Path(__file__).resolve().parent.parent / 'site' / 'data.js'
UA = {'User-Agent': 'Mozilla/5.0 (droidex data updater; +https://github.com/n4ckz/droidex)'}

# ---------- mapping nom tycoon-tools -> id droidex ----------
NAME2ID = {
 'LOADLIFTER':'loadlifter','MO-TRAK':'motrak','KX':'kx','LEP':'lep','TRI-TEK':'tritek',
 'RIC-1200':'ric1200','DRFT-R':'drftr','IG':'ig','RIC':'ric','SNOW MOUSE':'snowmouse',
 'CYCLENS':'cyclens','MONO-WLKR':'monowlkr','R7':'r7','OPTI-STRK':'optistrk','B2-RP':'b2rp',
 'BB9':'bb9','CYCLO-GRAV':'cyclograv','MECHA-DROID':'mechadroid','PROTO-ROLLER':'protoroller',
 'GUNRUNNER':'gunrunner','B1 HEAVY':'b1heavy','AMP WALKER':'amp','STRIKE-ORB':'strikeorb',
 'SEN-TRI':'sentri','B2 HEAVY':'b2heavy','LNG-SHOT':'lngshot','B2 SUPER':'b2super',
 'OPTI-POD':'optipod','R2':'r2','TRAK-R':'trakr','R6':'r6','HAUL-R':'haulr','LO':'lo',
 'UTIL-TEC':'utiltec','ORB-WALKER':'orbwalker','BB':'bb','GROUNDMECH':'groundmech',
 'B1 SECURITY':'b1sec','HOV-R':'hovr','BU-4D':'bu4d','R9':'r9','R4':'r4',
 'SENATE HOVERCAM':'senate','ARG':'arg','A-LT':'alt','ROLL-R':'rollr','VECT-ARM':'vectarm',
 'BAL-CORE':'balcore','NAV-EX':'navex','2BB':'2bb','BDX EXPLORER':'bdx',
 'IMPERIAL PROBE':'improbe','B1 BATTLE':'b1battle','GONK':'gonk','R8':'r8','ID10':'id10',
 'CB':'cb','R3':'r3','R5':'r5','DRK-1 PROBE':'drk1','MOUSE':'mouse','PIT':'pit',
 'BB8':'bb8','MISTER BONES':'misterbones','IG-11 MARSHAL':'ig11','DJ-R3X':'djr3x',
 'CB-23':'cb23','R2-D2':'r2d2',
}
# noms d'affichage droidex (conservés tels quels dans l'interface)
DISPLAY = {
 'mouse':'Mouse','pit':'Pit','gonk':'Gonk','cb':'CB','cb23':'CB-23','r3':'R3','r5':'R5','r8':'R8',
 'improbe':'Imperial Probe','b1battle':'B1 Battle','drk1':'DRK-1 Probe','id10':'ID10',
 'bdx':'BDX Explorer','arg':'ARG','senate':'Senate Hovercam','bu4d':'BU-4D','balcore':'Bal-Core',
 'rollr':'ROLL-R','2bb':'2BB','alt':'A-LT','r4':'R4','r9':'R9','b1sec':'B1 Security','navex':'NAV-EX',
 'vectarm':'VECT-Arm','hovr':'HOV-R','groundmech':'Groundmech','lo':'LO','amp':'AMP Walker',
 'sentri':'SEN-TRI','optipod':'Opti-Pod','gunrunner':'Gunrunner','bb':'BB','r2':'R2','r6':'R6',
 'trakr':'TRAK-R','orbwalker':'ORB-Walker','utiltec':'Util-Tec (Ulti-Tech)','b1heavy':'B1 Heavy',
 'b2super':'B2 Super','b2heavy':'B2 Heavy','strikeorb':'Strike-Orb','haulr':'Haul-R','lngshot':'LNG-Shot',
 'protoroller':'Proto-Roller','mechadroid':'Mecha-Droid','monowlkr':'Mono-WLKR','bb9':'BB9','r7':'R7',
 'b2rp':'B2-RP','cyclograv':'Cyclo-Grav','optistrk':'Opti-STRK','snowmouse':'Snow Mouse','ric':'RIC',
 'ric1200':'RIC-1200','lep':'LEP','loadlifter':'Loadlifter','motrak':'MO-TRAK','tritek':'TRI-TEK',
 'cyclens':'CYCLENS','drftr':'DRFT-R','kx':'KX','ig':'IG','bb8':'BB-8','misterbones':'Mister Bones',
 'ig11':'IG-11 Marshal','djr3x':'DJ R-3X','r2d2':'R2-D2',
}
TIER_WORDS = {'BASE': 0, 'GOLD': 1, 'DIAMOND': 2, 'RAINBOW': 3, 'BESKAR': 4}
RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Iconic']
TYPE_ORDER = {'Worker': 0, 'Astromech': 1, 'Battle': 2}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def cells_of(row):
    cs = [html.unescape(re.sub(r'<[^>]+>', ' ', c)).strip()
          for c in re.findall(r'<t[dh].*?</t[dh]>', row, re.S)]
    return [re.sub(r'\s+', ' ', c).replace('● ', '') for c in cs]


def tables_of(raw):
    return re.findall(r'<table.*?</table>', raw, re.S)


def parse_income(s):
    s = s.strip()
    if s in ('—', '', '-') or '%' in s:
        return None
    m = re.match(r'([\d.]+)(K?)/s', s)
    if not m:
        raise ValueError(f'revenu illisible : {s!r}')
    v = float(m.group(1)) * (1000 if m.group(2) == 'K' else 1)
    return int(v) if v == int(v) else v


def parse_values():
    raw = fetch(f'{BASE}/value-list/')
    vals = {}
    for r in re.findall(r'<tr.*?</tr>', tables_of(raw)[0], re.S)[1:]:
        c = cells_of(r)
        if c[0] not in NAME2ID:
            sys.exit(f'✗ Droïde inconnu dans la value list : {c[0]!r} — '
                     f'ajouter son id dans NAME2ID/DISPLAY puis relancer.')
        vals[NAME2ID[c[0]]] = {
            'rarity': c[1].capitalize(), 'type': c[2].capitalize(),
            'perk': None if c[3] in ('—', '') else c[3],
            'inc': [parse_income(x) for x in c[4:9]],
            'beskarCost': None if c[9] in ('—', '') else c[9],
        }
    return vals


def parse_rebirths():
    raw = fetch(f'{BASE}/rebirth-requirements/')
    rebirths, unlocks, credits = {}, {}, {}
    for ci, t in enumerate(tables_of(raw), start=1):
        cyc = {}
        for r in re.findall(r'<tr.*?</tr>', t, re.S)[1:]:
            c = cells_of(r)
            rb = int(c[0].split('→')[1].strip())
            credits[rb] = re.sub(r'\.00([MBT])', r'\1', c[1]).replace('.50', '.5')
            if ci == 1 and c[2] not in ('—', ''):
                unlocks[rb] = c[2].title()
            toks, reqs, i = c[3].split(), [], 0
            while i < len(toks):
                tier = TIER_WORDS[toks[i]]; i += 1
                name = []
                while i < len(toks) and toks[i] not in TIER_WORDS:
                    name.append(toks[i]); i += 1
                key = ' '.join(name)
                if key not in NAME2ID:
                    sys.exit(f'✗ Droïde inconnu dans les renaissances : {key!r} (cycle {ci}, RB {rb})')
                reqs.append([NAME2ID[key], tier])
            assert len(reqs) == 3, (ci, rb, reqs)
            cyc[rb] = reqs
        rebirths[ci] = cyc
    return rebirths, unlocks, credits


def js_num(v):
    return str(int(v)) if float(v).is_integer() else str(v)


# Les chaînes venant du site distant finissent dans du JavaScript exécuté par
# tous les visiteurs : liste blanche stricte, tout caractère inattendu arrête net.
SAFE_STR = re.compile(r"^[A-Za-z0-9 ×%+./-]+$")


def js_str(s, origin):
    if not SAFE_STR.match(s):
        sys.exit(f'✗ Chaîne suspecte depuis tycoon-tools ({origin}) : {s!r} — '
                 f'vérifier le site source avant de régénérer.')
    return f"'{s}'"


def droid_line(did, vals):
    v = vals[did]
    parts = [f"id:'{did}'", f"n:'{DISPLAY[did]}'",
             f"t:{js_str(v['type'], did + '.type')}", f"r:{js_str(v['rarity'], did + '.rarity')}"]
    if v['rarity'] == 'Iconic':
        parts.append('iconic:true')
    else:
        parts.append('inc:[' + ','.join(js_num(x) for x in v['inc']) + ']')
        parts.append(f"bskCost:{js_str(v['beskarCost'], did + '.beskarCost')}")
    if v['perk']:
        parts.append(f"perk:{js_str(v['perk'], did + '.perk')}")
    return ' {' + ','.join(parts) + '},'


def generate(vals, rebirths, unlocks, credits, checked_date):
    L = []
    L.append(f"""/* =========================================================================
   DONNÉES DE JEU — Star Wars: Droid Tycoon (Fortnite, FOAD/Blzn Studios)
   =========================================================================
   Ce fichier est GÉNÉRÉ par tools/update-gamedata.py — ne pas éditer à la
   main : relancer le script puis relire le diff.

   Sources communautaires (recoupées le {checked_date}) :
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

const DROIDS = [""")
    for rar in RARITY_ORDER:
        ids = [d for d in DISPLAY if vals[d]['rarity'] == rar]
        ids.sort(key=lambda d: (TYPE_ORDER[vals[d]['type']],
                                -(vals[d]['inc'][0] or 0) if vals[d]['inc'] else 0, DISPLAY[d]))
        L.append(f' /* {rar} */')
        L.extend(droid_line(d, vals) for d in ids)
    L.append('];')
    L.append('')
    L.append('/* Crédits requis par renaissance (identiques pour les 4 cycles) */')
    L.append('const RB_CREDITS = {' + ','.join(f"{k}:{js_str(credits[k], f'credits[{k}]')}" for k in sorted(credits)) + '};')
    L.append('')
    L.append("""/* Exigences de renaissance : REBIRTHS[cycle][niveau] = [[idDroïde, variante] ×3]
   Une variante supérieure valide toujours l'exigence. Après la renaissance 27
   (ou dès la 12 en « super-renaissance »), on passe au cycle suivant (4 → 1). */
const REBIRTHS = {""")
    for cyc in sorted(rebirths):
        L.append(f' {cyc}: {{')
        for rb in sorted(rebirths[cyc]):
            reqstr = ','.join(f"['{d}',{t}]" for d, t in rebirths[cyc][rb])
            L.append(f'  {rb}:[{reqstr}],')
        L.append(' },')
    L.append('};')
    L.append('')
    L.append('/* Emplacements débloqués (cycle 1 uniquement) */')
    L.append('const RB_UNLOCKS = {' + ','.join(f"{k}:{js_str(unlocks[k], f'unlocks[{k}]')}" for k in sorted(unlocks)) + '};')
    L.append('')
    L.append("const RARITY_ORDER = ['Common','Rare','Epic','Legendary','Mythic','Iconic'];")
    L.append('')
    return '\n'.join(L)


def main():
    check = '--check' in sys.argv
    print('Téléchargement de tycoon-tools…')
    vals = parse_values()
    rebirths, unlocks, credits = parse_rebirths()
    print(f'  {len(vals)} droïdes · {len(rebirths)} cycles × {len(rebirths[1])} renaissances')

    # la date de recoupage n'est réécrite que si le contenu change
    current = OUT.read_text() if OUT.exists() else ''
    m = re.search(r'recoupées le (\d{2}/\d{2}/\d{4})', current)
    old_date = m.group(1) if m else '11/07/2026'
    unchanged = generate(vals, rebirths, unlocks, credits, old_date) == current

    if unchanged:
        print('✓ site/data.js est déjà à jour — aucun changement côté jeu.')
        return
    if check:
        print('✗ Écart détecté entre tycoon-tools et site/data.js — relancer sans --check pour régénérer.')
        sys.exit(1)
    import datetime
    today = datetime.date.today().strftime('%d/%m/%Y')
    OUT.write_text(generate(vals, rebirths, unlocks, credits, today))
    print(f'✓ site/data.js régénéré (recoupé le {today}).')
    print('  Relire le diff :  git diff site/data.js')
    print('  Puis : incrémenter APP_VERSION (site/version.js), compléter CHANGELOG.md,')
    print('  relancer les tests (cd tests && npm test).')


if __name__ == '__main__':
    main()
