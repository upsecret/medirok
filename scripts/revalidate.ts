// 운영 캐시 재검증 — 시드 직후 실행한다.
//
// 콘텐츠 페이지가 ISR로 캐시되므로, 시드만 하고 이걸 빠뜨리면 발행 후
// 최대 revalidate초 동안 옛 화면이 나간다. 시드 npm 스크립트 뒤에 체이닝돼 있다.
//
// REVALIDATE_SECRET이 없으면 조용히 넘어가지 않고 실패시킨다 — 조용한 실패가
// 정확히 이 장치가 막으려는 상황이다.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.medirok.com";
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
