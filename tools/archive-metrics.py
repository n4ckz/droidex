#!/usr/bin/env python3
"""Archive les métriques officielles de l'île Droid Tycoon (Ecosystem API
Epic) : l'API ne garde qu'une fenêtre glissante de 7 jours, ce script recopie
donc chaque jour les valeurs — exactes, agrégées par Epic — dans le dépôt.

- data/metrics/daily.json : une entrée par jour UTC complet (~300 o/jour)
- data/metrics/hourly-AAAA-MM.json : une entrée par heure (~8 Ko/jour)

Idempotent : chaque exécution fusionne la fenêtre courante avec l'existant
(jusqu'à 6 jours de pannes de cron sans perte). Le jour UTC en cours est
ignoré (incomplet). Sortie déterministe (tri des clés) → diffs minimaux.
"""
import datetime as dt
import json
import urllib.request
from pathlib import Path

ISLAND = '7865-8305-9184'
BASE = f'https://api.fortnite.com/ecosystem/v1/islands/{ISLAND}/metrics'
OUT = Path(__file__).resolve().parent.parent / 'data' / 'metrics'
UA = {'User-Agent': 'Mozilla/5.0 (droidex metrics archive; +https://github.com/n4ckz/droidex)'}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8', 'replace'))


def by_timestamp(payload, key_len):
    """Regroupe {métrique: [{value,timestamp},…]} par horodatage tronqué.
    key_len : 10 → 'AAAA-MM-JJ' (jour), 13 → 'AAAA-MM-JJTHH' (heure)."""
    rows = {}
    for metric, points in payload.items():
        if not isinstance(points, list):
            continue
        for p in points:
            key = p.get('timestamp', '')[:key_len]
            if not key:
                continue
            row = rows.setdefault(key, {})
            if metric == 'retention':  # {d1,d7,timestamp} au lieu de value
                if p.get('d1') is not None:
                    row['retentionD1'] = p['d1']
                if p.get('d7') is not None:
                    row['retentionD7'] = p['d7']
            elif p.get('value') is not None:
                row[metric] = p['value']
    return rows


def merge(path, fresh, drop_key=None):
    old = json.loads(path.read_text()) if path.exists() else {}
    for k, v in fresh.items():
        if k == drop_key or not v:  # période en cours : incomplète, on saute
            continue
        old[k] = v  # la fenêtre API (recalculée par Epic) prime sur l'archive
    path.write_text(json.dumps(old, indent=1, sort_keys=True) + '\n')
    return len(fresh)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # sans from/to l'API ne renvoie que ~2 jours : on demande explicitement
    # toute la fenêtre autorisée (7 jours glissants, to jamais dans le futur)
    now = dt.datetime.now(dt.timezone.utc)
    frm = (now - dt.timedelta(days=7)).strftime('%Y-%m-%dT00:00:00Z')
    to = now.strftime('%Y-%m-%dT%H:00:00Z')
    window = f'?from={frm}&to={to}'
    daily = by_timestamp(fetch(f'{BASE}/day{window}'), 10)
    hourly = by_timestamp(fetch(f'{BASE}/hour{window}'), 13)
    today = max(daily) if daily else None  # jour UTC en cours = incomplet
    merge(OUT / 'daily.json', daily, drop_key=today)
    # horaire : shard mensuel ; l'heure en cours s'écrase d'elle-même demain
    for month in sorted({k[:7] for k in hourly}):
        shard = {k: v for k, v in hourly.items() if k.startswith(month)}
        merge(OUT / f'hourly-{month}.json', shard)
    n = len(json.loads((OUT / 'daily.json').read_text()))
    print(f'✓ archive : {n} jour(s) au total, fenêtre courante fusionnée '
          f'({len(daily)} j / {len(hourly)} h reçus).')


if __name__ == '__main__':
    main()
