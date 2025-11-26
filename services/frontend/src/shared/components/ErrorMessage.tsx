import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
}) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-center p-4 text-sm text-[var(--error)] bg-red-50 rounded-md border border-red-100 ${className}`}
    >
      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
