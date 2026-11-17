"""History logic: building from raw files, reruns on the same day, failing sources, status."""

import gzip
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from tracker import build, run as run_mod
from tracker.config import COLUMNS
from tracker.sources import Source, parse_metar

FIXTURE = (Path(__file__).parent / "fixtures" / "metar_sample.json").read_bytes()


def shifted(raw, delta_c):
    """The fixture with every temperature moved by delta_c."""
    data = json.loads(raw)
    for rec in data:
        rec["temp"] = rec["temp"] + delta_c
    return json.dumps(data).encode()


def good_source(raw):
    return Source("aviationweather", "json", lambda: raw, parse_metar)


def broken_source():
    def fail():
        raise ConnectionError("down")
    return Source("brokensource", "json", fail, parse_metar)


@pytest.fixture
def paths(tmp_path):
    return {
        "raw_dir": tmp_path / "raw",
        "history_path": tmp_path / "history.csv",
        "status_path": tmp_path / "status.json",
        "runs_log": tmp_path / "runs.csv",
    }


def do_run(paths, when, sources):
    return run_mod.run(now=when, sources=sources, publish_issue=False, **paths)


def t(day, hour=17):
    return datetime(2026, 11, day, hour, 0, tzinfo=timezone.utc)


def test_run_writes_raw_history_and_status(paths):
    st = do_run(paths, t(17), [good_source(FIXTURE)])
    raw = paths["raw_dir"] / "2026-11-17" / "aviationweather.json.gz"
    assert gzip.decompress(raw.read_bytes()) == FIXTURE  # saved exactly as it came in
    rows = build.read_history(paths["history_path"])
    assert list(rows[0].keys()) == COLUMNS
    assert len(rows) == 4
    assert st["items"] == 4 and st["days_with_success"] == 1
    assert st["first_run_date"] == "2026-11-17"
    assert set(st) >= {"run_time", "first_run_date", "days_with_success", "items",
                       "new_today", "gone_today", "sources"}


def test_history_is_sorted_by_date_then_item_id(paths):
    do_run(paths, t(18), [good_source(FIXTURE)])
    do_run(paths, t(17), [good_source(FIXTURE)])
    rows = build.read_history(paths["history_path"])
    keys = [(r["date"], r["item_id"]) for r in rows]
    assert keys == sorted(keys)
    assert {r["date"] for r in rows} == {"2026-11-17", "2026-11-18"}


def test_second_run_same_day_replaces_that_day(paths):
    do_run(paths, t(17, 12), [good_source(FIXTURE)])
    st = do_run(paths, t(17, 22), [good_source(shifted(FIXTURE, 5))])
    rows = build.read_history(paths["history_path"])
    assert len(rows) == 4                       # still one row per item for the day
    cun = next(r for r in rows if r["item_id"] == "MMUN")
    assert cun["temp_c"] == "33.0"              # the later run's values
    assert st["days_with_success"] == 1         # the day counts once
    assert len(list((paths["raw_dir"] / "2026-11-17").glob("*.gz"))) == 1


def test_failing_source_does_not_stop_the_run(paths):
    st = do_run(paths, t(17), [broken_source(), good_source(FIXTURE)])
    sources = {s["name"]: s for s in st["sources"]}
    assert sources["brokensource"]["ok"] is False and sources["brokensource"]["count"] == 0
    assert sources["aviationweather"]["ok"] is True and sources["aviationweather"]["count"] == 4
    assert not (paths["raw_dir"] / "2026-11-17" / "brokensource.json.gz").exists()
    assert "brokensource" in paths["runs_log"].read_text()


def test_all_sources_failing_still_finishes(paths):
    do_run(paths, t(17), [good_source(FIXTURE)])
    st = do_run(paths, t(18), [broken_source()])
    assert st["items"] == 0
    assert len(st["gone_today"]) == 4
    assert st["days_with_success"] == 1
    assert len(build.read_history(paths["history_path"])) == 4


def test_failed_rerun_keeps_the_days_earlier_raw_file(paths):
    do_run(paths, t(17, 12), [good_source(FIXTURE)])
    do_run(paths, t(17, 22), [Source("aviationweather", "json", lambda: b"oops", parse_metar)])
    assert (paths["raw_dir"] / "2026-11-17" / "aviationweather.json.gz").exists()
    assert len(build.read_history(paths["history_path"])) == 4


def test_build_is_reproducible_from_raw_files_alone(paths):
    do_run(paths, t(17), [good_source(FIXTURE)])
    do_run(paths, t(18), [good_source(shifted(FIXTURE, -3))])
    first = paths["history_path"].read_text()
    paths["history_path"].unlink()
    build.main(paths["raw_dir"], paths["history_path"])
    assert paths["history_path"].read_text() == first


def test_new_and_gone_in_status(paths):
    do_run(paths, t(17), [good_source(FIXTURE)])
    data = [r for r in json.loads(FIXTURE) if r["icaoId"] != "LFPG"]
    st = do_run(paths, t(18), [good_source(json.dumps(data).encode())])
    assert st["gone_today"] == ["LFPG"]
    assert st["new_today"] == []
    assert st["days_with_success"] == 2


def test_empty_values_are_left_empty(paths):
    do_run(paths, t(17), [good_source(FIXTURE)])
    cun = next(r for r in build.read_history(paths["history_path"]) if r["item_id"] == "MMUN")
    assert cun["ceiling_ft"] == ""
