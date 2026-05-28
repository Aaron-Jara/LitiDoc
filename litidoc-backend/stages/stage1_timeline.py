from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import fitz

from config import settings
from core.chunker import ChunkProcessor
from core.normalizer import PAGE_BREAK, normalize_text
from core.parallel_processor import ParallelProcessor
from models.document import DocIndex, IndexList

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "stage1_timeline.txt"
SYSTEM_PROMPT = (
    "You are a legal document analyst. "
    "Return ONLY a valid JSON array of event objects with keys: date, description, page. "
    "Do not include markdown fences or commentary."
)
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _timeline_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline.json"


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _extract_full_text(file_path: str) -> str:
    page_texts: list[str] = []
    with fitz.open(file_path) as document:
        for page in document:
            page_texts.append(normalize_text(page.get_text("text")))
    return PAGE_BREAK.join(page_texts)


def _page_range_start(page_range: str) -> int:
    if "-" in page_range:
        return int(page_range.split("-", maxsplit=1)[0])
    return int(page_range)


def _build_chunks_for_document(document: DocIndex) -> list[dict]:
    full_text = _extract_full_text(document.file_path)
    if not full_text.strip():
        return []

    processor = ChunkProcessor()
    normalized = {"text": full_text}
    chunks = processor.process_document(normalized)

    enriched: list[dict] = []
    for chunk in chunks:
        enriched.append(
            {
                **chunk,
                "chunk_text": chunk.get("text", ""),
                "reference_tag": document.reference_tag,
                "source_doc": document.reference_tag,
                "original_name": document.original_name,
            }
        )
    return enriched


def _strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _parse_events_from_response(response: str) -> list[dict]:
    if not response or not response.strip():
        return []

    cleaned = _strip_code_fence(response)
    parsed = json.loads(cleaned)

    if isinstance(parsed, dict):
        for key in ("events", "data", "results"):
            if isinstance(parsed.get(key), list):
                parsed = parsed[key]
                break
        else:
            return []

    if not isinstance(parsed, list):
        return []

    events: list[dict] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        description = str(item.get("description", "")).strip()
        if not description:
            continue
        events.append(
            {
                "date": str(item.get("date", "unspecified")).strip() or "unspecified",
                "description": description,
                "page": item.get("page"),
            }
        )
    return events


def _normalize_description(description: str) -> str:
    return re.sub(r"\s+", " ", description).strip().lower()


def _dedupe_key(event: dict) -> tuple[str, str]:
    return (
        str(event.get("date", "unspecified")).strip().lower(),
        _normalize_description(str(event.get("description", ""))),
    )


def _parse_sortable_date(date_value: str) -> tuple[int, datetime | str]:
    normalized = date_value.strip()
    if not normalized or normalized.lower() == "unspecified":
        return (2, "")

    if ISO_DATE_RE.match(normalized):
        try:
            return (0, datetime.strptime(normalized, "%Y-%m-%d"))
        except ValueError:
            pass

    return (1, normalized.lower())


def _coerce_page_number(page_value: object, fallback_page: int) -> int:
    if isinstance(page_value, int):
        return max(1, page_value)
    if isinstance(page_value, str) and page_value.isdigit():
        return max(1, int(page_value))
    return max(1, fallback_page)


def _build_timeline_event(
    raw_event: dict,
    *,
    reference_tag: str,
    fallback_page: int,
    event_number: int,
) -> dict:
    date_text = str(raw_event.get("date", "unspecified")).strip() or "unspecified"
    page = _coerce_page_number(raw_event.get("page"), fallback_page)

    return {
        "event_id": f"evt_{event_number:03d}",
        "date": date_text,
        "date_text": date_text,
        "description": str(raw_event.get("description", "")).strip(),
        "citation": f"Doc {reference_tag}, p. {page}",
        "source_doc": reference_tag,
        "page": page,
    }


def extract_timeline(job_id: str, index: IndexList | dict) -> dict:
    """
    Extract, deduplicate, and sort timeline events for all indexed documents.
    """
    if isinstance(index, dict):
        index = IndexList.model_validate(index)

    if not job_id.strip():
        raise ValueError("job_id is required.")
    if not index.documents:
        raise ValueError("index contains no documents.")

    prompt_template = _load_prompt_template()
    processor = ParallelProcessor(max_tokens=8000)

    all_chunks: list[dict] = []
    for document in index.documents:
        all_chunks.extend(_build_chunks_for_document(document))

    if not all_chunks:
        empty_result = {"job_id": job_id, "events": [], "total_events": 0}
        _timeline_path(job_id).parent.mkdir(parents=True, exist_ok=True)
        _timeline_path(job_id).write_text(
            json.dumps(empty_result, indent=2),
            encoding="utf-8",
        )
        return empty_result

    chunk_results = processor.process_chunks(
        all_chunks,
        prompt_template=prompt_template,
        system_prompt=SYSTEM_PROMPT,
    )

    deduped_events: dict[tuple[str, str], dict] = {}
    for chunk_result in chunk_results:
        if chunk_result.get("error"):
            print(
                f"[Stage1] chunk {chunk_result.get('chunk_id')} failed: "
                f"{chunk_result['error']}"
            )
            continue

        response = chunk_result.get("response")
        if not response:
            continue

        try:
            parsed_events = _parse_events_from_response(response)
        except json.JSONDecodeError as error:
            print(
                f"[Stage1] invalid JSON for chunk {chunk_result.get('chunk_id')}: {error}"
            )
            continue

        reference_tag = str(chunk_result.get("reference_tag", ""))
        fallback_page = _page_range_start(str(chunk_result.get("page_range", "1")))

        for raw_event in parsed_events:
            event = _build_timeline_event(
                raw_event,
                reference_tag=reference_tag,
                fallback_page=fallback_page,
                event_number=0,
            )
            deduped_events[_dedupe_key(event)] = event

    sorted_events = sorted(
        deduped_events.values(),
        key=lambda event: _parse_sortable_date(str(event.get("date", "unspecified"))),
    )

    final_events: list[dict] = []
    for index_number, event in enumerate(sorted_events, start=1):
        event["event_id"] = f"evt_{index_number:03d}"
        final_events.append(event)

    result = {
        "job_id": job_id,
        "events": final_events,
        "total_events": len(final_events),
    }

    timeline_path = _timeline_path(job_id)
    timeline_path.parent.mkdir(parents=True, exist_ok=True)
    timeline_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print(
        f"[Stage1] timeline saved job_id={job_id} "
        f"events={result['total_events']} chunks={len(all_chunks)}"
    )
    return result
