import { FC } from "react";
import { Entity } from "@really-nicca/types";
import { X, Tag, Info } from "lucide-react";

interface GraphDetailsPanelProps {
  entity: Entity;
  onClose: () => void;
}

export const GraphDetailsPanel: FC<GraphDetailsPanelProps> = ({
  entity,
  onClose,
}) => {
  // Map entity types to colors
  const typeColors: Record<string, string> = {
    PERSON: "#3b82f6", // Blue
    ORGANIZATION: "#8b5cf6", // Purple
    CONCEPT: "#10b981", // Green
    DATE: "#f59e0b", // Amber
    PAPER: "#ec4899", // Pink
  };

  const typeColor = typeColors[entity.type] || "#6366f1";

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-[var(--bg-panel)] border-l border-[var(--border)] shadow-lg flex flex-col z-10">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-main)] truncate">
            {entity.label}
          </h2>
          <div className="flex items-center mt-1">
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: typeColor }}
            >
              {entity.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-md hover:bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Aliases */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div>
            <div className="flex items-center text-sm font-medium text-[var(--text-muted)] mb-2">
              <Tag size={16} className="mr-1" />
              Aliases
            </div>
            <div className="flex flex-wrap gap-2">
              {entity.aliases.map((alias, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-[var(--bg-app)] text-[var(--text-main)] text-xs rounded border border-[var(--border)]"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence & Importance */}
        <div>
          <div className="flex items-center text-sm font-medium text-[var(--text-muted)] mb-2">
            <Info size={16} className="mr-1" />
            Metadata
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">
                Confidence
              </span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: `${entity.confidence * 100}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-[var(--text-main)]">
                  {(entity.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {entity.metadata?.importance !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Importance
                </span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${entity.metadata.importance * 100}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-[var(--text-main)]">
                    {(entity.metadata.importance * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        {entity.sources && entity.sources.length > 0 && (
          <div>
            <div className="text-sm font-medium text-[var(--text-muted)] mb-2">
              Source Snippets ({entity.sources.length})
            </div>
            <div className="space-y-2">
              {entity.sources.slice(0, 3).map((source, i) => (
                <div
                  key={i}
                  className="p-3 bg-[var(--bg-app)] rounded border border-[var(--border)]"
                >
                  <p className="text-sm text-[var(--text-main)] leading-relaxed">
                    "{source.snippet}"
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Chunk {source.chunkIndex}
                  </p>
                </div>
              ))}
              {entity.sources.length > 3 && (
                <p className="text-xs text-[var(--text-muted)] text-center">
                  + {entity.sources.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
