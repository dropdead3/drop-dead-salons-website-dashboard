import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that creates a POST endpoint at /__dev-context
 * which receives browser state and writes it to .cursor/browser-context.json
 * 
 * This allows Cursor agents to know what the user is currently seeing
 * in the browser when running the dev server.
 * 
 * DEV ONLY -- this plugin only runs in development mode.
 */
export function devContextPlugin(): Plugin {
  const contextDir = path.resolve(process.cwd(), '.cursor');
  const contextFile = path.join(contextDir, 'browser-context.json');

  return {
    name: 'dev-context-bridge',
    apply: 'serve', // Only runs in dev server, never in build

    configureServer(server) {
      server.middlewares.use('/__dev-context', (req, res, next) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const context = JSON.parse(body);

            // Ensure .cursor directory exists
            if (!fs.existsSync(contextDir)) {
              fs.mkdirSync(contextDir, { recursive: true });
            }

            // Write context with pretty formatting
            fs.writeFileSync(contextFile, JSON.stringify(context, null, 2), 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            console.error('[dev-context] Failed to write context:', err);
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      });

      console.log('[dev-context] Browser context bridge active at /__dev-context');
    },
  };
}
