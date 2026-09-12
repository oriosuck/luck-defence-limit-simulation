export const MIN_LEVEL = 15;
export const MAX_LEVEL = 25;

// 실패 보정 확률은 아직 미확정.
// 각 레벨의 failBonusTable만 수정하면 핵심 로직 변경 없이 반영된다.
export const BREAKTHROUGH_CONFIG = {
  15: { toLevel: 16, baseRate: 70, stoneCost: 30, goldCost: 20000, failBonusTable: [0] },
  16: { toLevel: 17, baseRate: 50, stoneCost: 32, goldCost: 22000, failBonusTable: [0] },
  17: { toLevel: 18, baseRate: 30, stoneCost: 34, goldCost: 24000, failBonusTable: [0] },
  18: { toLevel: 19, baseRate: 20, stoneCost: 36, goldCost: 26000, failBonusTable: [0] },
  19: { toLevel: 20, baseRate: 12, stoneCost: 38, goldCost: 28000, failBonusTable: [0] },
  20: { toLevel: 21, baseRate: 8, stoneCost: 40, goldCost: 32000, failBonusTable: [0] },
  21: { toLevel: 22, baseRate: 6, stoneCost: 42, goldCost: 36000, failBonusTable: [0] },
  22: { toLevel: 23, baseRate: 4, stoneCost: 44, goldCost: 40000, failBonusTable: [0] },
  23: { toLevel: 24, baseRate: 2, stoneCost: 47, goldCost: 50000, failBonusTable: [0] },
  24: { toLevel: 25, baseRate: 1, stoneCost: 50, goldCost: 60000, failBonusTable: [0] },
};

export function getBreakthroughConfig(level) {
  return BREAKTHROUGH_CONFIG[level] ?? null;
}

export function getFailBonus(level, failCount) {
  const table = BREAKTHROUGH_CONFIG[level]?.failBonusTable ?? [0];
  return table[Math.min(failCount, table.length - 1)] ?? 0;
}
