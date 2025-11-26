import React, { useState } from "react";
import { UploadForm } from "./UploadForm";
import { TextArea } from "../../../../shared/components/Input";
import { Button } from "../../../../shared/components/Button";
import { FileText, Type } from "lucide-react";
import { Graph } from "@really-nicca/types";
import { apiClient } from "../../services/api-client";

interface UploadSectionProps {
  onGraphReady: (graph: Graph) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
}

type InputMode = "upload" | "paste";

export const UploadSection: React.FC<UploadSectionProps> = ({
  onGraphReady,
  onError,
  isProcessing = false,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [pastedText, setPastedText] = useState("");
  const [textError, setTextError] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleUploadSuccess = (graph: Graph) => {
    onGraphReady(graph);
  };

  const handlePasteSubmit = async () => {
    setTextError("");

    if (!pastedText.trim()) {
      setTextError("Please enter some text");
      return;
    }

    if (pastedText.trim().length < 10) {
      setTextError("Text must be at least 10 characters long");
      return;
    }

    setIsExtracting(true);
    try {
      const response = await apiClient.extractGraph(pastedText);
      onGraphReady(response.graph);
    } catch (err: any) {
      console.error("Extraction failed:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to extract graph";
      setTextError(msg);
      if (onError) onError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-[var(--bg-app)] rounded-lg border border-[var(--border)]">
        <button
          onClick={() => setInputMode("upload")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all
            ${
              inputMode === "upload"
                ? "bg-white text-[var(--primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }
          `}
        >
          <FileText className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => setInputMode("paste")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all
            ${
              inputMode === "paste"
                ? "bg-white text-[var(--primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }
          `}
        >
          <Type className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      {/* Upload Mode */}
      {inputMode === "upload" && (
        <UploadForm onUploadSuccess={handleUploadSuccess} onError={onError} />
      )}

      {/* Paste Mode */}
      {inputMode === "paste" && (
        <div className="space-y-4">
          <TextArea
            label="Paste your text here"
            placeholder="Enter or paste text to extract knowledge graph..."
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setTextError("");
            }}
            error={textError}
            rows={12}
            className="font-mono text-sm"
          />
          <Button
            onClick={handlePasteSubmit}
            disabled={isProcessing || isExtracting || !pastedText.trim()}
            className="w-full"
          >
            {isExtracting ? "Extracting..." : "Extract Knowledge Graph"}
          </Button>
        </div>
      )}
    </div>
  );
};
