from __future__ import annotations

import json
import re
from pathlib import Path

import fitz
from fastapi import UploadFile

from config import settings
from core.case_metadata import extract_case_metadata
from core.normalizer import DocumentNormalizer, normalize_text
from models.document import DocIndex, DocumentType, IndexList

TYPE_PREFIX: dict[DocumentType, int] = {
    DocumentType.PLEADING: 1,
    DocumentType.DISCOVERY: 2,
    DocumentType.CORRESPONDENCE: 3,
    DocumentType.FINANCIAL: 4,
    DocumentType.OTHER: 5,
}

INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def get_next_tag(doc_type: DocumentType, existing_tags: list[str]) -> str:
    """Return the next reference tag for a document type (e.g. 1.3, 2.1)."""
    prefix = TYPE_PREFIX[doc_type]
    max_sequence = 0

    for tag in existing_tags:
        if not tag.startswith(f"{prefix}."):
            continue
        suffix = tag.split(".", maxsplit=1)[1]
        if suffix.isdigit():
            max_sequence = max(max_sequence, int(suffix))

    return f"{prefix}.{max_sequence + 1}"


def _sanitize_filename(filename: str) -> str:
    cleaned = INVALID_FILENAME_CHARS.sub("_", filename).strip()
    return cleaned or "document.pdf"


def _uploads_original_dir(job_id: str) -> Path:
    return Path(settings.UPLOAD_PATH) / job_id / "original"


def _uploads_incoming_dir(job_id: str) -> Path:
    return Path(settings.UPLOAD_PATH) / job_id / "incoming"


def _job_index_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "index.json"


def _read_first_page(file_path: Path) -> tuple[str, int]:
    with fitz.open(file_path) as document:
        page_count = document.page_count
        if page_count == 0:
            return "", 0
        first_page_text = normalize_text(document[0].get_text("text"))
        return first_page_text, page_count


def _build_summary(first_page_text: str, max_chars: int = 200) -> str:
    if not first_page_text:
        return "No extractable text on first page."
    if len(first_page_text) <= max_chars:
        return first_page_text
    return f"{first_page_text[:max_chars].rstrip()}..."


async def index_documents(job_id: str, uploaded_files: list[UploadFile]) -> dict:
    """
    Save uploads, classify documents, assign reference tags, and persist index.json.
    """
    if not job_id.strip():
        raise ValueError("job_id is required.")
    if not uploaded_files:
        raise ValueError("At least one uploaded file is required.")

    upload_dir = _uploads_original_dir(job_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    index_path = _job_index_path(job_id)
    index_path.parent.mkdir(parents=True, exist_ok=True)

    normalizer = DocumentNormalizer()
    assigned_tags: list[str] = []
    documents: list[DocIndex] = []

    for upload in uploaded_files:
        original_name = _sanitize_filename(upload.filename or "document.pdf")
        temp_path = upload_dir / f"tmp_{original_name}"

        content = await upload.read()
        temp_path.write_bytes(content)
        await upload.close()

        first_page_text, page_count = _read_first_page(temp_path)
        doc_type = normalizer.detect_doc_type(first_page_text)
        reference_tag = get_next_tag(doc_type, assigned_tags)
        assigned_tags.append(reference_tag)

        renamed_name = _sanitize_filename(f"{reference_tag}_{original_name}")
        final_path = upload_dir / renamed_name
        if final_path.exists():
            final_path.unlink()
        temp_path.rename(final_path)

        documents.append(
            DocIndex(
                reference_tag=reference_tag,
                original_name=original_name,
                doc_type=doc_type,
                summary=_build_summary(first_page_text),
                page_count=page_count,
                file_path=str(final_path),
            )
        )

    case_metadata = extract_case_metadata(documents)
    index_list = IndexList(
        job_id=job_id,
        documents=documents,
        case_metadata=case_metadata,
    )
    index_path.write_text(
        json.dumps(index_list.model_dump(), indent=2),
        encoding="utf-8",
    )

    return index_list.model_dump()


async def index_documents_from_directory(job_id: str) -> dict:
    """Index files previously saved to storage/uploads/{job_id}/incoming/."""
    incoming_dir = _uploads_incoming_dir(job_id)
    if not incoming_dir.exists():
        raise FileNotFoundError(f"Incoming upload directory not found: {incoming_dir}")

    saved_files = sorted(
        path
        for path in incoming_dir.iterdir()
        if path.is_file() and not path.name.startswith("tmp_")
    )
    if not saved_files:
        raise ValueError("No uploaded files found for indexing.")

    upload_dir = _uploads_original_dir(job_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    index_path = _job_index_path(job_id)
    index_path.parent.mkdir(parents=True, exist_ok=True)

    normalizer = DocumentNormalizer()
    assigned_tags: list[str] = []
    documents: list[DocIndex] = []

    for source_path in saved_files:
        original_name = _sanitize_filename(source_path.name)
        temp_path = upload_dir / f"tmp_{original_name}"
        temp_path.write_bytes(source_path.read_bytes())

        first_page_text, page_count = _read_first_page(temp_path)
        doc_type = normalizer.detect_doc_type(first_page_text)
        reference_tag = get_next_tag(doc_type, assigned_tags)
        assigned_tags.append(reference_tag)

        renamed_name = _sanitize_filename(f"{reference_tag}_{original_name}")
        final_path = upload_dir / renamed_name
        if final_path.exists():
            final_path.unlink()
        temp_path.rename(final_path)

        documents.append(
            DocIndex(
                reference_tag=reference_tag,
                original_name=original_name,
                doc_type=doc_type,
                summary=_build_summary(first_page_text),
                page_count=page_count,
                file_path=str(final_path),
            )
        )

    case_metadata = extract_case_metadata(documents)
    index_list = IndexList(
        job_id=job_id,
        documents=documents,
        case_metadata=case_metadata,
    )
    index_path.write_text(
        json.dumps(index_list.model_dump(), indent=2),
        encoding="utf-8",
    )
    return index_list.model_dump()
