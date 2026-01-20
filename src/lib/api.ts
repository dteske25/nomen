export const API = {
  getNames: async () => {
    const res = await fetch('/api/names');
    return res.json();
  },
  submitName: async (name: string, gender: string, origin?: string) => {
    const res = await fetch('/api/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender, origin }),
    });
    return res.json();
  },
  vote: async (nameId: string, vote: 'like' | 'dislike' | 'superlike') => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameId, vote }),
    });
    return res.json();
  }
};
