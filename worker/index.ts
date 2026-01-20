import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { fetchNames, levenshtein } from './utils';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_API_KEY: string;
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

app.post('/api/ai/alternatives', async (c) => {
  const body = await c.req.json();
  const { name, gender } = body;
  
  if (!name || !gender) {
    return c.json({ error: 'Name and gender are required' }, 400);
  }

  const apiKey = c.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500);
  }

  try {
    const { generateAlternatives } = await import('./ai');
    const alternatives = await generateAlternatives(name, gender, apiKey);
    return c.json({ alternatives });
  } catch (e) {
    console.error("AI Generation Error:", e);
    return c.json({ error: 'Failed to generate alternatives' }, 500);
  }
});


app.post('/api/seed', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  
  try {
    // 1. Fetch current names
    const currentNames = await db.select().from(schema.names).all();
    
    // 2. Fetch candidates (request more than 50 to allow for duplicates/similarity rejections)
    const candidates = await fetchNames(150);
    
    const addedNames: string[] = [];
    const minLevenshteinDistance = 2;
    
    for (const candidate of candidates) {
      if (addedNames.length >= 50) break;
      
      // Check for exact match in DB or already added in this batch
      const exactMatch = currentNames.some(n => n.name.toLowerCase() === candidate.name.toLowerCase()) || 
                         addedNames.includes(candidate.name);
      
      if (exactMatch) continue;
      
      // Check for similarity
      const isSimilar = currentNames.some(n => levenshtein(n.name.toLowerCase(), candidate.name.toLowerCase()) < minLevenshteinDistance);
      
      if (isSimilar) continue;
      
      // Add to DB
      const id = crypto.randomUUID();
      await db.insert(schema.names).values({
        id,
        name: candidate.name,
        gender: candidate.gender,
        origin: candidate.origin,
        createdAt: new Date(),
      });
      
      addedNames.push(candidate.name);
    }
    
    return c.json({ added: addedNames.length, names: addedNames });
    
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to seed database' }, 500);
  }
});

// Serve static assets (React App)
// This wildcard route must be last to allow API routes to be handled first
app.get('/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
