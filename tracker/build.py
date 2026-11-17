"""Build data/history.csv from the raw files alone.

    python -m tracker.build

Reads every data/raw/<date>/<source>.<format>.gz in date order, converts each one to rows
with the common columns, and rewrites the history sorted by date, then item_id. Nothing else
is read, so building twice gives the same file and a rule change applies to every day.
"""

import csv
import gzip
import io
import re
import sys
from pathlib import Path

from .config import COLUMNS, HISTORY_PATH, RAW_DIR
from .sources import SOURCE_BY_NAME

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def raw_dates(raw_dir=RAW_DIR):
    """Dates (sorted) that have at least one raw file."""
    raw_dir = Path(raw_dir)
    if not raw_dir.exists():
        return []
    return sorted(d.name for d in raw_dir.iterdir()
                  if d.is_dir() and DATE_RE.match(d.name) and any(d.glob("*.gz")))


def raw_files_for(date, raw_dir=RAW_DIR):
    """(source, path) pairs for one day, for sources the tracker knows."""
    out = []
    for path in sorted((Path(raw_dir) / date).glob("*.gz")):
        source_name = path.name.split(".")[0]
        if source_name in SOURCE_BY_NAME:
            out.append((source_name, path))
    return out


def rows_for_day(date, raw_dir=RAW_DIR):
    rows = []
    for source_name, path in raw_files_for(date, raw_dir):
        try:
            raw = gzip.decompress(path.read_bytes())
            rows.extend(SOURCE_BY_NAME[source_name].parse(raw, date))
        except Exception as exc:  # a broken raw file gives no rows; it never stops the build
            print(f"warning: could not read {path}: {exc}", file=sys.stderr)
    return rows


def build_history(raw_dir=RAW_DIR):
    rows = []
    for date in raw_dates(raw_dir):
        rows.extend(rows_for_day(date, raw_dir))
    rows.sort(key=lambda r: (r["date"], r["item_id"]))
    return rows


def format_value(value):
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:.1f}"
    return str(value)


def history_csv_text(rows):
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(COLUMNS)
    for row in rows:
        writer.writerow([format_value(row.get(col)) for col in COLUMNS])
    return buf.getvalue()


def write_history(rows, path=HISTORY_PATH):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(history_csv_text(rows), encoding="utf-8")


def read_history(path=HISTORY_PATH):
    path = Path(path)
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def main(raw_dir=RAW_DIR, history_path=HISTORY_PATH):
    rows = build_history(raw_dir)
    write_history(rows, history_path)
    print(f"wrote {len(rows)} rows from {len(raw_dates(raw_dir))} days to {history_path}")
    return rows


if __name__ == "__main__":
    main()
