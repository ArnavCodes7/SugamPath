// Shared AI helper for Vercel functions. Keys come from server env only (GEMINI_API_KEY, GROQ_API_KEY).
// Free-tier quota is per model, so a long chain keeps the app working when one runs out.
const GEMINI_MODELS = [
  'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite',
  'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite',
];

export async function askVision(prompt: string, imageDataUrl: string): Promise<{ json: any; provider: 'Gemini' | 'Groq' | 'Custom'; model: string }> {
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageDataUrl);
  if (!m) throw new Error('bad image');
  const [, mime, b64] = m;
  const gKey = process.env.GEMINI_API_KEY;
  const qKey = process.env.GROQ_API_KEY;
  let lastErr: unknown = new Error('No AI key configured');

  // Self-hosted / OpenAI-compatible vision model (LLM_BASE_URL, LLM_API_KEY, LLM_MODEL) goes first.
  const cBase = process.env.LLM_BASE_URL?.replace(/\/+$/, '');
  const cModel = process.env.LLM_MODEL;
  if (cBase && cModel) {
    try {
      const r = await fetch(`${cBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY ?? ''}` },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          model: cModel,
          temperature: 0.1,
          messages: [{ role: 'user', content: [{ type: 'text', text: `${prompt}\n/no_think` }, { type: 'image_url', image_url: { url: imageDataUrl } }] }],
        }),
      });
      if (!r.ok) throw new Error(`custom ${cModel} ${r.status}`);
      const d: any = await r.json();
      let text: string = d?.choices?.[0]?.message?.content ?? '';
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
      const a = text.indexOf('{');
      const z = text.lastIndexOf('}');
      if (a < 0 || z < a) throw new Error('custom: no JSON in reply');
      return { json: JSON.parse(text.slice(a, z + 1)), provider: 'Custom', model: cModel };
    } catch (e) {
      lastErr = e; // fall through to Gemini / Groq
    }
  }
  if (gKey) {
    // Models are tried in order; 503 "high demand" is common, so each is retried once.
    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(12000),
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
          // 429 = this model's free quota is spent, 404 = unavailable: go straight to the next model.
          if (/ (429|404|403)$/.test(String((e as Error).message))) break;
          await new Promise((res) => setTimeout(res, 500));
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
