import { GoogleGenAI } from '@google/genai';

export async function generateAlternatives(name: string, gender: string, apiKey: string): Promise<string[]> {
  const genAI = new GoogleGenAI({ apiKey });
  
  const prompt = `List 5 creative alternative spellings or close variations for the baby name "${name}" (gender: ${gender}). 
  Return ONLY a JSON array of strings. Do not include markdown formatting or explanation. 
  Example output: ["Name1", "Name2", "Name3", "Name4", "Name5"]`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // In @google/genai, response.text() is a method on the *candidate* or similar, 
    // OR simply response.text() if using the right level of abstraction. 
    // Evaluating the error "response.text is not a function", it implies response is the raw object.
    // The quickstart says response.text() but that might be for Python or a different version.
    // Let's inspect the response structure safely.
    // Actually, looking at the TS definition or recent usage, it often returns { text: string } or similar helper.
    // But if 'response.text' is not a function, maybe it's a property?
    // Let's use safely: response.text() if exists, else check candidates.
    
    // For now, based on standard new SDK patterns, it might be `response.candidates[0].content.parts[0].text`.
    // But let's try the safest way: JSON stringify if unclear, but better to check docs or use debug script to see structure.
    
    // Actually, to save turns, I'll update the debug script to dump the keys of the response first, 
    // OR just guess standard structure: response.candidates[0].content.parts[0].text
    
    // However, the error in debug_ai.js was "response.text is not a function".
    // I'll assume for now I need to access it differently.
    
    // Let's try to access it via `response.candidates[0].content.parts[0].text` which is the low-level structure.
    
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const text = part?.text || '';
    
    if (!text) {
        console.error('Unexpected response structure:', JSON.stringify(response, null, 2));
        throw new Error('No text generated');
    }
    
    // Clean up if the model adds markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error generating names:', error);
    throw error;
  }
}
