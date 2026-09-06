#!/usr/bin/env python3
"""Ping IndexNow : soumet les URLs du sitemap aux moteurs compatibles
(Bing, Yandex, Naver, Seznam — PAS Google, qui n'utilise pas IndexNow).

Appelé automatiquement par .github/workflows/indexnow.yml à chaque push
sur main touchant site/ ; utilisable à la main : python3 tools/indexnow-ping.py
(--check affiche la requête sans l'envoyer).

La clé est publique par construction (le protocole exige qu'elle soit servie
à la racine du site) : elle ne permet que de soumettre des URLs de NOTRE
hôte, la committer ne donne aucun pouvoir supplémentaire. Auto-hébergeurs :
générer la vôtre (secrets.token_hex(16)), la poser en site/<clé>.txt et
adapter KEY/HOST ci-dessous.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

HOST = 'droidex.nackz.dev'
KEY = '98d14e2c6871000220f0185f81868835'
ENDPOINT = 'https://api.indexnow.org/indexnow'
SITEMAP = Path(__file__).resolve().parent.parent / 'site' / 'sitemap.xml'


def main():
    urls = re.findall(r'<loc>([^<]+)</loc>', SITEMAP.read_text())
    if not urls:
        sys.exit('✗ aucune URL dans site/sitemap.xml')
    # Garde-fou : ne JAMAIS pinger si la clé n'est pas servie en prod — vécu le
    # 02/09/2026 : premier ping parti 69 s avant le déploiement du fichier,
    # bingbot a validé sur un 404 et a tenu la clé pour invalide pendant 4 jours.
    if '--check' not in sys.argv:
        key_url = f'https://{HOST}/{KEY}.txt'
        try:
            req = urllib.request.Request(key_url, headers={'User-Agent': 'droidex-indexnow/1.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                served = r.read().decode('utf-8', 'replace').strip()
        except Exception as e:
            sys.exit(f'✗ clé injoignable ({key_url}) : {e} — pinger seulement APRÈS le déploiement.')
        if served != KEY:
            sys.exit(f'✗ {key_url} ne sert pas la clé attendue — pinger seulement APRÈS le déploiement.')
    payload = {
        'host': HOST,
        'key': KEY,
        'keyLocation': f'https://{HOST}/{KEY}.txt',
        'urlList': urls,
    }
    body = json.dumps(payload).encode()
    print(f'{len(urls)} URL(s) du sitemap → {ENDPOINT}')
    if '--check' in sys.argv:
        print(json.dumps(payload, indent=1))
        return
    req = urllib.request.Request(
        ENDPOINT, data=body,
        headers={'Content-Type': 'application/json; charset=utf-8',
                 'User-Agent': f'droidex-indexnow/1.0 (+https://{HOST})'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f'✓ IndexNow : HTTP {r.status}')  # 200/202 = accepté
    except urllib.error.HTTPError as e:
        # 4xx = clé pas encore servie, payload invalide, ou quota — à lire
        sys.exit(f'✗ IndexNow : HTTP {e.code} — {e.read().decode("utf-8", "replace")[:200]}')


if __name__ == '__main__':
    main()
