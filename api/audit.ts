import { askVision, readBody, LANG_NAME } from './_ai.js';

export const config = { maxDuration: 40 };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = await readBody(req);
    const lang = LANG_NAME[b.language] ? b.language : 'en';
    const prompt = `You audit pedestrian accessibility from one photo near "${b.placeName ?? 'a public place'}". Subject hint: ${b.subject ?? 'gate'}. User note: "${String(b.note ?? '').slice(0, 300)}".
Reply ONLY with JSON of this exact shape (use "unknown" when not visible; never guess):
{"subject":"gate"|"footpath"|"crossing"|"bus_stop"|"other","scene":string (what the photo actually shows and the main access issue, 1-2 plain short sentences in ${LANG_NAME[lang]}; if the photo is not about a gate, path, crossing or bus stop, say what it really shows),"image_quality":"good"|"poor"|"unusable","step_free_access":"yes"|"partial"|"no"|"unknown","steps_count_estimate":number|null,"ramp":{"present":"yes"|"no"|"unknown","slope":"gentle"|"moderate"|"steep"|"unknown","handrail":"yes"|"no"|"unknown"},"lift":{"present":"yes"|"no"|"unknown","working":"yes"|"no"|"unknown"},"doorway_width":"wide"|"standard"|"narrow"|"unknown","surface":"smooth"|"rough"|"broken"|"unpaved"|"unknown","kerb_ramp":"present"|"absent"|"unknown","tactile_paving":{"present":"yes"|"partial"|"no"|"unknown","condition":"intact"|"broken"|"blocked"|"unknown"},"obstructions":[{"type":"parked_vehicle"|"vendor"|"construction"|"open_drain"|"pole"|"garbage"|"other","severity":"minor"|"major"}],"crossing_signal":"none"|"signal"|"audible_signal"|"unknown","open_drain_adjacent":boolean,"ai_confidence":number 0..1,"uncertainty_notes":string}
Lower ai_confidence (below 0.5) if the photo is dark, blurry or not about accessibility.`;
    const started = Date.now();
    const { json, provider, model } = await askVision(prompt, b.imageDataUrl);
    res.status(200).json({ findings: json, provider, model, processing_ms: Date.now() - started });
  } catch (e) {
    res.status(502).json({ error: String((e as Error).message) });
  }
}
