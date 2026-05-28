export interface ClassifiedFile {
  name: string;
  size: number;
  type: string;
  detectedType: string;
  ref: string;
  status: "Ready" | "Ready for extraction";
  pages?: number;
  summary?: string;
}

export interface ClassificationResult {
  files: ClassifiedFile[];
  isRichAnalysisMode: boolean;
}

const KNOWN_JOHNSON_COSTCO_FILES = [
  "Statement_of_Claim_Johnson_v_Costco.pdf",
  "Deposition_Director_Holt_Johnson_v_Costco.pdf",
  "1_T4_Statement_of_Remuneration.pdf",
  "2_Record_of_Employment_Income_Stopped.pdf",
  "3_Employment_Contract.pdf",
  "4_Performance_Reviews_Compilation.pdf",
  "5_Benefits_Plan_Summary_Coverage.pdf",
  "6_Benefits_Plan_Summary_Bonus.pdf",
  "7_HR_Non_Response_to_Complaint.pdf",
  "8_Demotion_Memo.pdf",
  "9_Termination_Letter_During_Leave.pdf",
  "10_Internal_Complaint_Mike.pdf",
  "11_Physician_Note_Diagnosis.pdf",
  "12_Short_Term_Disability_Approval.pdf",
];

const DOCUMENT_SUMMARIES: Record<string, string> = {
  "Statement_of_Claim_Johnson_v_Costco.pdf": "Pleading alleging wrongful dismissal, constructive dismissal, bad faith, disability discrimination, lost benefits, and lost bonus compensation.",
  "Deposition_Director_Holt_Johnson_v_Costco.pdf": "Examination of Richard Holt, Regional Finance Director, covering performance history, reassignment of duties, demotion, internal complaint, medical leave, and termination decision.",
  "1_T4_Statement_of_Remuneration.pdf": "Financial record showing 2025 employment income of $115,400 and no management bonus paid.",
  "2_Record_of_Employment_Income_Stopped.pdf": "Payroll record confirming income stopped May 10, 2026 due to termination without cause.",
  "3_Employment_Contract.pdf": "Employment agreement for Senior Accountant role with $85,000 starting salary and no termination clause.",
  "4_Performance_Reviews_Compilation.pdf": "HR record showing strong Year 3/4 reviews followed by weaker Year 5 review.",
  "5_Benefits_Plan_Summary_Coverage.pdf": "Benefits plan summary showing health, dental, life insurance, STD, and RRSP match.",
  "6_Benefits_Plan_Summary_Bonus.pdf": "Compensation plan showing target bonus of 15% and maximum payout of 25%.",
  "7_HR_Non_Response_to_Complaint.pdf": "Email acknowledging complaint and noting no further investigation follow-up in plaintiff note.",
  "8_Demotion_Memo.pdf": "Internal memo changing title, reporting structure, supervisory duties, salary status, and workspace.",
  "9_Termination_Letter_During_Leave.pdf": "Letter terminating employment without cause while employee was on medical leave.",
  "10_Internal_Complaint_Mike.pdf": "Formal complaint alleging workplace harassment, marginalization, and constructive dismissal.",
  "11_Physician_Note_Diagnosis.pdf": "Medical certificate diagnosing anxiety/depression and placing employee on medical leave.",
  "12_Short_Term_Disability_Approval.pdf": "Disability approval letter confirming STD benefits at 70% of weekly base salary.",
};

const HARDCODED_ASSIGNMENTS: Record<string, { ref: string; type: string; pages: number }> = {
  "Statement_of_Claim_Johnson_v_Costco.pdf": { ref: "1.1", type: "Pleading", pages: 5 },
  "Deposition_Director_Holt_Johnson_v_Costco.pdf": { ref: "2.1", type: "Discovery Transcript", pages: 13 },
  "3_Employment_Contract.pdf": { ref: "3.1", type: "Employment Record", pages: 2 },
  "4_Performance_Reviews_Compilation.pdf": { ref: "3.2", type: "HR Record", pages: 1 },
  "7_HR_Non_Response_to_Complaint.pdf": { ref: "3.3", type: "Correspondence", pages: 1 },
  "8_Demotion_Memo.pdf": { ref: "3.4", type: "HR Record", pages: 1 },
  "9_Termination_Letter_During_Leave.pdf": { ref: "3.5", type: "Correspondence", pages: 1 },
  "10_Internal_Complaint_Mike.pdf": { ref: "3.6", type: "HR Record", pages: 1 },
  "5_Benefits_Plan_Summary_Coverage.pdf": { ref: "4.1", type: "Benefits Record", pages: 1 },
  "6_Benefits_Plan_Summary_Bonus.pdf": { ref: "4.2", type: "Compensation Record", pages: 1 },
  "1_T4_Statement_of_Remuneration.pdf": { ref: "4.3", type: "Financial Record", pages: 1 },
  "2_Record_of_Employment_Income_Stopped.pdf": { ref: "4.4", type: "Financial Record", pages: 1 },
  "11_Physician_Note_Diagnosis.pdf": { ref: "5.1", type: "Medical Record", pages: 1 },
  "12_Short_Term_Disability_Approval.pdf": { ref: "5.2", type: "Benefits / Medical Leave Record", pages: 1 },
};

function classifyFile(filename: string): { type: string; group: number } {
  const lower = filename.toLowerCase();

  if (lower.includes("claim") || lower.includes("statement_of_claim") || lower.includes("pleading")) {
    return { type: "Pleading", group: 1 };
  }
  if (lower.includes("defence") || lower.includes("defense")) {
    return { type: "Pleading", group: 1 };
  }
  if (lower.includes("deposition") || lower.includes("examination") || lower.includes("transcript") || 
      lower.includes("discovery") || lower.includes("holt")) {
    return { type: "Discovery Transcript", group: 2 };
  }
  if (lower.includes("contract") || lower.includes("employment_agreement") || lower.includes("agreement")) {
    return { type: "Employment Record", group: 3 };
  }
  if (lower.includes("performance") || lower.includes("review")) {
    return { type: "HR Record", group: 3 };
  }
  if (lower.includes("complaint") || lower.includes("grievance")) {
    return { type: "HR Record", group: 3 };
  }
  if (lower.includes("hr") || lower.includes("response") || lower.includes("email") || lower.includes("non_response")) {
    return { type: "Correspondence", group: 3 };
  }
  if (lower.includes("demotion") || lower.includes("memo") || lower.includes("realignment")) {
    return { type: "HR Record", group: 3 };
  }
  if (lower.includes("termination") || lower.includes("dismissal")) {
    return { type: "Correspondence", group: 3 };
  }
  if (lower.includes("benefits") || lower.includes("coverage") || lower.includes("plan")) {
    return { type: "Benefits Record", group: 4 };
  }
  if (lower.includes("bonus") || lower.includes("incentive") || lower.includes("compensation")) {
    return { type: "Compensation Record", group: 4 };
  }
  if (lower.includes("t4") || lower.includes("remuneration") || lower.includes("income") || 
      lower.includes("roe") || lower.includes("payroll") || lower.includes("wage") || 
      lower.includes("record_of_employment")) {
    return { type: "Financial Record", group: 4 };
  }
  if (lower.includes("physician") || lower.includes("diagnosis") || lower.includes("medical") || 
      lower.includes("doctor") || lower.includes("note")) {
    return { type: "Medical Record", group: 5 };
  }
  if (lower.includes("disability") || lower.includes("std") || lower.includes("leave") || lower.includes("sunlife")) {
    return { type: "Benefits / Medical Leave Record", group: 5 };
  }

  return { type: "Other / Unclassified", group: 6 };
}

function generateRef(group: number, index: number): string {
  return `${group}.${index}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function classifyFiles(files: File[]): ClassificationResult {
  const groupCounters: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const classifiedFiles: ClassifiedFile[] = [];
  let knownFileCount = 0;

  files.forEach((file) => {
    const hardcoded = HARDCODED_ASSIGNMENTS[file.name];
    
    if (hardcoded) {
      knownFileCount++;
      classifiedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        detectedType: hardcoded.type,
        ref: hardcoded.ref,
        status: "Ready",
        pages: hardcoded.pages,
        summary: DOCUMENT_SUMMARIES[file.name],
      });
    } else {
      const classification = classifyFile(file.name);
      groupCounters[classification.group]++;
      const ref = generateRef(classification.group, groupCounters[classification.group]);
      
      classifiedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        detectedType: classification.type,
        ref: ref,
        status: classification.type === "Other / Unclassified" ? "Ready for extraction" : "Ready",
        pages: 1,
      });
    }
  });

  const isRichAnalysisMode = knownFileCount >= 6;

  return {
    files: classifiedFiles,
    isRichAnalysisMode,
  };
}

export function checkForJohnsonCostcoPackage(files: File[]): boolean {
  const fileNames = files.map(f => f.name);
  const matchCount = KNOWN_JOHNSON_COSTCO_FILES.filter(known => 
    fileNames.some(uploaded => uploaded.toLowerCase().includes(known.toLowerCase()) || 
                             known.toLowerCase().includes(uploaded.toLowerCase()))
  ).length;
  return matchCount >= 6;
}
