export const API = {
  getNames: async () => {
    const res = await fetch('/api/names', {
      headers: { 'X-User-Name': localStorage.getItem('userName') || 'anonymous' }
    });
    return res.json();
  },
  submitName: async (name: string, gender: string) => {
    const res = await fetch('/api/names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        gender,
        createdBy: localStorage.getItem('userName') || 'anonymous'
      }),
    });
    return res.json();
  },
  seed: async () => {
    const res = await fetch('/api/seed', {
      method: 'POST',
    });
    return res.json();
  },
  vote: async (nameId: string, vote: 'like' | 'dislike' | 'maybe') => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nameId,
        vote,
        userName: localStorage.getItem('userName') || 'anonymous'
      }),
    });
    return res.json();
  },
  getMatches: async () => {
    const res = await fetch('/api/matches', {
      headers: {
        'X-User-Name': localStorage.getItem('userName') || 'anonymous'
      }
    });
    return res.json();
  },
  getAlternatives: async (name: string, gender: string) => {
    const res = await fetch('/api/ai/alternatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': localStorage.getItem('userName') || 'anonymous'
      },
      body: JSON.stringify({ name, gender }),
    });
    return res.json();
  },
  getVotes: async () => {
    const res = await fetch('/api/votes', {
      headers: { 'X-User-Name': localStorage.getItem('userName') || 'anonymous' }
    });
    return res.json();
  },
  getSimilarVibes: async (name: string, gender: string) => {
    const res = await fetch('/api/ai/similar-vibes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': localStorage.getItem('userName') || 'anonymous'
      },
      body: JSON.stringify({ name, gender }),
    });
    return res.json();
  }
};
