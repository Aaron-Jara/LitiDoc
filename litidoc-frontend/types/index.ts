export interface TimelineEvent {
  event_id: string;
  date: string | null;
  date_text: string;
  description: string;
  citation?: string | null;
  source_doc?: string | null;
  page?: number | null;
}

export interface TimelineHighlightEvent {
  rank: number;
  source_event_id: string;
  date: string;
  date_text: string;
  description: string;
  brief_explanation: string;
  citation: string;
  source_doc?: string | null;
  page?: number | null;
}

export type JobStatusValue = "processing" | "complete" | "error";

export type ProcessingStage = 0 | 1 | 2 | 3 | 4;

export interface JobStatus {
  job_id: string;
  status: JobStatusValue;
  current_stage: ProcessingStage;
  progress: number;
  message?: string | null;
  error: string | null;
  completed_stages?: string[];
  warnings?: string[];
  timeline_events_preview?: TimelineEvent[];
  timeline_total_events?: number;
  timeline_highlights_preview?: TimelineHighlightEvent[];
  timeline_highlights_count?: number;
  background_word_count?: number | null;
  background_summary?: string | null;
  damage_total?: number | null;
  category_totals?: Record<string, number>;
  download_url?: string | null;
  word_download_url?: string | null;
}

export interface UploadResponse {
  job_id: string;
  status: string;
}

export function isTerminalStatus(status: JobStatusValue): boolean {
  return status === "complete" || status === "error";
}
