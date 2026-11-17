"""The issue text."""

from tracker.issue import render_body
from tracker.moves import compare


def row(date, item_id, temp_f, cat="VFR"):
    return {"date": date, "item_id": item_id, "item": item_id.title(), "temp_f": f"{temp_f:.1f}",
            "flight_category": cat}


STATUS = {"run_time": "2026-11-18T17:00:00Z", "items": 2, "days_with_success": 2,
          "sources": [{"name": "aviationweather", "ok": True, "count": 2}]}


def test_body_lists_moves_with_old_and_new_values():
    rows = [row("2026-11-17", "MMUN", 80), row("2026-11-17", "KBNA", 50, "VFR"),
            row("2026-11-18", "MMUN", 84.5), row("2026-11-18", "KBNA", 49, "IFR")]
    body = render_body(compare(rows), STATUS)
    assert "since 2026-11-17" in body
    assert "| Mmun | MMUN | 80.0 | 84.5 | +4.5 |" in body
    assert "Kbna (KBNA): VFR → IFR" in body


def test_body_on_first_day():
    body = render_body(compare([row("2026-11-17", "MMUN", 80)]), STATUS)
    assert "nothing to compare" in body
    assert "Appeared: none" in body
