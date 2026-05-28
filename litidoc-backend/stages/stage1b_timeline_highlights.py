from __future__ import annotations

import json
import re
from pathlib import Path

from config import settings
from core.claude_client import ClaudeClient
from core.date_utils import normalize_date_fields, sort_events_chronologically

PROMPT_PATH = (
    Path(__file__).resolve().parent.parent / "prompts" / "stage1b_timeline_highlights.txt"
)
SYSTEM_PROMPT = (
    "You are a litigation damages analyst. "
    "Return ONLY valid JSON with an events array. "
    "Do not include markdown fences or commentary."
)
TARGET_HIGHLIGHTS = 9
MAX_TIMELINE_EVENTS_IN_PROMPT = 400


def _timeline_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline.json"


def _highlights_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline_highlights.json"


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _load_timeline(job_id: str) -> dict:
    timeline_path = _timeline_path(job_id)
    if not timeline_path.exists():
        raise FileNotFoundError(f"Timeline not found: {timeline_path}")
    return json.loads(timeline_path.read_text(encoding="utf-8"))


def _strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _compact_event_for_prompt(event: dict) -> dict:
    return {
        "event_id": event.get("event_id"),
        "date": event.get("date") or event.get("date_text"),
        "description": (event.get("description") or "")[:500],
        "citation": event.get("citation"),
    }


def _build_timeline_payload(timeline: dict) -> dict:
    events = timeline.get("events", [])
    if len(events) > MAX_TIMELINE_EVENTS_IN_PROMPT:
        # Keep chronological coverage when truncating for the model.
        step = max(1, len(events) // MAX_TIMELINE_EVENTS_IN_PROMPT)
        events = events[::step][:MAX_TIMELINE_EVENTS_IN_PROMPT]

    return {
        "job_id": timeline.get("job_id"),
        "total_events": timeline.get("total_events", len(timeline.get("events", []))),
        "events": [_compact_event_for_prompt(event) for event in events],
    }


def _parse_highlights_response(response: str) -> list[dict]:
    cleaned = _strip_code_fence(response)
    parsed = json.loads(cleaned)
    if isinstance(parsed, list):
        raw_events = parsed
    elif isinstance(parsed, dict):
        raw_events = parsed.get("events", [])
    else:
        raise ValueError("Highlights response must be a JSON object or array.")

    if not isinstance(raw_events, list):
        raise ValueError("Highlights events must be a JSON array.")

    highlights: list[dict] = []
    for item in raw_events:
        if not isinstance(item, dict):
            continue
        source_id = str(item.get("source_event_id", "")).strip()
        if not source_id:
            continue
        highlights.append(
            {
                "rank": int(item.get("rank", len(highlights) + 1)),
                "source_event_id": source_id,
                "date": str(item.get("date", "")).strip(),
                "brief_explanation": str(item.get("brief_explanation", "")).strip(),
            }
        )

    highlights.sort(key=lambda row: row.get("rank", 999))
    return highlights[:TARGET_HIGHLIGHTS]


def _enrich_highlights(
    ranked: list[dict],
    timeline: dict,
) -> list[dict]:
    by_id = {event.get("event_id"): event for event in timeline.get("events", [])}
    enriched: list[dict] = []

    for row in ranked:
        source = by_id.get(row["source_event_id"])
        if not source:
            continue

        date_text = source.get("date_text") or source.get("date") or row.get("date")
        enriched.append(
            {
                "rank": row.get("rank", len(enriched) + 1),
                "source_event_id": row["source_event_id"],
                "date": source.get("date", row.get("date")),
                "date_text": date_text,
                "description": source.get("description", ""),
                "brief_explanation": row.get("brief_explanation", ""),
                "citation": source.get("citation", ""),
                "source_doc": source.get("source_doc"),
                "page": source.get("page"),
            }
        )

    return enriched


def _apply_normalized_dates(event: dict) -> dict:
    raw_date = str(event.get("date_text") or event.get("date") or "").strip()
    sort_date, display_date = normalize_date_fields(raw_date)
    updated = dict(event)
    updated["date"] = sort_date
    updated["date_text"] = display_date
    return updated


def _finalize_highlights(events: list[dict]) -> list[dict]:
    """Normalize highlight dates and order left-to-right chronologically."""
    normalized = [_apply_normalized_dates(event) for event in events]
    ordered = sort_events_chronologically(normalized)
    for index, event in enumerate(ordered, start=1):
        event["rank"] = index
    return ordered


def _heuristic_highlights(timeline: dict, count: int = TARGET_HIGHLIGHTS) -> list[dict]:
    """Pick spread + keyword-weighted events when Claude is unavailable."""
    events = list(timeline.get("events", []))
    if not events:
        return []

    keywords = (
        "collision",
        "injury",
        "terminated",
        "termination",
        "disability",
        "std",
        "ltd",
        "surgery",
        "emergency",
        "court",
        "discover",
        "settlement",
        "bonus",
        "income",
        "wage",
        "complaint",
        "affidavit",
        "expert",
        "fired",
        "laid off",
        "damages",
    )
    low_priority = (
        "was born",
        "date of birth",
        "birth certificate",
        "social security",
        "driver's license",
    )

    def score(event: dict) -> int:
        text = f"{event.get('description', '')} {event.get('date', '')}".lower()
        value = sum(2 for word in keywords if word in text)
        value -= sum(4 for phrase in low_priority if phrase in text)
        return value

    scored = sorted(
        enumerate(events),
        key=lambda pair: (score(pair[1]), -pair[0]),
        reverse=True,
    )

    n = min(count, len(events))
    if n == 1:
        indices = [0]
    else:
        evenly = [round(i * (len(events) - 1) / (n - 1)) for i in range(n)]
        top_scored = [idx for idx, _ in scored[: max(n // 2, 1)]]
        indices = sorted(set(evenly + top_scored))[:n]

    selected = [events[i] for i in indices]

    highlights: list[dict] = []
    for rank, event in enumerate(selected, start=1):
        desc = (event.get("description") or "").strip()
        if len(desc) > 100:
            brief = desc[:97].rstrip() + "…"
        else:
            brief = desc or "Key event in the case chronology."

        highlights.append(
            {
                "rank": rank,
                "source_event_id": event.get("event_id"),
                "date": event.get("date"),
                "date_text": event.get("date_text") or event.get("date"),
                "description": desc,
                "brief_explanation": brief,
                "citation": event.get("citation", ""),
                "source_doc": event.get("source_doc"),
                "page": event.get("page"),
            }
        )

    return highlights


def summarize_timeline_highlights(
    job_id: str,
    timeline: dict | None = None,
    *,
    use_heuristic_only: bool = False,
) -> dict:
    """
    Build a condensed timeline (~9 key events) from the full Stage 1 timeline.
    Persists to timeline_highlights.json.
    """
    if not job_id.strip():
        raise ValueError("job_id is required.")

    if timeline is None:
        timeline = _load_timeline(job_id)

    source_events = timeline.get("events", [])
    source_total = timeline.get("total_events", len(source_events))

    if not source_events:
        result = {
            "job_id": job_id,
            "source_total_events": 0,
            "highlights_count": 0,
            "events": [],
        }
        _highlights_path(job_id).parent.mkdir(parents=True, exist_ok=True)
        _highlights_path(job_id).write_text(json.dumps(result, indent=2), encoding="utf-8")
        return result

    target = min(TARGET_HIGHLIGHTS, len(source_events))
    enriched: list[dict] = []

    if not use_heuristic_only:
        try:
            template = _load_prompt_template()
            payload = _build_timeline_payload(timeline)
            timeline_json = json.dumps(payload, indent=2, ensure_ascii=False)
            prompt = (
                template.replace("{timeline_json}", timeline_json)
                .replace("{total_events}", str(source_total))
            )

            client = ClaudeClient()
            response = client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPT,
                max_tokens=4000,
            )
            ranked = _parse_highlights_response(response)
            enriched = _enrich_highlights(ranked, timeline)

            if len(enriched) < min(target, len(source_events)):
                print(
                    f"[Stage1b] Claude returned {len(enriched)} highlights; "
                    "filling with heuristic picks"
                )
                existing_ids = {row["source_event_id"] for row in enriched}
                for row in _heuristic_highlights(timeline, count=target):
                    if row["source_event_id"] in existing_ids:
                        continue
                    row["rank"] = len(enriched) + 1
                    enriched.append(row)
                    existing_ids.add(row["source_event_id"])
                    if len(enriched) >= target:
                        break
        except Exception as error:
            print(f"[Stage1b] Claude highlights failed: {error}")

    if not enriched:
        enriched = _heuristic_highlights(timeline, count=target)

    enriched = _finalize_highlights(enriched[:target])

    result = {
        "job_id": job_id,
        "source_total_events": source_total,
        "highlights_count": len(enriched),
        "events": enriched,
    }

    out_path = _highlights_path(job_id)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(
        f"[Stage1b] highlights saved job_id={job_id} "
        f"count={result['highlights_count']} from={source_total}"
    )
    return result
