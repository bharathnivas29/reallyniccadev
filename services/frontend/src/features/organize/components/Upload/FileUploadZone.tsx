import React, { useState, useCallback } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { Button } from "../../../../shared/components/Button";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

const DEFAULT_MAX_SIZE_MB = 10;

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  accept = ".pdf,.docx,.txt",
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const acceptedExtensions = accept.split(",").map((ext) => ext.trim());

      if (!acceptedExtensions.includes(fileExtension)) {
        return `Invalid file type. Please upload ${acceptedExtensions.join(
          ", "
        )} files.`;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size exceeds maximum limit of ${maxSizeMB}MB.`;
      }

      return null;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      setError(undefined);
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-xl p-12 
          transition-all cursor-pointer group
          ${
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary-light)]/20 scale-[1.02]"
              : error
              ? "border-[var(--error)] bg-red-50"
              : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/10"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={`
            h-16 w-16 rounded-full flex items-center justify-center 
            transition-transform
            ${
              error
                ? "bg-red-100 text-[var(--error)]"
                : "bg-[var(--primary-light)] text-[var(--primary)] group-hover:scale-110"
            }
          `}
          >
            {error ? <AlertCircle size={32} /> : <UploadCloud size={32} />}
          </div>

          <div className="space-y-1 text-center">
            <p className="text-lg font-medium text-[var(--text-main)]">
              {error ? "Upload Failed" : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              PDF, DOCX, or TXT (max {maxSizeMB}MB)
            </p>
          </div>

          {!error && (
            <div className="pt-4">
              <Button variant="secondary" size="sm" disabled={disabled}>
                Browse Files
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};
