import type { QueuedWrite, SugamBackend } from './types';

const KEY = 'sugampath_outbox_v1';
const MAX_QUEUE = 300;

function load(): QueuedWrite[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]') as QueuedWrite[];
  } catch {
    return [];
  }
}
function save(q: QueuedWrite[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  } catch {
    // ignore
  }
}

function apply(b: SugamBackend, w: QueuedWrite): Promise<void> {
  switch (w.op) {
    case 'updateTrip':
      return b.updateTrip(w.token, w.patch);
    case 'raiseSos':
      return b.raiseSos(w.token, w.sos);
    case 'resolveSos':
      return b.resolveSos(w.token);
    case 'createTrip':
      return b.createTrip(w.trip);
    case 'submitSurfaceSamples':
      return b.submitSurfaceSamples(w.samples);
    case 'reportHazard':
      return b.reportHazard(w.report);
    case 'submitArrivalCheck':
      return b.submitArrivalCheck(w.check);
    case 'recordLegalReport':
      return b.recordLegalReport(w.report);
  }
}

/**
 * Wraps any backend so writes made in a tunnel or with no signal are kept and replayed in order
 * when the network returns. Reads and realtime pass straight through.
 * Order matters (createTrip before updateTrip), so a failed write stops the flush and retries later.
 */
export function withOutbox(inner: SugamBackend): SugamBackend {
  let flushing = false;

  const flush = async () => {
    if (flushing || !navigator.onLine) return;
    flushing = true;
    try {
      let q = load();
      while (q.length) {
        try {
          await apply(inner, q[0]);
        } catch {
          break;
        }
        q = q.slice(1);
        save(q);
      }
    } finally {
      flushing = false;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', flush);
    void flush();
  }

  const write = async (w: QueuedWrite) => {
    // Preserve order: if anything is already waiting, queue behind it.
    if (!navigator.onLine || load().length) {
      save([...load(), w]);
      void flush();
      return;
    }
    try {
      await apply(inner, w);
    } catch {
      save([...load(), w]);
    }
  };

  return {
    ...inner,
    name: `${inner.name}+outbox`,
    createTrip: (trip) => write({ op: 'createTrip', trip }),
    updateTrip: (token, patch) => write({ op: 'updateTrip', token, patch }),
    raiseSos: (token, sos) => write({ op: 'raiseSos', token, sos }),
    resolveSos: (token) => write({ op: 'resolveSos', token }),
    submitSurfaceSamples: (samples) => write({ op: 'submitSurfaceSamples', samples }),
    reportHazard: (report) => write({ op: 'reportHazard', report }),
    submitArrivalCheck: (check) => write({ op: 'submitArrivalCheck', check }),
    recordLegalReport: (report) => write({ op: 'recordLegalReport', report }),
  };
}
