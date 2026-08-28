// OG 이미지(1200x630) 생성기. 게임 캔버스와 같은 색/실루엣을 SVG로 옮겨 PNG로 렌더한다.
//   npm run og   →  public/og-image.png
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const W = 1200;
const H = 630;

// --- 마스코트 물고기 (GameIcons.tsx FishMascot, viewBox 0 0 128 104) ---
function fish() {
  return `
  <g>
    <path d="M44 52C30 40 20 32 12 34c6 8 6 28 0 36 8 2 18-6 32-18z" fill="#f4714a"/>
    <path d="M58 30c8-16 22-18 30-8-6 2-14 6-18 14z" fill="#f4714a"/>
    <path d="M66 60c-6 16-2 24 14 20-4-8-6-16-4-24z" fill="#ef6a42"/>
    <path d="M116 52c-14-22-40-30-60-24C42 32 34 42 34 52s8 20 22 24c20 6 46-2 60-24z" fill="url(#fishBody)"/>
    <ellipse cx="72" cy="64" rx="26" ry="12" fill="#ffe7db" opacity="0.5"/>
    <circle cx="96" cy="47" r="7" fill="#fff"/>
    <circle cx="98" cy="47" r="3.6" fill="#26140c"/>
    <circle cx="95.5" cy="44.5" r="1.6" fill="#fff"/>
  </g>`;
}

// --- 해파리 (engine.ts drawJellyfish 근사) ---
function jelly(R) {
  const p = (n) => +(n * R).toFixed(2);
  const bell =
    `M ${p(-1)} ${p(0.1)} Q ${p(-1)} ${p(-1.05)} 0 ${p(-1.05)} ` +
    `Q ${p(1)} ${p(-1.05)} ${p(1)} ${p(0.1)} ` +
    `Q ${p(0.6)} ${p(0.4)} ${p(0.5)} ${p(0.16)} ` +
    `Q ${p(0.25)} ${p(0.42)} 0 ${p(0.18)} ` +
    `Q ${p(-0.25)} ${p(0.42)} ${p(-0.5)} ${p(0.16)} ` +
    `Q ${p(-0.6)} ${p(0.4)} ${p(-1)} ${p(0.1)} Z`;
  let tentacles = '';
  for (let i = 0; i < 5; i++) {
    const bx = p((i - 2) * 0.38);
    const w = i % 2 === 0 ? 'rgba(209,87,159,0.8)' : 'rgba(244,166,216,0.75)';
    tentacles += `<path d="M ${bx} ${p(0.35)} C ${bx + 5} ${p(0.9)} ${bx - 6} ${p(1.5)} ${bx + 3} ${p(2.1)}" stroke="${w}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
  }
  return `
  <g>
    <circle cx="0" cy="0" r="${p(1.9)}" fill="url(#jellyGlow)"/>
    ${tentacles}
    <path d="${bell}" fill="url(#jellyBell)"/>
    <ellipse cx="${p(-0.28)}" cy="${p(-0.45)}" rx="${p(0.26)}" ry="${p(0.42)}" fill="rgba(255,255,255,0.4)" transform="rotate(-17 ${p(-0.28)} ${p(-0.45)})"/>
    <path d="M ${p(-0.7)} ${p(0.02)} Q 0 ${p(-0.3)} ${p(0.7)} ${p(0.02)}" stroke="rgba(160,40,110,0.35)" stroke-width="1.5" fill="none"/>
  </g>`;
}

// --- 빛줄기 ---
function beams() {
  const b = [
    [120, -60, 260, 70],
    [340, -60, 200, 90],
    [560, -60, 150, 60],
  ];
  return b
    .map(
      ([x, y, w, skew]) =>
        `<polygon points="${x},${y} ${x + w},${y} ${x + w + skew + 180},${H + 60} ${x + skew},${H + 60}" fill="url(#beam)" opacity="0.9"/>`,
    )
    .join('');
}

// --- 물방울 ---
function bubbles() {
  const list = [
    [90, 500, 10], [150, 420, 6], [210, 540, 4], [70, 300, 5],
    [640, 560, 8], [700, 500, 5], [1120, 120, 9], [1050, 210, 5],
    [980, 90, 6], [560, 120, 7], [500, 220, 4], [1150, 430, 6],
    [860, 300, 4], [420, 470, 5], [260, 200, 4], [780, 590, 6],
  ];
  return list
    .map(
      ([cx, cy, r]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>` +
        `<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.28}" fill="rgba(255,255,255,0.4)"/>`,
    )
    .join('');
}

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4aa3bd"/>
      <stop offset="0.5" stop-color="#215d78"/>
      <stop offset="1" stop-color="#0f2b3a"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(188,236,246,0.16)"/>
      <stop offset="1" stop-color="rgba(188,236,246,0)"/>
    </linearGradient>
    <linearGradient id="fishBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb094"/>
      <stop offset="0.55" stop-color="#ff8a65"/>
      <stop offset="1" stop-color="#f4714a"/>
    </linearGradient>
    <linearGradient id="jellyBell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffc4e6"/>
      <stop offset="0.55" stop-color="#f3a0d4"/>
      <stop offset="1" stop-color="#d1579f"/>
    </linearGradient>
    <radialGradient id="jellyGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="rgba(244,166,216,0.32)"/>
      <stop offset="1" stop-color="rgba(244,166,216,0)"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="rgba(4,18,26,0)"/>
      <stop offset="1" stop-color="rgba(4,18,26,0.5)"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${beams()}
  ${bubbles()}

  <!-- 해파리들 -->
  <g transform="translate(930 138) rotate(8)">${jelly(46)}</g>
  <g transform="translate(1095 468) rotate(-10)">${jelly(34)}</g>
  <g transform="translate(322 486) rotate(6)" opacity="0.9">${jelly(24)}</g>

  <!-- 물고기 마스코트 -->
  <g transform="translate(742 214) scale(3.42) rotate(-8 64 52)" filter="url(#soft)">${fish()}</g>

  <!-- 텍스트 -->
  <g filter="url(#soft)">
    <text x="96" y="300" font-family="Malgun Gothic, 'Segoe UI', sans-serif" font-size="132" font-weight="800" fill="#ffffff" letter-spacing="1">딥씨 다이브</text>
  </g>
  <rect x="100" y="330" width="140" height="10" rx="5" fill="#ff8a65"/>
  <text x="100" y="392" font-family="Malgun Gothic, 'Segoe UI', sans-serif" font-size="34" font-weight="600" fill="rgba(255,255,255,0.86)">해파리를 피하고, 최대한 오래 생존하세요</text>

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: { loadSystemFonts: true, defaultFontFamily: 'Malgun Gothic' },
  background: '#215d78',
});
const png = resvg.render().asPng();
const out = process.argv[2];
writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
