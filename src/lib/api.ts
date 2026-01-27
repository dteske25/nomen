
let currentUserName = localStorage.getItem('userName') || '';

export const API = {
  setApiUser: (name: string) => {
    currentUserName = name;
  },
  getNames: async () => {
    const res = await fetch(`/api/names?userName=${encodeURIComponent(currentUserName)}`);
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
        userName: currentUserName
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
        userName: currentUserName
      }),
    });
    return res.json();
  },
  getMatches: async () => {
    const res = await fetch(`/api/matches?userName=${encodeURIComponent(currentUserName)}`);
    return res.json();
  },
  getAlternatives: async (name: string, gender: string) => {
    const res = await fetch('/api/ai/alternatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, gender, userName: currentUserName }),
    });
    return res.json();
  },
  getVotes: async () => {
    const res = await fetch(`/api/votes?userName=${encodeURIComponent(currentUserName)}`);
    return res.json();
  },
  getSimilarVibes: async (name: string, gender: string) => {
    const res = await fetch('/api/ai/similar-vibes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, gender, userName: currentUserName }),
    });
    return res.json();
  }
};

