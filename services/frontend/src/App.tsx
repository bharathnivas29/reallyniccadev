import { useState } from "react";
import { Layout } from "./shared/components/Layout";
import { AlertCircle } from "lucide-react";
import { GraphCanvas } from "./features/visualize/components/GraphCanvas";
import { UploadSection } from "./features/organize/components/Upload/UploadSection";
import { Graph } from "@really-nicca/types";

function App() {
  const [graph, setGraph] = useState<Graph | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleGraphReady = (newGraph: Graph) => {
    setGraph(newGraph);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setGraph(undefined);
    setError(undefined);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            Knowledge Graph Organizer
          </h1>
          <p className="text-[var(--text-muted)]">
            Upload documents or paste text to automatically extract and
            visualize knowledge graphs
          </p>
        </header>

        <main className="flex flex-col items-center gap-8">
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!graph ? (
            <UploadSection
              onGraphReady={handleGraphReady}
              onError={(err) => setError(err)}
              isProcessing={isProcessing}
            />
          ) : (
            <div className="w-full h-[800px] bg-[var(--bg-app)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold text-lg">Graph Visualization</h2>
                  <div className="flex gap-2 text-sm text-[var(--text-muted)]">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">
                      {graph.nodes.length} Nodes
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded-md">
                      {graph.edges.length} Edges
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  Upload New File
                </button>
              </div>

              <div className="flex-1 relative">
                <GraphCanvas graphData={graph} />
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default App;
