export interface DocumentIndexItem {
  ref: string;
  file: string;
  type: string;
  summary: string;
  pages: number;
  size?: string;
  status?: "Ready" | "Ready for extraction";
}

export interface TimelineEvent {
  date: string;
  event: string;
  people: string;
  citation: string;
  confidence: "High" | "Medium" | "Low";
}

export interface DamageItem {
  category: string;
  description: string;
  extractedSupport: string;
  citation: string;
  notes?: string;
}

export interface CaseParties {
  plaintiff: string;
  defendant: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export interface LitiDocAnalysisResponse {
  caseName: string;
  parties: CaseParties;
  matterType: string;
  jurisdiction: string;
  currentStage: string;
  documentIndex: DocumentIndexItem[];
  timeline: TimelineEvent[];
  backgroundDraft: string;
  damageRegister: DamageItem[];
  nameInconsistencyNote?: string;
  extractedEvents?: number;
  damageCategories?: number;
  sourcesCited?: number;
}

export type TabType = "timeline" | "background" | "documents" | "damages" | "exports";
