// 운영 캐시 재검증 — 시드 직후 실행한다.
//
// 콘텐츠 페이지가 ISR로 캐시되므로, 시드만 하고 이걸 빠뜨리면 발행 후
// 최대 revalidate초 동안 옛 화면이 나간다. 시드 npm 스크립트 뒤에 체이닝돼 있다.
//
// REVALIDATE_SECRET이 없으면 조용히 넘어가지 않고 실패시킨다 — 조용한 실패가
// 정확히 이 장치가 막으려는 상황이다.

import { SITE_URL } from "@/lib/site";

// NEXT_PUBLIC_SITE_URL은 쓰지 않는다 — .env.local에서 그 값은 localhost:3000이라
// 운영 대신 로컬을 때린다. 정식 도메인의 유일한 출처는 SITE_URL이다.
// 로컬 검증이 필요하면 REVALIDATE_TARGET으로 명시적으로 덮어쓴다.
const SITE = process.env.REVALIDATE_TARGET ?? SITE_URL;
const secret = process.env.REVALIDATE_SECRET;

if (!secret) {
  console.error(
    "✗ REVALIDATE_SECRET이 없습니다. .env.local에 설정하고 Vercel 환경변수에도 같은 값을 넣으세요.",
  );
  process.exit(1);
}

const res = await fetch(`${SITE}/revalidate`, {
  method: "POST",
  headers: { "x-revalidate-secret": secret },
});

if (!res.ok) {
  console.error(`✗ 재검증 실패 ${res.status} — ${await res.text()}`);
  process.exit(1);
}

console.log(`✓ 재검증 완료 — ${SITE}`);
