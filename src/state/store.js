import { CHARACTERS } from '../data/characters.js';
import { MIN_LEVEL } from '../data/breakthroughConfig.js';

export const STORAGE_KEY = 'luck-defence-limit-simulation:v1';

export function createDefaultState() {
  return {
    selectedCharacterId: CHARACTERS[0]?.id ?? null,
    characters: Object.fromEntries(CHARACTERS.map((character) => [character.id, {
      savedLevel: MIN_LEVEL,
      currentLevel: MIN_LEVEL,
      failCount: 0,
    }])),
    records: {},
    totals: { attempts: 0, gold: 0, stones: 0 },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    const parsed = JSON.parse(raw);
    const base = createDefaultState();

    for (const character of CHARACTERS) {
      if (parsed.characters?.[character.id]) {
        base.characters[character.id] = {
          ...base.characters[character.id],
          ...parsed.characters[character.id],
        };
      }
    }

    base.selectedCharacterId = parsed.selectedCharacterId && base.characters[parsed.selectedCharacterId]
      ? parsed.selectedCharacterId
      : base.selectedCharacterId;
    base.records = parsed.records ?? {};
    base.totals = parsed.totals ?? base.totals;

    return base;
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
