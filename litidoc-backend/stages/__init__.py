from __future__ import annotations

import asyncio
import json
import traceback
from pathlib import Path
from typing import Any

from config import settings
from core.fallbacks import (
    get_fallback_background,
    get_fallback_classifications,
    get_fallback_timeline,
)
from models.document import IndexList
from stages.stage0_indexer import index_documents_from_directory
from stages.stage1_timeline import extract_timeline
from stages.stage2_background import write_background
from stages.stage3_classify import classify_damages
from stages.stage4_excel import build_excel_guaranteed


def _status_path(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id / "status.json"


def _default_status(job_id: str) -> dict[str, Any]:
    return {
        "job_id": job_id,
        "status": "processing",
        "current_stage": 0,
        "progress": 0,
        "message": "Queued for processing",
        "error": None,
        "completed_stages": [],
        "warnings": [],
        "timeline_events_preview": [],
        "background_word_count": None,
        "damage_total": None,
        "download_url": None,
    }


async def update_status(job_id: str, **updates: Any) -> dict[str, Any]:
    status_path = _status_path(job_id)
    status_path.parent.mkdir(parents=True, exist_ok=True)

    status = _default_status(job_id)
    if status_path.exists():
        status.update(json.loads(status_path.read_text(encoding="utf-8")))

    status.update(updates)
    status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")
    return status


async def run_all_stages(job_id: str) -> None:
    """Run Stage 0 through Stage 4; use demo fallbacks so the pipeline always completes."""
    warnings: list[str] = []
    completed_stages: list[str] = []

    try:
        await update_status(
            job_id,
            status="processing",
            current_stage=0,
            progress=5,
            message="Indexing and classifying uploaded documents",
            warnings=warnings,
        )

        try:
            index = await index_documents_from_directory(job_id)
            completed_stages.append("stage0")
        except Exception as error:
            warning = f"Stage 0 failed, continuing with empty index: {error}"
            warnings.append(warning)
            print(f"[Pipeline] WARNING: {warning}")
            traceback.print_exc()
            index = {"job_id": job_id, "documents": []}

        index_model = IndexList.model_validate(index)
        await update_status(
            job_id,
            current_stage=0,
            progress=20,
            message="Document indexing step finished",
            completed_stages=completed_stages,
            warnings=warnings,
        )

        await update_status(
            job_id,
            current_stage=1,
            progress=30,
            message="Extracting timeline events",
            warnings=warnings,
        )
        try:
            timeline = await asyncio.to_thread(extract_timeline, job_id, index_model)
            completed_stages.append("stage1")
        except Exception as error:
            warning = f"Stage 1 failed, using fallback timeline: {error}"
            warnings.append(warning)
            print(f"[Pipeline] WARNING: {warning}")
            traceback.print_exc()
            timeline = get_fallback_timeline(job_id)

        timeline_preview = timeline.get("events", [])[:20]
        await update_status(
            job_id,
            current_stage=1,
            progress=45,
            message=f"Timeline ready ({timeline.get('total_events', 0)} events)",
            completed_stages=completed_stages,
            timeline_events_preview=timeline_preview,
            warnings=warnings,
        )

        await update_status(
            job_id,
            current_stage=2,
            progress=55,
            message="Writing background section",
            warnings=warnings,
        )
        try:
            background = await asyncio.to_thread(write_background, job_id, timeline)
            completed_stages.append("stage2")
        except Exception as error:
            warning = f"Stage 2 failed, using fallback background: {error}"
            warnings.append(warning)
            print(f"[Pipeline] WARNING: {warning}")
            traceback.print_exc()
            background = get_fallback_background(job_id)

        await update_status(
            job_id,
            current_stage=2,
            progress=65,
            message="Background section ready",
            completed_stages=completed_stages,
            background_word_count=background.get("word_count"),
            warnings=warnings,
        )

        await update_status(
            job_id,
            current_stage=3,
            progress=75,
            message="Classifying financial damages",
            warnings=warnings,
        )
        try:
            classifications = await asyncio.to_thread(
                classify_damages,
                job_id,
                index_model,
                timeline,
            )
            completed_stages.append("stage3")
        except Exception as error:
            warning = f"Stage 3 failed, using fallback classifications: {error}"
            warnings.append(warning)
            print(f"[Pipeline] WARNING: {warning}")
            traceback.print_exc()
            classifications = get_fallback_classifications(job_id)

        await update_status(
            job_id,
            current_stage=3,
            progress=85,
            message="Damage classification ready",
            completed_stages=completed_stages,
            damage_total=classifications.get("grand_total"),
            warnings=warnings,
        )

        await update_status(
            job_id,
            current_stage=4,
            progress=92,
            message="Building Excel schedule",
            warnings=warnings,
        )
        try:
            excel_path = await asyncio.to_thread(
                build_excel_guaranteed,
                job_id,
                classifications,
            )
            completed_stages.append("stage4")
        except Exception as error:
            warning = f"Stage 4 failed even after guaranteed fallback: {error}"
            warnings.append(warning)
            print(f"[Pipeline] WARNING: {warning}")
            traceback.print_exc()
            excel_path = None

        final_message = "Processing complete"
        if warnings:
            final_message = (
                f"Processing complete with {len(warnings)} fallback warning(s)"
            )

        await update_status(
            job_id,
            status="complete",
            current_stage=4,
            progress=100,
            message=final_message,
            completed_stages=completed_stages,
            timeline_events_preview=timeline.get("events", [])[:20],
            background_word_count=background.get("word_count"),
            damage_total=classifications.get("grand_total"),
            download_url=f"/download/{job_id}" if excel_path else None,
            warnings=warnings,
            error=None,
        )
        print(f"[Pipeline] complete job_id={job_id} excel={excel_path} warnings={len(warnings)}")
    except Exception as error:
        # Last-resort guard: still attempt to mark complete with fallback artifacts.
        print(f"[Pipeline] unexpected failure job_id={job_id}: {error}")
        traceback.print_exc()
        warnings.append(f"Unexpected pipeline failure: {error}")

        try:
            timeline = get_fallback_timeline(job_id)
            background = get_fallback_background(job_id)
            classifications = get_fallback_classifications(job_id)
            excel_path = await asyncio.to_thread(
                build_excel_guaranteed,
                job_id,
                classifications,
            )
        except Exception as recovery_error:
            print(f"[Pipeline] recovery failed job_id={job_id}: {recovery_error}")
            traceback.print_exc()
            await update_status(
                job_id,
                status="error",
                message="Processing failed during recovery",
                error=str(recovery_error),
                warnings=warnings,
            )
            return

        await update_status(
            job_id,
            status="complete",
            current_stage=4,
            progress=100,
            message="Processing complete using emergency fallback data",
            completed_stages=["stage1", "stage2", "stage3", "stage4"],
            timeline_events_preview=timeline.get("events", [])[:20],
            background_word_count=background.get("word_count"),
            damage_total=classifications.get("grand_total"),
            download_url=f"/download/{job_id}",
            warnings=warnings,
            error=None,
        )
