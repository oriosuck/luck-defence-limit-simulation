export const MIN_LEVEL = 15;
export const MAX_LEVEL = 25;

// 실패할 때마다 해당 구간의 기본 성공 확률의 1/10만큼 추가 보정 확률이 누적된다.
// 예: 기본 70% → 실패 1회 후 +7%, 실패 2회 후 +14%
export const BREAKTHROUGH_CONFIG = {
  15: { toLevel: 16, baseRate: 70, stoneCost: 30, goldCost: 20000 },
  16: { toLevel: 17, baseRate: 50, stoneCost: 32, goldCost: 22000 },
  17: { toLevel: 18, baseRate: 30, stoneCost: 34, goldCost: 24000 },
  18: { toLevel: 19, baseRate: 20, stoneCost: 36, goldCost: 26000 },
  19: { toLevel: 20, baseRate: 12, stoneCost: 38, goldCost: 28000 },
  20: { toLevel: 21, baseRate: 8, stoneCost: 40, goldCost: 32000 },
  21: { toLevel: 22, baseRate: 6, stoneCost: 42, goldCost: 36000 },
  22: { toLevel: 23, baseRate: 4, stoneCost: 44, goldCost: 40000 },
  23: { toLevel: 24, baseRate: 2, stoneCost: 47, goldCost: 50000 },
  24: { toLevel: 25, baseRate: 1, stoneCost: 50, goldCost: 60000 },
};

export function getBreakthroughConfig(level) {
  return BREAKTHROUGH_CONFIG[level] ?? null;
}

export function getFailBonus(level, failCount) {
  const baseRate = BREAKTHROUGH_CONFIG[level]?.baseRate ?? 0;
  return (baseRate / 10) * failCount;
}
