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
        'X-User-Name': localStorage.getItem('userName') || 'anonymous'
      },
      body: JSON.stringify({ name, gender }),
    });
    return res.json();
  },
  seed: async () => {
    const res = await fetch('/api/seed', {
      method: 'POST',
    });
    return res.json();
  },
  vote: async (nameId: string, vote: 'like' | 'dislike' | 'superlike') => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Name': localStorage.getItem('userName') || 'anonymous'
      },
      body: JSON.stringify({ nameId, vote }),
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
