export interface ArchetypeRawData {
  archetypeId: string;
  usageRate: number;
  winRate: number;
  top8Count: number;
  top32Count: number;
  totalPlacements: number;
  totalGames: number;
  matchupWinRates: Array<{
    opponentUsageRate: number;
    winRate: number;
  }>;
}

export interface MetaScoreResult {
  archetypeId: string;
  metaScore: number;
  topCutRate: number;
  matchupScore: number;
}

export const DEFAULT_WEIGHTS = {
  usage: 0.2,
  winRate: 0.3,
  topCut: 0.3,
  matchup: 0.2,
} as const;

const CONFIDENCE_MIN_GAMES = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeWinRate(wr: number): number {
  return clamp((wr - 0.3) / 0.4, 0, 1);
}

function applyConfidenceAdjustment(value: number, totalGames: number): number {
  if (totalGames >= CONFIDENCE_MIN_GAMES) return value;
  const factor = totalGames / CONFIDENCE_MIN_GAMES;
  return 0.5 + (value - 0.5) * factor;
}

export function calculateMetaScores(
  archetypes: ArchetypeRawData[],
  weights = DEFAULT_WEIGHTS
): MetaScoreResult[] {
  if (archetypes.length === 0) return [];

  const maxUsageRate = Math.max(...archetypes.map((a) => a.usageRate));

  const topCutComposites = archetypes.map((a) => {
    if (a.totalPlacements === 0) return 0;
    const top8Rate = a.top8Count / a.totalPlacements;
    const top32Rate = a.top32Count / a.totalPlacements;
    return 0.6 * top8Rate + 0.4 * top32Rate;
  });
  const maxTopCutComposite = Math.max(...topCutComposites, 0.001);

  return archetypes.map((arch, i) => {
    const normalizedUsage = maxUsageRate > 0 ? arch.usageRate / maxUsageRate : 0;

    const adjustedWinRate = applyConfidenceAdjustment(arch.winRate, arch.totalGames);
    const normalizedWR = normalizeWinRate(adjustedWinRate);

    const topCutRate = topCutComposites[i];
    const normalizedTopCut = topCutRate / maxTopCutComposite;

    let matchupScore = 0.5;
    const totalOpponentWeight = arch.matchupWinRates.reduce(
      (sum, m) => sum + m.opponentUsageRate,
      0
    );
    if (totalOpponentWeight > 0) {
      const weightedSum = arch.matchupWinRates.reduce(
        (sum, m) => sum + m.winRate * m.opponentUsageRate,
        0
      );
      matchupScore = weightedSum / totalOpponentWeight;
    }
    const adjustedMatchup = applyConfidenceAdjustment(matchupScore, arch.totalGames);
    const normalizedMatchup = normalizeWinRate(adjustedMatchup);

    const rawScore =
      weights.usage * normalizedUsage +
      weights.winRate * normalizedWR +
      weights.topCut * normalizedTopCut +
      weights.matchup * normalizedMatchup;

    const metaScore = Math.round(clamp(rawScore * 100, 0, 100));

    return {
      archetypeId: arch.archetypeId,
      metaScore,
      topCutRate,
      matchupScore,
    };
  });
}
