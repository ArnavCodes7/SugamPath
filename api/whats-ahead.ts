import { askVision, readBody, LANG_NAME } from './_ai.js';

export const config = { maxDuration: 30 };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = await readBody(req);
    const lang = LANG_NAME[body.language] ? body.language : 'en';
    const prompt = `You help a blind or low-vision pedestrian who is stuck. Look at this camera frame taken in front of them.
Reply ONLY with JSON: {"guidance": string, "hazard": null | {"kind": "stairs"|"no_ramp"|"rough_surface"|"broken_lift"|"blocked_path"|"vendor"|"parked_vehicle"|"other", "side": "left"|"right"|"ahead"}}.
"guidance" must be 1-2 short spoken sentences in ${LANG_NAME[lang]}, saying what is ahead and which way to move. If the image is dark, blurry or unclear, say so and ask them to point the camera again, with hazard null. Never claim the way is safe.`;
    const { json } = await askVision(prompt, body.imageDataUrl);
    if (typeof json.guidance !== 'string') throw new Error('bad shape');
    res.status(200).json({ guidance: json.guidance, hazard: json.hazard ?? undefined });
  } catch (e) {
    res.status(502).json({ error: String((e as Error).message) });
  }
}
