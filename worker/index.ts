import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Bindings }>();

// API Routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/api/names', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  // TODO: Add pagination or random generic names if empty
  const result = await db.select().from(schema.names).all();
  return c.json(result);
});

app.post('/api/names', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const { name, gender, origin } = body;
  
  if (!name || !gender) {
    return c.json({ error: 'Name and gender are required' }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await db.insert(schema.names).values({
      id,
      name,
      gender,
      origin,
      createdAt: new Date(),
    });
    return c.json({ id, name, status: 'created' }, 201);
  } catch (e) {
     return c.json({ error: 'Failed to create name' }, 500);
  }
});

app.post('/api/vote', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const { nameId, vote } = body; // user_name should be passed in headers or body
  // For now, let's assume a header 'X-User-Name' or just generic
  // The 'votes' table requires userName.
  const userName = c.req.header('X-User-Name') || 'anonymous';

  if (!nameId || !vote) {
    return c.json({ error: 'Name ID and vote are required' }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await db.insert(schema.votes).values({
      id,
      userName,
      nameId,
      vote,
      createdAt: new Date(),
    });
    return c.json({ status: 'voted' }, 201);
  } catch (e) {
    return c.json({ error: 'Failed to record vote' }, 500);
  }
});

// Serve static assets (React App)
// This wildcard route must be last to allow API routes to be handled first
app.get('/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
