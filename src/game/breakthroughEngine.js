import { getBreakthroughConfig, getFailBonus, MAX_LEVEL } from '../data/breakthroughConfig.js';

export function calculateBreakthrough(level, failCount, random = Math.random) {
  if (level >= MAX_LEVEL) return null;

  const config = getBreakthroughConfig(level);
  if (!config) return null;

  const bonus = getFailBonus(level, failCount);
  const finalRate = Math.min(config.baseRate + bonus, 100);
  const success = random() * 100 < finalRate;

  return {
    success,
    fromLevel: level,
    toLevel: success ? config.toLevel : level,
    nextFailCount: success ? 0 : failCount + 1,
    config,
    bonus,
    finalRate,
  };
}
