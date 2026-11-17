# ✈️ Jetset Tracker: Girls'-Trip Airport Watch

[![Tests](https://github.com/allisonbelll/-data-tracker/actions/workflows/tests.yml/badge.svg)](https://github.com/allisonbelll/-data-tracker/actions/workflows/tests.yml)
[![Daily run](https://github.com/allisonbelll/-data-tracker/actions/workflows/daily.yml/badge.svg)](https://github.com/allisonbelll/-data-tracker/actions/workflows/daily.yml)

**Live site:** https://allisonbelll.github.io/-data-tracker/

Every day, GitHub Actions runs this tool on its own. It downloads the latest weather and flying conditions at 19 airports
that serve popular bachelorette, beach, island and city-break destinations (Cancún, Nashville, Las Vegas, Paris and others).
It adds them to a history with one row per airport per day, opens a GitHub Issue listing what moved, and publishes the
result to an installable website with three pages: **Today**, **Browse** and **Trends**. The Today page also has an
interactive 3D flight globe: routes from home (XNA, Fayetteville) to every destination, with little planes you can tap to see
a boarding pass with the distance, estimated flight time and today's weather and flying conditions at the destination.

## Build the history from the raw files

```bash
python -m tracker.build
```

This replays every `data/raw/<date>/<source>.<format>.gz` in date order and rewrites `data/history.csv`. It reads nothing
else, so running it twice produces the same file, and a change to a rule (in `tracker/sources.py`) applies to every day of
the history.

Other commands:

```bash
pip install -r requirements.txt   # pytest (the pipeline itself uses only the Python standard library)
python -m tracker.run             # the full daily pipeline: fetch, build, status, issue
python -m pytest -v               # the test suite
python -m http.server             # preview the site locally at http://localhost:8000
```

## Items and key

The 19 items are airports. The **key (`item_id`) is the airport's four-letter ICAO code**, which never changes, so the same
airport lines up day after day.

| item_id | Destination | Region | Vibe |
|---|---|---|---|
| KBNA | Nashville | USA | Bachelorette |
| KLAS | Las Vegas | USA | Bachelorette |
| KAUS | Austin | USA | Bachelorette |
| KMIA | Miami | USA | Beach |
| KPHX | Scottsdale | USA | Desert & spa |
| KCHS | Charleston | USA | Southern charm |
| KSAV | Savannah | USA | Southern charm |
| KJFK | New York City | USA | City |
| PHNL | Honolulu | USA | Island |
| PHOG | Maui | USA | Island |
| MMUN | Cancún | Mexico & Caribbean | Beach |
| MMSD | Cabo San Lucas | Mexico & Caribbean | Beach |
| TJSJ | San Juan | Mexico & Caribbean | Island |
| MYNN | Nassau | Mexico & Caribbean | Island |
| LFPG | Paris | Europe | City |
| LIRF | Rome | Europe | City |
| LEBL | Barcelona | Europe | Beach |
| LPPT | Lisbon | Europe | City |
| LGAV | Athens (Greek islands gateway) | Europe | Island |

The list lives in `tracker/config.py`.

## Sources

| Name | What it is | Format | URL | Login |
|---|---|---|---|---|
| `aviationweather` | NOAA Aviation Weather Center METAR API: the latest routine weather report (METAR) from each airport | JSON | `https://aviationweather.gov/api/data/metar?ids=<the 19 codes>&format=json` | None (no API key) |

**What is kept:** the request asks only for the 19 tracked airports. If the response holds any other station, it is dropped,
and if it holds more than one report for an airport, only the most recent one (largest `obsTime`) is kept. From each report
the tool keeps the temperature, dew point, wind, gusts, visibility, cloud layers (to get the ceiling), altimeter setting,
flight category and observation time. The whole response is still saved as the raw file.

If this source ever stops working, a replacement can be added as another `Source` in `tracker/sources.py`. Each source
is called on its own, so one failing never stops the run.

## The history file: `data/history.csv`

One row per airport per day, sorted by `date`, then `item_id`. A value that the source does not report is left empty.

| Column | Meaning | Unit |
|---|---|---|
| `date` | UTC date of the run that fetched the row | YYYY-MM-DD |
| `item_id` | ICAO airport code (the key) | text |
| `item` | Destination name | text |
| `source` | Source the row came from | text |
| `airport` | Airport name | text |
| `region` | USA, Mexico & Caribbean, or Europe | text |
| `vibe` | Kind of trip the destination is known for | text |
| `obs_time_utc` | Time of the weather observation | UTC, ISO 8601 |
| `temp_f` | Air temperature (converted from °C) | °F |
| `temp_c` | Air temperature | °C |
| `dewpoint_c` | Dew point | °C |
| `humidity_pct` | Relative humidity, computed from temperature and dew point (Magnus formula) | % |
| `wind_kt` | Sustained wind speed | knots |
| `gust_kt` | Wind gust (empty when there are no gusts) | knots |
| `visibility_mi` | Visibility (10 means "10 or more") | statute miles |
| `ceiling_ft` | Lowest broken, overcast or obscured cloud layer (empty means no ceiling) | feet above ground |
| `pressure_hpa` | Altimeter setting | hectopascals |
| `flight_category` | VFR, MVFR, IFR or LIFR: the source's value, or, if missing, computed from ceiling and visibility with the FAA rules | category |

## The status file: `data/status.json`

Describes the latest run: `run_time` (UTC), `run_date`, `first_run_date` (date of the earliest raw file),
`days_with_success` (number of different dates with a raw file), `items` (rows on the run date), `new_today` and
`gone_today` (item_ids that appeared or disappeared since the previous date), `previous_date`, and `sources` (one entry per
source with `name`, `ok`, `count`, `format`, and `error`).

## Move rule

A **move** is the absolute change in **temperature (`temp_f`, °F)** for an airport between the run date and the previous
date in the history. Only airports with a temperature on both dates count. Every day's issue lists:

* the **5 biggest moves** (largest absolute change first; ties broken by `item_id`), with the old and new values,
* every airport whose **flight category changed** (for example VFR → IFR),
* every airport that **appeared** or **disappeared**.

The issue is titled with the date (for example `2026-11-17`). It is opened every day, even on a day with no changes, and the
previous day's issue is closed. The Today page uses the same rule.

## Each daily run

1. Calls every source and saves exactly what it returned, gzipped, to `data/raw/<date>/<source>.<format>.gz`. A source that
   fails (network error, bad JSON, or none of the tracked airports) writes no raw file, and the run goes on. Every result,
   success or failure, goes into `data/status.json` and is appended to the log `data/runs.csv`.
2. Rebuilds `data/history.csv` from the raw files alone.
3. Writes `data/status.json`.
4. Opens (or updates) today's issue and closes the previous one.
5. The workflow commits `data/`.

A second run on the same UTC date overwrites that day's raw file, rebuilds the history and updates the same issue, so each
day counts once. If the second run's fetch fails, the earlier raw file from that day is kept.

## Files

| Path | What it does |
|---|---|
| `tracker/config.py` | The airports (items), history columns, move rule settings and file paths |
| `tracker/sources.py` | Each source: how it is downloaded and how its raw file becomes rows with the common columns |
| `tracker/build.py` | Builds `data/history.csv` from the raw files (`python -m tracker.build`) |
| `tracker/moves.py` | The move rule: biggest moves, flight category changes, appeared and disappeared |
| `tracker/status.py` | Writes `data/status.json` |
| `tracker/issue.py` | Writes the issue text and opens, updates and closes issues through the GitHub API |
| `tracker/run.py` | The daily pipeline (`python -m tracker.run`) |
| `tests/test_sources.py` | Tests the conversion of the source to the common columns |
| `tests/test_moves.py` | Tests the move rule |
| `tests/test_history.py` | Tests the history logic: build from raw files, reproducibility, a second run on the same day, failing sources, status |
| `tests/test_issue.py` | Tests the issue text |
| `tests/fixtures/metar_sample.json` | A sample source response used by the tests |
| `.github/workflows/daily.yml` | Runs the pipeline every day (plus a backup run), saves the globe's map file once, and commits `data/` |
| `.github/workflows/tests.yml` | Runs the tests on every push |
| `data/raw/<date>/*.gz` | Raw source responses, one folder per day |
| `data/history.csv` | The history, one row per airport per day |
| `data/status.json` | The latest run |
| `data/runs.csv` | Log of every source call in every run (time, source, ok, count, error) |
| `index.html` | Today page: last run, source status, counts, the flight globe and departures board, latest values with changes, biggest moves |
| `browse.html` | Browse page: filters (region, vibe, flight category), search, sort by every numeric column, star shortlist saved in the browser |
| `trends.html` | Trends page: a chart of every numeric value over the days with an item picker, and six findings computed from the history |
| `assets/style.css` | The shared fonts, colors and layout |
| `assets/app.js` | Shared code: loading and parsing the data files, the move rule, the shortlist, formatting |
| `assets/charts.js` | The line and bar charts (plain SVG, no outside library, so they work offline) |
| `assets/globe.js` | The 3D flight globe: airport coordinates, great-circle routes from XNA, animated planes, click-for-boarding-pass, departures board |
| `assets/decor.js` | The flight and wedding illustrations (plane with a "Bride Tribe" banner, diamond ring, champagne) and vibe icons |
| `assets/vendor/d3-geo.min.js`, `assets/vendor/d3-array.min.js` | d3-geo 3.1.1 and d3-array 3.2.4 (ISC license), used for the globe's projection |
| `assets/land-110m.json` | World coastlines (world-atlas, Natural Earth 1:110m, public domain), saved by the daily workflow on its first run |
| `manifest.webmanifest` | Web app manifest that makes the site installable |
| `sw.js` | Service worker: caches the site, loads data from the network when online and from the cache when offline |
| `icons/` | App icons |
| `requirements.txt` | Python packages for the tests |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
