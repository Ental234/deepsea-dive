import type { ItemType } from '../game/items';

interface IconProps {
  size?: number;
}

/**
 * 아이템 픽업의 심볼 아이콘. 캔버스( engine.ts drawItemGlyph )와 같은 형태를
 * DOM/HUD 용으로 옮긴 것 — 색은 currentColor 를 따른다.
 */
export function ItemIcon({ type, size = 18 }: IconProps & { type: ItemType }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'bubbleShield':
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.2-2.8 7.3-7 8.5C7.8 21.3 5 18.2 5 14V6z" />
        </svg>
      );
    case 'coralMissile':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2l6 15-6-3.4L6 17z" />
        </svg>
      );
    case 'whirlpool':
      return (
        <svg {...common}>
          <path d="M20 12a8 8 0 1 1-4-6.93" />
          <path d="M16.5 12a4.5 4.5 0 1 1-3-4.24" />
        </svg>
      );
    case 'whaleShark':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M4 12c0-3.3 3.1-5 7-5s8 2 9 5c-1 3-5 5-9 5s-7-1.7-7-5z" />
          <path d="M4 12L1 8v8z" />
        </svg>
      );
    case 'coralBarrier':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="12" cy="4.5" r="2.2" />
          <circle cx="19.5" cy="12" r="2.2" />
          <circle cx="12" cy="19.5" r="2.2" />
          <circle cx="4.5" cy="12" r="2.2" />
        </svg>
      );
  }
}

/** 시작 화면 마스코트. 캔버스 물고기와 같은 실루엣의 벡터 버전. */
export function FishMascot({ width = 128 }: { width?: number }) {
  return (
    <svg width={width} viewBox="0 0 128 104" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fishBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb094" />
          <stop offset="0.55" stopColor="#ff8a65" />
          <stop offset="1" stopColor="#f4714a" />
        </linearGradient>
      </defs>
      {/* 꼬리지느러미 */}
      <path
        d="M44 52C30 40 20 32 12 34c6 8 6 28 0 36 8 2 18-6 32-18z"
        fill="#f4714a"
      />
      {/* 등지느러미 */}
      <path d="M58 30c8-16 22-18 30-8-6 2-14 6-18 14z" fill="#f4714a" />
      {/* 가슴지느러미 */}
      <path d="M66 60c-6 16-2 24 14 20-4-8-6-16-4-24z" fill="#ef6a42" />
      {/* 몸통 */}
      <path
        d="M116 52c-14-22-40-30-60-24C42 32 34 42 34 52s8 20 22 24c20 6 46-2 60-24z"
        fill="url(#fishBody)"
      />
      {/* 배 하이라이트 */}
      <ellipse cx="72" cy="64" rx="26" ry="12" fill="#ffe7db" opacity="0.5" />
      {/* 눈 */}
      <circle cx="96" cy="47" r="7" fill="#fff" />
      <circle cx="98" cy="47" r="3.6" fill="#26140c" />
      <circle cx="95.5" cy="44.5" r="1.6" fill="#fff" />
    </svg>
  );
}

export function LockIcon({ size = 15 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
