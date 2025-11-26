import React, { useState, useCallback } from "react";
import { FileUploadZone } from "./FileUploadZone";
import { ProgressBar } from "./ProgressBar";
import { FileList } from "./FileList";
import { Button } from "../../../../shared/components/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../services/api-client";
import { Graph } from "@really-nicca/types";

interface UploadFormProps {
  onUploadSuccess: (graph: Graph) => void;
  onError?: (error: string) => void;
}

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

export const UploadForm: React.FC<UploadFormProps> = ({
  onUploadSuccess,
  onError,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");

  const resetForm = useCallback(() => {
    setUploadState("idle");
    setSelectedFile(null);
    setFilePreview("");
    setProgress(0);
    setError("");
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError("");
    setUploadState("selected");
    setFilePreview(
      `Ready to upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    );
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setProgress(0);

    try {
      // Simulate initial progress
      setProgress(10);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      // Upload file to backend
      const response = await apiClient.uploadFile(selectedFile);

      clearInterval(interval);
      setProgress(100);
      setUploadState("success");

      // Return the extracted graph
      onUploadSuccess(response.graph);
    } catch (err: any) {
      console.error("Upload failed:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to upload file";
      setError(errorMessage);
      setUploadState("error");
      if (onError) onError(errorMessage);
    }
  }, [selectedFile, onUploadSuccess, onError]);

  const handleRemoveFile = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return (
    <div className="w-full space-y-4">
      {uploadState === "idle" && (
        <FileUploadZone onFileSelect={handleFileSelect} />
      )}

      {uploadState === "selected" && selectedFile && (
        <>
          <FileList
            file={selectedFile}
            preview={filePreview}
            onRemove={handleRemoveFile}
            showPreview={true}
          />
          <div className="flex gap-3">
            <Button onClick={handleUpload} variant="primary" className="flex-1">
              Extract Knowledge Graph
            </Button>
            <Button onClick={handleRemoveFile} variant="secondary">
              Cancel
            </Button>
          </div>
        </>
      )}

      {uploadState === "uploading" && selectedFile && (
        <div className="space-y-4">
          <FileList
            file={selectedFile}
            preview={filePreview}
            onRemove={() => {}}
            showPreview={false}
          />
          <ProgressBar
            progress={progress}
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            status={
              progress < 30
                ? "Reading file..."
                : progress < 70
                ? "Extracting text..."
                : "Processing..."
            }
          />
        </div>
      )}

      {uploadState === "success" && selectedFile && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              File uploaded successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              {selectedFile.name} has been processed. Generating knowledge
              graph...
            </p>
          </div>
        </div>
      )}

      {uploadState === "error" && error && (
        <div className="space-y-4">
          {selectedFile && (
            <FileList
              file={selectedFile}
              preview={filePreview}
              onRemove={handleRemoveFile}
              showPreview={false}
            />
          )}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <Button onClick={resetForm} variant="secondary" className="w-full">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
