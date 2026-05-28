from __future__ import annotations

import re
from typing import Iterable

from models.document import CaseMetadata, DocIndex, DocumentType

CAPTION_RE = re.compile(
    r"B\s*E\s*T\s*W\s*E\s*E\s*N\s*:\s*"
    r"([A-Z][A-Z\s.'-]+?)\s*,?\s*Plaintiff"
    r".*?"
    r"(?:and|—|-)\s*"
    r"([A-Z][A-Z\s.'&-]+?)\s*,?\s*Defendant",
    re.IGNORECASE | re.DOTALL,
)
FILENAME_V_RE = re.compile(
    r"([A-Za-z][A-Za-z0-9_]+)\s+v\.?\s+([A-Za-z][A-Za-z0-9_]+)",
    re.IGNORECASE,
)
EMPLOYEE_NAME_RE = re.compile(
    r"(?:Employee Name|Patient|Claimant|From|Dear)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
)
JURISDICTION_RE = re.compile(
    r"\b(Ontario|British Columbia|Alberta|Quebec|Manitoba|Saskatchewan|"
    r"Nova Scotia|New Brunswick|Prince Edward Island|Newfoundland and Labrador|"
    r"Northwest Territories|Nunavut|Yukon)\b",
    re.IGNORECASE,
)
CLAIM_KEYWORDS = (
    ("wrongful dismissal", "Wrongful dismissal"),
    ("constructive dismissal", "Constructive dismissal"),
    ("bad faith", "Bad faith damages"),
    ("disability", "Disability-related claims"),
    ("human rights", "Human rights"),
    ("lost bonus", "Lost bonus compensation"),
    ("severance", "Severance / termination pay"),
)


def _title_name(raw: str) -> str:
    cleaned = re.sub(r"\s+", " ", raw).strip(" ,.-")
    if not cleaned:
        return ""
    if cleaned.isupper():
        return cleaned.title()
    return cleaned


def _company_name(raw: str) -> str:
    cleaned = re.sub(r"\s+", " ", raw).strip(" ,.-")
    if cleaned.isupper():
        return cleaned.title()
    return cleaned


def _parse_caption(text: str) -> tuple[str, str] | None:
    match = CAPTION_RE.search(text)
    if not match:
        return None
    plaintiff = _title_name(match.group(1))
    defendant = _company_name(match.group(2))
    if plaintiff and defendant:
        return plaintiff, defendant
    return None


def _parse_filename_case_name(documents: Iterable[DocIndex]) -> str | None:
    preferred: list[str] = []
    fallback: list[str] = []

    for doc in documents:
        match = FILENAME_V_RE.search(doc.original_name)
        if not match:
            continue
        left = _title_name(match.group(1).replace("_", " "))
        right = _company_name(match.group(2).replace("_", " "))
        label = f"{left} v. {right}"
        if "claim" in doc.original_name.lower() or "statement" in doc.original_name.lower():
            preferred.append(label)
        else:
            fallback.append(label)

    if preferred:
        return preferred[0]
    if fallback:
        return fallback[0]
    return None


def _collect_employee_names(documents: Iterable[DocIndex]) -> set[str]:
    names: set[str] = set()
    for doc in documents:
        for match in EMPLOYEE_NAME_RE.finditer(doc.summary):
            name = _title_name(match.group(1))
            if len(name.split()) >= 2:
                names.add(name)
    return names


def _infer_matter_type(text: str) -> str:
    lowered = text.lower()
    labels: list[str] = []
    for keyword, label in CLAIM_KEYWORDS:
        if keyword in lowered and label not in labels:
            labels.append(label)
    if labels:
        return " / ".join(labels)
    if "employment" in lowered:
        return "Employment litigation"
    return "Litigation damages analysis"


def _infer_jurisdiction(text: str) -> str:
    match = JURISDICTION_RE.search(text)
    if match:
        return match.group(1).title()
    if "canada revenue agency" in text.lower() or "ontario" in text.lower():
        return "Ontario"
    return ""


def extract_case_metadata(documents: list[DocIndex]) -> CaseMetadata:
    """Derive case caption fields from indexed document summaries and filenames."""
    if not documents:
        return CaseMetadata()

    combined_text = "\n".join(
        f"{doc.original_name}\n{doc.summary}" for doc in documents
    )

    plaintiff = ""
    defendant = ""
    caption_source = ""

    prioritized = sorted(
        documents,
        key=lambda doc: (
            0 if "statement_of_claim" in doc.original_name.lower().replace(" ", "_") else 1,
            0 if doc.doc_type == DocumentType.PLEADING else 1,
            doc.original_name,
        ),
    )

    for doc in prioritized:
        caption = _parse_caption(doc.summary)
        if caption:
            plaintiff, defendant = caption
            caption_source = doc.original_name
            break

    if not plaintiff or not defendant:
        for doc in documents:
            caption = _parse_caption(doc.summary)
            if caption:
                plaintiff, defendant = caption
                caption_source = doc.original_name
                break

    case_name = _parse_filename_case_name(documents) or ""
    if plaintiff and defendant:
        case_name = f"{plaintiff} v. {defendant}"
    elif not case_name:
        case_name = "Uploaded Case Package"

    jurisdiction = _infer_jurisdiction(combined_text)
    matter_type = _infer_matter_type(combined_text)

    employee_names = _collect_employee_names(documents)
    name_note: str | None = None
    if plaintiff and employee_names:
        plaintiff_lower = plaintiff.lower()
        mismatches = sorted(
            name for name in employee_names if name.lower() != plaintiff_lower
        )
        if mismatches:
            alt = ", ".join(mismatches)
            name_note = (
                f"Name inconsistency detected: caption/plaintiff is {plaintiff}, "
                f"while employment and financial records identify {alt}. "
                "Flagged for review."
            )

    if not plaintiff:
        plaintiff = "See case documents"
    if not defendant:
        defendant = "See case documents"

    return CaseMetadata(
        case_name=case_name,
        plaintiff=plaintiff,
        defendant=defendant,
        matter_type=matter_type or "Litigation damages analysis",
        jurisdiction=jurisdiction or "To be confirmed",
        name_inconsistency_note=name_note,
        source_document=caption_source or None,
    )
