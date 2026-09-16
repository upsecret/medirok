import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getAllBlogPosts, getBlogOwner, getBlogPostsByOwner } from "@/lib/blog-data";
import { decodeParam } from "@/lib/hospitals-data";
import { blogGroupOfHospital, blogOwnerSlug } from "@/lib/blog-groups";
import { BlogPostCard } from "@/components/BlogPostCard";
import { JsonLd } from "@/components/JsonLd";
import { blogSchema, breadcrumbSchema } from "@/lib/schema-generator";
import { SITE_URL } from "@/lib/site";
import { blogSourceLabel } from "@/lib/blog-source";

// 시드는 즉시 라이브라 캐시를 안 쓰고 있었다. 이제 ISR로 두고 발행 직후 반영은
// /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts · 런북 §9-3).
export const revalidate = 1800;

// URL 1단계는 "소유자" — 병원 slug 또는 블로그 그룹 slug(src/lib/blog-groups.ts).
// 파라미터 이름은 라우트 폴더명을 따라 hospitalSlug로 남겨 둔다.
interface PageProps {
  params: Promise<{ hospitalSlug: string }>;
}

/** 주격 조사 — 받침이 있으면 "이", 없으면 "가"(예: "힐하우스피부과가", "디오디피부과의원 청담이") */
function subject(name: string): string {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${name}${hasFinal ? "이" : "가"}`;
}

/** 소개 문장에 쓰는 채널 이름 — 네이버 원출처는 기존 문구("공식 블로그") 그대로 */
function channelWord(sourceBlogUrl: string): string {
  return blogSourceLabel(sourceBlogUrl).kind === "naver" ? "블로그" : "웹사이트";
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return [...new Set(posts.map((p) => (p.hospitalSlug ? blogOwnerSlug(p.hospitalSlug) : "")))]
    .filter(Boolean)
    .map((hospitalSlug) => ({ hospitalSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const ownerSlug = decodeParam((await params).hospitalSlug);
  const [owner, posts] = await Promise.all([
    getBlogOwner(ownerSlug),
    getBlogPostsByOwner(ownerSlug),
  ]);
  if (!owner || posts.length === 0) return {};

  const title = `${owner.nameKr} 병원 소식 · 메디록`;
  const description = `${subject(owner.nameKr)} 공식 ${channelWord(posts[0].sourceBlogUrl)}에 직접 쓴 진료 기록을 주제별로 재구성한 ${posts.length}편. 원문 출처를 함께 밝힙니다.`;
  const canonical = `/blog/${ownerSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function BlogOwnerPage({ params }: PageProps) {
  const ownerSlug = decodeParam((await params).hospitalSlug);

  // 그룹에 묶인 지점 slug로 들어오면 그룹 URL로 영구 이동한다 —
  // 지점별로 발행됐던 옛 URL의 링크 가치를 넘기고, 같은 목록이 두 URL로 색인되는 것을 막는다.
  const group = blogGroupOfHospital(ownerSlug);
  if (group) permanentRedirect(`/blog/${encodeURIComponent(group.slug)}`);

  const [owner, posts] = await Promise.all([
    getBlogOwner(ownerSlug),
    getBlogPostsByOwner(ownerSlug),
  ]);
  if (!owner || posts.length === 0) notFound();

  const url = `${SITE_URL}/blog/${encodeURIComponent(ownerSlug)}`;
  const { sourceBlogName, sourceBlogUrl } = posts[0];

  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: SITE_URL },
      { name: "병원 소식", url: `${SITE_URL}/blog` },
      { name: owner.nameKr, url },
    ]),
    blogSchema({
      name: `${owner.nameKr} 블로그`,
      description: `${owner.nameKr}의 공식 ${channelWord(sourceBlogUrl)} 콘텐츠를 메디록이 주제별로 재구성한 모음`,
      url,
      sourceBlogUrl,
      posts: posts.map((p) => ({
        title: p.seoTitle,
        url: `${url}/${p.slug}`,
        publishedAt: p.publishedAt,
        description: p.metaDescription,
      })),
    }),
  ];

  const linkClass = "text-[var(--color-accent-300)] underline underline-offset-2";

  return (
    <>
      <JsonLd data={schemas} />

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2.5">
        <div className="container-page text-sm text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › <Link href={"/blog" as Route}>병원 소식</Link> ›{" "}
          {owner.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-primary-800)] py-12 md:py-16">
        <div className="container-page">
          <p className="eyebrow !text-[var(--color-accent-300)]">
            CLINIC BLOG · 메디록
          </p>
          <h1 className="editorial mt-4 text-white">{owner.nameKr} 진료 이야기</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-200)]">
            {subject(owner.nameKr)} 공식 {channelWord(sourceBlogUrl)}에 직접 쓴 진료 기록을 메디록이
            주제별로 재구성했습니다. 각 글 하단에 재구성의 근거가 된 원문 목록이 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            {owner.isGroup ? (
              // 네트워크 병원은 병원 소식은 하나지만 병원 상세는 지점마다 있다
              <nav
                aria-label={`${owner.nameKr} 지점`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[var(--color-primary-200)]"
              >
                <span>지점 보기</span>
                {owner.hospitals.map((h) => (
                  <Link key={h.slug} href={`/hospital/${h.slug}` as Route} className={linkClass}>
                    {h.nameKr.startsWith(`${owner.nameKr} `)
                      ? h.nameKr.slice(owner.nameKr.length + 1)
                      : h.nameKr}
                  </Link>
                ))}
              </nav>
            ) : (
              <Link href={`/hospital/${owner.hospitals[0].slug}` as Route} className={linkClass}>
                의원 상세 보기
              </Link>
            )}
            <a
              href={sourceBlogUrl}
              target="_blank"
              rel="noopener nofollow"
              className={linkClass}
            >
              {sourceBlogName} ({blogSourceLabel(sourceBlogUrl).short})
            </a>
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container-page">
          <h2 className="editorial mb-7">전체 글 <span className="font-sans text-base text-[var(--color-text-muted)]">{posts.length}편</span></h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <BlogPostCard
                key={p.slug}
                post={p}
                hospitalSlug={owner.slug}
                hospitalName={owner.nameKr}
                // 2열 그리드라 첫 줄 두 장이 접힘 위에 온다
                priority={i < 2}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
