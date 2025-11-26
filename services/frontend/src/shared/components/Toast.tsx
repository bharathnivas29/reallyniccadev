import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[var(--success)]" />,
    error: <AlertCircle className="h-5 w-5 text-[var(--error)]" />,
    info: <Info className="h-5 w-5 text-[var(--primary)]" />,
  };

  const bgColors = {
    success: "bg-white border-[var(--success)]",
    error: "bg-white border-[var(--error)]",
    info: "bg-white border-[var(--primary)]",
  };

  return (
    <div
      className={`
      flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 border-l-4 ${bgColors[type]}
    `}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
        {icons[type]}
      </div>
      <div className="ml-3 text-sm font-normal text-[var(--text-main)]">
        {message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
        onClick={() => onClose(id)}
      >
        <span className="sr-only">Close</span>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
