// scripts/accuracy-eval.ts
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

type Entity = { label: string; type: string };
type Relationship = { source: string; target: string; type: string };

interface Sample {
  name: string;
  text: string;
  expected: {
    entities: Entity[];
    relationships: Relationship[];
  };
}

// Load golden samples
const samples: Sample[] = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../docs/golden-samples.json'), 'utf-8')
);

const BASE_URL = 'http://localhost:3000/api/organize';

function precisionRecallF1<T>(pred: T[], gold: T[]): { p: number; r: number; f1: number } {
  const predSet = new Set(pred.map(x => JSON.stringify(x)));
  const goldSet = new Set(gold.map(x => JSON.stringify(x)));
  const tp = [...predSet].filter(x => goldSet.has(x)).length;
  const p = predSet.size ? tp / predSet.size : 0;
  const r = goldSet.size ? tp / goldSet.size : 0;
  const f1 = p + r ? (2 * p * r) / (p + r) : 0;
  return { p, r, f1 };
}

async function run() {
  const lines: string[] = [];
  let totalEnt = { p: 0, r: 0, f1: 0 };
  let totalRel = { p: 0, r: 0, f1: 0 };

  for (const s of samples) {
    const resp = await axios.post(`${BASE_URL}/extract`, { text: s.text });
    const graph = resp.data.graph;
    const predEnt: Entity[] = graph.nodes.map((n: any) => ({ label: n.label, type: n.type }));
    if (graph.edges.length > 0) {
      console.log('First Edge Sample:', JSON.stringify(graph.edges[0], null, 2));
    }
    // Create node map for ID resolution
    const nodeMap = new Map<string, string>();
    graph.nodes.forEach((n: any) => nodeMap.set(n.id, n.label));

    const predRel: Relationship[] = graph.edges.map((e: any) => ({
      source: nodeMap.get(e.sourceId) || 'Unknown',
      target: nodeMap.get(e.targetId) || 'Unknown',
      type: e.relationType || e.type,
    }));

    const entMetrics = precisionRecallF1<Entity>(predEnt, s.expected.entities);
    const relMetrics = precisionRecallF1<Relationship>(predRel, s.expected.relationships);

    totalEnt.p += entMetrics.p;
    totalEnt.r += entMetrics.r;
    totalEnt.f1 += entMetrics.f1;
    totalRel.p += relMetrics.p;
    totalRel.r += relMetrics.r;
    totalRel.f1 += relMetrics.f1;

    console.log(`\n--- Sample: ${s.name} ---`);
    console.log('Expected Entities:', s.expected.entities.map(e => `${e.label} (${e.type})`).join(', '));
    console.log('Actual Entities:', predEnt.map(e => `${e.label} (${e.type})`).join(', '));
    console.log('Expected Relationships:', s.expected.relationships.map(r => `${r.source} -[${r.type}]-> ${r.target}`).join(', '));
    console.log('Actual Relationships:', predRel.map(r => `${r.source} -[${r.type}]-> ${r.target}`).join(', '));

    lines.push(`### ${s.name}`);
    lines.push(`- Entity Precision: ${(entMetrics.p * 100).toFixed(1)}%`);
    lines.push(`- Entity Recall: ${(entMetrics.r * 100).toFixed(1)}%`);
    lines.push(`- Entity F1: ${(entMetrics.f1 * 100).toFixed(1)}%`);
    lines.push(`- Relationship Precision: ${(relMetrics.p * 100).toFixed(1)}%`);
    lines.push(`- Relationship Recall: ${(relMetrics.r * 100).toFixed(1)}%`);
    lines.push(`- Relationship F1: ${(relMetrics.f1 * 100).toFixed(1)}%`);
    lines.push('');
  }

  const n = samples.length;
  const avgEnt = { p: totalEnt.p / n, r: totalEnt.r / n, f1: totalEnt.f1 / n };
  const avgRel = { p: totalRel.p / n, r: totalRel.r / n, f1: totalRel.f1 / n };

  const reportLines = [
    '# Accuracy Evaluation Report',
    `**Date:** ${new Date().toISOString()}`,
    '',
    '## Per‑Sample Metrics',
    ...lines,
    '## Overall Averages',
    `- Entity Precision: ${(avgEnt.p * 100).toFixed(1)}%`,
    `- Entity Recall: ${(avgEnt.r * 100).toFixed(1)}%`,
    `- Entity F1: ${(avgEnt.f1 * 100).toFixed(1)}%`,
    `- Relationship Precision: ${(avgRel.p * 100).toFixed(1)}%`,
    `- Relationship Recall: ${(avgRel.r * 100).toFixed(1)}%`,
    `- Relationship F1: ${(avgRel.f1 * 100).toFixed(1)}%`,
    ''
  ].join('\n');

  const outPath = path.resolve(__dirname, '../accuracy_evaluation_report.md');
  fs.writeFileSync(outPath, reportLines, { encoding: 'utf-8' });
  console.log('✅ Accuracy evaluation completed. Report written to accuracy_evaluation_report.md');
}

run().catch(err => {
  console.error('❌ Evaluation failed:', err);
  process.exit(1);
});
