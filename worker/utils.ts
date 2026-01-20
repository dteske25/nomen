export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export type CandidateName = {
  name: string;
  gender: string;
  origin: string;
};

export async function fetchNames(count: number): Promise<CandidateName[]> {
  const response = await fetch(
    `https://randomuser.me/api/?results=${count}&nat=us,gb,fr,de,es&inc=name,gender,nat`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch names from randomuser.me');
  }

  const data = await response.json() as any;
  
  return data.results.map((r: any) => ({
    name: r.name.first,
    gender: r.gender, // 'male' or 'female'
    origin: r.nat,
  }));
}
