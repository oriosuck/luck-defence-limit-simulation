import './styles.css';
import { CHARACTERS } from './data/characters.js';

const STONE_ICON = '/assets/icons/breakthrough-stone.png';
const GOLD_ICON = '/assets/icons/gold.png';
import { MIN_LEVEL, MAX_LEVEL, getBreakthroughConfig, getFailBonus } from './data/breakthroughConfig.js';
import { loadState, saveState } from './state/store.js';
import { calculateBreakthrough } from './game/breakthroughEngine.js';
import { mountBattleStage } from './game/battleStage.js';

/* State persistence lives in src/state/store.js. */
let state = loadState();
let battleStage = null;


function selectedCharacter() {
  return CHARACTERS.find((character) => character.id === state.selectedCharacterId) ?? CHARACTERS[0];
}

function selectedState() {
  return state.characters[state.selectedCharacterId];
}

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatPercent(value) {
  return Number(value.toFixed(1)).toString();
}

function getCharacterTotals(characterId) {
  return Object.values(state.records)
    .filter((record) => record.characterId === characterId)
    .reduce((totals, record) => {
      totals.attempts += record.attempts;
      totals.gold += record.goldSpent;
      totals.stones += record.stoneSpent;
      return totals;
    }, { attempts: 0, gold: 0, stones: 0 });
}

function recordKey(characterId, fromLevel) {
  return `${characterId}:${fromLevel}`;
}

function updateRecord(characterId, fromLevel, success, config) {
  const key = recordKey(characterId, fromLevel);
  const current = state.records[key] ?? {
    characterId,
    fromLevel,
    toLevel: config.toLevel,
    attempts: 0,
    successes: 0,
    failures: 0,
    goldSpent: 0,
    stoneSpent: 0,
  };
  current.attempts += 1;
  current.successes += success ? 1 : 0;
  current.failures += success ? 0 : 1;
  current.goldSpent += config.goldCost;
  current.stoneSpent += config.stoneCost;
  state.records[key] = current;

  state.totals.attempts += 1;
  state.totals.gold += config.goldCost;
  state.totals.stones += config.stoneCost;
}

function attemptBreakthrough() {
  const characterState = selectedState();
  if (!characterState) return;

  const result = calculateBreakthrough(
    characterState.currentLevel,
    characterState.failCount,
  );
  if (!result) return;

  updateRecord(
    state.selectedCharacterId,
    result.fromLevel,
    result.success,
    result.config,
  );

  characterState.currentLevel = result.toLevel;
  characterState.failCount = result.nextFailCount;

  saveState(state);
  render();
  animateResult(result.success, result.fromLevel, result.toLevel);
}

function animateResult(success, fromLevel, toLevel) {
  requestAnimationFrame(() => {
    battleStage?.playBreakthrough(success);
    const result = document.querySelector('.result');
    if (result) {
      result.className = `result ${success ? 'success' : 'fail'}`;
      result.textContent = success
        ? `Lv.${fromLevel} → Lv.${toLevel}`
        : `Lv.${fromLevel} 유지`;
    }
  });
}

function setCurrentLevel(level) {
  const characterState = selectedState();
  if (!characterState) return;
  characterState.currentLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
  characterState.failCount = 0;
  saveState(state);
  render();
}

function clearSelectedCharacterRecords() {
  const characterId = state.selectedCharacterId;
  const removedTotals = getCharacterTotals(characterId);

  for (const key of Object.keys(state.records)) {
    if (state.records[key]?.characterId === characterId) {
      delete state.records[key];
    }
  }

  state.totals.attempts = Math.max(0, state.totals.attempts - removedTotals.attempts);
  state.totals.gold = Math.max(0, state.totals.gold - removedTotals.gold);
  state.totals.stones = Math.max(0, state.totals.stones - removedTotals.stones);
}

function saveCurrentLevel() {
  const character = selectedCharacter();
  const characterState = selectedState();
  const shouldReset = confirm(`${character.name}의 기준 레벨을 Lv.${characterState.currentLevel}(으)로 저장합니다.\n지금까지의 이 캐릭터 돌파 기록과 소비 재화도 초기화할까요?`);

  characterState.savedLevel = characterState.currentLevel;
  characterState.failCount = 0;
  if (shouldReset) clearSelectedCharacterRecords();

  saveState(state);
  render();
}

function restoreCurrentLevel() {
  const character = selectedCharacter();
  const characterState = selectedState();
  const shouldReset = confirm(`${character.name}을(를) 기준 레벨 Lv.${characterState.savedLevel}(으)로 되돌립니다.\n지금까지의 이 캐릭터 돌파 기록과 소비 재화도 초기화할까요?`);

  characterState.currentLevel = characterState.savedLevel;
  characterState.failCount = 0;
  if (shouldReset) clearSelectedCharacterRecords();

  saveState(state);
  render();
}

function resetSelectedCharacterSimulation() {
  const characterId = state.selectedCharacterId;
  const characterState = selectedState();
  if (!characterId || !characterState) return;

  const removedTotals = getCharacterTotals(characterId);

  for (const key of Object.keys(state.records)) {
    if (state.records[key]?.characterId === characterId) {
      delete state.records[key];
    }
  }

  state.totals.attempts = Math.max(0, state.totals.attempts - removedTotals.attempts);
  state.totals.gold = Math.max(0, state.totals.gold - removedTotals.gold);
  state.totals.stones = Math.max(0, state.totals.stones - removedTotals.stones);

  characterState.savedLevel = MIN_LEVEL;
  characterState.currentLevel = MIN_LEVEL;
  characterState.failCount = 0;

  saveState(state);
  render();
}

function renderCharacters() {
  return CHARACTERS.map((character) => `
    <button class="character-btn ${character.id === state.selectedCharacterId ? 'active' : ''}" data-character-id="${character.id}">
      <div class="character-thumb">${character.image ? `<img src="${character.image}" alt="${character.name}">` : 'IMG'}</div>
      <div class="character-name">${character.name}</div>
    </button>
  `).join('');
}

function renderRecords() {
  const rows = Object.values(state.records)
    .filter((record) => record.characterId === state.selectedCharacterId)
    .sort((a, b) => a.fromLevel - b.fromLevel);

  if (!rows.length) return '<tr><td colspan="5" class="muted">아직 시도 기록이 없습니다.</td></tr>';

  return rows.map((record) => `
    <tr>
      <td>${record.fromLevel} → ${record.toLevel}</td>
      <td>${record.attempts}</td>
      <td>${record.successes}</td>
      <td>${formatNumber(record.stoneSpent)}</td>
      <td>${formatNumber(record.goldSpent)}</td>
    </tr>
  `).join('');
}

function renderLevelModalRows() {
  return CHARACTERS.map((character) => {
    const cs = state.characters[character.id];
    const options = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i)
      .map((level) => `<option value="${level}" ${level === cs.savedLevel ? 'selected' : ''}>Lv.${level}</option>`)
      .join('');
    return `<label>${character.name}</label><select data-level-character="${character.id}">${options}</select>`;
  }).join('');
}

function render() {
  battleStage?.destroy();
  battleStage = null;
  const character = selectedCharacter();
  const characterState = selectedState();
  const config = getBreakthroughConfig(characterState.currentLevel);
  const bonus = characterState.currentLevel < MAX_LEVEL ? getFailBonus(characterState.currentLevel, characterState.failCount) : 0;
  const selectedTotals = getCharacterTotals(state.selectedCharacterId);

  document.querySelector('#app').innerHTML = `
    <main class="app">
      <section class="card summary">
        <small>${character.name} 소비 재화 합계 · 총 ${formatNumber(selectedTotals.attempts)}회 시도</small>
        <strong class="summary-resources"><span class="currency"><img src="${STONE_ICON}" alt="돌파석"> ${formatNumber(selectedTotals.stones)}</span><span class="currency"><img src="${GOLD_ICON}" alt="골드"> ${formatNumber(selectedTotals.gold)}</span></strong>
      </section>

      <section class="card">
        <div class="toolbar">
          <button id="openLevelSettings">전체 레벨 설정</button>
          <button id="resetSimulation">이 캐릭터 기록 초기화</button>
        </div>
        <div class="character-carousel">
          <button class="character-nav character-nav-left" id="characterPrev" aria-label="이전 캐릭터">‹</button>
          <div class="characters" id="characterList">${renderCharacters()}</div>
          <button class="character-nav character-nav-right" id="characterNext" aria-label="다음 캐릭터">›</button>
        </div>
        <div class="hero-stage battle-stage">
          <canvas id="battleCanvas" class="battle-canvas" aria-label="${character.name}과 몬스터의 전투 미리보기"></canvas>
          <div class="battle-stage-badge">CANVAS BATTLE</div>
          <div class="battle-controls">
            <button id="previewAttack" type="button">공격 보기</button>
            <button type="button" disabled title="궁극기 데이터가 추가되면 활성화됩니다.">궁극기 준비 중</button>
          </div>
        </div>
        <div class="level-row">
          <div><strong>${character.name}</strong><div class="muted">저장 레벨 Lv.${characterState.savedLevel}</div></div>
          <div class="level-controls">
            <button id="levelDown" ${characterState.currentLevel <= MIN_LEVEL ? 'disabled' : ''}>−</button>
            <span class="level">Lv.${characterState.currentLevel}/25</span>
            <button id="levelUp" ${characterState.currentLevel >= MAX_LEVEL ? 'disabled' : ''}>＋</button>
          </div>
        </div>
        <div class="toolbar" style="margin-top:10px">
          <button id="saveLevel">기준 레벨로 저장</button>
          <button id="restoreLevel">기준 레벨로 돌아가기</button>
        </div>
        <div class="rate">${characterState.currentLevel >= MAX_LEVEL ? 'MAX LEVEL' : `성공 확률 ${formatPercent(config.baseRate)}% <span class="bonus">${bonus > 0 ? `+ ${formatPercent(bonus)}%` : ''}</span>`}</div>
        <button class="upgrade" id="upgrade" ${characterState.currentLevel >= MAX_LEVEL ? 'disabled' : ''}>
          ${characterState.currentLevel >= MAX_LEVEL ? 'MAX' : '업그레이드'}
          <span class="cost">${config ? `<span class="currency"><img src="${STONE_ICON}" alt="돌파석"> ${config.stoneCost}</span>　<span class="currency"><img src="${GOLD_ICON}" alt="골드"> ${formatNumber(config.goldCost)}</span>` : ''}</span>
        </button>
        <div class="result"></div>
      </section>

      <section class="card">
        <h2 class="section-title">한계 돌파 기록 · ${character.name}</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>구간</th><th>시도</th><th>성공</th><th>돌파석</th><th>골드</th></tr></thead>
            <tbody>${renderRecords()}</tbody>
          </table>
        </div>
      </section>

      <p class="footer-note">실패할 때마다 해당 구간 기본 성공 확률의 1/10만큼 보정 확률이 누적됩니다.</p>

      <dialog id="levelDialog">
        <div class="modal">
          <h2 class="section-title">전체 캐릭터 저장 레벨 설정</h2>
          <div class="level-grid">${renderLevelModalRows()}</div>
          <div class="modal-actions"><button id="closeLevelSettings">취소</button><button id="saveAllLevels">전체 저장</button></div>
        </div>
      </dialog>
    </main>
  `;

  bindEvents();
  battleStage = mountBattleStage(document.querySelector('#battleCanvas'), character);
}

function bindEvents() {
  document.querySelectorAll('[data-character-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCharacterId = button.dataset.characterId;
      saveState(state);
      render();
    });
  });

  const characterList = document.querySelector('#characterList');
  document.querySelector('#characterPrev')?.addEventListener('click', () => {
    characterList?.scrollBy({ left: -260, behavior: 'smooth' });
  });
  document.querySelector('#characterNext')?.addEventListener('click', () => {
    characterList?.scrollBy({ left: 260, behavior: 'smooth' });
  });

  document.querySelector('#levelDown')?.addEventListener('click', () => setCurrentLevel(selectedState().currentLevel - 1));
  document.querySelector('#levelUp')?.addEventListener('click', () => setCurrentLevel(selectedState().currentLevel + 1));
  document.querySelector('#saveLevel')?.addEventListener('click', saveCurrentLevel);
  document.querySelector('#restoreLevel')?.addEventListener('click', restoreCurrentLevel);
  document.querySelector('#upgrade')?.addEventListener('click', attemptBreakthrough);
  document.querySelector('#previewAttack')?.addEventListener('click', () => battleStage?.playAttack());
  document.querySelector('#resetSimulation')?.addEventListener('click', () => {
    const character = selectedCharacter();
    if (confirm(`${character.name}의 기록, 소비 재화, 기준 레벨을 모두 초기화할까요? 기준 레벨은 Lv.${MIN_LEVEL}로 돌아갑니다.`)) {
      resetSelectedCharacterSimulation();
    }
  });

  const dialog = document.querySelector('#levelDialog');
  document.querySelector('#openLevelSettings')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector('#closeLevelSettings')?.addEventListener('click', () => dialog?.close());
  document.querySelector('#saveAllLevels')?.addEventListener('click', () => {
    document.querySelectorAll('[data-level-character]').forEach((select) => {
      const characterState = state.characters[select.dataset.levelCharacter];
      const level = Number(select.value);
      characterState.savedLevel = level;
      characterState.currentLevel = level;
      characterState.failCount = 0;
    });
    saveState(state);
    dialog?.close();
    render();
  });
}

render();
