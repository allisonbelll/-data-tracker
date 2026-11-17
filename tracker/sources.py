"""Sources: how each one is downloaded and how its raw file becomes rows with the common columns.

Every source has a name, a raw format (the file extension it is saved under), a fetch()
that returns the exact bytes the source sent, and a parse() that turns those bytes into rows.
"""

import json
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable

from .config import AIRPORTS, USER_AGENT

METAR_URL = "https://aviationweather.gov/api/data/metar?ids={ids}&format=json"


def http_get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ---------- helpers ----------

def _num(value):
    """Turn a source value into a float. '10+' -> 10.0, 'VRB' or '' or None -> None."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().rstrip("+")
    try:
        return float(text)
    except ValueError:
        return None


def _round(value, digits=1):
    return None if value is None else round(value, digits)


def _int(value):
    return None if value is None else int(round(value))


def humidity(temp_c, dewpoint_c):
    """Relative humidity (%) from temperature and dew point, Magnus formula."""
    if temp_c is None or dewpoint_c is None:
        return None
    a, b = 17.625, 243.04
    import math
    rh = 100 * math.exp(a * dewpoint_c / (b + dewpoint_c)) / math.exp(a * temp_c / (b + temp_c))
    return _int(min(rh, 100.0))


def ceiling(clouds, vert_vis=None):
    """Lowest broken (BKN), overcast (OVC) or obscured layer in feet; vertical visibility counts too."""
    bases = []
    for layer in clouds or []:
        cover = str(layer.get("cover", "")).upper()
        base = _num(layer.get("base"))
        if cover in ("BKN", "OVC", "OVX") and base is not None:
            bases.append(base)
    vv = _num(vert_vis)
    if vv is not None:
        bases.append(vv)
    return _int(min(bases)) if bases else None


def flight_category(ceiling_ft, visibility_mi):
    """FAA flight category from ceiling (ft) and visibility (statute miles)."""
    c = ceiling_ft if ceiling_ft is not None else 100000
    v = visibility_mi if visibility_mi is not None else 100
    if c < 500 or v < 1:
        return "LIFR"
    if c < 1000 or v < 3:
        return "IFR"
    if c <= 3000 or v <= 5:
        return "MVFR"
    return "VFR"


def _obs_time(record):
    t = record.get("obsTime")
    if isinstance(t, (int, float)):
        return datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rt = record.get("reportTime")
    if rt:
        return str(rt).replace(".000Z", "Z").replace(" ", "T")
    return None


# ---------- aviationweather.gov METAR source ----------

def fetch_metar():
    ids = ",".join(sorted(AIRPORTS))  # ask only for the airports we track
    return http_get(METAR_URL.format(ids=ids))


def parse_metar(raw_bytes, date):
    """Turn the METAR JSON list into one row per tracked airport for `date`."""
    records = json.loads(raw_bytes.decode("utf-8"))
    if not isinstance(records, list):
        raise ValueError("METAR response is not a JSON list")
    latest = {}
    for rec in records:
        if not isinstance(rec, dict):
            continue
        icao = str(rec.get("icaoId", "")).upper()
        if icao not in AIRPORTS:  # keep only the airports we track
            continue
        key = rec.get("obsTime") or 0
        if icao not in latest or key > (latest[icao].get("obsTime") or 0):
            latest[icao] = rec
    rows = []
    for icao in sorted(latest):
        rec = latest[icao]
        name, airport, region, vibe = AIRPORTS[icao]
        temp_c = _num(rec.get("temp"))
        dew_c = _num(rec.get("dewp"))
        vis = _num(rec.get("visib"))
        ceil_ft = ceiling(rec.get("clouds"), rec.get("vertVis"))
        cat = rec.get("fltCat") or flight_category(ceil_ft, vis)
        rows.append({
            "date": date,
            "item_id": icao,
            "item": name,
            "source": "aviationweather",
            "airport": airport,
            "region": region,
            "vibe": vibe,
            "obs_time_utc": _obs_time(rec),
            "temp_f": _round(temp_c * 9 / 5 + 32) if temp_c is not None else None,
            "temp_c": _round(temp_c),
            "dewpoint_c": _round(dew_c),
            "humidity_pct": humidity(temp_c, dew_c),
            "wind_kt": _int(_num(rec.get("wspd"))),
            "gust_kt": _int(_num(rec.get("wgst"))),
            "visibility_mi": _round(vis),
            "ceiling_ft": ceil_ft,
            "pressure_hpa": _round(_num(rec.get("altim"))),
            "flight_category": str(cat).upper(),
        })
    return rows


@dataclass
class Source:
    name: str
    fmt: str           # raw file extension, e.g. "json"
    fetch: Callable[[], bytes]
    parse: Callable[[bytes, str], list]
    description: str = ""


SOURCES = [
    Source(
        name="aviationweather",
        fmt="json",
        fetch=fetch_metar,
        parse=parse_metar,
        description="NOAA Aviation Weather Center METAR API (JSON), latest observation per airport",
    ),
]

SOURCE_BY_NAME = {s.name: s for s in SOURCES}
