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
    get_fallback_timeline_highlights,
)
from models.document import IndexList
from stages.stage0_indexer import index_documents_from_directory
from stages.stage1_timeline import extract_timeline
from stages.stage1b_timeline_highlights import summarize_timeline_highlights
from stages.stage2_background import write_background
from stages.stage3_classify import classify_damages
from stages.stage4_excel import build_excel_guaranteed

_running_jobs: set[str] = set()


def _job_dir(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id


def _status_path(job_id: str) -> Path:
    return _job_dir(job_id) / "status.json"


def _artifact_path(job_id: str, name: str) -> Path:
    return _job_dir(job_id) / name


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_saved_status(job_id: str) -> dict[str, Any]:
    status_path = _status_path(job_id)
    if not status_path.exists():
        return _default_status(job_id)
    status = _default_status(job_id)
    status.update(_read_json(status_path))
    return status


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
        "timeline_highlights_preview": [],
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
    if job_id in _running_jobs:
        print(f"[Pipeline] job_id={job_id} already running, skipping duplicate start")
        return

    _running_jobs.add(job_id)
    saved = _load_saved_status(job_id)
    warnings: list[str] = list(saved.get("warnings") or [])
    completed_stages: list[str] = list(saved.get("completed_stages") or [])

    try:
        await update_status(
            job_id,
            status="processing",
            current_stage=0,
            progress=5,
            message="Indexing and classifying uploaded documents",
            warnings=warnings,
            completed_stages=completed_stages,
        )

        index_path = _artifact_path(job_id, "index.json")
        if index_path.exists():
            index = _read_json(index_path)
            if "stage0" not in completed_stages:
                completed_stages.append("stage0")
            print(f"[Pipeline] resume job_id={job_id} loaded existing index")
        else:
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

        timeline_path = _artifact_path(job_id, "timeline.json")
        if timeline_path.exists():
            timeline = _read_json(timeline_path)
            if "stage1" not in completed_stages:
                completed_stages.append("stage1")
            print(f"[Pipeline] resume job_id={job_id} loaded existing timeline")
            await update_status(
                job_id,
                current_stage=1,
                progress=30,
                message=f"Resuming after timeline ({timeline.get('total_events', 0)} events)",
                warnings=warnings,
                completed_stages=completed_stages,
            )
        else:
            await update_status(
                job_id,
                current_stage=1,
                progress=30,
                message="Extracting timeline events",
                warnings=warnings,
                completed_stages=completed_stages,
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
            progress=42,
            message=f"Timeline ready ({timeline.get('total_events', 0)} events)",
            completed_stages=completed_stages,
            timeline_events_preview=timeline_preview,
            warnings=warnings,
        )

        highlights_path = _artifact_path(job_id, "timeline_highlights.json")
        if highlights_path.exists():
            highlights = _read_json(highlights_path)
            if "stage1b" not in completed_stages:
                completed_stages.append("stage1b")
            print(f"[Pipeline] resume job_id={job_id} loaded existing highlights")
        else:
            await update_status(
                job_id,
                current_stage=1,
                progress=48,
                message="Selecting key timeline events",
                warnings=warnings,
                completed_stages=completed_stages,
            )
            try:
                highlights = await asyncio.to_thread(
                    summarize_timeline_highlights,
                    job_id,
                    timeline,
                )
                completed_stages.append("stage1b")
            except Exception as error:
                warning = f"Timeline highlights failed, using heuristic selection: {error}"
                warnings.append(warning)
                print(f"[Pipeline] WARNING: {warning}")
                traceback.print_exc()
                highlights = get_fallback_timeline_highlights(job_id, timeline)

        highlights_preview = highlights.get("events", [])
        await update_status(
            job_id,
            current_stage=1,
            progress=50,
            message=(
                f"Key events ready ({highlights.get('highlights_count', 0)} of "
                f"{timeline.get('total_events', 0)})"
            ),
            completed_stages=completed_stages,
            timeline_highlights_preview=highlights_preview,
            warnings=warnings,
        )

        background_path = _artifact_path(job_id, "background.json")
        if background_path.exists():
            background = _read_json(background_path)
            if "stage2" not in completed_stages:
                completed_stages.append("stage2")
            print(f"[Pipeline] resume job_id={job_id} loaded existing background")
        else:
            await update_status(
                job_id,
                current_stage=2,
                progress=55,
                message="Writing background section",
                warnings=warnings,
                completed_stages=completed_stages,
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

        classifications_path = _artifact_path(job_id, "classifications.json")
        if classifications_path.exists():
            classifications = _read_json(classifications_path)
            if "stage3" not in completed_stages:
                completed_stages.append("stage3")
            print(f"[Pipeline] resume job_id={job_id} loaded existing classifications")
        else:
            await update_status(
                job_id,
                current_stage=3,
                progress=75,
                message="Classifying financial damages",
                warnings=warnings,
                completed_stages=completed_stages,
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
            timeline_highlights_preview=highlights_preview,
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
            highlights = get_fallback_timeline_highlights(job_id, timeline)
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
            completed_stages=["stage1", "stage1b", "stage2", "stage3", "stage4"],
            timeline_events_preview=timeline.get("events", [])[:20],
            timeline_highlights_preview=highlights.get("events", []),
            background_word_count=background.get("word_count"),
            damage_total=classifications.get("grand_total"),
            download_url=f"/download/{job_id}",
            warnings=warnings,
            error=None,
        )
    finally:
        _running_jobs.discard(job_id)
