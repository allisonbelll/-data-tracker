"""The move rule."""

from tracker.moves import compare


def row(date, item_id, temp_f, cat="VFR", item=None):
    return {"date": date, "item_id": item_id, "item": item or item_id,
            "temp_f": "" if temp_f is None else f"{temp_f:.1f}", "flight_category": cat}


def test_biggest_moves_are_ranked_by_absolute_change():
    rows = [
        row("2026-11-17", "A", 70), row("2026-11-17", "B", 70), row("2026-11-17", "C", 70),
        row("2026-11-18", "A", 72), row("2026-11-18", "B", 60), row("2026-11-18", "C", 75),
    ]
    diff = compare(rows, limit=2)
    assert diff["previous_date"] == "2026-11-17"
    assert [m["item_id"] for m in diff["moves"]] == ["B", "C"]
    assert diff["moves"][0]["change"] == -10.0
    assert diff["moves"][0]["old"] == 70.0 and diff["moves"][0]["new"] == 60.0
    assert len(diff["all_moves"]) == 3


def test_ties_break_by_item_id_and_no_change_is_kept():
    rows = [row("d1", "B", 50), row("d1", "A", 50), row("d2", "B", 55), row("d2", "A", 45),
            row("d1", "Z", 60), row("d2", "Z", 60)]
    diff = compare(rows)
    assert [m["item_id"] for m in diff["moves"]] == ["A", "B", "Z"]
    assert diff["moves"][-1]["change"] == 0.0


def test_new_gone_and_category_changes():
    rows = [row("d1", "A", 50, "VFR"), row("d1", "B", 50),
            row("d2", "A", 50, "IFR"), row("d2", "C", 50)]
    diff = compare(rows)
    assert [n["item_id"] for n in diff["new"]] == ["C"]
    assert [g["item_id"] for g in diff["gone"]] == ["B"]
    assert diff["category_changes"] == [{"item_id": "A", "item": "A", "old": "VFR", "new": "IFR"}]


def test_empty_values_are_skipped():
    rows = [row("d1", "A", None), row("d2", "A", 60)]
    assert compare(rows)["moves"] == []


def test_first_day_has_nothing_to_compare():
    diff = compare([row("d1", "A", 50)])
    assert diff["previous_date"] is None
    assert diff["moves"] == [] and diff["new"] == [] and diff["gone"] == []


def test_compare_against_a_day_with_no_rows():
    rows = [row("2026-11-17", "A", 50)]
    diff = compare(rows, "2026-11-18")
    assert diff["previous_date"] == "2026-11-17"
    assert [g["item_id"] for g in diff["gone"]] == ["A"]
