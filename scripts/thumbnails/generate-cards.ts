/**
 * 브랜드 타이포 카드 생성 — 차용할 사진이 없는 매거진의 대표 이미지.
 *
 * 실행:
 *   npm run thumbnails:cards            (썸네일 없는 매거진 전부)
 *   npm run thumbnails:cards -- slug-a slug-b
 *
 * 병원 사진을 무관한 글에 돌려 쓰면 독자가 그 의원 관련 글로 오인한다.
 * 대신 카테고리 색 + 제목 + 錄 워드마크로 된 카드를 만든다 — 저작권 리스크 0,
 * 15편이 하나의 시각 언어로 묶인다.
 *
 * 렌더는 Playwright(로컬 Chromium). 한글 서체가 시스템에 있으므로 next/og처럼
 * 폰트 바이너리를 끌어안을 필요가 없다.
 *
 * 산출물: `.thumbnails/generated/<slug>.png` (1280×720)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { getSeedPayload } from "../seed-payload";

const OUT_DIR = path.resolve(".thumbnails/generated");
const W = 1280;
const H = 720;

// MagazineCard.tsx의 TYPE_COLORS/TYPE_LABELS와 같은 값 — 카드와 썸네일의 색이 어긋나면
// 목록에서 같은 글의 배지와 이미지가 다른 색으로 보인다.
const TYPE_COLORS: Record<string, string> = {
  article: "#4A6FA0",
  qna: "#7C6238",
  regional: "#2E7D5C",
  interview: "#2D3748",
  case: "#B4453E",
};
const TYPE_LABELS: Record<string, string> = {
  article: "시술 가이드",
  qna: "Q&A",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

/** "제목 — 부제" / "제목 (2026) — 부제" → [제목, 부제] */
function splitTitle(seoTitle: string): [string, string] {
  const m = seoTitle.split(/\s*[—–]\s*/);
  return [m[0]?.trim() ?? seoTitle, m.slice(1).join(" — ").trim()];
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(opts: {
  label: string;
  color: string;
  title: string;
  subtitle: string;
}): string {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; }
  body {
    background: #FAF8F3;
    font-family: "Pretendard", -apple-system, "Apple SD Gothic Neo", sans-serif;
    color: #1A202C;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px;
    position: relative;
  }
  /* 좌측 색 밴드 — 카테고리 식별자 */
  .band { position: absolute; left: 0; top: 0; bottom: 0; width: 16px; background: ${opts.color}; }
  /* 우하단 대형 글리프 — 배경 요소로 깔아 브랜드를 각인시킨다 */
  .glyph {
    position: absolute; right: 44px; bottom: -70px;
    font-family: "Noto Serif KR", "AppleMyungjo", serif;
    font-size: 380px; line-height: 1; color: ${opts.color}; opacity: 0.08;
  }
  .label {
    display: inline-block; font-size: 22px; font-weight: 600; letter-spacing: 0.02em;
    color: #fff; background: ${opts.color}; padding: 8px 18px; border-radius: 6px;
  }
  .title {
    font-size: 62px; font-weight: 700; line-height: 1.24; letter-spacing: -0.02em;
    max-width: 1000px; word-break: keep-all;
  }
  .sub {
    margin-top: 22px; font-size: 30px; line-height: 1.45; color: #4A5568;
    max-width: 960px; word-break: keep-all;
  }
  .foot { display: flex; align-items: center; gap: 14px; }
  .mark {
    width: 52px; height: 52px; border-radius: 12px; background: #2D3748; color: #B89968;
    font-family: "Noto Serif KR", "AppleMyungjo", serif; font-size: 32px;
    display: flex; align-items: center; justify-content: center;
  }
  .wordmark { font-size: 28px; font-weight: 600; color: #2D3748; }
</style></head><body>
  <div class="band"></div>
  <div class="glyph">錄</div>
  <div><span class="label">${esc(opts.label)}</span></div>
  <div>
    <div class="title">${esc(opts.title)}</div>
    ${opts.subtitle ? `<div class="sub">${esc(opts.subtitle)}</div>` : ""}
  </div>
  <div class="foot"><div class="mark">錄</div><div class="wordmark">메디록</div></div>
</body></html>`;
}

async function run(): Promise<void> {
  const only = process.argv.slice(2);
  const payload = await getSeedPayload();
  const res = await payload.find({ collection: "magazines", limit: 500, depth: 0 });

  const targets = (res.docs as unknown as Record<string, unknown>[]).filter((d) => {
    const slug = String(d.slug);
    if (only.length > 0) return only.includes(slug);
    return !d.thumbnail; // 이미 대표 이미지가 있으면 건드리지 않는다
  });

  if (targets.length === 0) {
    console.log("생성 대상이 없습니다.");
    process.exit(0);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  for (const doc of targets) {
    const slug = String(doc.slug);
    const type = String(doc.type);
    const [title, subtitle] = splitTitle(String(doc.seoTitle));
    await page.setContent(
      html({
        label: TYPE_LABELS[type] ?? "메디록",
        color: TYPE_COLORS[type] ?? "#2D3748",
        title,
        subtitle,
      }),
      { waitUntil: "load" }
    );
    const out = path.join(OUT_DIR, `${slug}.png`);
    await page.screenshot({ path: out });
    console.log(`  ✓ ${slug}.png  [${TYPE_LABELS[type]}] ${title}`);
  }

  await browser.close();
  console.log(`\n${targets.length}장 생성: ${OUT_DIR}`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
