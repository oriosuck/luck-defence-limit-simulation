// 캐릭터의 게임 데이터와 화면 보정값을 함께 관리한다.
// presentation 값은 원본 이미지 비율이 달라도 스테이지 안에서 같은 크기로 보이게 조정할 때 사용한다.
const DEFAULT_PRESENTATION = { scale: 1.18, x: 0, y: 0 };

const CHARACTER_DATA = [
  { id: 'awakened-hailey', name: '각성 헤일리', image: '/assets/characters/awakened-hailey.webp' },
  { id: 'horde-tar', name: '군체 타르', image: '/assets/characters/horde-tar.webp' },
  { id: 'ghost-ninja', name: '귀신 닌자', image: '/assets/characters/ghost-ninja.webp' },
  { id: 'grand-mama', name: '그랜드 마마', image: '/assets/characters/grand-mama.webp' },
  { id: 'knight-lancelot', name: '기사 랜슬롯', image: '/assets/characters/knight-lancelot.png' },
  { id: 'mage-jiji', name: '마도학자 지지', image: '/assets/characters/mage-jiji.png' },
  { id: 'demon-king-dragon', name: '마왕 드래곤', image: '/assets/characters/demon-king-dragon.webp' },
  { id: 'reaper-frog', name: '사신개구리', image: '/assets/characters/reaper-frog.webp' },
  { id: 'sage-kun', name: '선인 쿤', image: '/assets/characters/sage-kun.webp' },
  { id: 'noise-king-penguin', name: '소음킹 펭귄악사', image: '/assets/characters/noise-king-penguin.webp' },
  { id: 'devil-monopoly', name: '악마 모노폴리', image: '/assets/characters/devil-monopoly.png' },
  { id: 'orc-leader', name: '오크 지도자', image: '/assets/characters/orc-leader.webp' },
  { id: 'hero-ray', name: '용사 레이', image: '/assets/characters/hero-ray.webp' },
  { id: 'cheonryong-woochi', name: '천룡 우치', image: '/assets/characters/cheonryong-woochi.webp' },
];

export const CHARACTERS = CHARACTER_DATA.map((character) => ({
  ...character,
  presentation: {
    ...DEFAULT_PRESENTATION,
    ...(character.presentation ?? {}),
  },
}));
