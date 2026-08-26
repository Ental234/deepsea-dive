# Handoff: 딥씨 다이브 — UI 프로토타입

## Overview
"딥씨 다이브" 캐주얼 서바이벌 게임의 4개 핵심 화면(시작, 게임 플레이+HUD, 게임오버, 랭킹)에 대한 인터랙티브 UI 프로토타입입니다. PRD(첨부된 PRD.md)의 핵심 게임 루프, 아이템 시스템, 레벨업, 랭킹 시스템을 시각화합니다.

## About the Design Files
이 폴더의 HTML 파일은 **디자인 레퍼런스**입니다 — 실제 프로덕션 코드로 그대로 복사해 쓰는 게 아니라, 의도한 화면 구성/스타일/인터랙션을 보여주는 프로토타입입니다. 실제 구현은 PRD 7장 기술 스택(React 19 + Vite + TypeScript, Canvas API 게임 루프, Supabase)에 맞춰 새로 작성해야 합니다. 게임 로직(충돌 판정, 스폰, 이동)은 프로토타입에서 DOM 엘리먼트로 단순화되어 있으니, 실제 구현 시 PRD 6장 기능 명세를 기준으로 Canvas 기반 렌더링으로 재작성하세요.

## Fidelity
**High-fidelity** — 색상, 타이포그래피, 레이아웃 수치는 최종안에 가깝습니다. 다만 게임 플레이 로직 자체(스폰 규칙, 밸런싱 수치)는 프로토타입 단순화 버전이며 PRD 6장을 최종 근거로 삼으세요.

## Screens / Views

### 1. 시작 화면 (Start)
- **Purpose**: 타이틀 노출, 게임 시작 또는 랭킹 진입
- **Layout**: 390×844 화면, flex column, `justify-content: space-between`, padding `88px 24px 48px`
- **Background**: `linear-gradient(180deg, oklch(85% 0.06 220) 0%, oklch(58% 0.13 233) 52%, oklch(33% 0.09 240) 100%)` (수면→심해 그라디언트)
- **Components**:
  - 타이틀 "딥씨 다이브" — Baloo 2, 800, 44px, 흰색, text-shadow `0 4px 18px rgba(0,0,0,0.25)`
  - 서브타이틀 "해파리를 피하고, 최대한 오래 생존하세요" — Nunito, 15px, 흰색 90% opacity
  - 물고기 아이콘: teardrop 형태(`border-radius: 60% 40% 50% 50% / 60% 60% 40% 40%`) + 삼각형 꼬리(clip-path), 위아래로 3.2s float 애니메이션
  - "시작하기" 버튼: pill, accent color 배경(`#ff8a65`), 흰 텍스트, 800 weight, 18px
  - "랭킹 보기" 버튼: outline (2px solid rgba(255,255,255,0.6)), transparent 배경
  - 하단 안내 텍스트: "화면을 탭해서 물고기를 이동시켜요" 13px

### 2. 게임 화면 (Game + HUD)
- **Layout**: 전체 390×844. 상단 HUD 바(높이 70px, absolute) + 언락 아이콘 행(74px 위치) + 게임 영역(top 70px, 390×774, 클릭 가능)
- **HUD**: 좌측 SCORE 라벨(11px, rgba(255,255,255,0.7)) + 점수(Baloo 2, 800, 22px), 우측 "LV n" pill (rgba(255,255,255,0.15) 배경)
- **아이템 해금 행**: 5개 슬롯(30×30px, radius 10px) — 해금된 레벨은 accent color, 미해금은 반투명 흰색. PRD 6.4 순서: 거품 실드(Lv1) → 산호가시 유도탄(Lv2) → 가시복 모드(Lv3) → 고래상어 라이드(Lv4) → 산호 배리어(Lv5)
- **게임 영역 배경**: `linear-gradient(180deg, oklch(58% 0.11 222) 0%, oklch(38% 0.09 235) 55%, oklch(24% 0.07 245) 100%)`
- **해파리**: 30×22px bell shape(`border-radius: 50% 50% 12% 12% / 60% 60% 20% 20%`, 핑크 그라디언트) + 3개 촉수(2px 너비 라인). 위→아래 낙하, 시간·레벨에 따라 속도/스폰 빈도 증가
- **아이템(거품)**: 32×32px 원, radial-gradient 흰색/블루, shine 애니메이션. 물고기와 겹치면 3초간 실드 발동
- **물고기**: 시작 화면과 동일 shape, 실드 활성 시 주변에 pulse-ring(48×40px, 흰 테두리, 1s 반복 확대+페이드)
- **조작**: 게임 영역 클릭/탭 → 해당 좌표로 물고기가 고정 속도(260px/s)로 직선 이동, 새 클릭 시 목표 좌표 즉시 갱신

### 3. 게임오버 화면 (Game Over)
- **Layout**: 전체 화면 어두운 그라디언트 배경 위 중앙 카드(오프화이트, radius 24px, padding 32px 24px)
- **Components**:
  - "게임 종료" 제목 — Baloo 2, 800, 24px
  - FINAL SCORE 라벨 + 큰 점수(40px, accent color) + "생존 시간 N초"
  - 닉네임 입력 필드 (text input, 최대 20자, radius 14px, border 2px)
  - "랭킹 등록" 버튼 (accent 배경, pill)
  - "다시 시작" 버튼 (outline)

### 4. 랭킹 화면 (Ranking)
- **Layout**: 상단 뒤로가기 버튼(34×34px) + "명예의 전당" 제목, 아래 스크롤 리스트
- **리스트 행**: rank 배지(28px 원, 1~3위는 금/은/동 색상, 그 외 회색), 닉네임, 점수. 짝수 행에 약한 배경 tint, 방금 등록한 내 기록은 accent tint 강조

## Interactions & Behavior
- 화면 전환: 시작 → (시작하기) → 게임 → (충돌) → 게임오버 → (등록) → 랭킹 → (← 뒤로) → 시작
- 게임 루프: `requestAnimationFrame` 기반, 매 프레임 물고기 이동/해파리 낙하/충돌 판정/아이템 스폰-수집 처리
- 충돌 판정: 원형(반지름 기반) 거리 계산. 실드 활성 중 충돌 시 해파리 제거 + 보너스 점수, 비활성 중 충돌 시 즉시 게임오버
- 점수: 생존 시간 비례 증가(10점/초) + 실드 중 제거 보너스(해파리당 20점)
- 레벨: 점수 300점마다 1레벨 상승, 최대 5레벨. 레벨 상승 시 해금 아이템 슬롯 표시 갱신, 해파리 스폰 속도/빈도 소폭 증가
- 랭킹 등록: 닉네임 입력 후 등록 시 기존 리스트에 삽입, 점수 내림차순 정렬, TOP 20까지만 유지

## State Management
- `screen`: 'start' | 'game' | 'gameover' | 'ranking'
- `fish: {x, y}`, `target: {x, y} | null` — 물고기 현재/목표 좌표
- `jellies: [{id, x, y, speed}]`, `items: [{id, x, y}]` — 활성 엔티티 배열
- `shieldUntil`: 실드 만료 타임스탬프
- `score`, `level`(score에서 파생), `startedAt`, 스폰 타이머들
- `nickname`, `gameOverScore`, `gameOverSeconds`
- `rankings: [{nickname, score, isYou}]`

## Design Tokens

**Colors**
- Primary blue (surface): `oklch(85% 0.06 220)`
- Primary blue (mid): `oklch(58% 0.13 233)` / `oklch(58% 0.11 222)`
- Primary blue (deep): `oklch(33% 0.09 240)` / `oklch(24% 0.07 245)`
- Accent (CTA/캐릭터): `#ff8a65` (튜닝 가능 대안: `#4fb8af`, `#ffd166`)
- 해파리: `oklch(80% 0.1 335)` → `oklch(66% 0.14 330)`
- 배경(라이트): `oklch(96% 0.01 230)` / `oklch(97% 0.005 240)`
- 텍스트(다크): `oklch(28% 0.03 240)` / `oklch(30% 0.02 240)`
- 랭킹 배지: 금 `#ffd166`, 은 `#cbd5e1`, 동 `#d8a479`

**Typography**
- 타이틀/숫자 강조: Baloo 2 (600/700/800)
- 본문/UI: Nunito (400/600/700/800)

**Other**
- Radius: pill 버튼 999px, 카드 24px, 입력창 14px, 아이콘 슬롯 10px
- Phone frame: 390×844 화면, 8px 베젤, 40px 코너 radius
- 게임 영역: top 70px, 390×774

## Assets
별도 이미지 에셋 없음 — 물고기/해파리/아이템은 모두 CSS shape(border-radius, clip-path, gradient)로 구성. 실제 구현 시 일러스트/스프라이트로 교체 권장.

## Files
- `DeepSea Dive Prototype.dc.html` — 전체 프로토타입 (4화면 + 게임 로직)
