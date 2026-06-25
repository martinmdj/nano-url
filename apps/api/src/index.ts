import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { authRoutes } from './auth/routes';
import { urlsRoutes } from './urls/routes';
import { redirectRoutes } from './redirect/routes';
import { statsRoutes } from './stats/routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { logger } from './lib/logger';
import { readFile } from 'fs/promises';

const app = new Hono();

app.use('*', requestLogger);

app.route('/api/auth', authRoutes);
app.route('/api/urls', urlsRoutes);
app.route('/api/stats', statsRoutes);

app.get('/', (c) => {
  return c.text('nano-url API');
});

app.route('/', redirectRoutes);

app.onError(errorHandler);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// In production, serve the SPA from the web build
if (process.env.NODE_ENV === 'production') {
  app.get('*', async (c) => {
    try {
      const content = await readFile('../web/dist/index.html', 'utf-8');
      return c.html(content);
    } catch {
      return c.json({ success: false, error: 'Not found' }, 404);
    }
  });
}

serve({ fetch: app.fetch, port }, () => {
  logger.info(`API server running on http://localhost:${port}`);
});