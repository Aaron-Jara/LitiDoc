# LitiDoc Frontend Quick Guide

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Dropzone
- Lucide React
- Axios

## Folder Structure
- `app/` - App Router pages, layouts, global styles, and API routes
- `app/api/process/` - Next.js proxy route forwarding requests to FastAPI
- `components/ui/` - Reusable UI primitives (buttons, cards, inputs)
- `components/layout/` - Layout-level components (header, shell, wrappers)
- `lib/` - API clients, hooks helpers, utility modules
- `hooks/` - Custom React hooks
- `types/` - Shared TypeScript interfaces and types

## Backend API Endpoints
- `POST /process`
  - Accepts multipart form data with uploaded files
  - Returns `{ job_id, status }`
- `GET /status/{id}`
  - Returns processing progress and preview data for a job
- `GET /download/{id}`
  - Returns generated Excel report file when complete

## Frontend Tasks Checklist
- [ ] Build file upload zone (drag/drop + click to select)
- [ ] Build progress stepper (stages, percent, status text)
- [ ] Build timeline table (date, description, citation/source)
- [ ] Build download button (enabled on completed status)
- [ ] Polish dark mode styling across all sections

## Run Commands
```bash
npm run dev
```

## Design Direction
- Dark-first UI theme
- Blue-to-purple gradients for hero elements and accents
- Subtle animations for loading/progress feedback

## API Proxy Note
- Frontend should call `POST /api/process` and `GET /api/process?job_id=...`
- This proxy route forwards requests to the FastAPI backend at `http://localhost:8000`
