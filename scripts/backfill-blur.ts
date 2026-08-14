/**
 * 기존 media 문서에 blurDataURL을 채운다 — 1회성 백필.
 *
 * blurDataURL은 업로드 훅(Media.ts)이 원본 버퍼로 만든다. 그래서 훅을 넣기 전에
 * 올라간 문서에는 값이 없다. 그 문서들은 파일이 이미 Blob에 있으므로, 여기서는
 * card 파생본을 다시 받아 같은 방식으로 생성한다.
 *
 * 반드시 getSeedPayload()를 경유한다 — PAYLOAD_DB_PUSH=false로 스키마 push를
 * 막기 위해서다. 확인용 한 줄짜리 스크립트라도 push가 켜진 채 getPayload()를
 * 부르면 payload_migrations에 dev(batch −1) 마커가 꽂힌다(런북 §운영 DB 규칙,
 * 2026-08-14 사고 기록).
 *
 * 재실행해도 안전하다 — 이미 값이 있는 문서는 건너뛴다.
 * 전부 다시 만들려면 --force.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getSeedPayload } from "./seed-payload";
import { publicMediaUrl } from "../src/lib/payload-mappers";

const force = process.argv.includes("--force");

async function main(): Promise<void> {
  const payload = await getSeedPayload();
  const { docs } = await payload.find({
    collection: "media",
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  let filled = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const doc of docs) {
    const id = String(doc.id);
    const label = doc.filename ?? id;

    if (doc.blurDataURL && !force) {
      skipped++;
      continue;
    }

    // card 파생본이 있으면 그것을 쓴다 — 원본보다 작아 받는 비용이 적고,
    // 어차피 16px로 줄일 것이라 결과는 같다.
    const source = doc.sizes?.card?.url ?? doc.url;
    const cardFilename = doc.sizes?.card?.filename ?? doc.filename;
    if (!source) {
      failed.push(`${label}: url 없음`);
      continue;
    }

    // Blob을 쓰는 환경에서는 publicMediaUrl이 CDN 절대 주소를 돌려준다.
    // 토큰이 없는 환경(e2e docker·로컬)은 /api/media/file/* 상대 경로가 그대로
    // 남는데, 그걸 받으려면 서버가 떠 있어야 한다 — 파일이 staticDir에 그대로
    // 있으므로 디스크에서 읽는다.
    const href = publicMediaUrl(source);

    try {
      const buffer = href.startsWith("http")
        ? Buffer.from(
            await (async () => {
              const res = await fetch(href);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.arrayBuffer();
            })(),
          )
        : await readFile(path.resolve(process.cwd(), "media", cardFilename!));
      const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();

      await payload.update({
        collection: "media",
        id: doc.id,
        overrideAccess: true,
        data: { blurDataURL: `data:image/webp;base64,${blur.toString("base64")}` },
      });
      filled++;
      console.log(`  ✓ ${label}`);
    } catch (err) {
      failed.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n생성 ${filled} · 건너뜀 ${skipped} · 실패 ${failed.length}`);
  if (failed.length > 0) {
    console.error("실패 목록:");
    failed.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
}

await main();
process.exit(0);
