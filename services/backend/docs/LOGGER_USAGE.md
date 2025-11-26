# Logger Usage Guide

This guide explains how to use the Winston-based logger in the backend service.

## Basic Usage

```typescript
import { logger } from '@/shared/utils/logger';

// Info level - general application flow
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Debug level - detailed debugging (only in development)
logger.debug('Processing data', { itemCount: 42, batchSize: 10 });

// Warning level - potentially harmful situations
logger.warn('Rate limit approaching', { currentRequests: 95, limit: 100 });

// Error level - critical errors
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  retryAttempt: 3
});
```

## Using Context (Recommended)

Create a child logger with a specific context for your module:

```typescript
import { logger } from '@/shared/utils/logger';

// In a controller
const log = logger.child('ExtractController');

export class ExtractController {
  async extractGraph(req: Request, res: Response): Promise<void> {
    log.info('Processing extraction request', {
      textLength: req.body.text.length,
      requestId: req.requestId
    });
    
    try {
      // ... business logic
      log.info('Extraction completed successfully', {
        entityCount: result.entities.length,
        duration: `${duration}ms`
      });
    } catch (error) {
      log.error('Extraction failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }
}
```

## Log Levels

The logger uses the following levels (in order of severity):

1. **error** (0) - Critical errors that need immediate attention
2. **warn** (1) - Warning messages for potentially harmful situations
3. **info** (2) - Informational messages about application flow
4. **debug** (3) - Detailed debugging information

### Environment-Based Levels

- **Production**: Only `info`, `warn`, and `error` are logged
- **Development**: All levels including `debug` are logged
- **Test**: Only `error` is logged (quiet mode)

## Request Tracking

Every HTTP request automatically gets:
- A unique request ID (UUID)
- Request logging (method, path, query, IP)
- Response logging (status code, duration)
- Error logging (if an error occurs)

The request ID is:
- Generated automatically or taken from `X-Request-ID` header
- Attached to `req.requestId`
- Returned in response header `X-Request-ID`
- Included in all logs during the request lifecycle

Example log output:
```
2025-11-26 21:34:29 info [HTTP] Incoming request
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "path": "/api/organize/extract",
  "query": {},
  "ip": "::1"
}

2025-11-26 21:34:30 info [HTTP] Request completed
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "path": "/api/organize/extract",
  "statusCode": 200,
  "duration": "1234ms"
}
```

## Structured Logging

Always include relevant metadata in your logs:

```typescript
// ✅ GOOD - Structured with metadata
logger.info('Graph saved successfully', {
  graphId: 'abc-123',
  nodeCount: 15,
  edgeCount: 23,
  duration: '45ms'
});

// ❌ BAD - Unstructured string concatenation
logger.info(`Graph abc-123 saved with 15 nodes and 23 edges in 45ms`);
```

## Migration from console.log

Replace all `console.log` statements:

```typescript
// Before
console.log(`[Extract] Processing text (${text.length} chars)...`);
console.error(`[Extract] Failed:`, error.message);

// After
const log = logger.child('ExtractController');
log.info('Processing text', { textLength: text.length });
log.error('Extraction failed', { error: error.message, stack: error.stack });
```

## Production Logs

In production, logs are written to:
- **Console**: All logs (for container/cloud logging)
- **logs/error.log**: Only error-level logs
- **logs/combined.log**: All logs in JSON format

These files are automatically rotated and excluded from git.

## Best Practices

1. **Use context**: Always create a child logger with context for your module
2. **Include metadata**: Add relevant data as objects, not in the message string
3. **Use appropriate levels**: 
   - `debug` for verbose debugging
   - `info` for normal flow
   - `warn` for recoverable issues
   - `error` for critical failures
4. **Include request ID**: When logging in request handlers, include `req.requestId`
5. **Log errors properly**: Include both `error.message` and `error.stack`
6. **Don't log sensitive data**: Never log passwords, tokens, or PII

## Examples

### Controller Example
```typescript
import { logger } from '@/shared/utils/logger';

const log = logger.child('UploadController');

export class UploadController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    const file = req.file;
    
    log.info('File upload started', {
      requestId: req.requestId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    try {
      const result = await this.processFile(file);
      
      log.info('File processed successfully', {
        requestId: req.requestId,
        graphId: result.graphId,
        entityCount: result.entityCount,
        duration: `${duration}ms`
      });
      
      res.json(result);
    } catch (error) {
      log.error('File processing failed', {
        requestId: req.requestId,
        fileName: file.originalname,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ error: 'Processing failed' });
    }
  }
}
```

### Service Example
```typescript
import { logger } from '@/shared/utils/logger';

const log = logger.child('GraphBuilderService');

export class GraphBuilderService {
  buildGraph(entities: Entity[], relationships: Relationship[]): Graph {
    log.debug('Building graph', {
      entityCount: entities.length,
      relationshipCount: relationships.length
    });

    const graph = {
      nodes: this.buildNodes(entities),
      edges: this.buildEdges(relationships)
    };

    log.info('Graph built successfully', {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length
    });

    return graph;
  }
}
```
