import type {
  BackendBackground,
  BackendCaseMetadata,
  BackendClassifications,
  BackendIndex,
  BackendTimeline,
  BackendTimelineHighlights,
} from "./backendTypes";
import type {
  DamageItem,
  DocumentIndexItem,
  LitiDocAnalysisResponse,
  TimelineEvent,
  TimelineHighlight,
} from "./types";

const DOC_TYPE_LABELS: Record<string, string> = {
  PLEADING: "Pleading",
  DISCOVERY: "Discovery",
  CORRESPONDENCE: "Correspondence",
  FINANCIAL: "Financial",
  OTHER: "Other",
};

const DAMAGE_CATEGORY_LABELS: Record<string, string> = {
  past_lost_income: "Past Lost Income",
  future_lost_income: "Future Lost Income",
  medical_expenses: "Medical Expenses",
  future_care_costs: "Future Care Costs",
  out_of_pocket: "Out of Pocket",
  loss_of_valuable_services: "Loss of Services",
  non_pecuniary: "Non Pecuniary",
  pre_judgment_interest: "Pre Judgment Interest",
};

const EXCEL_SHEET_NAMES = [
  "Summary",
  "Past Lost Income",
  "Future Lost Income",
  "Medical Expenses",
  "Future Care Costs",
  "Out of Pocket",
  "Loss of Services",
  "Non Pecuniary",
  "Pre Judgment Interest",
];

function formatCategoryLabel(category: string): string {
  return (
    DAMAGE_CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDocType(docType: string): string {
  return DOC_TYPE_LABELS[docType] ?? docType;
}

function mapTimelineEvents(timeline: BackendTimeline): TimelineEvent[] {
  return timeline.events.map((event) => ({
    date: event.date_text || event.date || "unspecified",
    event: event.description,
    people: "",
    citation: event.citation || "",
    confidence: "High" as const,
  }));
}

function highlightSortKey(dateValue: string): string {
  const normalized = dateValue.trim();
  const lowered = normalized.toLowerCase();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  if (/^\d{4}$/.test(normalized)) {
    return `${normalized}-06-30`;
  }
  if (lowered.includes("post-termination")) {
    return "9999-12-31";
  }

  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return lowered;
}

function mapTimelineHighlights(
  highlights: BackendTimelineHighlights,
): TimelineHighlight[] {
  const mapped = highlights.events.map((event) => ({
    rank: event.rank,
    date: event.date_text || event.date || "unspecified",
    label: event.brief_explanation || event.description,
    description: event.description,
    citation: event.citation,
    sortKey: highlightSortKey(event.date || event.date_text || ""),
  }));

  mapped.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return mapped.map(({ sortKey: _sortKey, ...event }, index) => ({
    ...event,
    rank: index + 1,
  }));
}

function mapDocumentIndex(index: BackendIndex): DocumentIndexItem[] {
  return index.documents.map((doc) => ({
    ref: doc.reference_tag,
    file: doc.original_name,
    type: formatDocType(doc.doc_type),
    summary: doc.summary,
    pages: doc.page_count,
    status: "Ready" as const,
  }));
}

function mapDamageRegister(classifications: BackendClassifications): DamageItem[] {
  return classifications.damages.map((item) => ({
    category: formatCategoryLabel(item.category),
    description: item.description,
    extractedSupport:
      item.amount != null
        ? `$${item.amount.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
        : "Amount not stated",
    citation: item.source || "",
    notes: item.notes || undefined,
    amount: item.amount ?? undefined,
  }));
}

const CAPTION_RE =
  /B\s*E\s*T\s*W\s*E\s*E\s*N\s*:\s*([A-Z][A-Z\s.'-]+?)\s*,?\s*Plaintiff.*?(?:and|—|-)\s*([A-Z][A-Z\s.'&-]+?)\s*,?\s*Defendant/is;

function inferCaseMetadataFromSummaries(index: BackendIndex): BackendCaseMetadata | null {
  const prioritized = [...index.documents].sort((a, b) => {
    const aClaim = /statement_of_claim/i.test(a.original_name) ? 0 : 1;
    const bClaim = /statement_of_claim/i.test(b.original_name) ? 0 : 1;
    return aClaim - bClaim;
  });

  let plaintiff = "";
  let defendant = "";
  for (const doc of prioritized) {
    const match = CAPTION_RE.exec(doc.summary);
    if (match) {
      plaintiff = match[1]
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w+/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
      defendant = match[2]
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w+/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
      break;
    }
  }

  if (!plaintiff || !defendant) {
    return null;
  }

  const combined = index.documents.map((doc) => doc.summary).join("\n");
  const jurisdictionMatch = combined.match(
    /\b(Ontario|British Columbia|Alberta|Quebec)\b/i,
  );

  const matterParts: string[] = [];
  const lowered = combined.toLowerCase();
  if (lowered.includes("wrongful dismissal")) {
    matterParts.push("Wrongful dismissal");
  }
  if (lowered.includes("constructive dismissal")) {
    matterParts.push("Constructive dismissal");
  }
  if (lowered.includes("bad faith")) {
    matterParts.push("Bad faith damages");
  }
  if (lowered.includes("disability")) {
    matterParts.push("Disability-related claims");
  }

  const employeeNames = new Set<string>();
  const employeeRe =
    /(?:Employee Name|Patient|Claimant|From|Dear)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
  for (const doc of index.documents) {
    let match: RegExpExecArray | null;
    while ((match = employeeRe.exec(doc.summary)) !== null) {
      employeeNames.add(match[1]);
    }
  }

  const mismatches = [...employeeNames].filter(
    (name) => name.toLowerCase() !== plaintiff.toLowerCase(),
  );

  return {
    case_name: `${plaintiff} v. ${defendant}`,
    plaintiff,
    defendant,
    matter_type:
      matterParts.length > 0
        ? matterParts.join(" / ")
        : "Litigation damages analysis",
    jurisdiction: jurisdictionMatch?.[1] ?? "To be confirmed",
    name_inconsistency_note:
      mismatches.length > 0
        ? `Name inconsistency detected: caption/plaintiff is ${plaintiff}, while employment and financial records identify ${mismatches.join(", ")}. Flagged for review.`
        : null,
  };
}

function resolveCaseMetadata(index: BackendIndex): BackendCaseMetadata {
  const meta = index.case_metadata;
  if (meta?.case_name) {
    return meta;
  }

  const inferred = inferCaseMetadataFromSummaries(index);
  if (inferred) {
    return inferred;
  }

  if (index.documents.length === 0) {
    return {
      case_name: "Uploaded Case Package",
      plaintiff: "See case documents",
      defendant: "See case documents",
      matter_type: "Litigation damages analysis",
      jurisdiction: "To be confirmed",
    };
  }

  const first = index.documents[0].original_name;
  const match = first.match(/([A-Za-z]+)\s+v\.?\s+([A-Za-z]+)/i);
  const caseName = match ? `${match[1]} v. ${match[2]}` : "Uploaded Case Package";

  return {
    case_name: caseName,
    plaintiff: "See case documents",
    defendant: "See case documents",
    matter_type: "Litigation damages analysis",
    jurisdiction: "To be confirmed",
  };
}

export function buildAnalysisResponse(input: {
  index: BackendIndex;
  timeline: BackendTimeline;
  highlights: BackendTimelineHighlights;
  background: BackendBackground;
  classifications: BackendClassifications;
}): LitiDocAnalysisResponse {
  const { index, timeline, highlights, background, classifications } = input;
  const categoriesWithTotals = Object.keys(classifications.category_totals ?? {});
  const caseMeta = resolveCaseMetadata(index);

  return {
    caseName: caseMeta.case_name,
    parties: {
      plaintiff: caseMeta.plaintiff || "See case documents",
      defendant: caseMeta.defendant || "See case documents",
    },
    matterType: caseMeta.matter_type || "Litigation damages analysis",
    jurisdiction: caseMeta.jurisdiction || "To be confirmed",
    nameInconsistencyNote: caseMeta.name_inconsistency_note ?? undefined,
    currentStage: "Analysis complete",
    documentIndex: mapDocumentIndex(index),
    timeline: mapTimelineEvents(timeline),
    timelineHighlights: mapTimelineHighlights(highlights),
    backgroundDraft: background.full_text,
    damageRegister: mapDamageRegister(classifications),
    extractedEvents: timeline.total_events,
    damageCategories: categoriesWithTotals.length,
    sourcesCited: index.documents.length,
    excelSheetNames: EXCEL_SHEET_NAMES,
  };
}
