import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getAllBlogPosts, getBlogPostsByHospital } from "@/lib/blog-data";
import { getHospitalBySlug, decodeParam } from "@/lib/hospitals-data";
import { BlogPostCard } from "@/components/BlogPostCard";
import { JsonLd } from "@/components/JsonLd";
import { blogSchema, breadcrumbSchema } from "@/lib/schema-generator";
import { SITE_URL } from "@/lib/site";
import { blogSourceLabel } from "@/lib/blog-source";

// 시드는 즉시 라이브라 캐시를 안 쓰고 있었다. 이제 ISR로 두고 발행 직후 반영은
// /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts · 런북 §9-3).
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ hospitalSlug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return [...new Set(posts.map((p) => p.hospitalSlug))]
    .filter(Boolean)
    .map((hospitalSlug) => ({ hospitalSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const hospitalSlug = decodeParam((await params).hospitalSlug);
  const [hospital, posts] = await Promise.all([
    getHospitalBySlug(hospitalSlug),
    getBlogPostsByHospital(hospitalSlug),
  ]);
  if (!hospital || posts.length === 0) return {};

  const title = `${hospital.nameKr} 병원 소식 · 메디록`;
  const description = `${hospital.nameKr}이 공식 블로그에 직접 쓴 진료 기록을 주제별로 재구성한 ${posts.length}편. 원문 출처를 함께 밝힙니다.`;
  const canonical = `/blog/${hospitalSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function BlogHospitalPage({ params }: PageProps) {
  const hospitalSlug = decodeParam((await params).hospitalSlug);
  const [hospital, posts] = await Promise.all([
    getHospitalBySlug(hospitalSlug),
    getBlogPostsByHospital(hospitalSlug),
  ]);
  if (!hospital || posts.length === 0) notFound();

  const url = `${SITE_URL}/blog/${encodeURIComponent(hospitalSlug)}`;
  const { sourceBlogName, sourceBlogUrl } = posts[0];

  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: SITE_URL },
      { name: "의원 블로그", url: `${SITE_URL}/blog` },
      { name: hospital.nameKr, url },
    ]),
    blogSchema({
      name: `${hospital.nameKr} 블로그`,
      description: `${hospital.nameKr}의 공식 블로그 콘텐츠를 메디록이 주제별로 재구성한 모음`,
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

  return (
    <>
      <JsonLd data={schemas} />

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2.5">
        <div className="container-page text-sm text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › <Link href={"/blog" as Route}>병원 소식</Link> ›{" "}
          {hospital.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-primary-800)] py-12 md:py-16">
        <div className="container-page">
          <p className="eyebrow !text-[var(--color-accent-300)]">
            CLINIC BLOG · 메디록
          </p>
          <h1 className="editorial mt-4 text-white">{hospital.nameKr} 진료 이야기</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-200)]">
            {hospital.nameKr}이 공식 블로그에 직접 쓴 진료 기록을 메디록이 주제별로
            재구성했습니다. 각 글 하단에 재구성의 근거가 된 원문 목록이 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link
              href={`/hospital/${hospital.slug}` as Route}
              className="text-[var(--color-accent-300)] underline underline-offset-2"
            >
              의원 상세 보기
            </Link>
            <a
              href={sourceBlogUrl}
              target="_blank"
              rel="noopener nofollow"
              className="text-[var(--color-accent-300)] underline underline-offset-2"
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
                hospitalSlug={hospital.slug}
                hospitalName={hospital.nameKr}
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
