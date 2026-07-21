#!/usr/bin/env python3
"""Daily backup of Droidex's PocketBase database.

Takes a consistent snapshot of pb_data/data.db via Python's sqlite3 backup
API (safe while PocketBase is running, WAL included) into backups/, and
keeps 14 days of history. Stdlib only — no dependency to install.

Adjust the two paths below to your install, then schedule it daily
(systemd timer or cron) — see README "Backups" section.
"""
import datetime
import pathlib
import sqlite3

SRC = "/opt/sites/droidex/pb_data/data.db"
DST_DIR = pathlib.Path("/opt/sites/droidex/backups")
KEEP_DAYS = 14

DST_DIR.mkdir(parents=True, exist_ok=True)
today = datetime.date.today().isoformat()
dst = DST_DIR / f"data-{today}.db"

src = sqlite3.connect(f"file:{SRC}?mode=ro", uri=True)
out = sqlite3.connect(dst)
with out:
    src.backup(out)
out.close()
src.close()

cutoff = datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)
for f in DST_DIR.glob("data-*.db"):
    try:
        if datetime.date.fromisoformat(f.stem[5:]) < cutoff:
            f.unlink()
    except ValueError:
        pass

print(f"backup ok: {dst} ({dst.stat().st_size} bytes)")
