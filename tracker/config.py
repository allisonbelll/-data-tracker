"""What the tracker watches: the airports (items), the history columns, and the move rule settings."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
HISTORY_PATH = DATA_DIR / "history.csv"
STATUS_PATH = DATA_DIR / "status.json"
RUNS_LOG_PATH = DATA_DIR / "runs.csv"

# The items. The key (item_id) is the airport's four-letter ICAO code, which never changes
# from one day to the next, so the same airport lines up day after day.
# item_id: (item name, airport, region, vibe)
AIRPORTS = {
    "KBNA": ("Nashville", "Nashville International", "USA", "Bachelorette"),
    "KLAS": ("Las Vegas", "Harry Reid International", "USA", "Bachelorette"),
    "KAUS": ("Austin", "Austin-Bergstrom International", "USA", "Bachelorette"),
    "KMIA": ("Miami", "Miami International", "USA", "Beach"),
    "KPHX": ("Scottsdale", "Phoenix Sky Harbor International", "USA", "Desert & spa"),
    "KCHS": ("Charleston", "Charleston International", "USA", "Southern charm"),
    "KSAV": ("Savannah", "Savannah/Hilton Head International", "USA", "Southern charm"),
    "KJFK": ("New York City", "John F. Kennedy International", "USA", "City"),
    "PHNL": ("Honolulu", "Daniel K. Inouye International", "USA", "Island"),
    "PHOG": ("Maui", "Kahului Airport", "USA", "Island"),
    "MMUN": ("Cancún", "Cancún International", "Mexico & Caribbean", "Beach"),
    "MMSD": ("Cabo San Lucas", "Los Cabos International", "Mexico & Caribbean", "Beach"),
    "TJSJ": ("San Juan", "Luis Muñoz Marín International", "Mexico & Caribbean", "Island"),
    "MYNN": ("Nassau", "Lynden Pindling International", "Mexico & Caribbean", "Island"),
    "LFPG": ("Paris", "Charles de Gaulle", "Europe", "City"),
    "LIRF": ("Rome", "Leonardo da Vinci–Fiumicino", "Europe", "City"),
    "LEBL": ("Barcelona", "Josep Tarradellas Barcelona–El Prat", "Europe", "Beach"),
    "LPPT": ("Lisbon", "Humberto Delgado", "Europe", "City"),
    "LGAV": ("Athens", "Athens International (Greek islands gateway)", "Europe", "Island"),
}

# The history file. The first four columns are fixed by the assignment.
COLUMNS = [
    "date",             # UTC date of the run, YYYY-MM-DD
    "item_id",          # ICAO airport code (the key)
    "item",             # destination name
    "source",           # source name
    "airport",          # airport name
    "region",           # USA / Mexico & Caribbean / Europe
    "vibe",             # kind of trip
    "obs_time_utc",     # time of the weather observation, UTC ISO 8601
    "temp_f",           # air temperature, °F
    "temp_c",           # air temperature, °C
    "dewpoint_c",       # dew point, °C
    "humidity_pct",     # relative humidity, %
    "wind_kt",          # sustained wind speed, knots
    "gust_kt",          # wind gust, knots (empty when no gusts)
    "visibility_mi",    # visibility, statute miles (10 means 10 or more)
    "ceiling_ft",       # lowest broken/overcast cloud layer, feet above ground (empty = no ceiling)
    "pressure_hpa",     # altimeter setting, hectopascals
    "flight_category",  # VFR / MVFR / IFR / LIFR
]

NUMERIC_COLUMNS = [
    "temp_f", "temp_c", "dewpoint_c", "humidity_pct", "wind_kt", "gust_kt",
    "visibility_mi", "ceiling_ft", "pressure_hpa",
]

# Move rule: a move is the absolute change in temp_f between an airport's value on the
# latest run date and its value on the previous run date. The issue lists the MOVE_LIMIT
# largest moves (ties broken by item_id), every airport whose flight category changed,
# and every airport that appeared or disappeared.
MOVE_COLUMN = "temp_f"
MOVE_LIMIT = 5

USER_AGENT = "jetset-tracker (github.com/allisonbelll/-data-tracker; class project)"
