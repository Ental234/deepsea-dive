# 딥씨 다이브 (가칭)

바다 속을 헤엄치며 쏟아지는 해파리를 피하고, 아이템으로 화면을 정리하며 최대한 오래 생존하는 캐주얼 서바이벌 게임. 레이디 버그(2010~2011) 오마주.

- 기획: [`PRD.md`](./PRD.md)
- 디자인 핸드오프: [`design/design_handoff_deepsea_dive/`](./design/design_handoff_deepsea_dive/README.md) — 4개 화면 하이파이 프로토타입 및 디자인 토큰 (참고용, 프로덕션 코드는 별도 구현)

## 기술 스택

- React 19 + Vite + TypeScript
- Canvas API 기반 게임 루프 (`requestAnimationFrame`)
- CSS Modules
- Supabase (Postgres) — 랭킹 저장/조회
- Vercel — 배포

## 폴더 구조

```
src/
  game/     게임 루프, 엔티티, 충돌 판정
  screens/  시작 / 게임 / 게임오버 / 랭킹 화면
  lib/      Supabase 클라이언트 등
```

## 개발

```bash
npm install
npm run dev
```

## 환경 변수

`.env`에 Supabase 프로젝트의 URL과 publishable key를 설정 (커밋하지 않음, `.env.example` 참고):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Project Settings → API Keys에서 확인 가능. publishable key는 RLS를 전제로 브라우저에 노출해도 되는 키다 (secret key와 다름).
