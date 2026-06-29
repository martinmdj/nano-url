import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { authRoutes } from './auth/routes';
import { urlsRoutes } from './urls/routes';
import { redirectRoutes } from './redirect/routes';
import { statsRoutes } from './stats/routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { logger } from './lib/logger';

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

if (process.env.NODE_ENV === 'production') {
  const webDist = new URL('../web/dist', import.meta.url).pathname;
  app.use('/assets/*', serveStatic({ root: webDist }));
  app.get('*', serveStatic({ path: './index.html', root: webDist }));
}

serve({ fetch: app.fetch, port }, () => {
  logger.info(`API server running on http://localhost:${port}`);
});