// Run: npx tsx scripts/selfcheck-pulse.ts
import { PulseAnalyzer, type PulseEvent } from '../src/lib/safety/pocketPulse';
import { resolveHazard, detectPeakHour } from '../src/lib/safety/hazards';

let fails = 0;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) fails++;
};
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5; })();

function run(gen: (t: number) => [number, number, number], seconds: number, speed: number | null) {
  const a = new PulseAnalyzer();
  a.setSpeed(speed);
  const evs: PulseEvent[] = [];
  for (let t = 0; t < seconds * 1000; t += 20) evs.push(...a.push(t, ...gen(t)));
  return evs;
}
const count = (e: PulseEvent[], k: string) => e.filter((x) => x.type === k).length;

// level walking on smooth ground: 1.8 Hz vertical bounce amp ~2.2, tiny sideways noise
const smooth = run((t) => [rnd() * 0.5, rnd() * 0.5, 9.81 + 2.2 * Math.max(0, Math.sin(2 * Math.PI * 1.8 * t / 1000))], 12, 1.3);
ok('smooth walk -> smooth windows, no rough/stairs', count(smooth, 'smooth') >= 4 && count(smooth, 'rough') === 0 && count(smooth, 'stairs') === 0);

// rough pavement: strong sideways jitter
const rough = run((t) => [rnd() * 9, rnd() * 9, 9.81 + 2.2 * Math.max(0, Math.sin(2 * Math.PI * 1.8 * t / 1000)) + rnd()], 12, 1.1);
ok('jittery walk -> rough', count(rough, 'rough') >= 4 && count(rough, 'smooth') === 0);

// stairs: heavy periodic impacts at 1.4 Hz, slow speed
const stairs = run((t) => [rnd() * 0.5, rnd() * 0.5, 9.81 + 5.5 * Math.max(0, Math.sin(2 * Math.PI * 1.4 * t / 1000)) ** 3], 12, 0.5);
ok('heavy periodic impacts + slow speed -> stairs', count(stairs, 'stairs') >= 3);
const notStairs = run((t) => [rnd() * 0.5, rnd() * 0.5, 9.81 + 5.5 * Math.max(0, Math.sin(2 * Math.PI * 1.4 * t / 1000)) ** 3], 12, 1.5);
ok('same impacts at normal speed -> not stairs', count(notStairs, 'stairs') === 0);

// fall: 3G spike then stillness
const fall = run((t) => (t === 2000 ? [0, 0, 9.81 * 3.2] : [0.05 * rnd(), 0.05 * rnd(), 9.81 + 0.05 * rnd()]), 10, 0);
ok('>2.5G spike + 5s stillness -> fall', count(fall, 'fall') === 1);
const stumble = run((t) => (t === 2000 ? [0, 0, 9.81 * 3.2] : t > 3000 && t < 4000 ? [rnd() * 12, rnd() * 12, 9.81 + rnd() * 12] : [0, 0, 9.81]), 10, 0);
ok('spike then movement -> no fall', count(stumble, 'fall') === 0);
const slam = run((t) => (t === 2000 ? [0, 0, 9.81 * 3.2] : [0, 0, 9.81 + 3 * Math.sin(t / 100)]), 10, 1);
ok('spike with no stillness -> no fall', count(slam, 'fall') === 0);

// decay tiers
const H = 3600_000, D = 24 * H;
const now = new Date(); now.setHours(12, 0, 0, 0);
const n = now.getTime();
const mk = (tier: 'structural' | 'maintenance' | 'transient', reports: number[]) => ({ id: 'x', placeId: 'p', gateName: 'g', kind: 'other' as const, tier, source: 'seed' as const, reports });
ok('structural never expires', resolveHazard(mk('structural', [n - 400 * D]), n) !== null);
ok('maintenance alive at 13d', resolveHazard(mk('maintenance', [n - 13 * D]), n) !== null);
ok('maintenance gone at 15d', resolveHazard(mk('maintenance', [n - 15 * D]), n) === null);
ok('transient alive at 2h', resolveHazard(mk('transient', [n - 2 * H]), n) !== null);
ok('transient gone at 4h', resolveHazard(mk('transient', [n - 4 * H]), n) === null);
const eve = (d: number, h: number) => { const x = new Date(n); x.setDate(x.getDate() - d); x.setHours(h, 5, 0, 0); return x.getTime(); };
const rep = [eve(1, 18), eve(2, 18), eve(3, 17)];
ok('3 evening reports on 3 days -> peak flag', detectPeakHour(rep));
ok('3 evening reports same day -> no flag', !detectPeakHour([eve(1, 17), eve(1, 18), eve(1, 19)]));
const six = new Date(n); six.setHours(18, 30, 0, 0);
ok('expired recurring blockage returns at 6:30 PM', resolveHazard(mk('transient', rep), six.getTime())?.status === 'peak');
ok('...but not at noon', resolveHazard(mk('transient', rep), n) === null);

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
