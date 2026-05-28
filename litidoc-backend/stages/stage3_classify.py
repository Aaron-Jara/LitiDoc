from __future__ import annotations

import json
import re
from pathlib import Path

import fitz

from config import settings
from core.claude_client import ClaudeClient
from core.normalizer import PAGE_BREAK, normalize_text
from models.document import DocIndex, DocumentType, IndexList

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "stage3_classify.txt"
SYSTEM_PROMPT = (
    "You are a litigation damages classifier. "
    "Extract numeric dollar amounts whenever they appear or can be calculated from stated figures. "
    "Return ONLY valid JSON with keys: damages (array), grand_total (number). "
    "grand_total must equal the sum of all non-null amount fields. "
    "Do not include markdown fences or commentary."
)

FINANCIAL_KEYWORDS = (
    "t4",
    "roe",
    "record of employment",
    "pay stub",
    "payroll",
    "salary",
    "wage",
    "remuneration",
    "invoice",
    "receipt",
    "benefit",
    "bonus",
    "compensation",
    "disability",
    "earnings",
    "income",
    "tax",
    "financial",
    "invoice",
    "bill",
    "payment",
    "charge",
    "cost",
    "dollar",
    "$",
)

DAMAGE_CATEGORIES = (
    "past_lost_income",
    "future_lost_income",
    "medical_expenses",
    "future_care_costs",
    "out_of_pocket",
    "loss_of_valuable_services",
    "non_pecuniary",
    "pre_judgment_interest",
)


def _classifications_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "classifications.json"


def _timeline_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline.json"


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _load_timeline(job_id: str) -> dict:
    timeline_path = _timeline_path(job_id)
    if not timeline_path.exists():
        return {"job_id": job_id, "events": [], "total_events": 0}
    return json.loads(timeline_path.read_text(encoding="utf-8"))


def _extract_full_text(file_path: str) -> str:
    page_texts: list[str] = []
    with fitz.open(file_path) as document:
        for page in document:
            page_texts.append(normalize_text(page.get_text("text")))
    return PAGE_BREAK.join(page_texts)


def _is_financial_document(document: DocIndex) -> bool:
    if document.doc_type == DocumentType.FINANCIAL:
        return True

    searchable = " ".join(
        [
            document.original_name,
            document.summary,
            document.reference_tag,
        ]
    ).lower()
    return any(keyword in searchable for keyword in FINANCIAL_KEYWORDS)


def _filter_financial_documents(index: IndexList) -> list[DocIndex]:
    """Include FINANCIAL-tagged docs and other docs with financial content signals."""
    return [document for document in index.documents if _is_financial_document(document)]


def _build_financial_documents_text(documents: list[DocIndex]) -> str:
    sections: list[str] = []
    for document in documents:
        text = _extract_full_text(document.file_path)
        sections.append(
            "\n".join(
                [
                    f"=== Document {document.reference_tag}: {document.original_name} ===",
                    f"Summary: {document.summary}",
                    text or "[No extractable text]",
                ]
            )
        )
    return "\n\n".join(sections)


def _build_timeline_summary(timeline: dict, max_events: int = 40) -> str:
    events = timeline.get("events", [])
    if not events:
        return "No timeline events available."

    # Prioritize events that mention money, then fill with chronological events.
    money_events = [
        event
        for event in events
        if "$" in str(event.get("description", ""))
        or any(
            token in str(event.get("description", "")).lower()
            for token in ("salary", "wage", "pay", "income", "invoice", "cost", "benefit", "bonus")
        )
    ]
    selected: list[dict] = []
    seen_ids: set[str] = set()
    for event in money_events + events:
        event_id = str(event.get("event_id", ""))
        if event_id in seen_ids:
            continue
        seen_ids.add(event_id)
        selected.append(event)
        if len(selected) >= max_events:
            break

    lines: list[str] = []
    for event in selected:
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


def _normalize_damage_item(item: dict, default_source: str = "") -> dict:
    category = str(item.get("category", "out_of_pocket")).strip()
    if category not in DAMAGE_CATEGORIES:
        category = "out_of_pocket"

    amount = item.get("amount")
    if amount is not None:
        try:
            if isinstance(amount, str):
                cleaned = re.sub(r"[^0-9.\-]", "", amount.replace(",", ""))
                amount = float(cleaned) if cleaned else None
            else:
                amount = float(amount)
        except (TypeError, ValueError):
            amount = None

    return {
        "category": category,
        "date": str(item.get("date", "unspecified")).strip() or "unspecified",
        "description": str(item.get("description", "")).strip(),
        "amount": amount,
        "source": str(item.get("source", default_source)).strip(),
        "notes": str(item.get("notes", "")).strip(),
    }


def _parse_classification_response(response: str) -> tuple[list[dict], float]:
    cleaned = _strip_code_fence(response)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Classification response must be a JSON object.")

    raw_items = parsed.get("damages", [])
    if not isinstance(raw_items, list):
        raw_items = []

    damages = [
        _normalize_damage_item(item)
        for item in raw_items
        if isinstance(item, dict) and str(item.get("description", "")).strip()
    ]

    grand_total = sum(
        float(item["amount"])
        for item in damages
        if isinstance(item.get("amount"), (int, float))
    )

    return damages, grand_total


def _group_by_category(damages: list[dict]) -> dict[str, dict]:
    grouped: dict[str, dict] = {
        category: {"items": [], "total": 0.0} for category in DAMAGE_CATEGORIES
    }

    for item in damages:
        category = item["category"]
        grouped[category]["items"].append(item)
        amount = item.get("amount")
        if isinstance(amount, (int, float)):
            grouped[category]["total"] += float(amount)

    # Remove empty categories for cleaner output.
    return {
        category: payload
        for category, payload in grouped.items()
        if payload["items"]
    }


def _empty_result(job_id: str, message: str) -> dict:
    return {
        "job_id": job_id,
        "damages": [],
        "grand_total": 0.0,
        "by_category": {},
        "category_totals": {},
        "financial_document_count": 0,
        "message": message,
    }


def classify_damages(
    job_id: str,
    index: IndexList | dict,
    timeline: dict | None = None,
) -> dict:
    """
    Classify financial damages from FINANCIAL documents using Claude.
    """
    if isinstance(index, dict):
        index = IndexList.model_validate(index)

    if not job_id.strip():
        raise ValueError("job_id is required.")

    if timeline is None:
        timeline = _load_timeline(job_id)

    financial_documents = _filter_financial_documents(index)
    if not financial_documents:
        result = _empty_result(
            job_id,
            "No financial documents found in index; classification skipped.",
        )
        _save_classifications(job_id, result)
        return result

    prompt_template = _load_prompt_template()
    financial_documents_text = _build_financial_documents_text(financial_documents)
    timeline_summary = _build_timeline_summary(timeline)

    prompt = (
        prompt_template.replace("{financial_documents_text}", financial_documents_text)
        .replace("{timeline_summary}", timeline_summary)
    )

    client = ClaudeClient()
    response = client.generate(
        prompt=prompt,
        system_prompt=SYSTEM_PROMPT,
        max_tokens=8000,
    )

    damages, grand_total = _parse_classification_response(response)
    by_category = _group_by_category(damages)
    category_totals = {
        category: payload["total"] for category, payload in by_category.items()
    }

    result = {
        "job_id": job_id,
        "damages": damages,
        "grand_total": grand_total,
        "by_category": by_category,
        "category_totals": category_totals,
        "financial_document_count": len(financial_documents),
        "message": None,
    }

    _save_classifications(job_id, result)
    print(
        f"[Stage3] classifications saved job_id={job_id} "
        f"items={len(damages)} grand_total={grand_total}"
    )
    return result


def _save_classifications(job_id: str, result: dict) -> None:
    path = _classifications_path(job_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2), encoding="utf-8")
