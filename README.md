# LitiDoc

LitiDoc is an end-to-end litigation consulting platform. Upload case documents (pleadings, depositions, financial records) and get a structured case index, chronological timeline, narrative background, damage classifications, and a downloadable Excel damages schedule—without manual document review from scratch.

## What it does

1. **Index** — PDFs are extracted, normalized, and classified (pleading, discovery, correspondence, financial, other) with reference tags (e.g. `1.4`, `2.1`).
2. **Timeline** — Text is split into overlapping chunks; each chunk is processed in parallel by Claude to extract dated events, then merged into one case timeline.
3. **Highlights** — Key timeline events are selected for quick review.
4. **Background** — A narrative background section is drafted from the full timeline.
5. **Classify** — Financial documents are analyzed for damage categories and totals.
6. **Export** — Results are written to an Excel schedule and an optional Word background document.

The pipeline is resilient: if a stage fails (API limits, timeouts), fallbacks keep the job moving so demos and reviews still complete.

## Architecture

```
Upload (PDF) → Stage 0 Index → Stage 1 Timeline (parallel Claude chunks)
            → Stage 1b Highlights → Stage 2 Background → Stage 3 Classify → Stage 4 Excel
```

**Parallel timeline extraction:** Documents are chunked (~3,000 words each, 200-word overlap). Up to **25** Claude requests run concurrently (one per chunk). A typical three-document demo case produces on the order of **~15–20** parallel “agents” for timeline extraction alone.

| Setting | Default | Purpose |
|--------|---------|---------|
| `CHUNK_SIZE` | 3000 | Words per chunk |
| `CHUNK_OVERLAP` | 200 | Overlap between chunks |
| `MAX_CONCURRENT` | 25 | Max parallel Claude calls |

## Project structure

```
LitiDoc/
├── litidoc-backend/     # FastAPI + Claude pipeline
│   ├── main.py          # HTTP API
│   ├── stages/          # Pipeline stages 0–4
│   ├── core/            # Chunking, Claude client, parallel processor
│   ├── prompts/         # Stage prompt templates
│   └── storage/         # Uploads and job artifacts (gitignored)
└── litidoc-frontend/    # Next.js UI (port 3000)
```

## Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18+** (frontend)
- **Anthropic API key** with access to Claude (default model: `claude-sonnet-4-6`)

## Quick start

### Backend

```bash
cd litidoc-backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create `litidoc-backend/.env`:

```env
ANTHROPIC_API_KEY=your_key_here
```

Start the API:

```bash
# Recommended for demos / long runs (reload ignores storage/)
python run_dev.py

# Or standard uvicorn (restarts on any .py change)
uvicorn main:app --reload --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health)

### Frontend

```bash
cd litidoc-frontend
npm install
cp .env.example .env.local   # optional; defaults to http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload PDFs, and run **Analyze case**. Poll the status until processing completes, then review timeline, background, classifications, and downloads.

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/process` | Upload PDFs; returns `{ job_id, status }` |
| `GET` | `/status/{job_id}` | Job progress (`?lite=1` for status only) |
| `GET` | `/timeline/{job_id}` | Full timeline JSON |
| `GET` | `/timeline-highlights/{job_id}` | Key events |
| `GET` | `/index/{job_id}` | Document index |
| `GET` | `/background/{job_id}` | Background text |
| `GET` | `/classifications/{job_id}` | Damage classifications |
| `GET` | `/download/{job_id}` | Excel schedule (`.xlsx`) |
| `GET` | `/download/word/{job_id}` | Background Word (`.docx`) |
| `POST` | `/resume/{job_id}` | Resume a stalled job |
| `GET` | `/health` | Liveness |

Example upload:

```bash
curl -X POST http://localhost:8000/process \
  -F "files=@deposition.pdf" \
  -F "files=@statement_of_claim.pdf"
```

## Configuration

All backend settings live in `litidoc-backend/.env` (see `config.py`):

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `CHUNK_SIZE` | No | Words per timeline chunk (default `3000`) |
| `CHUNK_OVERLAP` | No | Chunk overlap in words (default `200`) |
| `MAX_CONCURRENT` | No | Parallel Claude requests (default `25`) |
| `STORAGE_PATH` | No | Base storage directory (default `storage`) |

Frontend: set `FASTAPI_BASE_URL` in `litidoc-frontend/.env.local` if the API is not on `http://localhost:8000`.

## Outputs

Per job, artifacts are stored under `litidoc-backend/storage/jobs/{job_id}/`:

- `index.json` — Document metadata and types
- `timeline.json` — Extracted events
- `timeline_highlights.json` — Curated key events
- `background.json` — Narrative background
- `classifications.json` — Damage line items and totals
- `schedule.xlsx` — Excel damages schedule
- `background.docx` — Generated on Word download

## Development notes

- Use **`python run_dev.py`** when running real analyses; plain `--reload` restarts the server on code changes and can interrupt in-flight jobs.
- **`POST /resume/{job_id}`** continues from the last saved artifact after a crash or reload.
- Backend logs show chunk counts, e.g. `chunks=17 max_concurrent=25`, useful when explaining parallel processing.
- Sample schedule template: `litidoc-backend/schedule-sample.xlsx`.

## License

Hackathon / Lexiden project—add a license here if you open-source it.
