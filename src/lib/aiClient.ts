import type { AuditFindings } from '../types/sugampath';

/** Downscale and re-encode as JPEG. Re-encoding through a canvas also strips EXIF/GPS metadata. */
export async function toCleanJpegDataUrl(src: string, maxSide = 1024): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image load failed'));
    i.src = src;
  });
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

export interface AiAuditOut {
  findings: AuditFindings;
  provider: 'Gemini' | 'Groq' | 'Custom';
  model: string;
  processing_ms: number;
}

export let lastAiError = '';

export async function aiAudit(args: {
  photoUrl: string;
  subject: string;
  note: string;
  placeName: string;
  language: string;
}): Promise<AiAuditOut | null> {
  try {
    const imageDataUrl = await toCleanJpegDataUrl(args.photoUrl);
    const r = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...args, imageDataUrl, photoUrl: undefined }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      lastAiError = `${r.status} ${e?.error ?? ''}`.trim();
      return null;
    }
    lastAiError = '';
    const d = (await r.json()) as AiAuditOut;
    const f = d.findings;
    if (!f || typeof f.ai_confidence !== 'number') return null;
    f.ai_confidence = Math.max(0, Math.min(1, f.ai_confidence));
    f.obstructions = Array.isArray(f.obstructions) ? f.obstructions : [];
    f.ramp ??= { present: 'unknown', slope: 'unknown', handrail: 'unknown' };
    f.lift ??= { present: 'unknown', working: 'unknown' };
    f.tactile_paving ??= { present: 'unknown', condition: 'unknown' };
    f.uncertainty_notes ??= '';
    f.scene ??= '';
    return d;
  } catch (e) {
    lastAiError = String((e as Error)?.message ?? e);
    return null;
  }
}

export async function aiWhatsAhead(req: { imageDataUrl: string; language: string; placeId?: string }) {
  const r = await fetch('/api/whats-ahead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`whats-ahead ${r.status}`);
  return r.json();
}
