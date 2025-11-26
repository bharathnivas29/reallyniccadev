import { Router } from 'express';
import { extractController } from './controllers/extract.controller';
import { graphController } from './controllers/graph.controller';
import { uploadController } from './controllers/upload.controller';
import { upload } from '../../config/upload.config';

const router = Router();

// POST /api/organize/extract - Extract knowledge graph from text
router.post('/extract', (req, res) => extractController.extractGraph(req, res));

// POST /api/organize/upload - Upload file and extract knowledge graph
router.post('/upload', upload.single('file'), (req, res) => uploadController.uploadFile(req, res));

// GET /api/organize/graphs - List all graphs
router.get('/graphs', (req, res) => graphController.listGraphs(req, res));

// GET /api/organize/graphs/:graphId - Get specific graph
router.get('/graphs/:graphId', (req, res) => graphController.getGraph(req, res));

export default router;
