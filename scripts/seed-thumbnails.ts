/**
 * 매거진·블로그 대표 이미지 시드 — 선정본을 1280×720으로 잘라 Media에 올리고 문서에 연결.
 *
 * 실행:
 *   npm run seed:thumbnails               (운영 — .env.local)
 *   npm run seed:thumbnails -- --dry      (업로드 없이 소스 존재 여부만 점검)
 *   npm run seed:thumbnails -- --optional (없는 원본은 건너뛴다 — e2e용)
 *   npm run seed:thumbnails -- --refresh=<slug,…>  (이미지 교체 — 기존 media를 지우고 재업로드)
 *
 * --optional이 필요한 이유: 차용 원본은 외부 사이트에서 받아오므로 네트워크가 없거나
 * 갓 클론한 환경에는 없다. 반면 생성 카드는 로컬에서 만들 수 있어 항상 존재한다.
 * e2e는 이 모드로 돌려 "썸네일 있는 문서"와 "없는 문서"를 모두 확보한다.
 *
 * 선행:
 *   npm run thumbnails:collect   → .thumbnails/candidates/  (차용 원본)
 *   npm run thumbnails:cards     → .thumbnails/generated/   (브랜드 타이포 카드)
 *
 * 멱등: 같은 파일명의 media가 이미 있으면 재사용하고 새로 올리지 않는다.
 * 이미지를 교체하려면 어드민에서 해당 media를 지우거나 새 파일명을 쓴다.
 *
 * 이미지 선정 기준(수동 검토 완료): 인물 얼굴 식별 제외 · 시술 전후 사진 제외 ·
 * 판독 불가한 텍스트 배너 제외. 특히 디오디 원문에는 얼굴이 나오는 before/after
 * 사진이 있어 의료광고 규제상 후보에서 배제했다.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { getSeedPayload } from "./seed-payload";

const CAND = path.resolve(".thumbnails/candidates");
const GEN = path.resolve(".thumbnails/generated");
const W = 1280;
const H = 720;

const YEON_SITE = "https://gd365.ye-on.com/";
const DOD_SITE = "https://blog.dodskin.com/";
const naverUrl = (blogId: string, logNo: string): string =>
  `https://blog.naver.com/${blogId}/${logNo}`;

interface Entry {
  collection: "magazines" | "blog-posts" | "hospitals";
  slug: string;
  /** 원본 파일 절대경로 */
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  /**
   * thumbnail = 16:9 센터 크롭 (기본)
   * logo      = 크롭 없이 여백만 잘라 흰 배경으로 평탄화 (/blog 카드 배지용)
   */
  kind?: "thumbnail" | "logo";
  /** 연결할 필드. 기본 thumbnail */
  field?: "thumbnail" | "logo" | "coverImage";
  /**
   * 저장 파일명. 기본은 slug 기반이지만 **한국어 slug는 반드시 여기서 ASCII로 지정**한다 —
   * Payload의 /api/media/file/:filename 라우트가 퍼센트 인코딩된 한글 파일명을 해석하지
   * 못해 파일이 디스크(또는 Blob)에 있어도 404가 난다.
   */
  filename?: string;
}

const cand = (...p: string[]): string => path.join(CAND, ...p);
const gen = (slug: string): string => path.join(GEN, `${slug}.png`);

// ── 병원 공식 사이트에서 차용 (연결 병원이 있는 매거진 5편) ──
const BORROWED: Entry[] = [
  {
    collection: "magazines",
    slug: "guide-geomdan-dental-2026",
    src: cand("yeon-site", "02.jpg"),
    alt: "예온치과병원 검단 로비와 대기 공간",
    credit: "예온치과병원 공식 홈페이지",
    sourceUrl: YEON_SITE,
  },
  {
    collection: "magazines",
    slug: "guide-incheon-laminate-2026",
    src: cand("yeon-site", "content04_03.png"),
    alt: "기공사가 맞춤 보철물을 다듬는 모습",
    credit: "예온치과병원 공식 홈페이지",
    sourceUrl: YEON_SITE,
  },
  {
    collection: "magazines",
    slug: "guide-cheongdam-dermatology-2026",
    src: cand("dod-site", "cheongdam-clinic-how-to-choose.jpg"),
    alt: "디오디피부과의원 청담 대기 라운지",
    credit: "디오디피부과의원 청담 공식 블로그",
    sourceUrl: DOD_SITE,
  },
  {
    collection: "magazines",
    slug: "guide-cheongdam-derma-by-procedure-2026",
    src: cand("dod-site", "cheongdam-lifting-first-visit.jpg"),
    alt: "디오디피부과의원 청담 진료 구역 복도",
    credit: "디오디피부과의원 청담 공식 블로그",
    sourceUrl: DOD_SITE,
  },
  {
    collection: "magazines",
    slug: "interview-dod-dermatology-cheongdam",
    src: cand("dod-site", "summer-skin-care-guide.jpg"),
    alt: "디오디피부과의원 청담 리셉션 데스크",
    credit: "디오디피부과의원 청담 공식 블로그",
    sourceUrl: DOD_SITE,
  },
];

// ── 네이버 원문에서 선정 (블로그 3편) ──
// 각 글이 참조한 원문 중에서 고른다. 파일명의 logNo가 출처다.
const FROM_NAVER: Entry[] = [
  {
    collection: "blog-posts",
    slug: "yeon-incheon-dental",
    src: cand("naver", "yeon-incheon-dental_224359427396_03.jpg"),
    alt: "잇몸 단면에 식립된 임플란트 픽스처와 크라운 모형",
    credit: "예온치과병원 공식 네이버 블로그",
    sourceUrl: naverUrl("income3357", "224359427396"),
  },
  {
    collection: "blog-posts",
    slug: "yeon-incheon-laminate",
    // 참조 원문 3편이 모두 카드뉴스라 사진이 없다. 처음엔 그중 타이틀 카드를 썼는데
    // 글자가 박힌 이미지라 목록·카드 배경에서 지저분했다 — 병원 공식 사이트의
    // 시설 사진으로 교체한다(출처는 credit에 남는다).
    src: cand("yeon-site", "06.jpg"),
    alt: "예온치과병원 상담실",
    credit: "예온치과병원 공식 홈페이지",
    sourceUrl: YEON_SITE,
  },
  {
    collection: "blog-posts",
    slug: "dod-cheongdam-skin",
    src: cand("naver", "dod-cheongdam-skin_224316949261_06.jpg"),
    alt: "디오디피부과의원 청담 건물 외관",
    credit: "디오디피부과의원 청담 공식 네이버 블로그",
    sourceUrl: naverUrl("tj32xdcbiswj9", "224316949261"),
  },
];

// ── 생성 카드 (차용할 사진이 없는 매거진 10편) ──
const GENERATED_SLUGS = [
  "gangnam-implant-price-guide-2026",
  "gangnam-implant-top10-2026",
  "gangnam-vs-seocho-dental-prices",
  "senior-implant-vs-denture",
  "qna-65-implant-insurance",
  "qna-implant-aftercare-food",
  "interview-hangyeol-dental-han-jinwoo",
  "interview-songhak-dental-senior-focus",
  "case-67-fullmouth-implant",
  "case-72-bone-graft-implant",
];

const GENERATED: Entry[] = GENERATED_SLUGS.map((slug) => ({
  collection: "magazines" as const,
  slug,
  src: gen(slug),
  alt: "메디록 매거진 대표 이미지",
  credit: "메디록",
}));

// ── 의원 로고 (/blog 카드 배지) ──
// 흰 칩 위에 얹으므로 짙은 색 마크만 쓸 수 있다 (collect.ts 주석 참고).
const LOGOS: Entry[] = [
  {
    collection: "hospitals",
    slug: "예온치과병원",
    src: cand("logos", "yeon-mark.svg"),
    filename: "yeon-dental-logo.png",
    alt: "예온치과병원 로고",
    credit: "예온치과병원",
    sourceUrl: YEON_SITE,
    kind: "logo",
    field: "logo",
  },
  {
    collection: "hospitals",
    slug: "디오디피부과의원청담",
    src: cand("logos", "dod-mark.png"),
    filename: "dod-cheongdam-logo.png",
    alt: "디오디피부과의원 청담 로고",
    credit: "디오디피부과의원 청담",
    sourceUrl: DOD_SITE,
    kind: "logo",
    field: "logo",
  },
];

// ── 의원 커버 (/blog 카드 배경) ──
// 어둡게·흐리게 깔려 로고를 받쳐 주는 배경. **글자가 없는 시설 사진만** 쓴다.
const COVERS: Entry[] = [
  {
    collection: "hospitals",
    slug: "예온치과병원",
    src: cand("yeon-site", "14.jpg"),
    filename: "yeon-dental-cover.jpg",
    alt: "예온치과병원 진료실",
    credit: "예온치과병원 공식 홈페이지",
    sourceUrl: YEON_SITE,
    field: "coverImage",
  },
  {
    collection: "hospitals",
    slug: "디오디피부과의원청담",
    // dod-site 6장 중 3장은 매거진에 사용, 나머지는 인물·텍스트라 부적합.
    // 네이버 원문 중 유일하게 글자·인물이 없는 사진이다.
    src: cand("naver", "dod-cheongdam-skin_224316949261_02.jpg"),
    filename: "dod-cheongdam-cover.jpg",
    alt: "디오디피부과의원 청담 대기 라운지",
    credit: "디오디피부과의원 청담 공식 네이버 블로그",
    sourceUrl: naverUrl("tj32xdcbiswj9", "224316949261"),
    field: "coverImage",
  },
];

const ENTRIES: Entry[] = [
  ...BORROWED,
  ...FROM_NAVER,
  ...GENERATED,
  ...LOGOS,
  ...COVERS,
];

const exists = async (p: string): Promise<boolean> =>
  fs
    .access(p)
    .then(() => true)
    .catch(() => false);

async function main(): Promise<void> {
  const dry = process.argv.includes("--dry");
  const optional = process.argv.includes("--optional");
  // 썸네일은 optional 필드이므로 "없는 문서"도 정상 렌더돼야 한다(플레이스홀더).
  // e2e에서는 이 경로를 검증할 표본이 필요해 한 편을 일부러 비워 둔다.
  // 운영 시드에는 쓰지 않는다.
  const leave = process.argv
    .find((a) => a.startsWith("--leave-placeholder="))
    ?.split("=")[1];
  /**
   * 이미지를 **교체**할 때 쓴다. 이 스크립트는 파일명 기준 멱등이라, 소스 파일만 바꾸고
   * 그냥 돌리면 옛 media를 그대로 재사용해 교체가 조용히 무시된다.
   * 지정한 slug는 기존 media를 지우고 다시 올린다.
   */
  const refresh = new Set(
    (process.argv.find((a) => a.startsWith("--refresh="))?.split("=")[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  // 소스 누락은 업로드를 시작하기 전에 전부 알린다 — 절반만 올라간 상태가 제일 곤란하다
  const present: Entry[] = [];
  const missing: string[] = [];
  const leaveEntries: Entry[] = [];
  for (const e of ENTRIES) {
    if (leave && e.slug === leave) {
      leaveEntries.push(e);
      continue;
    }
    if (await exists(e.src)) present.push(e);
    else missing.push(`${e.slug} ← ${path.relative(process.cwd(), e.src)}`);
  }

  if (missing.length > 0) {
    if (!optional) {
      console.error("✗ 원본 이미지 누락:\n  " + missing.join("\n  "));
      console.error(
        "\n  npm run thumbnails:collect / npm run thumbnails:cards 를 먼저 실행하세요."
      );
      process.exit(1);
    }
    console.log(`⚠ 원본 없음 ${missing.length}건 — 건너뜁니다:\n  ${missing.join("\n  ")}`);
  }
  console.log(`✓ 원본 ${present.length}/${ENTRIES.length}장 확인`);
  if (dry) process.exit(0);
  if (present.length === 0) {
    console.log("올릴 이미지가 없습니다.");
    process.exit(0);
  }

  // Blob에 올리는 상황에서도 Payload는 파일명 충돌 검사에 로컬 staticDir(`media/`)를
  // 들여다본다. 토큰 없이 돌린 예전 실행이 남긴 파일이 있으면 이름이 통째로 밀린다
  // (guide-...-2026.jpg → guide-...-2027.jpg). 이름이 밀리면 이 스크립트의 멱등 조회
  // (`<slug>.jpg`)가 영영 빗나가 재실행마다 중복이 쌓인다.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const staticDir = path.resolve("media");
    const stale = await fs.readdir(staticDir).catch(() => [] as string[]);
    if (stale.length > 0) {
      console.error(
        `✗ 로컬 media/ 에 파일 ${stale.length}개가 남아 있습니다.\n` +
          "  Blob 업로드 시 파일명이 밀리므로 먼저 비우세요:  rm -rf media/"
      );
      process.exit(1);
    }
  }

  const payload = await getSeedPayload();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "medirok-thumb-"));

  // 비워 둘 문서는 **적극적으로 해제**한다. 건너뛰기만 하면 앞선 실행이 남긴 연결이
  // 그대로 살아 있어 플레이스홀더 표본이 사라진다(멱등하지 않게 된다).
  for (const e of leaveEntries) {
    const t = await payload.find({
      collection: e.collection,
      where: { slug: { equals: e.slug } },
      limit: 1,
      depth: 0,
    });
    if (t.docs.length === 0) continue;
    await payload.update({
      collection: e.collection,
      id: (t.docs[0] as { id: number | string }).id,
      data: { thumbnail: null },
    });
    console.log(`↷ 플레이스홀더 검증용으로 비움: ${e.collection}/${e.slug}`);
  }

  let created = 0;
  let reused = 0;
  let linked = 0;

  for (const e of present) {
    const isLogo = e.kind === "logo";
    // 로고는 파일명 충돌을 피하려 접미사를 붙인다 — 병원 slug가 매거진 slug와 겹칠 일은
    // 없지만, media 목록에서 용도가 바로 보이는 편이 낫다
    const filename = e.filename ?? (isLogo ? `${e.slug}-logo.png` : `${e.slug}.jpg`);

    // 1) 대상 문서부터 확인 — 없는데 media만 만들면 고아 이미지가 남는다
    //    (로컬 e2e는 병원 연결 매거진 5편을 시드하지 않아 실제로 발생한다)
    const target = await payload.find({
      collection: e.collection,
      where: { slug: { equals: e.slug } },
      limit: 1,
      depth: 0,
    });
    if (target.docs.length === 0) {
      console.log(`  ⚠ 문서 없음     ${e.collection}/${e.slug} — 건너뜀`);
      continue;
    }

    // 1-b) 교체 지정분은 기존 media를 먼저 지운다 — 안 그러면 파일명 멱등 때문에
    //      옛 이미지가 재사용되어 교체가 조용히 무시된다
    if (refresh.has(e.slug)) {
      const old = await payload.find({
        collection: "media",
        where: { filename: { equals: filename } },
        limit: 1,
        depth: 0,
      });
      if (old.docs.length > 0) {
        const oldId = (old.docs[0] as { id: number | string }).id;
        await payload.delete({ collection: "media", id: oldId });
        console.log(`  ♻ 교체 위해 삭제 ${filename} (media #${oldId})`);
      }
    }

    // 2) media 확보 (파일명 기준 멱등)
    const found = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    });

    let mediaId: number | string;
    if (found.docs.length > 0) {
      mediaId = (found.docs[0] as { id: number | string }).id;
      reused++;
      console.log(`  = media 재사용  ${filename}`);
    } else {
      const out = path.join(tmp, filename);
      if (isLogo) {
        // 로고는 크롭하면 안 된다. density는 SVG 래스터화 해상도 — 기본값이면
        // 예온 로고가 viewBox 크기(163×24) 그대로 래스터화돼 배지에서 뭉갠다.
        // trim은 원본의 넓은 여백(예온 SVG는 마크 오른쪽이 전부 빈 영역)을 걷어낸다.
        // flatten은 흰 칩과 맞추기 위한 것 — 투명 PNG의 흰 요소가 사라지는 것도 함께 막는다.
        await sharp(e.src, { density: 1200 })
          .flatten({ background: "#ffffff" })
          .trim({ threshold: 10 })
          .resize({ height: 240, fit: "inside", withoutEnlargement: true })
          .png()
          .toFile(out);
        const m = await sharp(out).metadata();
        console.log(`    로고 산출 ${m.width}×${m.height}`);
      } else {
        await sharp(e.src)
          .resize(W, H, { fit: "cover", position: "centre" })
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(out);
      }

      const doc = await payload.create({
        collection: "media",
        filePath: out,
        data: {
          alt: e.alt,
          ...(e.credit ? { credit: e.credit } : {}),
          ...(e.sourceUrl ? { sourceUrl: e.sourceUrl } : {}),
        },
      });
      // Payload가 이름을 바꿔 저장했다면 멱등성이 깨진 것이므로 즉시 멈춘다
      if (doc.filename !== filename) {
        console.error(
          `✗ 파일명이 밀렸습니다: ${filename} → ${doc.filename}\n` +
            "  같은 이름의 파일이 이미 저장소(또는 로컬 media/)에 있습니다. 정리 후 재실행하세요."
        );
        process.exit(1);
      }
      mediaId = doc.id;
      created++;
      console.log(`  + media 생성    ${filename}`);
    }

    // 3) 대상 문서에 연결
    const field = e.field ?? "thumbnail";
    await payload.update({
      collection: e.collection,
      id: (target.docs[0] as { id: number | string }).id,
      data: { [field]: mediaId },
    });
    linked++;
    console.log(`  → 연결          ${e.collection}/${e.slug}.${field}`);
  }

  await fs.rm(tmp, { recursive: true, force: true });
  console.log(
    `\n✅ 완료 — media 생성 ${created} / 재사용 ${reused}, 문서 연결 ${linked}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
