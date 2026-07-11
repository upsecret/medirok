# e2e 로컬 Postgres 환경

작성일: 2026-07-04 · e2e 테스트는 프로덕션(Neon) 대신 **로컬 Postgres 컨테이너**로 실행한다.

## 사용법

```bash
npm run test:e2e:local   # 컨테이너 기동 → 시드 → 전체 e2e (원커맨드)
```

개별 실행:

```bash
npm run e2e:db:up        # docker compose로 Postgres 기동 (포트 54329, --wait 헬스체크)
npm run e2e:seed         # 결정적 픽스처 시드 (멱등 upsert — 반복 실행 안전)
node --env-file=.env.e2e node_modules/@playwright/test/cli.js test   # 원하는 옵션으로 직접 실행
npm run e2e:db:down      # 컨테이너·볼륨 제거 (완전 초기화)
```

## 구성 요소

| 파일 | 역할 |
|---|---|
| docker-compose.e2e.yml | postgres:16-alpine, 포트 54329, medirok/medirok, DB medirok_e2e |
| .env.e2e | e2e 전용 환경(비밀값 없음 — 커밋됨). `DATABASE_URL`이 로컬을 가리킴 |
| scripts/seed-e2e.ts | legacy 시드(진료과 9·지역 47·병원 5·매거진 10)를 **운영 URL 체계(한국어 지역 slug)로 변환**해 upsert. `sidoSlug`는 구(gu)의 상위 지역에서 파생 |
| e2e/setup/data.setup.ts | 시드 확인 + 픽스처 기록. 의료진·후기·인증·지역 정보가 모두 있는 병원을 우선 선택 |

## 동작 원리

- `node --env-file=.env.e2e`로 실행하면 `DATABASE_URL`이 프로세스 환경에 먼저 설정되어 Next.js의 `.env.local`(Neon)을 **덮어쓴다**. dev 서버(webServer)도 이 환경을 상속.
- 빈 DB에 첫 `getPayload()` 호출 시 Payload가 스키마를 자동 push(dev push)하므로 별도 마이그레이션이 필요 없다.
- seed-e2e에는 안전장치가 있다: `DATABASE_URL`이 localhost/127.0.0.1이 아니면 즉시 중단 → **프로덕션에 시드가 흘러갈 수 없다**.

## 검증 이력 (2026-07-04)

로컬 PG에 대해 전체 chromium 스위트 실행: **64 통과 / 4 fixme 스킵 / 0 실패** (지역 데이터 파생 덕에 이전 skip 12건 전부 실테스트로 전환). 주의: dev 서버 콜드 스타트 직후에는 상세 라우트 온디맨드 컴파일로 내비게이션 테스트가 플레이키할 수 있음 — CI에서는 `next build && next start` 권장.
