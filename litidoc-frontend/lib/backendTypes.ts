export interface BackendTimelineEvent {
  event_id: string;
  date: string;
  date_text: string;
  description: string;
  citation: string;
  source_doc?: string;
  page?: number;
}

export interface BackendTimeline {
  job_id: string;
  events: BackendTimelineEvent[];
  total_events: number;
}

export interface BackendTimelineHighlight {
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

export interface BackendTimelineHighlights {
  job_id: string;
  source_total_events: number;
  highlights_count: number;
  events: BackendTimelineHighlight[];
}

export interface BackendDocIndexItem {
  reference_tag: string;
  original_name: string;
  doc_type: string;
  summary: string;
  page_count: number;
  file_path: string;
}

export interface BackendCaseMetadata {
  case_name: string;
  plaintiff: string;
  defendant: string;
  matter_type: string;
  jurisdiction: string;
  name_inconsistency_note?: string | null;
  source_document?: string | null;
}

export interface BackendIndex {
  job_id: string;
  documents: BackendDocIndexItem[];
  case_metadata?: BackendCaseMetadata | null;
}

export interface BackendBackground {
  job_id: string;
  introduction: string;
  incident_description: string;
  medical_treatment: string;
  employment_history: string;
  full_text: string;
  word_count: number;
  word_count_valid?: boolean;
}

export interface BackendDamageItem {
  category: string;
  date: string;
  description: string;
  amount: number | null;
  source: string;
  notes: string;
}

export interface BackendClassifications {
  job_id: string;
  damages: BackendDamageItem[];
  grand_total: number;
  category_totals: Record<string, number>;
  by_category?: Record<string, unknown>;
}
