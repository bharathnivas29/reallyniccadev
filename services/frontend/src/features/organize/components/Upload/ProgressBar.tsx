import React from "react";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  progress: number; // 0-100
  fileName?: string;
  fileSize?: number;
  status?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  fileName,
  fileSize,
  status = "Uploading...",
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full space-y-2">
      {/* File Info */}
      {fileName && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span className="font-medium text-[var(--text-main)] truncate max-w-xs">
              {fileName}
            </span>
          </div>
          {fileSize !== undefined && (
            <span className="text-[var(--text-muted)] flex-shrink-0">
              {formatFileSize(fileSize)}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[var(--primary)] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{status}</span>
        <span>{Math.round(clampedProgress)}%</span>
      </div>
    </div>
  );
};
