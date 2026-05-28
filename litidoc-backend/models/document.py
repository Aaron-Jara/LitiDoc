from enum import Enum

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    PLEADING = "PLEADING"
    DISCOVERY = "DISCOVERY"
    CORRESPONDENCE = "CORRESPONDENCE"
    FINANCIAL = "FINANCIAL"
    OTHER = "OTHER"


class DocIndex(BaseModel):
    reference_tag: str
    original_name: str
    doc_type: DocumentType
    summary: str
    page_count: int
    file_path: str


class CaseMetadata(BaseModel):
    case_name: str = ""
    plaintiff: str = ""
    defendant: str = ""
    matter_type: str = ""
    jurisdiction: str = ""
    name_inconsistency_note: str | None = None
    source_document: str | None = None


class IndexList(BaseModel):
    job_id: str
    documents: list[DocIndex] = Field(default_factory=list)
    case_metadata: CaseMetadata | None = None
