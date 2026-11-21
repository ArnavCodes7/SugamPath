// Shared AI helper for Vercel functions. Keys come from server env only (GEMINI_API_KEY, GROQ_API_KEY).
export async function askVision(prompt: string, imageDataUrl: string): Promise<{ json: any; provider: 'Gemini' | 'Groq'; model: string }> {
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageDataUrl);
  if (!m) throw new Error('bad image');
  const [, mime, b64] = m;
  const gKey = process.env.GEMINI_API_KEY;
  const qKey = process.env.GROQ_API_KEY;
  let lastErr: unknown = new Error('No AI key configured');
  if (gKey) {
    // Models are tried in order; 503 "high demand" is common, so each is retried once.
    for (const model of ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite']) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
            }),
          });
          if (!r.ok) throw new Error(`gemini ${model} ${r.status}`);
          const d: any = await r.json();
          const text = d?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
          return { json: JSON.parse(text), provider: 'Gemini', model };
        } catch (e) {
          lastErr = e;
          await new Promise((res) => setTimeout(res, 600));
        }
      }
    }
  }
  if (qKey && process.env.GROQ_VISION_MODEL) {
    try {
      const model = process.env.GROQ_VISION_MODEL ?? '';
      if (!model) throw new Error('no groq vision model');
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${qKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUrl } }] }],
        }),
      });
      if (!r.ok) throw new Error(`groq ${r.status}`);
      const d: any = await r.json();
      return { json: JSON.parse(d.choices[0].message.content), provider: 'Groq', model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function readBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

export const LANG_NAME: Record<string, string> = { en: 'English', hi: 'Hindi', pa: 'Punjabi (Gurmukhi)' };
