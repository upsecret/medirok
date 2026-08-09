/**
 * 썸네일 후보 수집 — 병원 공식 사이트 + 네이버 원문에서 이미지를 내려받는다.
 *
 * 실행:
 *   npm run thumbnails:collect
 *
 * 산출물은 `.thumbnails/candidates/<그룹>/`에 저장된다(gitignore).
 * 이 스크립트는 **후보만 모은다** — 어떤 장을 쓸지는 사람이 눈으로 고른다.
 * 선별 규칙(인물 얼굴·시술 전후 사진·텍스트 과다 배너 제외)은 자동 판별이 불가능하고,
 * 잘못 고르면 의료광고 규제에 걸리기 때문이다.
 *
 * 네이버(pstatic) 주의: HEAD는 404를 준다. GET + Referer 헤더로만 받아진다.
 *
 * 전송에 fetch가 아니라 curl을 쓰는 이유: gd365.ye-on.com이 내려주는 인증서 체인을
 * Node가 검증하지 못한다(UNABLE_TO_VERIFY_LEAF_SIGNATURE). curl은 통과한다.
 * 수집은 로컬 1회성 작업이라 런타임 의존성이 늘지 않는다.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const OUT_ROOT = path.resolve(".thumbnails/candidates");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface Target {
  group: string;
  /** 이미지 URL 목록을 만들어 반환 */
  resolve: () => Promise<{ url: string; name: string; referer?: string }[]>;
}

function curlArgs(url: string, referer?: string): string[] {
  return [
    "-sSL",
    "--max-time",
    "30",
    "-A",
    UA,
    ...(referer ? ["-e", referer] : []),
    url,
  ];
}

async function getText(url: string): Promise<string> {
  const { stdout } = await exec("curl", curlArgs(url), {
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function download(
  url: string,
  dest: string,
  referer?: string
): Promise<number> {
  await exec("curl", [...curlArgs(url, referer), "--fail", "-o", dest]);
  const { size } = await fs.stat(dest);
  if (size === 0) throw new Error("빈 파일");
  return size;
}

// ── 예온치과병원 공식 홈페이지 ──
const YEON_SITE = "https://gd365.ye-on.com";
const yeon: Target = {
  group: "yeon-site",
  resolve: async () => {
    const html = await getText(YEON_SITE + "/");
    // 로고·아이콘·SNS 버튼은 썸네일이 될 수 없다 — 사진(jpg/png)만 남긴다
    const found = new Set<string>();
    for (const m of html.matchAll(/(?:data-src|src)=["']([^"']+\.(?:jpg|png))["']/gi)) {
      const raw = m[1];
      if (/logo|kakao|naver|icon|header|flags?/i.test(raw)) continue;
      const abs = raw.startsWith("http")
        ? raw
        : YEON_SITE + "/" + raw.replace(/^\.?\//, "");
      found.add(abs);
    }
    return [...found].map((url) => ({
      url,
      name: path.basename(new URL(url).pathname),
    }));
  },
};

// ── 디오디피부과 공식 블로그(자체 도메인) ──
const DOD_SITE = "https://blog.dodskin.com";
const dod: Target = {
  group: "dod-site",
  resolve: async () => {
    const html = await getText(DOD_SITE + "/");
    // next/image 프록시 URL(/_next/image?url=...) 안의 원본 경로를 꺼낸다
    const found = new Set<string>();
    for (const m of html.matchAll(/\/_next\/image\?url=([^"'&]+)/g)) {
      const decoded = decodeURIComponent(m[1]);
      if (!/^\/images\/posts\//.test(decoded)) continue; // 포스트 히어로만
      found.add(DOD_SITE + decoded);
    }
    return [...found].map((url) => ({
      url,
      // /images/posts/<slug>/hero.jpg → <slug>.jpg
      name: `${new URL(url).pathname.split("/")[3]}.jpg`,
    }));
  },
};

// ── 네이버 블로그 원문 ──
// 글 하나가 여러 원문을 종합한 것이므로 **참조 원문 전부**를 훑는다.
// sourcePosts[0]만 보면 그 글이 카드뉴스뿐일 때 쓸 이미지가 없다
// (실제로 yeon-incheon-laminate의 첫 원문이 그랬다).
// 파일명에 logNo를 넣어 어느 원문에서 온 장인지 추적 가능하게 한다.
interface NaverSource {
  postSlug: string;
  blogId: string;
  logNos: string[];
}

const NAVER_SOURCES: NaverSource[] = [
  {
    postSlug: "yeon-incheon-dental",
    blogId: "income3357",
    logNos: ["224359427396", "224334182430", "224219410555"],
  },
  {
    postSlug: "yeon-incheon-laminate",
    blogId: "income3357",
    logNos: ["224354641790", "224319284605", "224131997364"],
  },
  {
    postSlug: "dod-cheongdam-skin",
    blogId: "tj32xdcbiswj9",
    logNos: ["224316949261", "224340734551", "224352352805", "224363232291"],
  },
  {
    postSlug: "yeon-incheon-ortho",
    blogId: "income3357",
    logNos: ["224372061740", "224361891536", "224347796141", "224336109258", "224310823083"],
  },
  {
    postSlug: "dod-cheongdam-lifting",
    blogId: "tj32xdcbiswj9",
    logNos: ["224369317424", "224365487881", "224364875176", "224364657239", "224360970255"],
  },
];

const naver: Target = {
  group: "naver",
  resolve: async () => {
    const out: { url: string; name: string; referer: string }[] = [];
    for (const s of NAVER_SOURCES) {
      for (const logNo of s.logNos) {
        const pageUrl = `https://m.blog.naver.com/${s.blogId}/${logNo}`;
        const html = await getText(pageUrl);
        // 본문 이미지는 mblogthumb-phinf. 원본 해상도 변형 중 w800을 쓴다.
        const urls: string[] = [];
        for (const m of html.matchAll(
          /https:\/\/mblogthumb-phinf\.pstatic\.net\/[^"'\s\\]+?\?type=w800/g
        )) {
          if (!urls.includes(m[0])) urls.push(m[0]);
        }
        let i = 0;
        for (const url of urls) {
          out.push({
            url,
            name: `${s.postSlug}_${logNo}_${String(++i).padStart(2, "0")}.jpg`,
            referer: pageUrl,
          });
        }
        console.log(`  ${s.postSlug} / ${logNo}: ${urls.length}장`);
      }
    }
    return out;
  },
};

// ── 의원 로고 (/blog 카드 배지) ──
//
// 배지는 흰 칩 위에 얹히므로 **밝은 배경용(짙은 색) 자산**만 쓸 수 있다.
// 후보를 훑어본 결과 양쪽 다 "마크"만 남았다:
//   - 예온 logo.svg = 리프 마크 단독(path 1개, #7D6E62). 워드마크는 SVG가 아니라 HTML 텍스트다.
//     풀 락업은 sns_logo.jpg(OG용)에 있지만 트림하면 134×20이라 배지 해상도에 못 미친다.
//   - 디오디 logo-lockup.png / logo-mark-white.png는 **흰색** 버전이라 흰 칩에서 사라진다.
//     짙은 색은 logo-mark-dark.png(모노그램)뿐이다.
// 결과적으로 양쪽 모두 마크만 쓰게 되어 형태도 서로 맞는다. 의원명은 카드 heading이 담당한다.
const logos: Target = {
  group: "logos",
  resolve: async () => [
    { url: `${YEON_SITE}/img_core/logo.svg`, name: "yeon-mark.svg" },
    { url: `${DOD_SITE}/images/brand/logo-mark-dark.png`, name: "dod-mark.png" },
  ],
};

async function run(): Promise<void> {
  for (const target of [yeon, dod, naver, logos]) {
    const dir = path.join(OUT_ROOT, target.group);
    await fs.mkdir(dir, { recursive: true });
    console.log(`\n• ${target.group}`);
    const items = await target.resolve();
    let ok = 0;
    for (const item of items) {
      const dest = path.join(dir, item.name);
      try {
        const bytes = await download(item.url, dest, item.referer);
        ok++;
        console.log(`  ✓ ${item.name} (${Math.round(bytes / 1024)}KB)`);
      } catch (e) {
        console.log(`  ✗ ${item.name} — ${(e as Error).message}`);
      }
    }
    console.log(`  → ${ok}/${items.length}장 저장: ${dir}`);
  }
  console.log(
    "\n다음: 후보를 눈으로 확인해 각 글의 대표 1장을 고른다.\n" +
      "  제외 — 인물 얼굴 식별 / 시술 전후 사진 / 텍스트 과다 배너"
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
