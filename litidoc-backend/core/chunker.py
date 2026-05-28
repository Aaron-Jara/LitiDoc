from __future__ import annotations

import re
from dataclasses import dataclass

from config import settings
from core.normalizer import PAGE_BREAK, extract_page_number

WORD_RE = re.compile(r"\S+")


@dataclass(frozen=True)
class WordSpan:
    index: int
    start_char: int
    end_char: int


def _build_word_spans(text: str) -> list[WordSpan]:
    return [
        WordSpan(index=index, start_char=match.start(), end_char=match.end())
        for index, match in enumerate(WORD_RE.finditer(text))
    ]


def _page_range_for_span(text: str, start_char: int, end_char: int) -> str:
    start_page = extract_page_number(text, start_char)
    end_page = extract_page_number(text, max(start_char, end_char - 1))
    if start_page == end_page:
        return str(start_page)
    return f"{start_page}-{end_page}"


def chunk_text(
    text: str,
    chunk_size: int = 3000,
    overlap: int = 200,
) -> list[dict]:
    """
    Split text into overlapping word-based chunks.

    Page ranges are approximated from form-feed page breaks in the text.
    """
    if not text or chunk_size <= 0:
        return []

    words = _build_word_spans(text)
    if not words:
        return []

    overlap = max(0, min(overlap, chunk_size - 1)) if chunk_size > 1 else 0
    stride = max(1, chunk_size - overlap)

    chunks: list[dict] = []
    chunk_index = 0
    start_word_idx = 0

    while start_word_idx < len(words):
        end_word_idx = min(start_word_idx + chunk_size, len(words)) - 1
        chunk_words = words[start_word_idx : end_word_idx + 1]

        chunk_text_value = text[
            chunk_words[0].start_char : chunk_words[-1].end_char
        ]
        page_range = _page_range_for_span(
            text,
            chunk_words[0].start_char,
            chunk_words[-1].end_char,
        )

        chunks.append(
            {
                "chunk_id": f"chunk_{chunk_index:04d}",
                "start_word": start_word_idx,
                "end_word": end_word_idx,
                "text": chunk_text_value,
                "page_range": page_range,
            }
        )

        if end_word_idx >= len(words) - 1:
            break

        chunk_index += 1
        start_word_idx += stride

    return chunks


class ChunkProcessor:
    """Chunk documents while preserving approximate page continuity."""

    def __init__(
        self,
        chunk_size: int | None = None,
        overlap: int | None = None,
    ) -> None:
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.overlap = overlap or settings.CHUNK_OVERLAP
        self._last_end_page: int | None = None

    def reset(self) -> None:
        self._last_end_page = None

    def process_document(self, normalized_document: dict) -> list[dict]:
        """Chunk a normalized document dict produced by DocumentNormalizer."""
        self.reset()
        text = normalized_document.get("text", "")
        chunks = chunk_text(text, self.chunk_size, self.overlap)
        return self._apply_page_continuity(text, chunks)

    def process_pages(self, page_texts: list[str]) -> list[dict]:
        """Chunk from per-page text while preserving page boundaries."""
        self.reset()
        combined_text = PAGE_BREAK.join(page_texts)
        chunks = chunk_text(combined_text, self.chunk_size, self.overlap)
        return self._apply_page_continuity(combined_text, chunks)

    def _apply_page_continuity(self, text: str, chunks: list[dict]) -> list[dict]:
        """
        Ensure chunk page ranges remain monotonic across a document.

        If a chunk's inferred start page regresses due to sparse text on a page,
        clamp it to the previous chunk's ending page.
        """
        adjusted: list[dict] = []

        for chunk in chunks:
            updated = dict(chunk)
            start_page = self._page_range_start(updated["page_range"])

            if self._last_end_page is not None and start_page < self._last_end_page:
                end_page = self._page_range_end(updated["page_range"])
                end_page = max(end_page, self._last_end_page)
                updated["page_range"] = (
                    str(self._last_end_page)
                    if self._last_end_page == end_page
                    else f"{self._last_end_page}-{end_page}"
                )
                start_page = self._last_end_page

            self._last_end_page = self._page_range_end(updated["page_range"])
            adjusted.append(updated)

        return adjusted

    @staticmethod
    def _page_range_start(page_range: str) -> int:
        if "-" in page_range:
            return int(page_range.split("-", maxsplit=1)[0])
        return int(page_range)

    @staticmethod
    def _page_range_end(page_range: str) -> int:
        if "-" in page_range:
            return int(page_range.split("-", maxsplit=1)[1])
        return int(page_range)
