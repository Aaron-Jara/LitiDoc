from __future__ import annotations

import json
import re
from pathlib import Path

from config import settings
from core.claude_client import ClaudeClient

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "stage2_background.txt"
SYSTEM_PROMPT = (
    "You are a legal damages report writer. "
    "Return ONLY valid JSON with keys: introduction, incident_description, "
    "medical_treatment, employment_history, full_text. "
    "Do not include markdown fences or commentary."
)
MIN_WORD_COUNT = 600
MAX_WORD_COUNT = 1200
MAX_LENGTH_RETRIES = 2


def _timeline_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline.json"


def _background_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "background.json"


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _load_timeline(job_id: str) -> dict:
    timeline_path = _timeline_path(job_id)
    if not timeline_path.exists():
        raise FileNotFoundError(f"Timeline not found: {timeline_path}")
    return json.loads(timeline_path.read_text(encoding="utf-8"))


def _format_timeline_for_prompt(timeline: dict) -> str:
    lines: list[str] = []
    for event in timeline.get("events", []):
        date_text = event.get("date_text") or event.get("date", "unspecified")
        description = event.get("description", "").strip()
        citation = event.get("citation", "")
        lines.append(f"- {date_text}: {description} [{citation}]")
    return "\n".join(lines)


def _strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _parse_background_response(response: str) -> dict:
    cleaned = _strip_code_fence(response)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Background response must be a JSON object.")

    sections = {
        "introduction": str(parsed.get("introduction", "")).strip(),
        "incident_description": str(parsed.get("incident_description", "")).strip(),
        "medical_treatment": str(parsed.get("medical_treatment", "")).strip(),
        "employment_history": str(parsed.get("employment_history", "")).strip(),
    }

    full_text = str(parsed.get("full_text", "")).strip()
    if not full_text:
        full_text = "\n\n".join(
            section for section in sections.values() if section
        ).strip()

    return {**sections, "full_text": full_text}


def _build_prompt(
    template: str,
    timeline: dict,
    *,
    extra_instruction: str | None = None,
) -> str:
    timeline_payload = {
        "job_id": timeline.get("job_id"),
        "total_events": timeline.get("total_events", len(timeline.get("events", []))),
        "events_readable": _format_timeline_for_prompt(timeline),
        "events": timeline.get("events", []),
    }
    timeline_json = json.dumps(timeline_payload, indent=2, ensure_ascii=False)
    prompt = template.replace("{timeline_json}", timeline_json)

    if extra_instruction:
        prompt = f"{prompt}\n\nAdditional instruction:\n{extra_instruction}"
    return prompt


def write_background(job_id: str, timeline: dict | None = None) -> dict:
    """
    Generate Background prose from timeline events and persist to background.json.
    """
    if not job_id.strip():
        raise ValueError("job_id is required.")

    if timeline is None:
        timeline = _load_timeline(job_id)
    elif not timeline.get("events"):
        raise ValueError("timeline contains no events.")

    prompt_template = _load_prompt_template()
    client = ClaudeClient()
    extra_instruction: str | None = None
    parsed: dict | None = None

    for attempt in range(1, MAX_LENGTH_RETRIES + 2):
        prompt = _build_prompt(
            prompt_template,
            timeline,
            extra_instruction=extra_instruction,
        )
        response = client.generate(
            prompt=prompt,
            system_prompt=SYSTEM_PROMPT,
            max_tokens=8000,
        )
        parsed = _parse_background_response(response)
        words = _word_count(parsed["full_text"])

        if MIN_WORD_COUNT <= words <= MAX_WORD_COUNT:
            break

        if words < MIN_WORD_COUNT and attempt <= MAX_LENGTH_RETRIES:
            extra_instruction = (
                "The previous draft was too short. Expand each section with additional "
                "detail drawn only from the timeline events. Target 900-1100 words total. "
                "Make it longer while keeping citations inline."
            )
            print(
                f"[Stage2] background too short ({words} words), retrying attempt={attempt + 1}"
            )
            continue

        if words > MAX_WORD_COUNT:
            print(
                f"[Stage2] warning: background exceeds max words ({words}>{MAX_WORD_COUNT})"
            )
        break

    if parsed is None:
        raise RuntimeError("Failed to generate background section.")

    word_count = _word_count(parsed["full_text"])
    result = {
        "job_id": job_id,
        "introduction": parsed["introduction"],
        "incident_description": parsed["incident_description"],
        "medical_treatment": parsed["medical_treatment"],
        "employment_history": parsed["employment_history"],
        "full_text": parsed["full_text"],
        "word_count": word_count,
        "word_count_valid": MIN_WORD_COUNT <= word_count <= MAX_WORD_COUNT,
    }

    background_path = _background_path(job_id)
    background_path.parent.mkdir(parents=True, exist_ok=True)
    background_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print(
        f"[Stage2] background saved job_id={job_id} "
        f"word_count={word_count} valid={result['word_count_valid']}"
    )
    return result
