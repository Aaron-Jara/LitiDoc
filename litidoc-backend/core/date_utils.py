from __future__ import annotations

import re
from datetime import datetime

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
YEAR_ONLY_RE = re.compile(r"^\d{4}$")

DATE_FORMATS = (
    "%Y-%m-%d",
    "%B %d, %Y",
    "%b %d, %Y",
    "%d %B %Y",
    "%d %b %Y",
    "%m/%d/%Y",
    "%m-%d-%Y",
)

RELATIVE_DATE_LABELS = frozenset(
    {
        "unspecified",
        "unknown",
        "post-termination",
        "post termination",
        "undated",
        "ongoing",
    }
)


def _try_parse_datetime(value: str) -> datetime | None:
    normalized = value.strip()
    if not normalized:
        return None

    if ISO_DATE_RE.match(normalized):
        try:
            return datetime.strptime(normalized, "%Y-%m-%d")
        except ValueError:
            return None

    if YEAR_ONLY_RE.match(normalized):
        try:
            return datetime(int(normalized), 1, 1)
        except ValueError:
            return None

    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(normalized, fmt)
        except ValueError:
            continue

    return None


def format_display_date(value: str) -> str:
    """Normalize a date string to a consistent human-readable label."""
    normalized = value.strip()
    if not normalized:
        return "Unspecified"

    lowered = normalized.lower()
    if lowered in RELATIVE_DATE_LABELS or lowered == "unspecified":
        if "post" in lowered and "termin" in lowered:
            return "Post-termination"
        return normalized.title()

    parsed = _try_parse_datetime(normalized)
    if parsed is None:
        return normalized

    if YEAR_ONLY_RE.match(normalized):
        return normalized

    # Windows-compatible day without leading zero
    return parsed.strftime("%b %d, %Y").replace(" 0", " ")


def normalize_date_fields(value: str) -> tuple[str, str]:
    """
    Return (sort_date, display_date).

    sort_date is ISO YYYY-MM-DD when parseable, YYYY for year-only,
    or the original token for relative/unknown dates.
    """
    normalized = value.strip()
    if not normalized:
        return ("unspecified", "Unspecified")

    lowered = normalized.lower()
    if lowered in RELATIVE_DATE_LABELS:
        if "post" in lowered and "termin" in lowered:
            return ("post-termination", "Post-termination")
        return (lowered, normalized.title())

    parsed = _try_parse_datetime(normalized)
    if parsed is None:
        return (normalized.lower(), normalized)

    if YEAR_ONLY_RE.match(normalized):
        return (normalized, normalized)

    iso = parsed.strftime("%Y-%m-%d")
    return (iso, format_display_date(iso))


def parse_sortable_date(date_value: str) -> tuple[int, object]:
    """Sort key compatible with stage1 timeline ordering."""
    normalized = date_value.strip()
    if not normalized or normalized.lower() in RELATIVE_DATE_LABELS | {"unspecified"}:
        return (2, normalized.lower())

    if ISO_DATE_RE.match(normalized):
        try:
            return (0, datetime.strptime(normalized, "%Y-%m-%d"))
        except ValueError:
            pass

    parsed = _try_parse_datetime(normalized)
    if parsed is not None:
        return (0, parsed)

    if YEAR_ONLY_RE.match(normalized):
        try:
            return (1, int(normalized))
        except ValueError:
            pass

    return (1, normalized.lower())


def sort_events_chronologically(events: list[dict]) -> list[dict]:
    return sorted(events, key=lambda event: parse_sortable_date(str(event.get("date", ""))))
