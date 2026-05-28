from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import settings
from stages import run_all_stages, update_status
from stages.stage0_indexer import _sanitize_filename, _uploads_incoming_dir
from stages.stage4_excel import _excel_path
from stages.word_export import build_background_docx


def _jobs_dir(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id


def _status_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "status.json"


def _timeline_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "timeline.json"


def _timeline_highlights_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "timeline_highlights.json"


def _background_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "background.json"


def _index_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "index.json"


def _classifications_path(job_id: str) -> Path:
    return _jobs_dir(job_id) / "classifications.json"


def _read_job_json(path: Path, artifact: str, job_id: str) -> dict[str, Any]:
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{artifact} not found for job: {job_id}",
        )
    return json.loads(path.read_text(encoding="utf-8"))


def generate_job_id() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:8]
    return f"{timestamp}-{suffix}"


app = FastAPI(title="LitiDoc API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/process")
async def process_documents(files: list[UploadFile] = File(...)) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")

    job_id = generate_job_id()
    incoming_dir = _uploads_incoming_dir(job_id)
    incoming_dir.mkdir(parents=True, exist_ok=True)

    for upload in files:
        original_name = _sanitize_filename(upload.filename or "document.pdf")
        file_path = incoming_dir / original_name
        file_path.write_bytes(await upload.read())
        await upload.close()

    await update_status(
        job_id,
        status="processing",
        current_stage=0,
        progress=0,
        message="Upload received, processing started",
    )

    asyncio.create_task(run_all_stages(job_id))
    return {"job_id": job_id, "status": "processing"}


@app.get("/status/{job_id}")
async def get_status(job_id: str, lite: bool = False) -> dict:
    status = _read_job_json(_status_path(job_id), "Status", job_id)

    if lite:
        return status

    timeline_path = _timeline_path(job_id)
    if timeline_path.exists():
        timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
        status["timeline_events_preview"] = timeline.get("events", [])[:20]
        status["timeline_total_events"] = timeline.get("total_events", 0)

    highlights_path = _timeline_highlights_path(job_id)
    if highlights_path.exists():
        highlights = json.loads(highlights_path.read_text(encoding="utf-8"))
        status["timeline_highlights_preview"] = highlights.get("events", [])
        status["timeline_highlights_count"] = highlights.get("highlights_count", 0)

    background_path = _background_path(job_id)
    if background_path.exists():
        background = json.loads(background_path.read_text(encoding="utf-8"))
        status["background_word_count"] = background.get("word_count")
        status["background_summary"] = background.get("full_text", "")[:500]

    classifications_path = _classifications_path(job_id)
    if classifications_path.exists():
        classifications = json.loads(classifications_path.read_text(encoding="utf-8"))
        status["damage_total"] = classifications.get("grand_total")
        status["category_totals"] = classifications.get("category_totals", {})

    if _excel_path(job_id).exists():
        status["download_url"] = f"/download/{job_id}"
    if background_path.exists():
        status["word_download_url"] = f"/download/word/{job_id}"

    return status


@app.get("/timeline/{job_id}")
async def get_timeline(job_id: str) -> dict:
    return _read_job_json(_timeline_path(job_id), "Timeline", job_id)


@app.get("/timeline-highlights/{job_id}")
async def get_timeline_highlights(job_id: str) -> dict:
    return _read_job_json(
        _timeline_highlights_path(job_id),
        "Timeline highlights",
        job_id,
    )


@app.get("/index/{job_id}")
async def get_index(job_id: str) -> dict:
    return _read_job_json(_index_path(job_id), "Document index", job_id)


@app.get("/background/{job_id}")
async def get_background(job_id: str) -> dict:
    return _read_job_json(_background_path(job_id), "Background", job_id)


@app.get("/classifications/{job_id}")
async def get_classifications(job_id: str) -> dict:
    return _read_job_json(
        _classifications_path(job_id),
        "Classifications",
        job_id,
    )


@app.get("/download/{job_id}")
async def download_schedule(job_id: str) -> FileResponse:
    excel_path = _excel_path(job_id)
    if not excel_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Excel schedule not found for job: {job_id}",
        )

    return FileResponse(
        path=excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"litidoc_schedule_{job_id}.xlsx",
        headers={
            "Content-Disposition": f'attachment; filename="litidoc_schedule_{job_id}.xlsx"'
        },
    )


@app.get("/download/word/{job_id}")
async def download_word_background(job_id: str) -> FileResponse:
    if not _background_path(job_id).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Background not found for job: {job_id}",
        )

    try:
        word_path = build_background_docx(job_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Word document: {error}",
        ) from error

    if not word_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Word document not found for job: {job_id}",
        )

    return FileResponse(
        path=word_path,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        filename=f"litidoc_background_{job_id}.docx",
        headers={
            "Content-Disposition": (
                f'attachment; filename="litidoc_background_{job_id}.docx"'
            )
        },
    )


@app.post("/resume/{job_id}")
async def resume_job(job_id: str) -> dict:
    """Resume a stalled job from the last saved artifact (e.g. after API reload)."""
    status_path = _status_path(job_id)
    if not status_path.exists():
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    status = json.loads(status_path.read_text(encoding="utf-8"))
    if status.get("status") == "complete":
        return {"job_id": job_id, "status": "complete", "message": "Job already complete."}

    asyncio.create_task(run_all_stages(job_id))
    return {"job_id": job_id, "status": "processing", "message": "Resume started."}


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}
