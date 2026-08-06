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
import urllib.parse
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
 'BB8':'bb8','BB-8':'bb8','MISTER BONES':'misterbones','IG-11 MARSHAL':'ig11','DJ-R3X':'djr3x',
 'CB-23':'cb23','R2-D2':'r2d2','C-3PO':'c3po','C-3P0':'c3po',
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
 'ig11':'IG-11 Marshal','djr3x':'DJ R-3X','r2d2':'R2-D2','c3po':'C-3PO',
}
TIER_WORDS = {'BASE': 0, 'GOLD': 1, 'DIAMOND': 2, 'RAINBOW': 3, 'BESKAR': 4, 'GALACTIC': 5}
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
            'inc': [parse_income(x) for x in c[4:10]],
            'beskarCost': None if c[10] in ('—', '') else c[10],
        }
    return vals


# « Coût par variante » : seconde source, sous contrôle.
#
# tycoon-tools donne les revenus des six variantes mais un seul coût, celui du
# Beskar (colonne « Beskar Cost », vérifié le 29/07/2026). Or les joueurs
# cherchent le prix de CHAQUE palier. Le wiki dédié le publie, un onglet par
# variante, pour les 62 droïdes standard : il est source de données pour ce
# seul champ. Ses tables étant saisies à la main (3 de ses coûts Beskar étaient
# faux ce jour-là), chaque valeur est confrontée au multiple attendu de sa
# rareté avant d'être publiée.
WIKI_API = 'https://star-wars-droid-tycoon.fandom.com/api.php'
WIKI_TABS = ['Base', 'Gold', 'Diamond', 'Rainbow', 'Beskar', 'Galactic']
# graphies du wiki qui diffèrent de celles de tycoon-tools
WIKI_ALIAS = {'MONO-WALKER': 'monowlkr', 'OPTI-STRIKE': 'optistrk',
              'UTIL-TECH': 'utiltec', 'TRI-TREK': 'tritek', 'B-U4D': 'bu4d'}


def parse_variant_costs():
    """{id: [coût Basic … coût Galactique]} d'après la page Droidex du wiki
    (« Droiddex » jusqu'au 03/08/2026 — redirects=1 absorbe les renommages)."""
    qs = urllib.parse.urlencode({'action': 'query', 'prop': 'revisions', 'titles': 'Droiddex',
                                 'rvprop': 'content', 'rvslots': 'main', 'format': 'json',
                                 'redirects': 1})
    page = json.loads(fetch(f'{WIKI_API}?{qs}'))['query']['pages']
    text = next(iter(page.values()))['revisions'][0]['slots']['main']['*']
    parts = re.split(r'\n\|-\|\s*([A-Za-z ]+)=', text)
    chunks = {'Base': parts[0]}
    for i in range(1, len(parts) - 1, 2):
        chunks[parts[i].strip()] = parts[i + 1]
    costs = {}
    for idx, tab in enumerate(WIKI_TABS):
        for m in re.finditer(r'\|\s*\[\[([^\]|]+?)\]\]\s*\|\|\s*\{\{Official:Rarity\|\w+\}\}(.*)',
                             chunks.get(tab, '')):
            name = m.group(1).strip().upper()
            did = NAME2ID.get(name) or WIKI_ALIAS.get(name)
            cells = [c.strip().strip('|').strip() for c in m.group(2).split('||')]
            if not did or len(cells) < 3:
                continue
            # « 1.41t » chez eux, « 1.41T » chez tycoon-tools
            cost = re.sub(r'([kmbt])$', lambda x: x.group(1).upper(), cells[2].replace(',', '').strip())
            if re.fullmatch(r'[\d.]+[KMBT]?', cost):
                costs.setdefault(did, [None] * len(WIKI_TABS))[idx] = cost
    if not costs:
        # page restructurée ou vidée : mieux vaut déclencher le repli sur les
        # coûts déjà publiés que de régénérer un data.js amputé (vécu le
        # 04/08/2026, renommage Droiddex → Droidex)
        raise ValueError('0 coût parsé sur la page Droidex du wiki')
    return costs


def _amount(s):
    m = re.fullmatch(r'([\d.]+)([KMBT]?)', s or '')
    return float(m.group(1)) * {'': 1, 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12}[m.group(2)] if m else None


def check_variant_costs(vals, costs):
    """Écarte les coquilles du wiki. Dans le jeu, le coût d'une variante vaut un
    multiple FIXE du coût Beskar, propre à chaque couple (rareté, variante) —
    vérifié le 29/07/2026 sur les 62 droïdes : ×4 en Or, ×8 en Diamant et ×16 en
    Arc-en-ciel par rapport au Basic, puis des paliers propres à chaque rareté
    pour le Beskar et le Galactique. Le coût Beskar de tycoon-tools sert d'ancre.

    Seuil à 2 %, choisi sur la distribution réelle des écarts au multiple médian
    (29/07/2026) : 364 valeurs sur 371 tombent sous 0,5 %, deux à 1,27 % —
    l'arrondi à trois chiffres des deux sources —, puis plus rien avant 3,2 %.
    Au-delà, ce ne sont plus des arrondis mais de vraies divergences : Gold de
    cyclograv et b2rp, dont les coûts semblent intervertis d'une source à
    l'autre. Mieux vaut une cellule vide qu'un chiffre faux.

    Le coût Beskar n'est jamais pris ici : tycoon-tools, notre source
    principale, le publie déjà — c'est lui qui fait foi."""
    beskar = WIKI_TABS.index('Beskar')
    ratios = {}
    for did, series in costs.items():
        anchor = _amount(vals.get(did, {}).get('beskarCost'))
        if not anchor:
            continue
        for idx, cost in enumerate(series):
            value = _amount(cost)
            if value and idx != beskar:
                ratios.setdefault((vals[did]['rarity'], idx), []).append((did, value / anchor))
    kept, dropped = {}, 0
    for did in costs:
        if vals.get(did, {}).get('beskarCost'):
            kept.setdefault(did, [None] * len(WIKI_TABS))[beskar] = vals[did]['beskarCost']
    for (rarity, idx), pairs in ratios.items():
        ordered = sorted(r for _, r in pairs)
        median = ordered[len(ordered) // 2]
        for did, ratio in pairs:
            if abs(ratio - median) / median <= 0.02:
                kept.setdefault(did, [None] * len(WIKI_TABS))[idx] = costs[did][idx]
            else:
                dropped += 1
                print(f'  ⚠ coût {WIKI_TABS[idx]} écarté pour {did} : {costs[did][idx]} — '
                      f'{abs(ratio - median) / median * 100:.1f} % au-dessus/dessous du rapport '
                      f'au coût Beskar des {rarity} (coquille du wiki, ou les deux sources '
                      f'ne disent pas la même chose)')
    if dropped:
        print(f'  {dropped} valeur(s) écartée(s) au total')
    return kept


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
    if v is None:
        return 'null'
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
        if v.get('costs'):
            parts.append('cost:[' + ','.join(
                js_str(c, f'{did}.cost') if c else 'null' for c in v['costs']) + ']')
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
   - Exigences de renaissance (4 cycles × {len(rebirths[1])}) et value list :
     https://tycoon-tools.com/droid-tycoon/ — le cycle 1 (RB 1-23) a été
     vérifié identique à nos données validées en jeu réel
   - Droidex : https://insider-gaming.com/fortnite-star-wars-droid-tycoon-droidex-all-droids/
   - Wiki : https://star-wars-droid-tycoon.fandom.com/wiki/
   - Événements / Iconiques : https://droidtycoonguide.com/events/

   inc: revenus crédits/s par variante [Basic, Or, Diamant, Arc-en-ciel, Beskar, Galactique] (null = non documenté)
   bskCost: coût du droïde en Beskar (tycoon-tools)
   cost: coût du droïde dans chacune des 6 variantes, même ordre que inc —
   tycoon-tools ne publie que celui du Beskar, cette série est donc recoupée sur
   le wiki dédié (seul champ venu d'une autre source, et seulement si son
   rapport au coût Beskar est celui de son couple rareté/variante)
   perk: bonus passif (termes du jeu)
   Les Iconiques rapportent +15%/s (pas de variantes).
   ========================================================================= */

/* Les libellés de variantes et de raretés (dépendants de la langue) sont dans i18n.js.
   Index des variantes : 0=Basic, 1=Or/Gold, 2=Diamant/Diamond, 3=Arc-en-ciel/Rainbow, 4=Beskar, 5=Galactique/Galactic. */

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
    last_rb = max(rebirths[1])
    L.append(f"""/* Exigences de renaissance : REBIRTHS[cycle][niveau] = [[idDroïde, variante] ×3]
   Une variante supérieure valide toujours l'exigence. Après la renaissance {last_rb}
   (ou dès la 12 en « super-renaissance »), on passe au cycle suivant (4 → 1). */
const REBIRTHS = {{""")
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
    # C-3PO existe en jeu (boutique de cristaux Nova, constaté le 17/07/2026)
    # mais pas encore dans la value list tycoon-tools : injection statique tant
    # que la source est en retard. setdefault → la source primera dès qu'elle
    # le référencera (perk relevé en jeu par Julien le 18/07/2026).
    vals.setdefault('c3po', {'rarity': 'Iconic', 'type': 'Worker',
                             'perk': '+25% workers', 'inc': [None] * 6, 'beskarCost': None})
    # tycoon-tools liste désormais C-3P0 mais sans perk : le relevé en jeu
    # (+25% workers, 18/07/2026) prime tant que la source ne le documente pas.
    if not vals['c3po'].get('perk'):
        vals['c3po']['perk'] = '+25% workers'
    rebirths, unlocks, credits = parse_rebirths()
    print(f'  {len(vals)} droïdes · {len(rebirths)} cycles × {len(rebirths[1])} renaissances')

    current = OUT.read_text() if OUT.exists() else ''
    # Coût du palier Galactique : absent de tycoon-tools, lu sur le wiki dédié.
    # Le wiki injoignable ne doit PAS vider la colonne : on repart alors des
    # valeurs déjà publiées dans data.js (sinon le cron « corrigerait » chaque
    # panne du wiki en supprimant des données justes).
    previous = {did: [c or None for c in re.findall(r"'([^']*)'|null", series)]
                for did, series in re.findall(r"\{id:'([^']+)'.*?cost:\[([^\]]*)\]", current)}
    try:
        costs = check_variant_costs(vals, parse_variant_costs())
        # une valeur déjà publiée (donc validée à l'époque contre le multiple)
        # ne disparaît pas parce que le wiki l'a remplacée par une coquille ou
        # retirée : la cellule vide reprend la valeur en place. Une correction
        # du wiki qui passe le contrôle prime toujours. (Vécu le 06/08/2026 :
        # bdx Arc-en-ciel réédité 400K → 300K, hors multiple ×16.)
        restored = 0
        for did, series in previous.items():
            for idx, old in enumerate(series):
                if old and not costs.setdefault(did, [None] * len(WIKI_TABS))[idx]:
                    costs[did][idx] = old
                    restored += 1
        if restored:
            print(f'  {restored} coût(s) repris de data.js faute de valeur wiki valable')
        total = sum(1 for s in costs.values() for c in s if c)
        print(f'  {total} coûts de variantes recoupés sur le wiki dédié '
              f'({len(costs)} droïdes × {len(WIKI_TABS)} paliers)')
    except Exception as e:
        costs = previous
        print(f'  ⚠ wiki injoignable ({e.__class__.__name__}) — '
              f'{len(costs)} séries de coûts conservées depuis data.js')
    for did, series in costs.items():
        if did in vals:
            vals[did]['costs'] = series

    # la date de recoupage n'est réécrite que si le contenu change
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
