import { useMemo, useState } from 'react';
import { CheckCircle2, FileText, Lock, Printer, X } from 'lucide-react';
import { backend } from '../../services/backend';
import { SAFE } from '../../lib/i18nSafety';
import { buildReport, checkEligibility, type VerifiedReport } from '../../lib/legal';
import type { AuditIssue, LanguageCode, Place } from '../../types/sugampath';

interface Props {
  issue: AuditIssue;
  place: Place | undefined;
  language: LanguageCode;
}

/**
 * Sits at the bottom of an issue in the City Dashboard.
 * Not eligible: plain reasons, no button. Eligible: one button that opens a printable report.
 */
export function LegalReportPanel({ issue, place, language }: Props) {
  const s = SAFE[language];
  const [report, setReport] = useState<VerifiedReport | null>(null);
  const [busy, setBusy] = useState(false);
  const elig = useMemo(() => checkEligibility(issue), [issue]);

  const create = async () => {
    if (!place || busy) return;
    setBusy(true);
    try {
      const r = await buildReport(issue, place);
      setReport(r);
      void backend.recordLegalReport({
        auditId: r.auditId,
        issueId: r.issueId,
        track: r.track,
        evidenceHash: r.evidenceHash,
        generatedAt: r.generatedAt,
      });
    } finally {
      setBusy(false);
    }
  };

  const trackLabel = elig.track === 'municipal' ? s.legalMunicipal : s.legalStructural;

  return (
    <div className="pt-3 border-t border-[var(--border-line)] space-y-2.5">
      <h3 className="text-xs font-bold text-[var(--ink-secondary)] flex items-center gap-1.5">
        <FileText className="w-4 h-4" aria-hidden="true" />
        {s.legalHeading}
      </h3>

      {elig.eligible ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--status-good-soft)] border border-[var(--status-good)]/30 p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--status-good)]" aria-hidden="true" />
              {s.legalReady}
            </p>
            <p className="text-xs text-[var(--ink-secondary)]">{trackLabel}</p>
          </div>
          <button
            type="button"
            onClick={create}
            disabled={busy || !place}
            className="px-4 py-2.5 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-sm font-bold min-h-[44px] disabled:opacity-50"
          >
            {s.legalCreate}
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--bg-paper)] border border-[var(--border-line)] p-3 space-y-1.5">
          <p className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
            <Lock className="w-4 h-4" aria-hidden="true" />
            {s.legalBlocked}
          </p>
          <ul className="space-y-1 text-xs text-[var(--ink-secondary)] list-disc pl-5">
            {elig.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {report && <ReportSheet report={report} language={language} onClose={() => setReport(null)} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="align-top">
      <th className="text-left font-semibold pr-4 py-1 w-44 text-neutral-600">{k}</th>
      <td className="py-1 break-words">{v}</td>
    </tr>
  );
}

function ReportSheet({ report: r, language, onClose }: { report: VerifiedReport; language: LanguageCode; onClose: () => void }) {
  const s = SAFE[language];
  const when = new Date(r.generatedAt).toLocaleString('en-IN');
  return (
    <div role="dialog" aria-modal="true" aria-label={r.title} className="fixed inset-0 z-[60] bg-black/60 overflow-y-auto p-3 sm:p-6 print:static print:p-0 print:bg-white print:overflow-visible">
      <div className="mx-auto max-w-3xl bg-white text-black rounded-2xl p-6 sm:p-10 space-y-5 print:rounded-none print:p-0 print:max-w-none" id="legal-report-print">
        <div className="flex items-start justify-between gap-4 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold min-h-[44px]">
            <Printer className="w-4 h-4" aria-hidden="true" />
            {s.legalPrint}
          </button>
          <button type="button" onClick={onClose} aria-label={s.legalClose} className="w-11 h-11 rounded-full bg-neutral-200 flex items-center justify-center">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <header className="border-b-2 border-black pb-3">
          <p className="text-xs font-bold tracking-wide uppercase text-neutral-600">SugamPath</p>
          <h1 className="text-2xl font-bold">{r.title}</h1>
          <p className="text-sm text-neutral-700">To: {r.addressee}</p>
        </header>

        <table className="w-full text-sm">
          <tbody>
            <Row k="Audit ID" v={r.auditId} />
            <Row k="Generated" v={when} />
            <Row k="Location" v={`${r.placeName}, ${r.city}`} />
            <Row k="Gate / access point" v={r.gateName} />
            <Row k="GPS" v={`${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} (place coordinates)`} />
            <Row k="First reported" v={new Date(r.firstReportedAt).toLocaleString('en-IN')} />
            <Row k="Finding" v={r.finding} />
            <Row k="Verification count" v={`${r.verificationCount} independent confirmation(s)`} />
            <Row k="Evidence" v={r.evidenceSummary} />
            <Row k="Evidence hash (SHA-256)" v={r.evidenceHash} />
          </tbody>
        </table>

        {r.clauses.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Legal basis</h2>
            <ul className="space-y-1.5 text-sm list-disc pl-5">
              {r.clauses.map((c) => (
                <li key={c.ref}>
                  <strong>{c.ref}.</strong> {c.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-1">
          <h2 className="text-base font-bold">Corrective action requested</h2>
          <p className="text-sm">{r.correctiveAction}</p>
        </section>

        <p className="text-xs text-neutral-600 border-t border-neutral-300 pt-3">{r.disclaimer}</p>
      </div>
    </div>
  );
}
