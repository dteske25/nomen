import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, notInArray, and, ne, inArray, or, isNotNull, desc } from 'drizzle-orm';
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
  try {
    const db = drizzle(c.env.DB, { schema });
    const userName = c.req.header('X-User-Name') || 'anonymous';
    
    // Get all name IDs voted on by this user
    const userVotes = await db.select({ nameId: schema.votes.nameId })
      .from(schema.votes)
      .where(eq(schema.votes.userName, userName))
      .all();
      
    const votedNameIds = userVotes.map(v => v.nameId);
    
    // Fetch names not voted on
    let query = db.select().from(schema.names);
    
    if (votedNameIds.length > 0) {
      // @ts-ignore
      query = query.where(notInArray(schema.names.id, votedNameIds));
    }
    
    const result = await query.all();
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/names', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
    const { name, gender, createdBy } = body;
  
  if (!name || !gender) {
    return c.json({ error: 'Name and gender are required' }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await db.insert(schema.names).values({
      id,
      name,
      gender,
      createdAt: new Date(),
      createdBy: createdBy || 'anonymous', // save creator
    });
    return c.json({ id, name, status: 'created' }, 201);
  } catch (e) {
     return c.json({ error: 'Failed to create name' }, 500);
  }
});

app.get('/api/votes', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const userName = c.req.header('X-User-Name') || 'anonymous';
  
  try {
    const result = await db.select({
      nameId: schema.votes.nameId,
      vote: schema.votes.vote,
      createdAt: schema.votes.createdAt,
      name: schema.names.name,
      gender: schema.names.gender
    })
    .from(schema.votes)
    .innerJoin(schema.names, eq(schema.votes.nameId, schema.names.id))
    .where(eq(schema.votes.userName, userName))
    .orderBy(desc(schema.votes.createdAt))
    .all();
    
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch votes' }, 500);
  }
});

app.post('/api/vote', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const { nameId, vote, userName } = body; 

  if (!nameId || !vote || !userName) {
    return c.json({ error: 'Name ID, vote, and userName are required' }, 400);
  }

  const id = crypto.randomUUID();
  try {
    const existingVote = await db.select()
      .from(schema.votes)
      .where(and(
        eq(schema.votes.userName, userName),
        eq(schema.votes.nameId, nameId)
      ))
      .get();

    if (existingVote) {
      await db.update(schema.votes)
        .set({ vote, createdAt: new Date() })
        .where(eq(schema.votes.id, existingVote.id))
        .run();
    } else {
      await db.insert(schema.votes).values({
        id,
        userName,
        nameId,
        vote,
        createdAt: new Date(),
      });
    }

    // Check for match
    let isMatch = false;
    if (vote === 'like' || vote === 'superlike') {
      // 1. Check if another user liked/superliked this name
      const otherLikes = await db.select()
        .from(schema.votes)
        .where(
          and(
            eq(schema.votes.nameId, nameId),
            ne(schema.votes.userName, userName),
            inArray(schema.votes.vote, ['like', 'superlike'])
          )
        )
        .limit(1);

      if (otherLikes.length > 0) {
        isMatch = true;
      } else {
        // 2. Check if the name was created by another user (and they haven't voted dislike ideally, but let's assume creation = like)
        // We do not check for explicit dislike from creator here to keep it simple, 
        // assuming creators generally like their suggestions unless they change their mind (which they can do by voting dislike).
        // If creator voted dislike, it would be caught if we did a check, but let's just check creation for now as per plan.
        const nameRecord = await db.select().from(schema.names).where(eq(schema.names.id, nameId)).get();
        if (nameRecord && nameRecord.createdBy && nameRecord.createdBy !== userName) {
           isMatch = true;
        }
      }
    }

    return c.json({ status: 'voted', match: isMatch }, 201);
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

app.post('/api/ai/similar-vibes', async (c) => {
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
    const { generateSimilarVibes } = await import('./ai');
    const alternatives = await generateSimilarVibes(name, gender, apiKey);
    return c.json({ alternatives });
  } catch (e) {
    console.error("AI Generation Error:", e);
    return c.json({ error: 'Failed to generate similar vibes' }, 500);
  }
});


app.get('/api/matches', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const userName = c.req.header('X-User-Name');

  if (!userName) {
    return c.json({ error: 'User name header required' }, 400);
  }

  try {
    // Strategy:
    // 1. Get all names the current user has liked
    // 2. Filter those names where:
    //    a. Another user has liked them
    //    b. OR Another user created them
    
    // Get user likes
    const userLikes = await db.select({ nameId: schema.votes.nameId })
      .from(schema.votes)
      .where(and(
        eq(schema.votes.userName, userName),
        inArray(schema.votes.vote, ['like', 'superlike'])
      ))
      .all();

    const likedNameIds = userLikes.map(v => v.nameId);
    
    if (likedNameIds.length === 0) {
      return c.json([]);
    }

    // Find matches among these liked names
    
    // Condition A: Others liked
    const agreedVotes = await db.select({ nameId: schema.votes.nameId })
      .from(schema.votes)
      .where(and(
        inArray(schema.votes.nameId, likedNameIds),
        ne(schema.votes.userName, userName),
        inArray(schema.votes.vote, ['like', 'superlike'])
      ))
      .all();
      
    const agreedNameIds = new Set(agreedVotes.map(v => v.nameId));

    // For Condition B, we need to check the names table for those we haven't already found in A
    // (Optimization: only check names that aren't already matched via votes)
    
    // Fetch details for all liked names to check creator and return data
    const likedNamesDetails = await db.select()
      .from(schema.names)
      .where(inArray(schema.names.id, likedNameIds))
      .all();

    const matches = likedNamesDetails.filter(n => {
      // Is matched by vote?
      if (agreedNameIds.has(n.id)) return true;
      
      // Is matched by creator?
      if (n.createdBy && n.createdBy !== userName) return true;
      
      return false;
    });

    return c.json(matches);

  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch matches' }, 500);
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
        gender: candidate.gender === 'male' ? 'boy' : candidate.gender === 'female' ? 'girl' : 'neutral',
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
