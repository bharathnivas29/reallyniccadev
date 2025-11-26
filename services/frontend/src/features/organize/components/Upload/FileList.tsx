import React from "react";
import { File, X, FileText, FileType, CheckCircle2 } from "lucide-react";
import { Button } from "../../../../shared/components/Button";

interface FileListProps {
  file: File;
  preview?: string;
  onRemove: () => void;
  showPreview?: boolean;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return <File className="w-5 h-5 text-red-500" />;
    case "docx":
      return <FileType className="w-5 h-5 text-blue-500" />;
    case "txt":
      return <FileText className="w-5 h-5 text-gray-500" />;
    default:
      return <File className="w-5 h-5 text-gray-400" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const FileList: React.FC<FileListProps> = ({
  file,
  preview,
  onRemove,
  showPreview = true,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* File Info Card */}
      <div className="flex items-start gap-3 p-4 bg-white border border-[var(--border)] rounded-lg">
        <div className="flex-shrink-0 mt-0.5">{getFileIcon(file.name)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">•</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {file.type || "Unknown type"}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="flex-shrink-0 h-8 w-8 p-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Validation Status */}
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">
              File validated successfully
            </span>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {showPreview && preview && (
        <div className="p-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-[var(--text-main)]">
              Preview
            </h4>
            <span className="text-xs text-[var(--text-muted)]">
              First 500 characters
            </span>
          </div>
          <div className="text-sm text-[var(--text-main)] leading-relaxed font-mono bg-white p-3 rounded border border-[var(--border)] max-h-32 overflow-y-auto">
            {preview}
            {preview.length >= 500 && (
              <span className="text-[var(--text-muted)]">...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
