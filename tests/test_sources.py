"""Conversion of the aviationweather source to the common columns."""

import json
from pathlib import Path

import pytest

from tracker.config import COLUMNS, AIRPORTS
from tracker.sources import ceiling, flight_category, humidity, parse_metar, _num

FIXTURE = Path(__file__).parent / "fixtures" / "metar_sample.json"


@pytest.fixture
def rows():
    return {r["item_id"]: r for r in parse_metar(FIXTURE.read_bytes(), "2026-11-17")}


def test_keeps_only_tracked_airports(rows):
    assert set(rows) == {"MMUN", "KBNA", "KJFK", "LFPG"}
    assert "KORD" not in rows


def test_rows_have_the_common_columns(rows):
    for row in rows.values():
        assert set(row) == set(COLUMNS)
        assert row["date"] == "2026-11-17"
        assert row["source"] == "aviationweather"
        assert row["item"] == AIRPORTS[row["item_id"]][0]


def test_numeric_values(rows):
    cun = rows["MMUN"]
    assert cun["temp_c"] == 28.0
    assert cun["temp_f"] == 82.4
    assert cun["wind_kt"] == 12
    assert cun["gust_kt"] == 18
    assert cun["visibility_mi"] == 6.0         # "6+" becomes 6
    assert cun["pressure_hpa"] == 1013.2
    assert cun["ceiling_ft"] is None           # scattered clouds are not a ceiling
    assert cun["obs_time_utc"] == "2026-11-17T17:00:00Z"
    assert rows["KBNA"]["visibility_mi"] == 10.0  # "10+" becomes 10
    assert rows["KBNA"]["gust_kt"] is None        # no gust reported stays empty


def test_latest_observation_wins_when_a_station_repeats(rows):
    assert rows["KJFK"]["temp_c"] == 5.6
    assert rows["KJFK"]["visibility_mi"] == 0.8


def test_flight_category(rows):
    assert rows["KBNA"]["flight_category"] == "MVFR"   # given by the source
    assert rows["KJFK"]["flight_category"] == "LIFR"   # computed: 300 ft overcast, 3/4 mile
    assert rows["MMUN"]["flight_category"] == "VFR"
    assert flight_category(800, 10) == "IFR"
    assert flight_category(None, None) == "VFR"


def test_helpers():
    assert _num("10+") == 10.0
    assert _num("VRB") is None
    assert _num(None) is None
    assert ceiling([{"cover": "FEW", "base": 1000}, {"cover": "BKN", "base": 2500}]) == 2500
    assert ceiling([], vert_vis=200) == 200
    assert humidity(20, 20) == 100
    assert humidity(None, 5) is None


def test_bad_json_raises():
    with pytest.raises(Exception):
        parse_metar(b"<html>error</html>", "2026-11-17")
    with pytest.raises(ValueError):
        parse_metar(json.dumps({"error": "x"}).encode(), "2026-11-17")
