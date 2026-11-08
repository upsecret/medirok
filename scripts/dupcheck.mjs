/**
 * 중복 콘텐츠 점검 — 병원 블로그(`scripts/seed-blog-posts.ts`) vs 네이버 원문·위성 블로그
 *
 * **왜 있나.** 병원 블로그는 병원이 공개한 원문을 "재구성"하는 글이다(런북 §9-2, 1:1 복제 금지).
 * 그런데 같은 원문을 위성 블로그(blog.dodskin.com·blog.ye-on.com)도 재작성해 싣고 있고,
 * 네이버 원문 자체도 살아 있다. 원문 문장이나 위성 블로그 문장을 그대로 옮기면 중복 콘텐츠다.
 * 2026-11-08 위성 블로그 쪽에서 검사기 없이 쌓인 원문 일치 362곳을 한꺼번에 고쳤다 —
 * 같은 일이 여기서 반복되지 않게 둔다. 사람 눈으로는 안 잡힌다.
 *
 * 비교 방식은 위성 블로그의 dupcheck.mjs와 같다: 공백·마크업·숫자·영문을 지우고
 * **한글만 남겨 줄 단위로** 연속 N자(기본 20) 일치를 찾는다.
 *
 * 검사 대상: 본문(`const xxxBody = \`…\``)과 seoTitle·metaDescription·shortAnswer·FAQ 문답.
 *   원출처 글 제목(`sourcePosts[].title`)은 인용이므로 세지 않는다.
 * 대조군 (있는 것만 쓰고 없으면 건너뛴다):
 *   content-raw/                         메디록이 직접 받아 둔 원문 (gitignore)
 *   ../blog-dodskin/content-raw          디오디 네이버 원문 (위성 블로그가 수집해 둔 것)
 *   ../blog-yeon/content-raw             예온 네이버 원문
 *   ../blog-dodskin/content/posts        위성 블로그 게시글 — 사이트 간 중복
 *   ../blog-yeon/content/posts
 * 대조군에 없는 원문은 검사되지 않는다. 새 글의 참조 원문은 먼저 받아 둔다(런북 §9-2):
 *   NAVER_BLOG_ID=tj32xdcbiswj9 node ../blog-dodskin/scripts/scrape-naver.mjs <logNo>...
 *   (메디록 루트에서 실행해야 메디록 content-raw/에 떨어진다)
 *
 *   npm run dupcheck                        # 전 편, 20자 (기존 27편 기준선은 content-sources.md 변경 이력)
 *   npm run dupcheck -- 15                  # 더 빡빡하게
 *   npm run dupcheck -- --slug <slug>       # 한 편만 — 새 글·수정 글 게이트 (0건이어야 한다)
 *   npm run dupcheck -- --summary           # 글별 건수만
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 20);
const onlySlug = opt('--slug');
const summary = args.includes('--summary');
const root = process.cwd();

/** 마크다운·JSX·URL을 걷어내고 한글만 남긴다. */
const strip = (line) =>
  line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^가-힣]/g, '');

// ── 대조군 ──────────────────────────────────────────────
const REFS = [
  ['content-raw', '메디록 원문'],
  ['../blog-dodskin/content-raw', '디오디 원문'],
  ['../blog-yeon/content-raw', '예온 원문'],
  ['../blog-dodskin/content/posts', 'blog.dodskin.com'],
  ['../blog-yeon/content/posts', 'blog.ye-on.com'],
];
const grams = new Map();
const used = [];
for (const [rel, label] of REFS) {
  const dir = path.resolve(root, rel);
  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f));
  } catch {
    continue;
  }
  if (!files.length) continue;
  used.push(`${label} ${files.length}편`);
  for (const f of files) {
    for (const raw of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
      if (/^imageAlt:/.test(raw)) continue;
      const t = strip(raw);
      for (let i = 0; i + N <= t.length; i++) {
        const g = t.slice(i, i + N);
        if (!grams.has(g)) grams.set(g, `${label}/${f}`);
      }
    }
  }
}
if (!used.length) {
  console.log('대조군이 하나도 없다 (content-raw/·위성 블로그 저장소). 통과로 둔다.');
  process.exit(0);
}

// ── 검사 대상: seed-blog-posts.ts를 줄 단위로 읽어 글별로 묶는다 ─────────
const FIELD_KEYS = new Set(['seoTitle', 'metaDescription', 'shortAnswer', 'question', 'answer']);
const lines = fs.readFileSync(path.join(root, 'scripts/seed-blog-posts.ts'), 'utf8').split('\n');
const bodies = {}; // 본문 상수명 → 줄
const fields = {}; // slug → 줄
const bodyOwner = {}; // 본문 상수명 → slug
let mode = null;
let cur = null;
let key = null;
for (const line of lines) {
  const b = line.match(/^const (\w+) = `(.*)$/);
  if (b) {
    cur = b[1];
    bodies[cur] = [b[2]];
    mode = /`;\s*$/.test(b[2]) ? null : 'body';
    continue;
  }
  if (mode === 'body') {
    bodies[cur].push(line.replace(/`;\s*$/, ''));
    if (/`;\s*$/.test(line)) mode = null;
    continue;
  }
  const s = line.match(/^\s+slug: "([^"]+)"/);
  if (s) {
    mode = 'fields';
    cur = s[1];
    fields[cur] = [];
    key = null;
    continue;
  }
  if (mode !== 'fields') continue;
  const bodyRef = line.match(/^\s+body: (\w+),/);
  if (bodyRef) {
    bodyOwner[bodyRef[1]] = cur;
    continue;
  }
  const k = line.match(/^\s+(\w+):\s*(.*)$/);
  if (k) {
    key = k[1];
    if (FIELD_KEYS.has(key) && k[2]) fields[cur].push(k[2]);
    continue;
  }
  // 값이 다음 줄로 넘어간 경우 ("seoTitle:\n  \"…\"")
  if (FIELD_KEYS.has(key) && /^\s+["`]/.test(line)) fields[cur].push(line);
}

const posts = {};
for (const [name, ls] of Object.entries(bodies)) {
  const slug = bodyOwner[name];
  if (!slug) continue;
  (posts[slug] ??= []).push(...ls);
}
for (const [slug, ls] of Object.entries(fields)) (posts[slug] ??= []).push(...ls);

if (onlySlug && !posts[onlySlug]) {
  console.error(`slug "${onlySlug}"를 seed-blog-posts.ts에서 찾지 못했다.`);
  process.exit(2);
}

// ── 비교 ───────────────────────────────────────────────
let total = 0;
for (const [slug, ls] of Object.entries(posts)) {
  if (onlySlug && slug !== onlySlug) continue;
  const hits = [];
  for (const raw of ls) {
    const t = strip(raw);
    for (let i = 0; i + N <= t.length; ) {
      if (!grams.has(t.slice(i, i + N))) {
        i++;
        continue;
      }
      let end = i + N;
      while (end < t.length && grams.has(t.slice(end - N + 1, end + 1))) end++;
      hits.push({ from: grams.get(t.slice(i, i + N)), len: end - i, text: t.slice(i, end) });
      i = end;
    }
  }
  if (!hits.length) continue;
  total += hits.length;
  if (summary) {
    console.log(`${String(hits.length).padStart(4)}  ${slug}`);
    continue;
  }
  console.log(`\n■ ${slug}`);
  for (const h of hits) console.log(`  ${h.len}자 [${h.from}] ${h.text}`);
}

console.log(`\n대조군: ${used.join(' · ')}`);
console.log(
  total
    ? `✗ 연속 ${N}자 이상 일치 ${total}건 — 원문·위성 블로그 문장 재사용으로 읽힌다. 다시 쓸 것`
    : `✓ 연속 ${N}자 이상 일치 없음`,
);
process.exit(total ? 1 : 0);
