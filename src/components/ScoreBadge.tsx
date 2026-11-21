import { AlertTriangle, CheckCircle2, HelpCircle, OctagonAlert, ShieldCheck } from 'lucide-react';
import { getScoreTier } from '../lib/scoring';
import { STRINGS } from '../lib/i18n';
import type { LanguageCode, VerificationLabel } from '../types/sugampath';
import { InfoTip } from './InfoTip';

interface ScoreBadgeProps {
  score: number | null;
  language: LanguageCode;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, language, size = 'md' }: ScoreBadgeProps) {
  const tier = getScoreTier(score);
  const t = STRINGS[language];

  const word =
    tier.word === 'Good'
      ? t.scoreGood
      : tier.word === 'Fair'
        ? t.scoreFair
        : tier.word === 'Poor'
          ? t.scorePoor
          : tier.word === 'Blocked'
            ? t.scoreBlocked
            : t.scoreUnrated;

  const Icon =
    tier.word === 'Good'
      ? CheckCircle2
      : tier.word === 'Fair'
        ? AlertTriangle
        : tier.word === 'Unrated'
          ? HelpCircle
          : OctagonAlert;

  if (size === 'lg') {
    return (
      <div
        className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl border border-[var(--border-line)]"
        style={{ backgroundColor: tier.softBgVar }}
        aria-label={`${word}, ${score ?? 0} ${t.outOf100}`}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-mono-tabular font-bold text-base border-2"
          style={{
            borderColor: tier.colorVar,
            color: tier.colorVar,
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {score ?? '--'}
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: tier.colorVar }}>
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{word}</span>
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 font-semibold"
      style={{ color: tier.colorVar }}
      aria-label={`${word}, ${score ?? 0} ${t.outOf100}`}
    >
      <Icon className={size === 'sm' ? 'w-4 h-4 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span className={`font-mono-tabular font-bold ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
        {score ?? '--'}
      </span>
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{word}</span>
    </span>
  );
}

interface TrustLabelProps {
  label: VerificationLabel;
  language: LanguageCode;
  showInfo?: boolean;
}

export function TrustLabelText({ label, language, showInfo = false }: TrustLabelProps) {
  const t = STRINGS[language];
  const text = t.labels[label];
  const infoText =
    label === 'verified'
      ? t.labelInfoVerified
      : label === 'ai_estimate'
        ? t.labelInfoAi
        : t.labelInfoNotVerified;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-secondary)]">
      {label === 'verified' && (
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-good)] shrink-0" aria-hidden="true" />
      )}
      <span className={label === 'verified' ? 'font-semibold text-[var(--status-good)]' : 'font-medium text-[var(--ink-primary)]'}>
        {text}
      </span>
      {showInfo && label !== 'unrated' && <InfoTip label={text} text={infoText} />}
    </span>
  );
}
