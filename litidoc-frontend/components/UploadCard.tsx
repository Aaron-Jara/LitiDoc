"use client";

import { useState, useRef, useCallback } from "react";
import { ClassifiedFile } from "@/lib/fileClassification";

interface UploadCardProps {
  onFilesSelected: (files: File[]) => void;
  classifiedFiles: ClassifiedFile[];
  isAnalysisComplete: boolean;
}

export default function UploadCard({
  onFilesSelected,
  classifiedFiles,
  isAnalysisComplete,
}: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [folderHelperMessage, setFolderHelperMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = Array.from(e.dataTransfer.items);
    const files = Array.from(e.dataTransfer.files);
    
    // Check if any dropped items are directories
    const hasDirectories = items.some(item => {
      const entry = item.webkitGetAsEntry?.();
      return entry?.isDirectory;
    });
    
    if (hasDirectories) {
      setFolderHelperMessage(true);
      setTimeout(() => setFolderHelperMessage(false), 5000);
      return;
    }
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (isAnalysisComplete && classifiedFiles.length > 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Uploaded Documents</h3>
          <span className="text-sm text-slate-500">{classifiedFiles.length} files</span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {classifiedFiles.map((file, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_auto] gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{file.detectedType} • {formatFileSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600 bg-slate-200 px-2 py-1 rounded whitespace-nowrap">
                  {file.ref}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  file.status === "Ready" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {file.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Upload case documents</h2>
        <p className="text-slate-600 max-w-xl mx-auto">
          Drop files or upload pleadings, contracts, HR records, medical notes, benefits records, transcripts, and financial documents.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-slate-700 font-medium mb-1">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-slate-500 text-sm">or click to browse</p>
          </div>
        </div>
      </div>

      {folderHelperMessage && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            For folder uploads, use Select folder or open the folder and select all files.
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <div className="flex gap-2">
          {["PDF", "DOCX", "XLSX", "CSV", "TXT"].map((ext) => (
            <span
              key={ext}
              className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
            >
              {ext}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
        >
          Select files
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Select folder
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.docx,.xlsx,.csv,.txt"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        onChange={handleFolderSelect}
        className="hidden"
      />
    </div>
  );
}
