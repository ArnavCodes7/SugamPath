import type { AuditFindings, VerificationLabel } from '../types/sugampath';

export interface ScoringResult {
  score_wheelchair: number;
  score_blind: number;
  score_walker: number;
  final_confidence: number;
  label: VerificationLabel;
  deductions: Array<{
    rule: string;
    wheelchair: number;
    blind: number;
    walker: number;
  }>;
  triggered_issue_severities: Array<{
    category: string;
    severity: number;
  }>;
}

/**
 * Deterministic scoring engine per PRD Section 13.5 & 13.6.
 * AI only reads and describes; code calculates scores and confidence.
 */
export function computeDeterministicScores(findings: AuditFindings): ScoringResult {
  let wheelchair = 100;
  let blind = 100;
  let walker = 100;

  const deductions: ScoringResult['deductions'] = [];
  const triggeredIssues: ScoringResult['triggered_issue_severities'] = [];

  const addDeduction = (rule: string, w: number, b: number, k: number) => {
    if (w !== 0 || b !== 0 || k !== 0) {
      deductions.push({ rule, wheelchair: w, blind: b, walker: k });
      wheelchair -= w;
      blind -= b;
      walker -= k;
    }
  };

  // Step-free access (caps apply after subtracting per PRD 13.5)
  if (findings.step_free_access === 'no') {
    addDeduction('Step-free access: No (Wheelchair cap 20, Walker cap 35)', 0, 15, 0);
    triggeredIssues.push({ category: 'no_ramp', severity: 5 });
  } else if (findings.step_free_access === 'partial') {
    addDeduction('Step-free access: Partial (Wheelchair cap 60, Walker cap 65)', 0, 5, 0);
  }

  // Ramp slope
  if (findings.ramp.present === 'yes') {
    if (findings.ramp.slope === 'steep') {
      addDeduction('Ramp slope: Steep', 20, 0, 10);
      triggeredIssues.push({ category: 'steep_ramp', severity: 4 });
    } else if (findings.ramp.slope === 'moderate') {
      addDeduction('Ramp slope: Moderate', 8, 0, 4);
    }
    if (findings.ramp.handrail === 'no') {
      addDeduction('Ramp has no handrail', 5, 5, 8);
    }
  }

  // Lift
  if (findings.lift.present === 'yes' && findings.lift.working === 'no') {
    addDeduction('Lift present but not working', 25, 0, 15);
    triggeredIssues.push({ category: 'broken_lift', severity: 5 });
  }

  // Doorway width
  if (findings.doorway_width === 'narrow') {
    addDeduction('Doorway width: Narrow', 15, 0, 5);
  }

  // Surface
  if (findings.surface === 'broken') {
    addDeduction('Surface condition: Broken', 20, 15, 15);
  } else if (findings.surface === 'rough') {
    addDeduction('Surface condition: Rough', 10, 5, 8);
  } else if (findings.surface === 'unpaved') {
    addDeduction('Surface condition: Unpaved', 25, 15, 20);
  }

  // Kerb ramp
  if (findings.kerb_ramp === 'absent') {
    addDeduction('Kerb ramp absent at crossing', 15, 5, 10);
    triggeredIssues.push({ category: 'no_ramp', severity: 3 });
  }

  // Tactile paving (footpaths and gates)
  if (findings.subject === 'footpath' || findings.subject === 'gate') {
    if (findings.tactile_paving.present === 'no') {
      addDeduction('Tactile paving absent', 0, 40, 0);
      triggeredIssues.push({ category: 'missing_tactile', severity: 4 });
    } else if (findings.tactile_paving.present === 'partial') {
      addDeduction('Tactile paving partial', 0, 20, 0);
    }
  }

  if (findings.tactile_paving.condition === 'broken' || findings.tactile_paving.condition === 'blocked') {
    addDeduction(`Tactile paving ${findings.tactile_paving.condition}`, 0, 25, 0);
    triggeredIssues.push({ category: 'blocked_tactile', severity: 4 });
  }

  // Obstructions
  for (const obs of findings.obstructions) {
    if (obs.severity === 'major') {
      addDeduction(`Major obstruction (${obs.type.replace('_', ' ')})`, 25, 30, 20);
      triggeredIssues.push({ category: 'obstruction', severity: 4 });
    } else {
      addDeduction(`Minor obstruction (${obs.type.replace('_', ' ')})`, 10, 10, 6);
    }
  }

  // Open drain next to path
  if (findings.open_drain_adjacent) {
    addDeduction('Open drain adjacent to path', 10, 30, 15);
    triggeredIssues.push({ category: 'open_drain', severity: 5 });
  }

  // Crossing or bus stop without audible signal
  if (
    (findings.subject === 'crossing' || findings.subject === 'bus_stop') &&
    findings.crossing_signal !== 'audible_signal' &&
    findings.crossing_signal !== 'unknown'
  ) {
    addDeduction('Crossing without audible signal', 0, 10, 0);
  }

  // Apply caps after subtracting (PRD Section 13.5)
  if (findings.step_free_access === 'no') {
    wheelchair = Math.min(wheelchair, 20);
    walker = Math.min(walker, 35);
  } else if (findings.step_free_access === 'partial') {
    wheelchair = Math.min(wheelchair, 60);
    walker = Math.min(walker, 65);
  }

  // Clamp at 0 minimum
  wheelchair = Math.max(0, Math.round(wheelchair));
  blind = Math.max(0, Math.round(blind));
  walker = Math.max(0, Math.round(walker));

  const imageFactor =
    findings.image_quality === 'good' ? 1.0 : findings.image_quality === 'poor' ? 0.6 : 0;

  const final_confidence = Number((findings.ai_confidence * imageFactor).toFixed(2));
  const label: VerificationLabel = final_confidence >= 0.5 ? 'ai_estimate' : 'not_verified';

  return {
    score_wheelchair: wheelchair,
    score_blind: blind,
    score_walker: walker,
    final_confidence,
    label,
    deductions,
    triggered_issue_severities: triggeredIssues,
  };
}

export function getScoreTier(score: number | null): {
  word: 'Good' | 'Fair' | 'Poor' | 'Blocked' | 'Unrated';
  colorVar: string;
  softBgVar: string;
} {
  if (score === null) {
    return {
      word: 'Unrated',
      colorVar: 'var(--ink-secondary)',
      softBgVar: 'var(--bg-subtle)',
    };
  }
  if (score >= 75) {
    return {
      word: 'Good',
      colorVar: 'var(--status-good)',
      softBgVar: 'var(--status-good-soft)',
    };
  }
  if (score >= 40) {
    return {
      word: 'Fair',
      colorVar: 'var(--status-amber)',
      softBgVar: 'var(--status-amber-soft)',
    };
  }
  if (score > 0) {
    return {
      word: 'Poor',
      colorVar: 'var(--status-red)',
      softBgVar: 'var(--status-red-soft)',
    };
  }
  return {
    word: 'Blocked',
    colorVar: 'var(--status-red)',
    softBgVar: 'var(--status-red-soft)',
  };
}
