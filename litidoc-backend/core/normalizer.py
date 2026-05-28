from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import fitz

from models.document import DocumentType

PAGE_BREAK = "\f"
WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """Clean extra whitespace and normalize Unicode."""
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = WHITESPACE_RE.sub(" ", text)
    return text.strip()


def extract_page_number(raw_text: str, position: int) -> int:
    """
    Return approximate page number for a character position.

    Expects page breaks inserted as form-feed (\\f) during PDF extraction.
    """
    if not raw_text:
        return 1

    position = max(0, min(position, len(raw_text)))
    return raw_text.count(PAGE_BREAK, 0, position) + 1


def _page_range_label(start_page: int, end_page: int) -> str:
    if start_page == end_page:
        return str(start_page)
    return f"{start_page}-{end_page}"


class DocumentNormalizer:
    """Extract, classify, and normalize PDF documents."""

    _PLEADING_KEYWORDS = (
        "complaint",
        "motion",
        "brief",
        "petition",
        "answer",
        "plaintiff",
        "defendant",
    )
    _DISCOVERY_KEYWORDS = (
        "interrogator",
        "deposition",
        "request for production",
        "subpoena",
        "discovery",
    )
    _CORRESPONDENCE_KEYWORDS = (
        "dear ",
        "sincerely",
        "letter",
        "correspondence",
        "re:",
    )
    _FINANCIAL_KEYWORDS = (
        "invoice",
        "payment",
        "balance",
        "damages",
        "expense",
        "receipt",
        "ledger",
        "t4",
        "record of employment",
        "roe",
        "pay stub",
        "salary",
        "remuneration",
        "bonus",
        "benefits plan",
        "disability",
        "earnings",
        "compensation",
    )

    def detect_doc_type(self, first_page_text: str) -> DocumentType:
        text = first_page_text.lower()

        if any(keyword in text for keyword in self._PLEADING_KEYWORDS):
            return DocumentType.PLEADING
        if any(keyword in text for keyword in self._DISCOVERY_KEYWORDS):
            return DocumentType.DISCOVERY
        if any(keyword in text for keyword in self._CORRESPONDENCE_KEYWORDS):
            return DocumentType.CORRESPONDENCE
        if any(keyword in text for keyword in self._FINANCIAL_KEYWORDS):
            return DocumentType.FINANCIAL

        return DocumentType.OTHER

    def extract_metadata(self, file_path: str) -> dict:
        path = Path(file_path)
        with fitz.open(file_path) as document:
            metadata = document.metadata or {}
            return {
                "file_name": path.name,
                "file_path": str(path),
                "page_count": document.page_count,
                "title": metadata.get("title") or "",
                "author": metadata.get("author") or "",
                "subject": metadata.get("subject") or "",
                "creator": metadata.get("creator") or "",
                "format": metadata.get("format") or "PDF",
            }

    def normalize_document(self, file_path: str) -> dict:
        path = Path(file_path)
        page_texts: list[str] = []

        with fitz.open(file_path) as document:
            for page in document:
                page_texts.append(normalize_text(page.get_text("text")))

        combined_text = PAGE_BREAK.join(page_texts)
        first_page_text = page_texts[0] if page_texts else ""
        page_count = len(page_texts)

        return {
            "doc_name": path.name,
            "doc_type": self.detect_doc_type(first_page_text),
            "page_range": _page_range_label(1, page_count) if page_count else "0",
            "text": combined_text,
            "page_count": page_count,
        }
