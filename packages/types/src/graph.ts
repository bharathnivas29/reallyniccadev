import { Entity } from './entity';
import { Relationship } from './relationship';

export interface GraphMetadata {
  graphId: string;
  createdAt: Date;
  updatedAt: Date;
  sourceText?: string;         // First 200 chars
}

export interface Graph {
  nodes: Entity[];
  edges: Relationship[];
  meta: GraphMetadata;
}
