"""The daily GitHub Issue: titled with the date, lists what moved, closes the previous day's issue."""

import json
import os
import re
import urllib.request

from .config import MOVE_LIMIT

API = "https://api.github.com"
TITLE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _fmt(v):
    return "" if v is None else f"{v:.1f}"


def render_body(diff, status, site_url=""):
    lines = []
    date, prev = diff["date"], diff["previous_date"]
    lines.append(f"## ✈️ Jetset Tracker: {date}")
    lines.append("")
    ok = ", ".join(f"{s['name']} {'✅' if s['ok'] else '❌'} ({s['count']} rows)" for s in status["sources"])
    lines.append(f"Run at {status['run_time']} UTC. Sources: {ok}. "
                 f"Airports today: {status['items']}. Days with data: {status['days_with_success']}.")
    lines.append("")
    if prev is None:
        lines.append("This is the first day in the history, so there is nothing to compare yet.")
    else:
        lines.append(f"### Biggest temperature moves since {prev}")
        lines.append(f"Rule: absolute change in temperature (°F) since the previous run; top {MOVE_LIMIT} shown.")
        lines.append("")
        if diff["moves"]:
            lines.append("| Destination | Airport | Old °F | New °F | Change |")
            lines.append("|---|---|---:|---:|---:|")
            for m in diff["moves"]:
                sign = "+" if m["change"] > 0 else ""
                lines.append(f"| {m['item']} | {m['item_id']} | {_fmt(m['old'])} | {_fmt(m['new'])} | {sign}{m['change']:.1f} |")
        else:
            lines.append("No changes today.")
        lines.append("")
        lines.append("### Flight category changes")
        if diff["category_changes"]:
            for c in diff["category_changes"]:
                lines.append(f"- {c['item']} ({c['item_id']}): {c['old'] or '–'} → {c['new'] or '–'}")
        else:
            lines.append("None.")
    lines.append("")
    lines.append("### Appeared / disappeared")
    new = ", ".join(f"{n['item']} ({n['item_id']})" for n in diff["new"]) or "none"
    gone = ", ".join(f"{g['item']} ({g['item_id']})" for g in diff["gone"]) or "none"
    lines.append(f"- Appeared: {new}")
    lines.append(f"- Disappeared: {gone}")
    if site_url:
        lines.append("")
        lines.append(f"[Open the site]({site_url})")
    return "\n".join(lines) + "\n"


def _request(method, url, token, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jetset-tracker",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if body else None


def publish(date, body, repo=None, token=None):
    """Open (or update) the issue titled `date`, and close every other open date-titled issue."""
    repo = repo or os.environ.get("GITHUB_REPOSITORY")
    token = token or os.environ.get("GITHUB_TOKEN")
    if not repo or not token:
        print("no GITHUB_REPOSITORY/GITHUB_TOKEN: skipping the issue")
        return None
    base = f"{API}/repos/{repo}/issues"
    open_issues = _request("GET", f"{base}?state=open&per_page=100", token) or []
    open_issues = [i for i in open_issues if "pull_request" not in i and TITLE_RE.match(i["title"])]
    today = next((i for i in open_issues if i["title"] == date), None)
    if today:
        _request("PATCH", f"{base}/{today['number']}", token, {"body": body})
        number = today["number"]
    else:
        number = _request("POST", base, token, {"title": date, "body": body})["number"]
    for issue in open_issues:
        if issue["title"] != date:
            _request("PATCH", f"{base}/{issue['number']}", token,
                     {"state": "closed", "state_reason": "completed"})
    return number
