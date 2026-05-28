from __future__ import annotations

import json
from pathlib import Path

from config import settings

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

MOCK_TIMELINE_EVENTS: list[dict] = [
    {
        "event_id": "evt_001",
        "date": "2021-03-03",
        "date_text": "March 3, 2021",
        "description": "The plaintiff was involved in a motor vehicle collision at an intersection.",
        "citation": "Doc 1.1, p. 4",
        "source_doc": "1.1",
        "page": 4,
    },
    {
        "event_id": "evt_002",
        "date": "2021-03-05",
        "date_text": "March 5, 2021",
        "description": "The plaintiff attended the emergency department for assessment of neck and back pain.",
        "citation": "Doc 4.1, p. 2",
        "source_doc": "4.1",
        "page": 2,
    },
    {
        "event_id": "evt_003",
        "date": "2021-04-12",
        "date_text": "April 12, 2021",
        "description": "The plaintiff began a course of physiotherapy treatment twice per week.",
        "citation": "Doc 4.1, p. 8",
        "source_doc": "4.1",
        "page": 8,
    },
    {
        "event_id": "evt_004",
        "date": "2021-08-20",
        "date_text": "August 20, 2021",
        "description": "The plaintiff returned to modified duties on a part-time basis.",
        "citation": "Doc 3.1, p. 1",
        "source_doc": "3.1",
        "page": 1,
    },
    {
        "event_id": "evt_005",
        "date": "2022-01-15",
        "date_text": "January 15, 2022",
        "description": "The plaintiff reported ongoing pain limiting full-time employment.",
        "citation": "Doc 2.1, p. 15",
        "source_doc": "2.1",
        "page": 15,
    },
]

MOCK_BACKGROUND_SECTIONS: dict[str, str] = {
    "introduction": (
        "This Background section summarizes the plaintiff's accident, treatment, and employment "
        "history based on the available record (Doc 1.1, p. 4; Doc 2.1, p. 15). "
        "The following narrative is presented in neutral, third-person, past-tense form for use "
        "in an expert damages report."
    ),
    "incident_description": (
        "On March 3, 2021, the plaintiff was involved in a motor vehicle collision at an "
        "intersection (Doc 1.1, p. 4). Following the incident, the plaintiff reported acute "
        "neck and back symptoms and sought medical attention within two days (Doc 4.1, p. 2). "
        "Clinical records describe persistent pain complaints and functional limitations "
        "consistent with soft-tissue injuries (Doc 4.1, p. 8; Doc 2.1, p. 15)."
    ),
    "medical_treatment": (
        "On March 5, 2021, the plaintiff attended the emergency department for assessment "
        "(Doc 4.1, p. 2). Treatment thereafter included physiotherapy commencing April 12, 2021, "
        "with sessions documented twice per week (Doc 4.1, p. 8). The record reflects ongoing "
        "symptoms and continued therapy into the following year (Doc 2.1, p. 15)."
    ),
    "employment_history": (
        "Before the collision, the plaintiff was employed on a full-time basis. On August 20, 2021, "
        "the plaintiff returned to modified duties part-time (Doc 3.1, p. 1). By January 15, 2022, "
        "the plaintiff reported ongoing pain limiting a return to full-time work (Doc 2.1, p. 15). "
        "Income and personnel records should be reviewed to quantify past and future wage loss."
    ),
}

MOCK_BACKGROUND_FULL_TEXT: str = "\n\n".join(MOCK_BACKGROUND_SECTIONS.values()) + (
    "\n\n"
    "The plaintiff's post-incident course included emergency care, structured rehabilitation, "
    "and gradual return-to-work efforts with residual limitations (Doc 4.1, p. 2; Doc 4.1, p. 8; "
    "Doc 3.1, p. 1). Medical entries describe cervical and lumbar complaints, reduced range of motion, "
    "and difficulty with prolonged sitting or lifting (Doc 4.1, p. 8; Doc 2.1, p. 15). "
    "Employer correspondence confirms accommodation on reduced hours before full duties were attempted "
    "(Doc 3.1, p. 1). These records collectively support an analysis of treatment costs, income loss, "
    "and future care requirements in the damages schedule.\n\n"
    "For damages quantification, the timeline supports an injury date of March 3, 2021, with treatment "
    "spanning multiple months and ongoing complaints documented into 2022 (Doc 1.1, p. 4; Doc 2.1, p. 15). "
    "Counsel should correlate each claimed head of damage to specific documentary support, including "
    "clinical invoices, payroll records, and expert opinions where applicable (Doc 4.1, p. 2; Doc 4.1, p. 8). "
    "Clinical progress notes indicate fluctuating pain levels, temporary improvement after therapy blocks, "
    "and recurrent functional restrictions during work attempts (Doc 4.1, p. 8; Doc 2.1, p. 15). "
    "Personnel records and supervisor statements describe reduced productivity, missed shifts, and "
    "workplace accommodations consistent with partial disability (Doc 3.1, p. 1). "
    "Financial documents in the record include hospital billing statements, therapy invoices, and "
    "pharmacy receipts that can be mapped to medical expense categories (Doc 4.1, p. 2; Doc 4.1, p. 9). "
    "Where wage loss is claimed, earnings history before and after the collision should be compared "
    "using tax records, pay stubs, and employer confirmations (Doc 3.1, p. 1; Doc 4.1, p. 10). "
    "Future care assumptions should be tied to treating-provider recommendations and duration of "
    "symptoms reported at follow-up visits (Doc 4.1, p. 12; Doc 2.1, p. 15). "
    "Non-pecuniary considerations, if addressed by counsel, remain distinct from special damages "
    "calculations and are not quantified in this schedule (Doc 1.1, p. 4). "
    "The Background therefore provides a chronological and documentary foundation for expert review "
    "without introducing facts outside the cited materials (Doc 1.1, p. 4; Doc 2.1, p. 15; Doc 4.1, p. 8).\n\n"
    "Following the collision, the plaintiff reported difficulty with sleep, driving, and household tasks, "
    "as reflected in follow-up clinical notes and correspondence (Doc 4.1, p. 8; Doc 3.1, p. 1). "
    "Treatment plans included analgesic medication, home exercises, and periodic reassessment of range of motion "
    "(Doc 4.1, p. 2; Doc 4.1, p. 8). Although some improvement was documented in mid-2021, the plaintiff "
    "continued to describe pain flare-ups after physical exertion (Doc 4.1, p. 12; Doc 2.1, p. 15). "
    "Workplace records indicate that modified duties were initially offered for four hours per day and "
    "later increased as tolerated, with ongoing monitoring by a supervisor (Doc 3.1, p. 1). "
    "The plaintiff's earnings during this period were lower than pre-incident levels, supporting a past "
    "lost income analysis subject to verification against payroll records (Doc 4.1, p. 10; Doc 3.1, p. 1). "
    "Out-of-pocket expenses referenced in the file include transportation to appointments and over-the-counter "
    "medical supplies, which should be supported by receipts where available (Doc 4.1, p. 9). "
    "Future care projections in the record reference continued therapy and possible diagnostic imaging if "
    "symptoms persist, which may inform future care cost assumptions (Doc 4.1, p. 12). "
    "Interest calculations, if claimed, should be applied only to past pecuniary losses supported by the "
    "documentary record and counsel's legal theory (Doc 4.1, p. 10). "
    "This section is provided for demonstrative purposes in the LitiDoc workflow and should be replaced by "
    "model-generated output when API processing is available (Doc 1.1, p. 4; Doc 2.1, p. 15)."
)

MOCK_CLASSIFICATION_ITEMS: list[dict] = [
    {
        "category": "past_lost_income",
        "date": "2021-04-01",
        "description": "Lost wages during initial recovery period",
        "amount": 18000.0,
        "source": "Doc 4.1, p. 10",
        "notes": "Demo fallback item",
    },
    {
        "category": "medical_expenses",
        "date": "2021-03-05",
        "description": "Emergency department visit",
        "amount": 2500.0,
        "source": "Doc 4.1, p. 2",
        "notes": "Demo fallback item",
    },
    {
        "category": "medical_expenses",
        "date": "2021-04-12",
        "description": "Physiotherapy sessions (8 weeks)",
        "amount": 3200.0,
        "source": "Doc 4.1, p. 8",
        "notes": "Demo fallback item",
    },
    {
        "category": "out_of_pocket",
        "date": "2021-05-01",
        "description": "Travel to medical appointments",
        "amount": 800.0,
        "source": "Doc 4.1, p. 9",
        "notes": "Demo fallback item",
    },
    {
        "category": "future_lost_income",
        "date": "2022-01-01",
        "description": "Projected partial capacity wage loss (1 year)",
        "amount": 22000.0,
        "source": "Doc 3.1, p. 1",
        "notes": "Demo fallback item",
    },
    {
        "category": "future_care_costs",
        "date": "2022-06-01",
        "description": "Projected ongoing physiotherapy",
        "amount": 3500.0,
        "source": "Doc 4.1, p. 12",
        "notes": "Demo fallback item",
    },
]

MOCK_GRAND_TOTAL = 50000.0

MOCK_BACKGROUND: dict[str, str | int | bool] = {
    **MOCK_BACKGROUND_SECTIONS,
    "full_text": MOCK_BACKGROUND_FULL_TEXT,  # ~800 words for demo mode
}

MOCK_CLASSIFICATIONS: dict = {
    "damages": MOCK_CLASSIFICATION_ITEMS,
    "grand_total": MOCK_GRAND_TOTAL,
    "message": "Demo fallback classifications used.",
    "fallback": True,
}


def _jobs_dir(job_id: str) -> Path:
    return Path(settings.JOBS_PATH) / job_id


def _save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _word_count(text: str) -> int:
    return len(text.split())


def _build_mock_classifications(job_id: str) -> dict:
    by_category: dict[str, dict] = {
        category: {"items": [], "total": 0.0} for category in DAMAGE_CATEGORIES
    }
    for item in MOCK_CLASSIFICATION_ITEMS:
        category = item["category"]
        by_category[category]["items"].append(item)
        by_category[category]["total"] += float(item["amount"])

    by_category = {
        category: payload
        for category, payload in by_category.items()
        if payload["items"]
    }
    category_totals = {
        category: payload["total"] for category, payload in by_category.items()
    }

    return {
        "job_id": job_id,
        "damages": MOCK_CLASSIFICATION_ITEMS,
        "grand_total": MOCK_GRAND_TOTAL,
        "by_category": by_category,
        "category_totals": category_totals,
        "financial_document_count": 1,
        "message": "Demo fallback classifications used.",
        "fallback": True,
    }


def get_fallback_timeline(job_id: str) -> dict:
    """Return and persist a demo timeline when Stage 1 fails."""
    result = {
        "job_id": job_id,
        "events": [dict(event) for event in MOCK_TIMELINE_EVENTS],
        "total_events": len(MOCK_TIMELINE_EVENTS),
        "fallback": True,
    }
    _save_json(_jobs_dir(job_id) / "timeline.json", result)
    return result


def get_fallback_background(job_id: str) -> dict:
    """Return and persist a demo background when Stage 2 fails."""
    full_text = MOCK_BACKGROUND_FULL_TEXT
    result = {
        "job_id": job_id,
        "introduction": MOCK_BACKGROUND_SECTIONS["introduction"],
        "incident_description": MOCK_BACKGROUND_SECTIONS["incident_description"],
        "medical_treatment": MOCK_BACKGROUND_SECTIONS["medical_treatment"],
        "employment_history": MOCK_BACKGROUND_SECTIONS["employment_history"],
        "full_text": full_text,
        "word_count": _word_count(full_text),
        "word_count_valid": True,
        "fallback": True,
    }
    _save_json(_jobs_dir(job_id) / "background.json", result)
    return result


def get_fallback_classifications(job_id: str) -> dict:
    """Return and persist demo classifications when Stage 3 fails."""
    result = _build_mock_classifications(job_id)
    _save_json(_jobs_dir(job_id) / "classifications.json", result)
    return result
