import { useEffect, useState } from "react";
import type { JobStatus } from "../types";

export async function uploadFiles(files: FileList): Promise<string> {
  if (!files || files.length === 0) {
    throw new Error("At least one file is required.");
  }

  // TODO: Build FormData and POST to /api/process, then return response.job_id.
  // Example target response shape: { job_id: string, status: string }
  throw new Error("uploadFiles is not implemented yet.");
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  if (!jobId) {
    throw new Error("jobId is required.");
  }

  // TODO: GET /api/process?job_id=${jobId} and return parsed JobStatus.
  throw new Error("getStatus is not implemented yet.");
}

export async function downloadExcel(jobId: string): Promise<void> {
  if (!jobId) {
    throw new Error("jobId is required.");
  }

  // TODO: Fetch/download generated Excel file for the provided jobId.
  // TODO: Create blob URL and trigger browser download.
  throw new Error("downloadExcel is not implemented yet.");
}

interface UsePollingResult {
  status: JobStatus | null;
  loading: boolean;
}

export function usePolling(jobId: string | null): UsePollingResult {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const poll = async () => {
      setLoading(true);
      try {
        // TODO: Call getStatus(jobId), set response state, and stop polling on terminal states.
        const latestStatus = await getStatus(jobId);
        if (!isCancelled) {
          setStatus(latestStatus);
        }
      } catch {
        // TODO: Add toast/logging and retry/backoff strategy.
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void poll();

    // TODO: Replace with dynamic polling interval based on status.
    const interval = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  return { status, loading };
}
