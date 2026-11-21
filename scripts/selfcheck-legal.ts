// Run: npx tsx scripts/selfcheck-legal.ts
import { INITIAL_ISSUES, INITIAL_PLACES } from '../src/data/mockSugamData';
import { checkEligibility, clausesFor, buildReport } from '../src/lib/legal';
import type { AuditIssue } from '../src/types/sugampath';

let fails = 0;
const ok = (n: string, c: boolean) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}`); if (!c) fails++; };
const base = INITIAL_ISSUES.find((i) => i.id === 'ISS-1039')!; // broken lift, 6 confirmations, conf .86
const now = Date.parse('2026-11-22T12:00:00Z');
const mk = (p: Partial<AuditIssue>, f: Partial<AuditIssue['findings']> = {}): AuditIssue => ({ ...base, ...p, findings: { ...base.findings, ...f } });

ok('seeded broken lift >48h, strong evidence -> eligible structural', (() => { const e = checkEligibility(base, now); return e.eligible && e.track === 'structural'; })());
ok('broken lift 2h old -> blocked (not prolonged)', !checkEligibility(mk({ created_at: new Date(now - 2 * 3600_000).toISOString() }), now).eligible);
ok('structural no_ramp, 1 confirm, blurry/low-conf -> blocked', !checkEligibility(mk({ category: 'no_ramp', confirmations: 1 }, { ai_confidence: 0.5 }), now).eligible);
ok('structural no_ramp, 1 confirm, clear photo conf .8 -> eligible', checkEligibility(mk({ category: 'no_ramp', confirmations: 1 }, { ai_confidence: 0.8, image_quality: 'good' }), now).eligible);
ok('structural no_ramp, poor photo but 2 confirms -> eligible', checkEligibility(mk({ category: 'no_ramp', confirmations: 2, proof_photo: undefined }, { ai_confidence: 0.4, image_quality: 'poor' }), now).eligible);
ok('structural, clear photo but conf .74 and 1 confirm -> blocked', !checkEligibility(mk({ category: 'no_ramp', confirmations: 1 }, { ai_confidence: 0.74 }), now).eligible);
ok('closed issue -> blocked', !checkEligibility(mk({ status: 'fixed' }), now).eligible);
const vendor = mk({ category: 'obstruction', confirmations: 1 }, { ai_confidence: 0.95 });
ok('parked scooter single sighting -> blocked even at .95', !checkEligibility(vendor, now).eligible);
const rep = checkEligibility(mk({ category: 'obstruction', confirmations: 3 }), now);
ok('repeated obstruction -> municipal track, never structural', rep.eligible && rep.track === 'municipal');
ok('municipal track cites no RPwD sections', clausesFor('obstruction', 'railway_station').length === 0);
ok('building clauses: 40,44,45,46,89 + HGUA + Rajive Raturi', (() => { const c = clausesFor('no_ramp', 'hospital').map((x) => x.ref).join('|'); return ['Section 40','Section 44','Section 45','Section 46','Section 89','Harmonised','Rajive Raturi'].every((k) => c.includes(k)) && !c.includes('Section 41'); })());
ok('transit hub adds Section 41', clausesFor('broken_lift', 'railway_station').some((c) => c.ref.endsWith('Section 41')));
ok('bus category uses transport clauses (41, no 44)', (() => { const c = clausesFor('no_low_floor_bus', 'bus_stand').map((x) => x.ref).join('|'); return c.includes('Section 41') && !c.includes('Section 44'); })());
ok('"other" category never eligible', !checkEligibility(mk({ category: 'other', confirmations: 9 }), now).eligible);

const place = INITIAL_PLACES.find((p) => p.id === base.place_id)!;
const r = await buildReport(base, place, now);
ok('report has audit id, 64-char hash, lat/lng', /^SP-ISS-1039-[0-9A-F]{8}$/.test(r.auditId) && r.evidenceHash.length === 64 && r.lat === place.lat);
const r2 = await buildReport(base, place, now + 1000);
ok('hash is stable for same evidence', r.evidenceHash === r2.evidenceHash);
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
