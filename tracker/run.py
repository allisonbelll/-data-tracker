"""The daily pipeline.

    python -m tracker.run

1. Call every source and save what it returns, gzipped, to data/raw/<date>/<source>.<format>.gz.
   A failing source writes no raw file and does not stop the run; every result is recorded.
2. Rebuild data/history.csv from the raw files.
3. Write data/status.json.
4. Open (or update) today's GitHub Issue and close the previous one.
The workflow then commits the data folder.
"""

import csv
import gzip
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import build, issue, moves, status
from .config import RAW_DIR, RUNS_LOG_PATH, HISTORY_PATH, STATUS_PATH
from .sources import SOURCES

SITE_URL = "https://allisonbelll.github.io/-data-tracker/"


def fetch_all(date, sources=SOURCES, raw_dir=RAW_DIR):
    """Fetch every source. Returns one result dict per source; never raises."""
    results = []
    day_dir = Path(raw_dir) / date
    for src in sources:
        result = {"name": src.name, "format": src.fmt, "ok": False, "count": 0, "error": ""}
        try:
            raw = src.fetch()
            rows = src.parse(raw, date)  # check that it parses before saving it
            if not rows:
                raise ValueError("source returned none of the tracked items")
            day_dir.mkdir(parents=True, exist_ok=True)
            # replaces any earlier file from the same day, so each day counts once
            (day_dir / f"{src.name}.{src.fmt}.gz").write_bytes(gzip.compress(raw, mtime=0))
            result.update(ok=True, count=len(rows))
        except Exception as exc:
            result["error"] = f"{type(exc).__name__}: {exc}"[:300]
            print(f"source {src.name} failed: {result['error']}", file=sys.stderr)
        results.append(result)
    return results


def log_results(run_time, results, path=RUNS_LOG_PATH):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    new = not path.exists()
    with path.open("a", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        if new:
            w.writerow(["run_time", "source", "ok", "count", "error"])
        for r in results:
            w.writerow([run_time, r["name"], str(r["ok"]).lower(), r["count"], r["error"]])


def run(now=None, sources=SOURCES, raw_dir=RAW_DIR, history_path=HISTORY_PATH,
        status_path=STATUS_PATH, runs_log=RUNS_LOG_PATH, publish_issue=True):
    now = now or datetime.now(timezone.utc)
    run_time = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    date = now.strftime("%Y-%m-%d")

    results = fetch_all(date, sources, raw_dir)
    log_results(run_time, results, runs_log)

    rows = build.build_history(raw_dir)
    build.write_history(rows, history_path)

    st = status.make_status(run_time, date, rows, results, raw_dir)
    status.write_status(st, status_path)

    if publish_issue:
        try:
            # compared against today's date, so a day where every source failed lists
            # every airport as disappeared, and the issue is still opened
            diff = moves.compare(rows, date)
            body = issue.render_body(diff, st, SITE_URL)
            number = issue.publish(date, body)
            if number:
                print(f"issue #{number} for {date}")
        except Exception as exc:  # the issue failing never stops the commit
            print(f"issue failed: {exc}", file=sys.stderr)

    print(f"{date}: " + ", ".join(f"{r['name']}={'ok' if r['ok'] else 'FAILED'}({r['count']})" for r in results))
    return st


if __name__ == "__main__":
    run(publish_issue=bool(os.environ.get("GITHUB_TOKEN")))
