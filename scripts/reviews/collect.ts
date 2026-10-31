/**
 * 병원 후기 후보 수집 — 힐하우스 지점별 공개 플랫폼 리뷰.
 *
 * 실행:
 *   npm run reviews:collect                 (네이버 — 지점당 요청 2회)
 *   ONLY=gangnam,suwon npm run reviews:collect
 *   npm run reviews:collect -- --google     (구글맵 — Playwright 1회 열람)
 *
 * 산출물은 `.reviews/candidates/<지점>.json`과 `.reviews/raw/`에 저장된다(gitignore).
 * 이 스크립트는 **후보만 모은다** — 어떤 후기를 쓸지는 사람이 눈으로 고른다.
 * 실제로 받아 본 본문에 병원 답글, 기기·제품 브랜드명("올타이트"·"더엘"), 효과 단정
 * ("얼굴 작아지고")이 섞여 있었다. 의료광고 규제에 걸리는 문장들이라 자동 반영을 만들지 않는다.
 * 선별 규칙은 런북 §11-3에 있다.
 *
 * **수집 실패·0건 지점은 rating 0 · reviewCount 0 · reviews []를 그대로 둔다.**
 * 비어 있는 것이 틀린 숫자보다 낫다.
 *
 * 함정 (전부 실제로 밟았다):
 *  - 네이버는 2021년에 별점을 폐지했다. place 레벨 점수 키가 없고 개별 리뷰도 "rating": null이다.
 *    → 네이버 발췌의 rating은 0으로 둔다. 가져올 수 있는 건 리뷰 수와 본문뿐이다.
 *  - m.place.naver.com은 반복 요청을 차단한다(8회쯤에서 "과도한 접근 요청"). map.naver.com의
 *    robots.txt는 Disallow: / 다. → 지점당 요청 2회 상한 · 3초 간격 · 차단 감지 시 즉시 전체 중단.
 *    차단을 우회하지 않는다. 차단되면 고객에게 요청하는 쪽으로 넘어간다.
 *  - 리뷰 날짜에 연도가 없다("10.23.금"). 최신순 상단만 쓰고 경계가 애매하면 아예 쓰지 않는다.
 *  - 구글맵은 curl·웹검색으로 안 된다(JS 블록). Playwright가 필요하다.
 *  - 지점별 플랫폼 링크는 고객 공식 사이트에 이미 있다 — 하드코딩하지 않는다.
 *
 * 저작권: 방문자 리뷰의 저작자는 작성자 개인이다. 병원도 메디록도 권리자가 아니므로
 * 고객 계약으로 해결되지 않는다. 짧은 발췌 + 출처 표기 + 원문 링크(인용 범위)로만 쓴다.
 *
 * DB를 보지 않는다 — getSeedPayload를 import하지 않는다.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const OUT_ROOT = path.resolve(".reviews/candidates");
const RAW_ROOT = path.resolve(".reviews/raw");

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const HEALHOUSE_SITE = "https://healhouseskin.com";
const HEALHOUSE_BRANCHES = ["gangnam", "gundae", "pangyo", "suwon", "daegu"];

/** 지점 slug → 메디록 병원 slug (시드에 옮겨 적을 때의 대상) */
const HOSPITAL_SLUG: Record<string, string> = {
  gangnam: "힐하우스피부과강남점",
  gundae: "힐하우스피부과건대점",
  pangyo: "힐하우스피부과판교점",
  suwon: "힐하우스피부과수원점",
  daegu: "힐하우스피부과대구점",
};

const BLOCKED = /과도한 접근|이용이 제한|비정상적인 접근/;

class Blocked extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getText(url: string, extra: string[] = []): Promise<string> {
  const { stdout } = await exec(
    "curl",
    ["-sSL", "--max-time", "30", "-A", UA, ...extra, url],
    { maxBuffer: 32 * 1024 * 1024 }
  );
  if (BLOCKED.test(stdout)) throw new Blocked(`플랫폼이 수집을 거부했다: ${url}`);
  return stdout;
}

/** naver.me 단축링크 → place id (리다이렉트 Location만 읽는다, 본문은 받지 않는다) */
async function resolvePlaceId(shortUrl: string): Promise<string | null> {
  const { stdout } = await exec("curl", ["-sSI", "--max-time", "20", "-A", UA, shortUrl]);
  const loc = stdout.match(/^location:\s*(\S+)/im)?.[1] ?? "";
  return loc.match(/\/(?:place|hospital|restaurant)\/(\d+)/)?.[1] ?? loc.match(/\/(\d{6,})/)?.[1] ?? null;
}

interface Candidate {
  nickname: string;
  /** 플랫폼 표기 그대로 — 연도가 없다 */
  created: string;
  body: string;
  /** 병원 답글이 달린 건인지 (답글 본문 자체는 후보에 넣지 않는다) */
  hasReply: boolean;
  visitCount?: string;
  /**
   * 선별을 돕는 자동 플래그. 자동 제외가 아니라 **사람이 볼 표시**다 —
   * 규칙 판정은 문맥을 봐야 해서(런북 §11-3) 코드가 대신할 수 없다.
   */
  flags: string[];
}

/** 발췌 규칙에 걸릴 만한 대목을 표시한다 (판정은 사람이 한다) */
function flagBody(body: string): string[] {
  const flags: string[] = [];
  if (/올타이트|더엘|리쥬란|쥬브젠|울쎄라|써마지|고우리|인모드|튠페이스|엠페이스|리프테라|실리프팅|스킨부스터/.test(body))
    flags.push("기기·제품 브랜드명");
  if (/작아졌|작아지|없어졌|좋아졌|개선된 느낌|효과는|칭찬|달라졌|펴지/.test(body))
    flags.push("효과 단정·전후 비교");
  // "원"만 보면 "원장님"에 걸린다 — 금액 표기와 할인 어휘만 잡는다
  if (/[\d,]+\s*(?:만\s*)?원|가격|할인|이벤트|쿠폰|패키지/.test(body)) flags.push("가격·이벤트");
  if (/추천합니다|추천하고 싶|추천드리|받으세요|가보세요|경험해보셨으면/.test(body))
    flags.push("시술 권유");
  if (/다른 (?:병원|피부과)|오진|공장형|타 ?병원/.test(body)) flags.push("타 의료기관 비교·비방");
  if (/마케팅|대행|체험단|협찬/.test(body)) flags.push("비유기적 계정 의심");
  if (/인스타|스레드|sns|SNS|피부텐텐|방송/.test(body)) flags.push("유입 경로·방송 언급");
  if (body.replace(/\s/g, "").length < 40) flags.push("분량 부족");
  return flags;
}

interface BranchResult {
  branch: string;
  hospitalSlug: string;
  platform: "naver" | "google";
  placeUrl: string | null;
  /** 공개 집계 리뷰 수. 못 읽으면 null — 추정하지 않는다 */
  visitorReviewTotal: number | null;
  /** 네이버는 별점이 없다 */
  rating: number | null;
  candidates: Candidate[];
  note: string;
}

/** 고객 공식 사이트에서 지점별 네이버 플레이스 링크를 찾는다 */
async function branchPlaceLink(branch: string): Promise<string | null> {
  const html = await getText(`${HEALHOUSE_SITE}/ko/clinics/${branch}/`);
  return html.match(/https?:\/\/naver\.me\/[A-Za-z0-9]+/)?.[0] ?? null;
}

function parseNaverReviews(html: string): { total: number | null; candidates: Candidate[]; replies: number } {
  const total = Number(html.match(/"visitorReviewsTotal"\s*:\s*"?(\d+)"?/)?.[1] ?? NaN);

  // SSR된 APOLLO 상태에서 리뷰 한 건은 "reviewId" 로 시작하는 블록이고, 병원 답글은 그 블록
  // 안의 "reply":{"__typename":"VisitorReviewReply", ... "body": ...} 에 따로 들어 있다.
  // 창(window) 기준으로 보면 둘이 구분되지 않는다 — 블록 단위로 끊어 **첫 body만** 리뷰로 읽는다.
  const nicknames = [...html.matchAll(/"nickname"\s*:\s*"([^"]*)"/g)].map((m) => m[1]);
  const blocks = html.split('"reviewId":"').slice(1);
  const candidates: Candidate[] = [];
  let replies = 0;

  blocks.forEach((block, i) => {
    const bodyMatch = block.match(/"body"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (!bodyMatch) return;
    let body: string;
    try {
      body = JSON.parse(`"${bodyMatch[1]}"`);
    } catch {
      return;
    }
    body = body.replace(/\s+/g, " ").trim();
    if (!/[가-힣]/.test(body) || body.length < 20) return;
    const hasReply = /"__typename"\s*:\s*"VisitorReviewReply"/.test(block);
    if (hasReply) replies++;
    candidates.push({
      nickname: nicknames[i] ?? "",
      created: block.match(/"created"\s*:\s*"([^"]*)"/)?.[1] ?? "",
      body,
      hasReply,
      visitCount: block.match(/"visitCount"\s*:\s*"?(\d+)"?/)?.[1],
      flags: [
        ...flagBody(body),
        // 판교점 상위 2건이 "디테일러스 마케팅랩" 계정이었다 — 작성자로만 드러나는 신호다
        ...(/마케팅|대행|랩$|체험단/.test(nicknames[i] ?? "") ? ["비유기적 계정 의심(작성자명)"] : []),
      ],
    });
  });

  return { total: Number.isFinite(total) ? total : null, candidates, replies };
}

async function collectNaver(branch: string): Promise<BranchResult> {
  const result: BranchResult = {
    branch,
    hospitalSlug: HOSPITAL_SLUG[branch],
    platform: "naver",
    placeUrl: null,
    visitorReviewTotal: null,
    rating: null, // 네이버는 별점을 제공하지 않는다
    candidates: [],
    note: "",
  };

  const shortUrl = await branchPlaceLink(branch);
  if (!shortUrl) {
    result.note = "공식 사이트 지점 페이지에서 네이버 플레이스 링크를 찾지 못했다";
    return result;
  }
  const placeId = await resolvePlaceId(shortUrl);
  if (!placeId) {
    result.note = `단축링크에서 place id를 얻지 못했다 (${shortUrl})`;
    return result;
  }
  result.placeUrl = `https://m.place.naver.com/hospital/${placeId}/review/visitor`;

  // 요청 2회 상한 — /home(집계)과 /review/visitor(본문)
  await sleep(3000);
  const home = await getText(`https://m.place.naver.com/hospital/${placeId}/home`);
  await fs.writeFile(path.join(RAW_ROOT, `${branch}-naver-home.html`), home);

  await sleep(3000);
  const review = await getText(result.placeUrl);
  await fs.writeFile(path.join(RAW_ROOT, `${branch}-naver-review.html`), review);

  const fromHome = parseNaverReviews(home);
  const fromReview = parseNaverReviews(review);
  result.visitorReviewTotal = fromReview.total ?? fromHome.total;
  // 병원 답글 본문은 애초에 후보에 들어오지 않는다(블록의 첫 body만 읽는다).
  // 답글이 달렸다는 사실 자체는 후보에 남겨 사람이 참고한다.
  result.candidates = fromReview.candidates;
  const clean = result.candidates.filter((c) => c.flags.length === 0).length;
  result.note =
    `방문자 리뷰 ${result.candidates.length}건(병원 답글 달린 건 ${fromReview.replies}건) · ` +
    `자동 플래그 없는 건 ${clean}건. 별점은 플랫폼이 제공하지 않는다(2021 폐지).`;
  return result;
}

/** 구글맵 — curl로는 JS 블록이라 Playwright로 1회 연다 */
async function collectGoogle(branch: string): Promise<BranchResult> {
  const { chromium } = await import("playwright");
  const result: BranchResult = {
    branch,
    hospitalSlug: HOSPITAL_SLUG[branch],
    platform: "google",
    placeUrl: null,
    visitorReviewTotal: null,
    rating: null,
    candidates: [],
    note: "",
  };
  const query = `힐하우스피부과 ${branch}`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ locale: "ko-KR", userAgent: UA.replace("iPhone", "Macintosh") });
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ko`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(6000);
    result.placeUrl = page.url();
    const text = await page.evaluate(() => document.body.innerText);
    await fs.writeFile(path.join(RAW_ROOT, `${branch}-google.txt`), text);
    result.rating = Number(text.match(/(\d\.\d)\s*\n?\s*\(?리뷰|(\d\.\d)\s*별/)?.[1] ?? NaN) || null;
    result.visitorReviewTotal = Number(text.match(/리뷰\s*([\d,]+)개/)?.[1]?.replace(/,/g, "") ?? NaN) || null;
    result.note = "구글맵 화면 텍스트를 .reviews/raw에 저장했다 — 평점·리뷰 수는 사람이 눈으로 확인한다";
  } finally {
    await browser.close();
  }
  return result;
}

async function run() {
  const useGoogle = process.argv.includes("--google");
  const only = process.env.ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
  const branches = HEALHOUSE_BRANCHES.filter((b) => !only || only.includes(b));

  await fs.mkdir(OUT_ROOT, { recursive: true });
  await fs.mkdir(RAW_ROOT, { recursive: true });

  const results: BranchResult[] = [];
  for (const branch of branches) {
    console.log(`\n• ${branch} (${useGoogle ? "구글맵" : "네이버"})`);
    try {
      const r = useGoogle ? await collectGoogle(branch) : await collectNaver(branch);
      results.push(r);
      const out = path.join(OUT_ROOT, `${branch}-${r.platform}.json`);
      await fs.writeFile(out, JSON.stringify(r, null, 2));
      console.log(
        `  집계 ${r.visitorReviewTotal ?? "읽지 못함"} · 평점 ${r.rating ?? "미제공"} · 후보 ${r.candidates.length}건`
      );
      console.log(`  → ${out}`);
      if (r.note) console.log(`  · ${r.note}`);
    } catch (e) {
      if (e instanceof Blocked) {
        console.log(`  ✗ ${e.message}`);
        console.log(
          "\n⚠ 플랫폼이 자동 수집을 거부했다. 우회하지 않는다.\n" +
            "  남은 지점은 고객(힐하우스)에게 지점별 리뷰 수와 발췌 사용 동의를 요청해 채운다.\n" +
            "  수집하지 못한 지점은 rating 0 · reviewCount 0 · reviews []를 그대로 둔다."
        );
        break;
      }
      console.log(`  ✗ ${(e as Error).message}`);
    }
  }

  console.log(
    "\n다음: 후보를 눈으로 골라 scripts/seed-healhouse.ts의 reviews[]에 손으로 옮겨 적는다.\n" +
      "  제외 — 병원 답글 / 효과 단정·전후 비교 / 기기·제품 브랜드명 / 가격·이벤트 / 개인 식별 정보\n" +
      "  지점당 최대 3건. 네이버 발췌는 rating 0, reviewerName은 \"닉**** (네이버)\".\n" +
      "  rating·reviewCount 필드에는 플랫폼 수치를 넣지 않는다 (런북 §11-1)."
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
