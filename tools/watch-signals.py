#!/usr/bin/env python3
"""Signaux communautaires : détecte qu'un patch du jeu a PEUT-ÊTRE eu lieu,
via des sources indépendantes de tycoon-tools (qui reste la seule source de
données — ce script n'écrit jamais dans data.js).

Sources surveillées :
- wiki dédié (star-wars-droid-tycoon.fandom.com) : API MediaWiki recentchanges
- page Droid Tycoon du wiki Fortnite : timestamp de dernière révision
- droidtycoonguide.com/events/ : empreinte du texte de la page (site statique)
- droidtrakr.com : catalogue de leur tracker (data.json + inventaire d'images)
  et leur retranscription des patch notes officiels (PATCH_NOTES_VERSION)

État : tools/watch-state.json (commité — le workflow le met à jour).
Codes de sortie : 0 = rien de neuf (ou première initialisation), 10 = au moins
une source a bougé (le rapport est sur stdout). Une source injoignable est
signalée mais n'est jamais bloquante.
"""
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

STATE = Path(__file__).resolve().parent / 'watch-state.json'
UA = {'User-Agent': 'Mozilla/5.0 (droidex patch signals; +https://github.com/n4ckz/droidex)'}

# Les titres/commentaires distants finissent dans le markdown d'une issue :
# on ne garde qu'un jeu de caractères inoffensif (pas de backtick, pas de
# contrôle) — même philosophie que la liste blanche du générateur data.js.
def clean(s):
    return re.sub(r"[^\w À-ſ.,:;!?'()/+%-]", '', str(s))[:120]


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def api(base, **params):
    qs = urllib.parse.urlencode({'format': 'json', **params})
    return json.loads(fetch(f'{base}/api.php?{qs}'))


def src_wiki_dedie():
    """Dernières modifications du wiki dédié (toutes pages confondues)."""
    data = api('https://star-wars-droid-tycoon.fandom.com',
               action='query', list='recentchanges',
               rcprop='title|timestamp|comment', rclimit=10, rctype='edit|new')
    rc = data['query']['recentchanges']
    if not rc:
        return None, ''
    token = rc[0]['timestamp']
    detail = ' ; '.join(f"{clean(c['title'])} ({clean(c['timestamp'])})" for c in rc[:5])
    return token, detail


def src_wiki_fortnite():
    """Dernière révision de la page Droid Tycoon du wiki Fortnite."""
    data = api('https://fortnite.fandom.com',
               action='query', prop='revisions', titles='Droid Tycoon',
               rvprop='timestamp|comment', rvlimit=1)
    pages = data['query']['pages']
    rev = next(iter(pages.values()))['revisions'][0]
    return rev['timestamp'], f"révision du {clean(rev['timestamp'])} — {clean(rev.get('comment', '')) or 'sans commentaire'}"


def src_guide_events():
    """Empreinte du texte de la page événements de droidtycoonguide."""
    raw = fetch('https://droidtycoonguide.com/events/')
    text = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', raw, flags=re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return hashlib.sha256(text.encode()).hexdigest()[:16], 'contenu de la page modifié'


def src_discord_patch_notes():
    """Canal #patch-notes officiel de FOAD, suivi (« Suivre ») sur le serveur
    Discord personnel de Julien : un bot de CE serveur lit le canal miroir en
    REST. Source officielle, activée seulement si DISCORD_BOT_TOKEN et
    DISCORD_PATCH_CHANNEL_ID sont présents dans l'environnement."""
    tok = os.environ.get('DISCORD_BOT_TOKEN')
    chan = os.environ.get('DISCORD_PATCH_CHANNEL_ID')
    if not tok or not chan:
        return None, ''  # non configuré : source simplement absente

    def api_discord(path):
        req = urllib.request.Request(
            f'https://discord.com/api/v10{path}',
            # Discord refuse (403) les User-Agents de navigateur sur l'API
            # bot : format « DiscordBot (url, version) » requis par leur doc
            headers={'Authorization': f'Bot {tok}',
                     'User-Agent': 'DiscordBot (https://github.com/n4ckz/droidex, 1.0)'})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode('utf-8', 'replace'))

    msgs = api_discord(f'/channels/{chan}/messages?limit=5')
    if not msgs:
        return None, ''
    print(f'· discord-patch-notes : canal miroir lu, {len(msgs)} message(s)')

    # citation intégrale des messages (du plus ancien au plus récent) :
    # texte multi-lignes conservé, neutralisé pour le markdown des issues
    # (backticks/chevrons retirés, @ désamorcé pour ne pinger personne)
    def quote(m):
        who = clean(m.get('author', {}).get('username', '?'))
        when = clean(m.get('timestamp', '')[:16].replace('T', ' '))
        body = re.sub(r'[`<>]', '', m.get('content', ''))
        body = re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', '', body)
        body = body.replace('@', '＠')[:1500].strip()
        lines = ['> ' + l for l in body.splitlines() if l.strip()] or []
        extras = len(m.get('attachments', [])) + len(m.get('embeds', []))
        if extras:
            lines.append(f'> _(+{extras} image(s)/embed(s) — voir le message)_')
        # le dépôt est PUBLIC : on lie vers le message D'ORIGINE sur le serveur
        # public de FOAD (message_reference du crosspost), jamais vers le
        # serveur personnel qui héberge le miroir
        ref = m.get('message_reference') or {}
        if ref.get('guild_id') and ref.get('message_id'):
            link = f'https://discord.com/channels/{ref["guild_id"]}/{ref["channel_id"]}/{ref["message_id"]}'
            return f'**{when} — {who}** · {link}\n' + '\n'.join(lines)
        return f'**{when} — {who}**\n' + '\n'.join(lines)

    detail = '\n\n' + '\n\n'.join(quote(m) for m in reversed(msgs[:3]))
    return msgs[0]['id'], detail


def src_epic_island():
    """Fiche officielle de l'île sur l'Ecosystem API d'Epic (publique, sans
    auth). Pas de numéro de version exposé, mais FOAD retouche titre/tags au
    fil des mises à jour : tout changement de la fiche est un signal officiel."""
    raw = fetch('https://api.fortnite.com/ecosystem/v1/islands/7865-8305-9184')
    data = json.loads(raw)
    token = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
    detail = f"titre « {clean(data.get('title', '?'))} », tags {clean(', '.join(data.get('tags', [])))}"
    return token, detail


def src_droidtrakr():
    """Catalogue du tracker droidtrakr.com (concurrent très réactif : Beskar
    15 min et art Galactique répercutés en quelques heures/jours). On ne
    retient que le catalogue STABLE — noms+raretés de data.json, droïdes
    illustrés et paliers de variantes de droid-images.js — jamais les fichiers
    bruts : data.json embarque les cases de progression des fondateurs du site
    et les images s'ajoutent au compte-gouttes (faux signal quotidien sinon).
    Suivi aussi : PATCH_NOTES_VERSION de leur app.js — ils retranscrivent à la
    main les patch notes du Discord officiel (que « Suivre » ne relaie pas si
    FOAD ne publie pas ses messages, constat du 21/07/2026)."""
    droids = json.loads(fetch('https://droidtrakr.com/data.json'))
    catalog = sorted((str(d.get('name', '')), str(d.get('rarity', ''))) for d in droids)
    raw = fetch('https://droidtrakr.com/droid-images.js')
    pairs = re.findall(r'"([A-Z0-9]+):([A-Za-z]+)"\s*:', raw)
    ids = sorted({i for i, _ in pairs})
    tiers = sorted({t for _, t in pairs})
    app = fetch('https://droidtrakr.com/app.js')
    m = re.search(r"PATCH_NOTES_VERSION\s*=\s*'([^']*)'", app)
    patch = m.group(1) if m else ''
    token = hashlib.sha256(json.dumps([catalog, ids, tiers, patch]).encode()).hexdigest()[:16]
    detail = (f"{len(catalog)} droïdes au catalogue, {len(ids)} illustrés, "
              f"paliers {clean(', '.join(tiers))}, patch notes retranscrits « {clean(patch)} »")
    return token, detail


SOURCES = {
    'discord-patch-notes': (src_discord_patch_notes, 'canal miroir #patch-notes de ton serveur Discord'),
    'epic-island': (src_epic_island, 'https://api.fortnite.com/ecosystem/v1/islands/7865-8305-9184'),
    'wiki-droid-tycoon': (src_wiki_dedie, 'https://star-wars-droid-tycoon.fandom.com/wiki/Special:RecentChanges'),
    'wiki-fortnite': (src_wiki_fortnite, 'https://fortnite.fandom.com/wiki/Droid_Tycoon?action=history'),
    'guide-events': (src_guide_events, 'https://droidtycoonguide.com/events/'),
    'droidtrakr': (src_droidtrakr, 'https://droidtrakr.com/'),
}


def ccu_anomaly(state, changed):
    """Pic CCU de la veille vs moyenne des jours précédents de l'archive
    (data/metrics/daily.json, alimentée par archive-metrics.py). Écart de plus
    de ±40 % → signal. Un jour donné n'est signalé qu'une fois (token)."""
    path = Path(__file__).resolve().parent.parent / 'data' / 'metrics' / 'daily.json'
    if not path.exists():
        return
    daily = json.loads(path.read_text())
    days = sorted(d for d, v in daily.items() if v.get('peakCCU'))
    if len(days) < 4:  # baseline trop courte pour juger
        return
    last, base = days[-1], days[:-1]
    mean = sum(daily[d]['peakCCU'] for d in base) / len(base)
    value = daily[last]['peakCCU']
    ratio = value / mean if mean else 1
    if 0.6 <= ratio <= 1.4:
        return
    if state.get('ccu-anomaly', {}).get('token') == last:
        return  # déjà signalé
    state['ccu-anomaly'] = {'token': last}
    changed.append('ccu-anomaly')
    sens = 'bond' if ratio > 1 else 'chute'
    print(f'CHANGED ccu-anomaly : {sens} du pic CCU le {last} — {value:.0f} vs '
          f'{mean:.0f} en moyenne sur les {len(base)} jours précédents ({ratio:+.0%})')
    print('  → patch, événement ou incident probable côté jeu')


def main():
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    first_run = not state
    changed = []
    for name, (fn, link) in SOURCES.items():
        try:
            token, detail = fn()
        except Exception as e:  # source en panne : on le dit, on continue
            print(f'⚠ {name} injoignable ({e.__class__.__name__}) — ignoré ce coup-ci')
            continue
        if token is None:
            continue
        old = state.get(name, {}).get('token')
        if old is not None and old != token:
            changed.append(name)
            print(f'CHANGED {name} : {detail}')
            if '\n' in detail:
                print()  # sans ligne vide, le markdown avale la ligne suivante dans la citation
            print(f'  → vérifier : {link}')
        state[name] = {'token': token}
    ccu_anomaly(state, changed)
    STATE.write_text(json.dumps(state, indent=1, sort_keys=True) + '\n')
    if first_run:
        print('État initialisé (aucun signal émis au premier passage).')
        return 0
    if changed:
        print(f'\n{len(changed)} source(s) communautaire(s) ont bougé — un patch du jeu a peut-être eu lieu.')
        print('La veille tycoon-tools (job "check") ouvrira sa PR quand les données changeront.')
        return 10
    print('✓ Aucun mouvement sur les sources communautaires.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
