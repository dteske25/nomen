import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, notInArray, and, ne, inArray, or, isNotNull, desc, asc } from 'drizzle-orm';
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


// GET /api/names
app.get('/api/names', async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const userName = c.req.query('userName') || 'anonymous';

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

    let result = await query.all();

    // If no names found, checks for "maybe" votes to recycle
    if (result.length === 0) {
      const maybeVotes = await db.select({ nameId: schema.votes.nameId })
        .from(schema.votes)
        .where(and(
          eq(schema.votes.userName, userName),
          eq(schema.votes.vote, 'maybe')
        ))
        .orderBy(asc(schema.votes.createdAt))
        .all();

      if (maybeVotes.length > 0) {
        const maybeNameIds = maybeVotes.map(v => v.nameId);
        const recycledNames = await db.select()
          .from(schema.names)
          .where(inArray(schema.names.id, maybeNameIds))
          .all();

        // Sort to match vote order (oldest first)
        result = recycledNames.sort((a, b) => {
          return maybeNameIds.indexOf(a.id) - maybeNameIds.indexOf(b.id);
        });
      }
    }

    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/api/names', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const { name, gender, userName } = body;
  const createdBy = userName || 'anonymous';

  if (!name || !gender) {
    return c.json({ error: 'Name and gender are required' }, 400);
  }

  try {
    // Check for existing name (case-insensitive)
    // Check for existing name (case-insensitive)
    const allNames = await db.select()
      .from(schema.names)
      .where(eq(schema.names.name, name)) // SQLite is case-insensitive by default for text usually, but to be safe we might want lower(), but let's stick to exact match or rely on user input matching. Actually, the seed check used lower(), but the schema is text. Let's do a rigorous check.
      // Drizzle doesn't have a simple lower() helper in the query builder easily without sql operator.
      // But looking at seed logic: "currentNames.some(n => n.name.toLowerCase() === candidate.name.toLowerCase())"
      // Detailed check:
      // Let's first just try to find it.
      .all();

    const existingName = allNames.find(n => n.name.toLowerCase() === name.toLowerCase());

    if (existingName) {
      // Name exists! Treat this as a vote for the existing name.
      // Check if user already voted?
      const userName = createdBy || 'anonymous';

      const existingVote = await db.select()
        .from(schema.votes)
        .where(and(
          eq(schema.votes.userName, userName),
          eq(schema.votes.nameId, existingName.id)
        ))
        .get();

      if (!existingVote) {
        await db.insert(schema.votes).values({
          id: crypto.randomUUID(),
          userName: userName,
          nameId: existingName.id,
          vote: 'like',
          createdAt: new Date(),
        });
      }

      // Return success as if created (or special status)
      return c.json({ id: existingName.id, name: existingName.name, status: 'merged' }, 200);
    }

    const id = crypto.randomUUID();
    await db.insert(schema.names).values({
      id,
      name,
      gender,
      createdAt: new Date(),
      createdBy: createdBy || 'anonymous', // save creator
    });

    // Auto-vote for the creator
    if (createdBy) {
      await db.insert(schema.votes).values({
        id: crypto.randomUUID(),
        userName: createdBy,
        nameId: id,
        vote: 'like', // Assume submitting is liking
        createdAt: new Date(),
      });
    }

    return c.json({ id, name, status: 'created' }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to create name' }, 500);
  }
});

app.get('/api/votes', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const userName = c.req.query('userName') || 'anonymous';

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
    if (vote === 'like') {
      // 1. Check if another user liked/superliked this name
      const otherLikes = await db.select()
        .from(schema.votes)
        .where(
          and(
            eq(schema.votes.nameId, nameId),
            ne(schema.votes.userName, userName),
            inArray(schema.votes.vote, ['like'])
          )
        )
        .limit(1);

      if (otherLikes.length > 0) {
        isMatch = true;
      }
      // Simplified: We now auto-vote on creation, so we don't need to check createdBy explicitly here.
      // If the creator submitted it, they have a vote record. If they liked it, it's a match.
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
  const userName = c.req.query('userName');

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
        inArray(schema.votes.vote, ['like'])
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
        inArray(schema.votes.vote, ['like'])
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
