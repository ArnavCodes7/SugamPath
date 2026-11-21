import { AUDIT_PHOTOS } from '../data/mockSugamData';
import type { AuditFindings } from '../types/sugampath';

export type SamplePhotoKey =
  | 'good_gate'
  | 'bikes_tactile'
  | 'stairs_no_ramp'
  | 'open_drain'
  | 'low_floor_bus'
  | 'blurry_dark';

export type PhotoAuditSubject = 'gate' | 'footpath' | 'crossing' | 'bus_stop';

export interface MockAuditSample {
  id: string;
  key: SamplePhotoKey;
  photo: string;
  subject: PhotoAuditSubject;
  defaultPlaceId: string;
  findings: AuditFindings;
}

export interface OfflinePendingAudit {
  id: string;
  placeId: string;
  placeName: string;
  subject: PhotoAuditSubject;
  note: string;
  photoUrl: string;
  sampleKey?: SamplePhotoKey;
  createdAt: string;
}

export const OFFLINE_QUEUE_STORAGE_KEY = 'sugampath_offline_audit_queue_v1';

export const MOCK_AUDIT_SAMPLES: MockAuditSample[] = [
  {
    id: 'sample-1-good-gate',
    key: 'good_gate',
    photo: AUDIT_PHOTOS.gateRamp,
    subject: 'gate',
    defaultPlaceId: 'plc-ndls-rajiv-chowk',
    findings: {
      subject: 'gate',
      scene: 'Step-free station gate with smooth gentle concrete ramp, railings, and working lift.',
      image_quality: 'good',
      step_free_access: 'yes',
      steps_count_estimate: 0,
      ramp: { present: 'yes', slope: 'gentle', handrail: 'yes' },
      lift: { present: 'yes', working: 'yes' },
      doorway_width: 'wide',
      surface: 'smooth',
      kerb_ramp: 'present',
      tactile_paving: { present: 'yes', condition: 'intact' },
      obstructions: [],
      crossing_signal: 'unknown',
      open_drain_adjacent: false,
      ai_confidence: 0.94,
      uncertainty_notes: 'Clear view of gate ramp and yellow guide tiles.',
    },
  },
  {
    id: 'sample-2-bikes-tactile',
    key: 'bikes_tactile',
    photo: '/assets/sample-bikes-tactile.svg',
    subject: 'footpath',
    defaultPlaceId: 'plc-pta-railway',
    findings: {
      subject: 'footpath',
      scene: 'Parked motorbikes blocking the yellow tactile guide tiles on footpath.',
      image_quality: 'good',
      step_free_access: 'partial',
      steps_count_estimate: 0,
      ramp: { present: 'unknown', slope: 'unknown', handrail: 'unknown' },
      lift: { present: 'no', working: 'unknown' },
      doorway_width: 'unknown',
      surface: 'rough',
      kerb_ramp: 'unknown',
      tactile_paving: { present: 'yes', condition: 'blocked' },
      obstructions: [{ type: 'parked_vehicle', severity: 'major' }],
      crossing_signal: 'unknown',
      open_drain_adjacent: false,
      ai_confidence: 0.88,
      uncertainty_notes: 'Ramp not visible in footpath frame.',
    },
  },
  {
    id: 'sample-3-stairs-no-ramp',
    key: 'stairs_no_ramp',
    photo: '/assets/sample-stairs-no-ramp.svg',
    subject: 'gate',
    defaultPlaceId: 'plc-chd-railway',
    findings: {
      subject: 'gate',
      scene: '6 concrete steps at station entrance with no ramp and lift closed.',
      image_quality: 'good',
      step_free_access: 'no',
      steps_count_estimate: 6,
      ramp: { present: 'no', slope: 'unknown', handrail: 'unknown' },
      lift: { present: 'yes', working: 'no' },
      doorway_width: 'standard',
      surface: 'smooth',
      kerb_ramp: 'unknown',
      tactile_paving: { present: 'no', condition: 'unknown' },
      obstructions: [],
      crossing_signal: 'unknown',
      open_drain_adjacent: false,
      ai_confidence: 0.91,
      uncertainty_notes: 'Stair count clearly visible from front view.',
    },
  },
  {
    id: 'sample-4-open-drain',
    key: 'open_drain',
    photo: AUDIT_PHOTOS.brokenTactile,
    subject: 'footpath',
    defaultPlaceId: 'plc-pta-bus-stand',
    findings: {
      subject: 'footpath',
      scene: 'Broken footpath edge next to an uncovered open drain with no tiles.',
      image_quality: 'good',
      step_free_access: 'partial',
      steps_count_estimate: null,
      ramp: { present: 'no', slope: 'unknown', handrail: 'unknown' },
      lift: { present: 'no', working: 'unknown' },
      doorway_width: 'unknown',
      surface: 'broken',
      kerb_ramp: 'absent',
      tactile_paving: { present: 'no', condition: 'unknown' },
      obstructions: [{ type: 'open_drain', severity: 'major' }],
      crossing_signal: 'unknown',
      open_drain_adjacent: true,
      ai_confidence: 0.89,
      uncertainty_notes: 'Open trench visible along right footpath edge.',
    },
  },
  {
    id: 'sample-5-low-floor-bus',
    key: 'low_floor_bus',
    photo: AUDIT_PHOTOS.lowFloorBusStop,
    subject: 'bus_stop',
    defaultPlaceId: 'plc-chd-isbt17',
    findings: {
      subject: 'bus_stop',
      scene: 'Low-floor bus bay with dropped kerb ramp and yellow warning tiles; crossing lacks sound signal.',
      image_quality: 'good',
      step_free_access: 'yes',
      steps_count_estimate: 0,
      ramp: { present: 'yes', slope: 'gentle', handrail: 'yes' },
      lift: { present: 'no', working: 'unknown' },
      doorway_width: 'wide',
      surface: 'smooth',
      kerb_ramp: 'present',
      tactile_paving: { present: 'yes', condition: 'intact' },
      obstructions: [],
      crossing_signal: 'signal',
      open_drain_adjacent: false,
      ai_confidence: 0.86,
      uncertainty_notes: 'Pedestrian signal present without audible speaker.',
    },
  },
  {
    id: 'sample-6-blurry-dark',
    key: 'blurry_dark',
    photo: '/assets/sample-blurry-dark.svg',
    subject: 'gate',
    defaultPlaceId: 'plc-ndls-kashmere',
    findings: {
      subject: 'gate',
      scene: 'Photo is too dark and blurry to read steps, ramp, or lift safely.',
      image_quality: 'poor',
      step_free_access: 'unknown',
      steps_count_estimate: null,
      ramp: { present: 'unknown', slope: 'unknown', handrail: 'unknown' },
      lift: { present: 'unknown', working: 'unknown' },
      doorway_width: 'unknown',
      surface: 'unknown',
      kerb_ramp: 'unknown',
      tactile_paving: { present: 'unknown', condition: 'unknown' },
      obstructions: [],
      crossing_signal: 'unknown',
      open_drain_adjacent: false,
      ai_confidence: 0.65,
      uncertainty_notes: 'Low light and motion blur. Confidence falls below 0.50.',
    },
  },
];

export function buildMockFindingsFromUpload(
  subject: PhotoAuditSubject,
  note: string,
  placeName: string
): AuditFindings {
  const n = note.toLowerCase();

  const hasDarkOrBlur =
    n.includes('blur') ||
    n.includes('dark') ||
    n.includes('unclear') ||
    n.includes('धुंध') ||
    n.includes('अंधेर') ||
    n.includes('ਧੁੰਦ') ||
    n.includes('ਹਨੇਰ');

  if (hasDarkOrBlur) {
    return {
      subject,
      scene: `Uploaded photo near ${placeName} is too dark or blurry to check safely.`,
      image_quality: 'poor',
      step_free_access: 'unknown',
      steps_count_estimate: null,
      ramp: { present: 'unknown', slope: 'unknown', handrail: 'unknown' },
      lift: { present: 'unknown', working: 'unknown' },
      doorway_width: 'unknown',
      surface: 'unknown',
      kerb_ramp: 'unknown',
      tactile_paving: { present: 'unknown', condition: 'unknown' },
      obstructions: [],
      crossing_signal: 'unknown',
      open_drain_adjacent: false,
      ai_confidence: 0.62,
      uncertainty_notes: 'Unclear photo — score not changed.',
    };
  }

  const hasBrokenLift =
    (n.includes('lift') || n.includes('elevator') || n.includes('लिफ्ट') || n.includes('ਲਿਫਟ')) &&
    (n.includes('broken') ||
      n.includes('closed') ||
      n.includes('not working') ||
      n.includes('out') ||
      n.includes('खराब') ||
      n.includes('बंद') ||
      n.includes('ਖਰਾਬ'));

  const hasNoRampOrStairs =
    n.includes('no ramp') ||
    n.includes('stairs') ||
    n.includes('steps') ||
    n.includes('सीढ़') ||
    n.includes('ਪੌੜ');

  const hasSteepRamp =
    n.includes('steep') || n.includes('खड़ा') || n.includes('ਤਿੱਖ');

  const hasBikesOrBlocked =
    n.includes('bike') ||
    n.includes('scooter') ||
    n.includes('parked') ||
    n.includes('block') ||
    n.includes('बाइक') ||
    n.includes('बंद') ||
    n.includes('ਬੰਦ');

  const hasOpenDrain =
    n.includes('drain') || n.includes('नाली') || n.includes('ਨਾਲੀ');

  const hasGoodRamp =
    n.includes('ramp') ||
    n.includes('good') ||
    n.includes('smooth') ||
    n.includes('clear') ||
    n.includes('रैंप') ||
    n.includes('ਰੈਂਪ') ||
    n.includes('साफ');

  const obstructions: AuditFindings['obstructions'] = [];
  if (hasBikesOrBlocked) {
    obstructions.push({ type: 'parked_vehicle', severity: 'major' });
  }
  if (hasOpenDrain) {
    obstructions.push({ type: 'open_drain', severity: 'major' });
  }

  const stepFree: AuditFindings['step_free_access'] =
    hasNoRampOrStairs || hasBrokenLift
      ? 'no'
      : hasBikesOrBlocked || hasOpenDrain || hasSteepRamp
        ? 'partial'
        : hasGoodRamp || subject === 'bus_stop'
          ? 'yes'
          : 'partial';

  return {
    subject,
    scene: `Uploaded ${subject.replace('_', ' ')} photo checked near ${placeName}.`,
    image_quality: 'good',
    step_free_access: stepFree,
    steps_count_estimate: hasNoRampOrStairs ? 6 : 0,
    ramp: {
      present: hasNoRampOrStairs ? 'no' : hasGoodRamp || hasSteepRamp ? 'yes' : 'unknown',
      slope: hasSteepRamp ? 'steep' : hasGoodRamp ? 'gentle' : 'unknown',
      handrail: hasGoodRamp ? 'yes' : 'unknown',
    },
    lift: {
      present: subject === 'gate' ? (hasBrokenLift || hasGoodRamp ? 'yes' : 'unknown') : 'no',
      working: hasBrokenLift ? 'no' : 'unknown',
    },
    doorway_width: subject === 'gate' ? 'wide' : 'unknown',
    surface: hasOpenDrain ? 'broken' : hasBikesOrBlocked ? 'rough' : 'smooth',
    kerb_ramp: subject === 'crossing' || subject === 'bus_stop' ? (hasNoRampOrStairs ? 'absent' : 'present') : 'unknown',
    tactile_paving: {
      present: hasBikesOrBlocked ? 'yes' : subject === 'footpath' || subject === 'gate' ? 'partial' : 'unknown',
      condition: hasBikesOrBlocked ? 'blocked' : hasOpenDrain ? 'broken' : 'intact',
    },
    obstructions,
    crossing_signal: subject === 'crossing' || subject === 'bus_stop' ? 'signal' : 'unknown',
    open_drain_adjacent: hasOpenDrain,
    ai_confidence: 0.86,
    uncertainty_notes: 'Demo browser analysis from photo and optional note.',
  };
}

export function loadOfflineAuditQueue(): OfflinePendingAudit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflinePendingAudit[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineAuditQueue(items: OfflinePendingAudit[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    // Ignore localStorage quota limits for large blob URLs
  }
}
