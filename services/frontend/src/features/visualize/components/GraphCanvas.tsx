import { useEffect, useRef, useState, useMemo, FC } from "react";
import cytoscape, { Core } from "cytoscape";
import { Graph, Relationship } from "@really-nicca/types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Download,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";

interface GraphCanvasProps {
  graphData?: Graph;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edge: Relationship) => void;
  selectedNodeId?: string;
  className?: string;
}

type LayoutName = "cose" | "circle" | "grid" | "breadthfirst" | "concentric";

export const GraphCanvas: FC<GraphCanvasProps> = ({
  graphData,
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isGraphReady, setIsGraphReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLayout, setCurrentLayout] = useState<LayoutName>("cose");

  // Stage 9.3: Visualization Controls State
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<string>>(
    new Set(["PERSON", "ORGANIZATION", "CONCEPT", "DATE", "PAPER"])
  );
  const [weightThreshold, setWeightThreshold] = useState(0.0);
  const [showLabels, setShowLabels] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter data based on controls
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    // Filter nodes by selected entity types
    const filteredNodes = graphData.nodes.filter((node) =>
      selectedEntityTypes.has(node.type)
    );

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Filter edges by weight threshold and visible nodes
    const filteredEdges = graphData.edges.filter(
      (edge) =>
        edge.weight >= weightThreshold &&
        visibleNodeIds.has(edge.sourceId) &&
        visibleNodeIds.has(edge.targetId)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [graphData, selectedEntityTypes, weightThreshold]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
      style: [
        // Node Styles
        {
          selector: "node",
          style: {
            "background-color": "#6366f1", // Indigo 500
            label: "data(label)",
            color: "#0f172a", // Slate 900
            "font-family": "Inter, sans-serif",
            "font-size": "12px",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: 32,
            height: 32,
            "border-width": 2,
            "border-color": "#e2e8f0", // Slate 200
            "text-background-opacity": 0,
          },
        },
        // Edge Styles
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#cbd5e1", // Slate 300
            "target-arrow-color": "#cbd5e1",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "10px",
            color: "#94a3b8", // Slate 400
            "text-rotation": "autorotate",
            "text-background-color": "#ffffff",
            "text-background-opacity": 1,
            "text-background-padding": "2px",
          },
        },
        // Selected State
        {
          selector: ":selected",
          style: {
            "background-color": "#4f46e5", // Indigo 600
            "border-color": "#312e81", // Indigo 900
            "border-width": 3,
            "line-color": "#6366f1",
            "target-arrow-color": "#6366f1",
            "source-arrow-color": "#6366f1",
          },
        },
        // Highlighted nodes (connected to hovered/selected)
        {
          selector: "node.highlighted",
          style: {
            "background-color": "#6366f1",
            opacity: 1,
          },
        },
        // Dimmed nodes (not connected)
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.3,
          },
        },
        // Highlighted edges
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#6366f1",
            "target-arrow-color": "#6366f1",
            opacity: 1,
            width: 3,
          },
        },
        // Dimmed edges
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.2,
          },
        },
      ],
      layout: {
        name: "grid",
        rows: 1,
      },
      wheelSensitivity: 0.2,
    });

    // Event Listeners
    cyRef.current.on("tap", "node", (evt) => {
      const node = evt.target;
      if (onNodeClick) {
        onNodeClick(node.id());
      }
    });

    // Edge Click Handler
    cyRef.current.on("tap", "edge", (evt) => {
      const edge = evt.target;
      if (onEdgeClick && graphData) {
        const edgeData = graphData.edges.find(
          (e) =>
            e.sourceId === edge.data("source") &&
            e.targetId === edge.data("target")
        );
        if (edgeData) {
          onEdgeClick(edgeData);
        }
      }
    });

    // Hover Effects
    cyRef.current.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const neighborhood = node.neighborhood();

      cyRef.current?.elements().addClass("dimmed");
      node.removeClass("dimmed").addClass("highlighted");
      neighborhood.removeClass("dimmed").addClass("highlighted");
    });

    cyRef.current.on("mouseout", "node", () => {
      cyRef.current?.elements().removeClass("dimmed highlighted");
    });

    setIsGraphReady(true);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, []);

  // Update Graph Data
  useEffect(() => {
    if (!cyRef.current || !filteredData) return;

    const cy = cyRef.current;

    // Transform data to Cytoscape elements
    const elements = [
      ...filteredData.nodes.map((node) => ({
        group: "nodes" as const,
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          ...node.metadata,
        },
      })),
      ...filteredData.edges.map((edge, i) => ({
        group: "edges" as const,
        data: {
          id: `e${i}`,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.relationType || edge.type,
          weight: edge.weight,
        },
      })),
    ];

    cy.elements().remove();
    cy.add(elements);

    // Run layout
    cy.layout({
      name: currentLayout,
      animate: true,
      animationDuration: 500,
      padding: 50,
      // @ts-ignore - layout options
      componentSpacing: 40,
      nodeOverlap: 4,
      refresh: 20,
      fit: true,
      randomize: false,
    }).run();
  }, [filteredData, currentLayout]);

  // Handle Selected Node Highlight
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().removeClass("selected-node");

    if (selectedNodeId) {
      const selectedNode = cyRef.current.$(`#${selectedNodeId}`);
      selectedNode.select();
    }
  }, [selectedNodeId]);

  // Search Functionality
  useEffect(() => {
    if (!cyRef.current || !isGraphReady) return;

    if (searchQuery) {
      const matchedNodes = cyRef.current.nodes().filter((node) => {
        const label = node.data("label") || "";
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      });

      cyRef.current.elements().addClass("dimmed");
      matchedNodes.removeClass("dimmed").addClass("highlighted");

      if (matchedNodes.length > 0) {
        cyRef.current.fit(matchedNodes, 50);
      }
    } else {
      cyRef.current.elements().removeClass("dimmed highlighted");
    }
  }, [searchQuery]);

  // Label Toggle Effect
  useEffect(() => {
    if (!cyRef.current || !isGraphReady) return;

    cyRef.current.nodes().style({
      label: showLabels ? "data(label)" : "",
    });
  }, [showLabels, isGraphReady]);

  // Zoom Controls
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      cyRef.current.center();
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  };

  // Export Function
  const handleExportPNG = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({ scale: 2, full: true });
      const link = document.createElement("a");
      link.download = `graph-${Date.now()}.png`;
      link.href = png;
      link.click();
    }
  };

  // Entity Type Toggle
  const toggleEntityType = (type: string) => {
    setSelectedEntityTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  return (
    <div className={`relative w-full h-full bg-[var(--bg-app)] ${className}`}>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="pl-10 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>

        {/* Layout Selector */}
        <select
          value={currentLayout}
          onChange={(e) => setCurrentLayout(e.target.value as LayoutName)}
          className="px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent cursor-pointer"
          title="Change Layout"
        >
          <option value="cose">Force</option>
          <option value="circle">Circle</option>
          <option value="grid">Grid</option>
          <option value="breadthfirst">Hierarchy</option>
          <option value="concentric">Concentric</option>
        </select>
      </div>

      {/* Stage 9.3: Visualization Controls Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white border border-[var(--border)] rounded-lg shadow-sm p-3 max-w-xs">
        {/* Panel Header */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between text-sm font-medium text-[var(--text-main)] hover:text-[var(--primary)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter size={14} />
            Controls
          </span>
          <span>{showFilters ? "▲" : "▼"}</span>
        </button>

        {/* Collapsible Controls */}
        {showFilters && (
          <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
            {/* Entity Type Filter */}
            <div>
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Entity Types
              </div>
              <div className="space-y-1">
                {["PERSON", "ORGANIZATION", "CONCEPT", "DATE", "PAPER"].map(
                  (type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntityTypes.has(type)}
                        onChange={() => toggleEntityType(type)}
                        className="rounded border-[var(--border)]"
                      />
                      <span>{type}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Weight Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[var(--text-muted)]">
                  Min Weight
                </span>
                <span className="text-[var(--text-main)]">
                  {weightThreshold.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={weightThreshold}
                onChange={(e) => setWeightThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {filteredData?.edges.length || 0} /{" "}
                {graphData?.edges.length || 0} edges
              </div>
            </div>

            {/* Label Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Node Labels
              </span>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="p-1.5 rounded hover:bg-[var(--bg-app)] transition-colors"
                title={showLabels ? "Hide Labels" : "Show Labels"}
              >
                {showLabels ? (
                  <Eye size={16} className="text-[var(--text-main)]" />
                ) : (
                  <EyeOff size={16} className="text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportPNG}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <Download size={14} />
              Export PNG
            </button>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--bg-app)] transition-colors shadow-sm"
          title="Zoom In"
        >
          <ZoomIn size={20} className="text-[var(--text-main)]" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--bg-app)] transition-colors shadow-sm"
          title="Zoom Out"
        >
          <ZoomOut size={20} className="text-[var(--text-main)]" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--bg-app)] transition-colors shadow-sm"
          title="Fit to Screen"
        >
          <Maximize2 size={20} className="text-[var(--text-main)]" />
        </button>
      </div>

      {/* Cytoscape Container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
