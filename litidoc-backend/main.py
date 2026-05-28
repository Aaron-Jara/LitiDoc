from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import settings
from stages import run_all_stages, update_status
from stages.stage0_indexer import _sanitize_filename, _uploads_incoming_dir
from stages.stage4_excel import _excel_path


def _status_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "status.json"


def _timeline_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "timeline.json"


def _background_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "background.json"


def _classifications_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "classifications.json"


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
async def get_status(job_id: str) -> dict:
    status_path = _status_path(job_id)
    if not status_path.exists():
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    status = json.loads(status_path.read_text(encoding="utf-8"))

    timeline_path = _timeline_path(job_id)
    if timeline_path.exists():
        timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
        status["timeline_events_preview"] = timeline.get("events", [])[:20]
        status["timeline_total_events"] = timeline.get("total_events", 0)

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

    excel_path = _excel_path(job_id)
    if excel_path.exists():
        status["download_url"] = f"/download/{job_id}"

    return status


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


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}
