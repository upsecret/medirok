/**
 * IndexNow 색인 요청 — Bing/Yandex/Naver 등 IndexNow 참여 엔진에 URL 변경을 통지한다.
 *
 * 왜 필요한가: ChatGPT 검색은 Bing 인덱스를 사용한다. Bing에 색인되지 않으면
 * 답변에 인용될 수 없다 (medirok_콘텐츠_발행팩.md §6 체크리스트 2번).
 *
 * 실행:
 *   npm run indexnow -- /magazine/guide-incheon-laminate-2026 /magazine/guide-...
 *   npm run indexnow -- --dry-run /magazine/...     # 전송 없이 페이로드만 출력
 *
 * 사전 조건 (한 번만):
 *   1. public/<KEY>.txt 가 배포돼 https://<HOST>/<KEY>.txt 에서 200으로 열려야 한다.
 *      → 이 스크립트가 전송 전에 자동으로 확인한다.
 *   2. 그 파일의 내용은 KEY 문자열과 정확히 같아야 한다.
 *
 * 주의: 외부 서비스로 URL을 발행하는 동작이다. 발행이 끝난 URL만 넣을 것.
 */

const KEY = "0bdf2a333d270c77d8a632f9455079de";
const HOST = process.env.INDEXNOW_HOST ?? "www.medirok.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const keyLocation = `https://${HOST}/${KEY}.txt`;

function usage(): never {
  console.error(
    "사용법: npm run indexnow -- [--dry-run] <경로 또는 절대URL> [...]\n" +
      "  예: npm run indexnow -- /magazine/guide-incheon-laminate-2026"
  );
  process.exit(1);
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const inputs = argv.filter((a) => a !== "--dry-run");
  if (inputs.length === 0) usage();

  const urlList = inputs.map((p) =>
    /^https?:\/\//i.test(p) ? p : `https://${HOST}${p.startsWith("/") ? p : `/${p}`}`
  );

  const offHost = urlList.filter((u) => new URL(u).hostname !== HOST);
  if (offHost.length > 0) {
    console.error(`❌ HOST(${HOST})와 다른 호스트가 섞여 있습니다:\n  ${offHost.join("\n  ")}`);
    process.exit(1);
  }

  const payload = { host: HOST, key: KEY, keyLocation, urlList };
  console.log("전송할 페이로드:");
  console.log(JSON.stringify(payload, null, 2));

  // 1) 키 파일 접근성 확인 — 실패하면 IndexNow가 요청을 거절한다
  console.log(`\n• 키 파일 확인: ${keyLocation}`);
  const keyRes = await fetch(keyLocation);
  const keyBody = (await keyRes.text()).trim();
  if (!keyRes.ok || keyBody !== KEY) {
    console.error(
      `❌ 키 파일 확인 실패 (status ${keyRes.status}, 내용 "${keyBody.slice(0, 40)}").\n` +
        "   public/<KEY>.txt 를 배포한 뒤 다시 실행하세요."
    );
    process.exit(1);
  }
  console.log("  ✓ 키 파일 정상");

  // 2) 대상 URL이 실제로 200인지 확인 — 404를 제출하면 신뢰도만 깎인다
  console.log("\n• 대상 URL 확인");
  let bad = 0;
  for (const u of urlList) {
    const res = await fetch(u, { method: "HEAD", redirect: "follow" });
    console.log(`  ${res.ok ? "✓" : "✗"} ${res.status} ${u}`);
    if (!res.ok) bad++;
  }
  if (bad > 0) {
    console.error(`❌ 200이 아닌 URL ${bad}건 — 제출을 중단합니다.`);
    process.exit(1);
  }

  if (dryRun) {
    console.log("\n(--dry-run) 전송하지 않고 종료합니다.");
    process.exit(0);
  }

  // 3) 제출
  console.log(`\n• IndexNow 제출 → ${ENDPOINT}`);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  // 200 OK / 202 Accepted 가 정상. 그 외는 본문에 사유가 담긴다.
  console.log(`  status ${res.status} ${res.statusText}`);
  if (text) console.log(`  body: ${text.slice(0, 500)}`);

  if (res.status !== 200 && res.status !== 202) {
    console.error("❌ IndexNow 제출 실패");
    process.exit(1);
  }
  console.log("\n✅ IndexNow 제출 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 실패:", err);
  process.exit(1);
});
