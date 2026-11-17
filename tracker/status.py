"""data/status.json: a description of the latest run."""

import json
from pathlib import Path

from .build import raw_dates
from .config import RAW_DIR, STATUS_PATH
from .moves import compare


def make_status(run_time, run_date, history_rows, source_results, raw_dir=RAW_DIR):
    dates = raw_dates(raw_dir)
    diff = compare(history_rows, run_date)
    items_today = [r for r in history_rows if r["date"] == run_date]
    return {
        "run_time": run_time,
        "run_date": run_date,
        "first_run_date": dates[0] if dates else None,
        "days_with_success": len(dates),
        "items": len(items_today),
        "new_today": [n["item_id"] for n in diff["new"]],
        "gone_today": [g["item_id"] for g in diff["gone"]],
        "previous_date": diff["previous_date"],
        "sources": [
            {"name": r["name"], "ok": bool(r["ok"]), "count": int(r["count"]),
             "format": r.get("format", ""), "error": r.get("error", "")}
            for r in source_results
        ],
    }


def write_status(status, path=STATUS_PATH):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(status, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
