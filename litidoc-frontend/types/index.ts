export interface TimelineEvent {
  event_id: string;
  date: string | null;
  date_text: string;
  description: string;
  citation?: string | null;
  source_doc?: string | null;
  page?: number | null;
}

export interface BackgroundSection {
  title: string;
  content: string;
}

export interface DamageItem {
  date: string | null;
  description: string;
  amount: number;
  source?: string | null;
}

export interface DamageCategory {
  name: string;
  total: number;
  items: DamageItem[];
}

export type JobStatusValue =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ProcessingStage = 0 | 1 | 2 | 3 | 4;

export interface JobStatus {
  job_id: string;
  status: JobStatusValue;
  current_stage: ProcessingStage;
  progress: number;
  message?: string | null;
  error: string | null;
  timeline_events_preview?: TimelineEvent[];
  background_word_count: number | null;
  damage_total: number | null;
  download_url: string | null;
}

export interface UploadResponse {
  job_id: string;
  status: JobStatusValue;
}
