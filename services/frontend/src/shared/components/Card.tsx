import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  footer,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-[var(--border)] shadow-sm ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-medium text-[var(--text-main)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border)] rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};
