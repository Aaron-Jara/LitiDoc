"use client";

import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  const handleSelectFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) {
      return;
    }

    setFiles(Array.from(selectedFiles));
    setStatus("files-selected");
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 px-6 py-16 text-gray-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12">
        <section className="text-center">
          <h1 className="bg-linear-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            LitiDoc
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
            Upload legal documents and track processing status in one place.
          </p>
        </section>

        <section className="w-full max-w-3xl rounded-2xl border border-gray-700/70 bg-gray-900/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-500 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-gray-100">
              Drop files here or choose from your device
            </p>
            <p className="mt-2 text-sm text-gray-400">
              PDF, DOCX, and image formats will be supported.
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
              Select files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => handleSelectFiles(event.target.files)}
              />
            </label>

            {files.length > 0 && (
              <p className="mt-4 text-sm text-gray-300">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Status: {status} {jobId ? `| Job: ${jobId}` : ""}
            </p>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {/* TODO: Replace this placeholder with Dropzone + upload actions. */}
            {/* TODO: Wire upload action to POST /api/process and store returned job_id. */}
            Processing: {isProcessing ? "active" : "idle"}
          </div>
        </section>

        {/*
          TODO: Progress section (future):
          - Show processing stage, percent complete, and live backend messages
          - Poll GET /api/process?job_id=... and update UI state
        */}

        {/*
          TODO: Results section (future):
          - Render timeline preview, background summary, and damages
          - Add report download action when job is complete
        */}
      </div>
    </main>
  );
}
