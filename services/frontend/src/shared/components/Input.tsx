import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || React.useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-main)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm 
          placeholder:text-[var(--text-light)] 
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-[var(--error)] focus:ring-[var(--error)]" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[var(--error)]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
};

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || React.useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-main)] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm 
          placeholder:text-[var(--text-light)] 
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-[var(--error)] focus:ring-[var(--error)]" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[var(--error)]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
};
