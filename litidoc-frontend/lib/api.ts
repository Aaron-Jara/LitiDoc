import { useEffect, useState } from "react";
import type {
  BackendBackground,
  BackendClassifications,
  BackendIndex,
  BackendTimeline,
  BackendTimelineHighlights,
} from "./backendTypes";
import { buildAnalysisResponse } from "./mapBackendToUi";
import type { LitiDocAnalysisResponse } from "./types";
import type { JobStatus, UploadResponse } from "../types";
import { isTerminalStatus } from "../types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data as T;
}

export async function uploadFiles(files: File[]): Promise<string> {
  if (!files.length) {
    throw new Error("At least one file is required.");
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/process", {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonResponse<UploadResponse>(response);
  return data.job_id;
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  if (!jobId) {
    throw new Error("jobId is required.");
  }

  const response = await fetch(
    `/api/process?job_id=${encodeURIComponent(jobId)}`,
    { method: "GET", cache: "no-store" },
  );

  if (response.status === 503) {
    throw new Error("BACKEND_UNAVAILABLE");
  }

  return parseJsonResponse<JobStatus>(response);
}

export async function resumeJob(jobId: string): Promise<void> {
  const response = await fetch(
    `/api/process?job_id=${encodeURIComponent(jobId)}&resume=1`,
    { method: "POST" },
  );
  await parseJsonResponse(response);
}

async function fetchArtifact<T>(jobId: string, resource: string): Promise<T> {
  const response = await fetch(
    `/api/jobs/${encodeURIComponent(jobId)}/${resource}`,
    { cache: "no-store" },
  );
  return parseJsonResponse<T>(response);
}

async function fetchArtifactOptional<T>(
  jobId: string,
  resource: string,
): Promise<T | null> {
  try {
    return await fetchArtifact<T>(jobId, resource);
  } catch {
    return null;
  }
}

export async function fetchJobResults(
  jobId: string,
): Promise<LitiDocAnalysisResponse> {
  const [index, timeline, highlightsRaw, background, classifications] =
    await Promise.all([
      fetchArtifact<BackendIndex>(jobId, "index"),
      fetchArtifact<BackendTimeline>(jobId, "timeline"),
      fetchArtifactOptional<BackendTimelineHighlights>(
        jobId,
        "timeline-highlights",
      ),
      fetchArtifact<BackendBackground>(jobId, "background"),
      fetchArtifact<BackendClassifications>(jobId, "classifications"),
    ]);

  const highlights: BackendTimelineHighlights = highlightsRaw ?? {
    job_id: jobId,
    source_total_events: timeline.total_events,
    highlights_count: 0,
    events: [],
  };

  return buildAnalysisResponse({
    index,
    timeline,
    highlights,
    background,
    classifications,
  });
}

export async function downloadExcel(jobId: string): Promise<void> {
  await downloadBinary(jobId, "excel", `litidoc_schedule_${jobId}.xlsx`);
}

export async function downloadWord(jobId: string): Promise<void> {
  await downloadBinary(jobId, "word", `litidoc_background_${jobId}.docx`);
}

async function downloadBinary(
  jobId: string,
  kind: "excel" | "word",
  filename: string,
): Promise<void> {
  const path =
    kind === "excel"
      ? `/api/download/${encodeURIComponent(jobId)}`
      : `/api/download/${encodeURIComponent(jobId)}/word`;

  const response = await fetch(path);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Download failed (${response.status})`;
    throw new Error(detail);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

interface UsePollingResult {
  status: JobStatus | null;
  loading: boolean;
  error: string | null;
}

export function usePolling(jobId: string | null): UsePollingResult {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let consecutiveFailures = 0;
    let resumeAttempted = false;

    const poll = async () => {
      setLoading(true);
      try {
        const latestStatus = await getStatus(jobId);
        if (isCancelled) {
          return;
        }
        consecutiveFailures = 0;
        setStatus(latestStatus);
        setError(null);

        if (isTerminalStatus(latestStatus.status) && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (pollError) {
        if (isCancelled) {
          return;
        }

        const isTransient =
          pollError instanceof Error &&
          pollError.message === "BACKEND_UNAVAILABLE";

        if (isTransient) {
          consecutiveFailures += 1;
          setError(
            consecutiveFailures >= 8
              ? "Backend unavailable. Restart the API server, then click Analyze again or refresh."
              : "Backend reconnecting…",
          );

          if (consecutiveFailures === 3 && !resumeAttempted) {
            resumeAttempted = true;
            try {
              await resumeJob(jobId);
            } catch {
              // Resume is best-effort when the backend comes back.
            }
          }
        } else {
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Failed to fetch job status.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void poll();
    intervalId = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  return { status, loading, error };
}
