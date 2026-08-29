#!/usr/bin/env python3
"""Daily backup of Droidex's PocketBase database.

Takes a consistent snapshot of pb_data/data.db via Python's sqlite3 backup
API (safe while PocketBase is running, WAL included) into backups/, and
keeps 14 days of history. Stdlib only — no dependency to install.

The install directory is taken from the DROIDEX_DIR environment variable,
or defaults to the parent of the deploy/ folder this script lives in (i.e.
the repository clone). Schedule it daily (systemd timer or cron) — see the
README "Backups" section.
"""
import datetime
import os
import pathlib
import sqlite3

BASE = pathlib.Path(os.environ.get("DROIDEX_DIR")
                    or pathlib.Path(__file__).resolve().parent.parent)
SRC = BASE / "pb_data" / "data.db"
DST_DIR = BASE / "backups"
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
