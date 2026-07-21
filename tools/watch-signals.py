#!/usr/bin/env python3
"""Signaux communautaires : détecte qu'un patch du jeu a PEUT-ÊTRE eu lieu,
via des sources indépendantes de tycoon-tools (qui reste la seule source de
données — ce script n'écrit jamais dans data.js).

Sources surveillées :
- wiki dédié (star-wars-droid-tycoon.fandom.com) : API MediaWiki recentchanges
- page Droid Tycoon du wiki Fortnite : timestamp de dernière révision
- droidtycoonguide.com/events/ : empreinte du texte de la page (site statique)

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
    req = urllib.request.Request(
        f'https://discord.com/api/v10/channels/{chan}/messages?limit=5',
        headers={'Authorization': f'Bot {tok}', 'User-Agent': UA['User-Agent']})
    with urllib.request.urlopen(req, timeout=30) as r:
        msgs = json.loads(r.read().decode('utf-8', 'replace'))
    if not msgs:
        return None, ''
    print(f'· discord-patch-notes : canal miroir lu, {len(msgs)} message(s), dernier id {msgs[0]["id"]}')
    detail = ' ; '.join(
        f"{clean(m.get('content', '')) or '(image ou embed — voir le canal)'} ({clean(m.get('timestamp', '')[:16])})"
        for m in msgs[:3])
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


SOURCES = {
    'discord-patch-notes': (src_discord_patch_notes, 'canal miroir #patch-notes de ton serveur Discord'),
    'epic-island': (src_epic_island, 'https://api.fortnite.com/ecosystem/v1/islands/7865-8305-9184'),
    'wiki-droid-tycoon': (src_wiki_dedie, 'https://star-wars-droid-tycoon.fandom.com/wiki/Special:RecentChanges'),
    'wiki-fortnite': (src_wiki_fortnite, 'https://fortnite.fandom.com/wiki/Droid_Tycoon?action=history'),
    'guide-events': (src_guide_events, 'https://droidtycoonguide.com/events/'),
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
