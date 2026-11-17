"""The move rule: what changed between the latest run date and the previous one.

A move is the absolute change in temp_f (°F) for an airport that has a value on both dates.
The biggest MOVE_LIMIT moves are reported (largest first, ties broken by item_id), along with
every airport whose flight category changed and every airport that appeared or disappeared.
The website's Today page applies the same rule in JavaScript.
"""

from .config import MOVE_COLUMN, MOVE_LIMIT


def _float(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def dates_in(rows):
    return sorted({r["date"] for r in rows})


def by_item(rows, date):
    return {r["item_id"]: r for r in rows if r["date"] == date}


def compare(rows, date=None, limit=MOVE_LIMIT, column=MOVE_COLUMN):
    """Compare `date` (default: latest date in rows) with the date before it."""
    dates = dates_in(rows)
    if date is None:
        date = dates[-1] if dates else None
    earlier = [d for d in dates if date is not None and d < date]
    prev_date = earlier[-1] if earlier else None
    today = by_item(rows, date) if date else {}
    before = by_item(rows, prev_date) if prev_date else {}

    moves = []
    category_changes = []
    for item_id in sorted(set(today) & set(before)):
        new_row, old_row = today[item_id], before[item_id]
        old_v, new_v = _float(old_row.get(column)), _float(new_row.get(column))
        if old_v is not None and new_v is not None:
            change = round(new_v - old_v, 1)
            moves.append({
                "item_id": item_id,
                "item": new_row.get("item", ""),
                "old": old_v,
                "new": new_v,
                "change": change,
                "abs_change": abs(change),
            })
        old_c, new_c = old_row.get("flight_category") or "", new_row.get("flight_category") or ""
        if old_c != new_c:
            category_changes.append({"item_id": item_id, "item": new_row.get("item", ""),
                                     "old": old_c, "new": new_c})
    moves.sort(key=lambda m: (-m["abs_change"], m["item_id"]))

    # with no earlier date there is nothing to compare, so nothing counts as new or gone
    new = sorted(set(today) - set(before)) if prev_date else []
    gone = sorted(set(before) - set(today)) if prev_date else []
    names = {r["item_id"]: r.get("item", "") for r in rows}
    return {
        "date": date,
        "previous_date": prev_date,
        "column": column,
        "moves": moves[:limit],
        "all_moves": moves,
        "category_changes": category_changes,
        "new": [{"item_id": i, "item": names.get(i, "")} for i in new],
        "gone": [{"item_id": i, "item": names.get(i, "")} for i in gone],
    }
