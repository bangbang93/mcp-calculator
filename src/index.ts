import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';
import * as http from 'node:http';
import * as path from 'node:path';
import { Worker } from 'node:worker_threads';

// ─── Safety limits ──────────────────────────────────────────────────────────

const TIMEOUT_MS = 5_000;
const MAX_MATRIX_SIZE = 100;

// Detect ts-node so the correct worker file/extension is used in dev mode.
// process[Symbol.for('ts-node.register.instance')] is set by ts-node when active.
const isTsNode = !!(process as unknown as Record<symbol, unknown>)[
  Symbol.for('ts-node.register.instance')
];
// Resolved at startup so the worker path survives packaging/renaming.
const WORKER_PATH = path.resolve(__dirname, isTsNode ? 'worker.ts' : 'worker.js');

interface WorkerResult {
  ok: true;
  value: string;
}
interface WorkerError {
  ok: false;
  error: string;
}
type WorkerMessage = WorkerResult | WorkerError;

/**
 * Run math.evaluate() inside a Worker thread with a hard timeout.
 * The worker is terminated if it doesn't respond within TIMEOUT_MS.
 */
function evaluate(expression: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { expression, maxMatrixSize: MAX_MATRIX_SIZE },
      execArgv: isTsNode ? ['-r', 'ts-node/register'] : [],
    });

    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error(`Calculation timed out after ${TIMEOUT_MS} ms`));
    }, TIMEOUT_MS);

    worker.once('message', (msg: WorkerMessage) => {
      clearTimeout(timer);
      if (msg.ok) {
        resolve(msg.value);
      } else {
        reject(new Error(msg.error));
      }
    });

    worker.once('error', (err) => {
      clearTimeout(timer);
      void worker.terminate();
      reject(err);
    });
  });
}

// ─── MCP server setup ────────────────────────────────────────────────────────

function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-calculator',
    version: '1.0.0',
  });

  server.registerTool(
    'calculate',
    {
      description:
        'Evaluate a mathematical expression using MathJS. Supports arithmetic, algebra, trigonometry, matrices, units, complex numbers, statistics and all other MathJS built-in functions.',
      inputSchema: {
        expression: z
          .string()
          .min(1)
          .describe(
            'Math expression to evaluate, e.g. "sin(pi/4)", "2 km to mile", "det([1,2;3,4])"',
          ),
      },
    },
    async ({ expression }) => {
      try {
        const text = await evaluate(expression);
        return {
          content: [{ type: 'text', text }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}

// ─── Transports ──────────────────────────────────────────────────────────────

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[mcp-calculator] Running in stdio mode');
}

async function startHttp(port: number): Promise<void> {
  const server = createServer();

  // Stateless transport – a fresh transport handles every request.
  const httpServer = http.createServer(async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error('[mcp-calculator] HTTP handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      } else if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } finally {
      try {
        await transport.close();
      } catch (closeErr) {
        console.error('[mcp-calculator] Error closing HTTP transport:', closeErr);
      }
    }
  });

  httpServer.listen(port, () => {
    console.error(`[mcp-calculator] Running in HTTP mode on port ${port}`);
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const useHttp =
  process.argv.includes('--http') || process.env['TRANSPORT'] === 'http';

if (useHttp) {
  const rawPort = process.env['PORT'];
  const defaultPort = 3000;
  let port = defaultPort;

  if (rawPort !== undefined && rawPort.trim() !== '') {
    const parsed = Number(rawPort);
    const isValidPort =
      Number.isFinite(parsed) &&
      Number.isInteger(parsed) &&
      parsed >= 1 &&
      parsed <= 65535;

    if (!isValidPort) {
      console.error(
        `[mcp-calculator] Invalid PORT environment variable: "${rawPort}". Expected an integer between 1 and 65535.`,
      );
      process.exit(1);
    }

    port = parsed;
  }

  startHttp(port).catch((err: unknown) => {
    console.error('[mcp-calculator] Fatal error:', err);
    process.exit(1);
  });
} else {
  startStdio().catch((err: unknown) => {
    console.error('[mcp-calculator] Fatal error:', err);
    process.exit(1);
  });
}
