import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getAllBlogPosts, getBlogPost, getBlogPostsByHospital } from "@/lib/blog-data";
import { getHospitalBySlug, getDoctorBySlug, decodeParam } from "@/lib/hospitals-data";
import { ShortAnswerBlock } from "@/components/ShortAnswerBlock";
import { FaqBlock } from "@/components/FaqBlock";
import { HospitalCard } from "@/components/HospitalCard";
import { BlogPostCard } from "@/components/BlogPostCard";
import { BlogSourceAttribution } from "@/components/BlogSourceAttribution";
import { Markdown } from "@/components/Markdown";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { AuthorProfile } from "@/components/AuthorProfile";
import { Thumbnail } from "@/components/Thumbnail";
import { JsonLd } from "@/components/JsonLd";
import {
  blogPostingSchema,
  faqPageSchema,
  breadcrumbSchema,
} from "@/lib/schema-generator";
import { SITE_URL, absMediaUrl } from "@/lib/site";

// 시드는 즉시 라이브라 캐시를 안 쓰고 있었다. 이제 ISR로 두고 발행 직후 반영은
// /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts · 런북 §9-3).
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ hospitalSlug: string; slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts
    .filter((p) => p.hospitalSlug)
    .map((p) => ({ hospitalSlug: p.hospitalSlug, slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const raw = await params;
  const hospitalSlug = decodeParam(raw.hospitalSlug);
  const post = await getBlogPost(hospitalSlug, decodeParam(raw.slug));
  if (!post) return {};
  const canonical = `/blog/${hospitalSlug}/${post.slug}`;
  const images = post.thumbnail
    ? [absMediaUrl(post.thumbnail.featureUrl)]
    : undefined;
  return {
    title: post.seoTitle,
    description: post.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: post.seoTitle,
      description: post.metaDescription,
      type: "article",
      url: canonical,
      images,
    },
    ...(images && {
      twitter: {
        card: "summary_large_image" as const,
        title: post.seoTitle,
        description: post.metaDescription,
        images,
      },
    }),
  };
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const raw = await params;
  const hospitalSlug = decodeParam(raw.hospitalSlug);
  // (병원, slug) 쌍으로 조회 — slug만 맞는 URL이 200이면 같은 글이 중복 색인된다
  const post = await getBlogPost(hospitalSlug, decodeParam(raw.slug));
  if (!post) notFound();

  const authorDoctor = post.authorDoctorSlug
    ? await getDoctorBySlug(post.authorDoctorSlug)
    : undefined;

  const [hospital, siblings] = await Promise.all([
    getHospitalBySlug(hospitalSlug),
    getBlogPostsByHospital(hospitalSlug),
  ]);
  if (!hospital) notFound();

  const otherPosts = siblings.filter((p) => p.slug !== post.slug);
  const hospitalUrl = `${SITE_URL}/blog/${encodeURIComponent(hospitalSlug)}`;
  const url = `${hospitalUrl}/${post.slug}`;

  // 저자 = 원문 작성 주체. 원장 명의 글이면 Person, 병원 명의 글이면 병원(Organization).
  // post.authorName(재구성 담당)은 바이라인 표기용이며 저자로 선언하지 않는다 —
  // 재구성 주체는 publisher(메디록)와 출처 박스가 이미 밝힌다.
  const authorName = authorDoctor?.nameKr ?? hospital.nameKr;
  const authorTitle = authorDoctor?.title;

  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: SITE_URL },
      { name: "의원 블로그", url: `${SITE_URL}/blog` },
      { name: hospital.nameKr, url: hospitalUrl },
      { name: post.seoTitle, url },
    ]),
    blogPostingSchema({
      title: post.seoTitle,
      description: post.metaDescription,
      publishedAt: post.publishedAt,
      url,
      authorName,
      authorTitle,
      authorIsPerson: Boolean(authorDoctor),
      authorUrl: authorDoctor
        ? undefined
        : `${SITE_URL}/hospital/${encodeURIComponent(hospital.slug)}`,
      sourcePosts: post.sourcePosts,
      sourceBlogUrl: post.sourceBlogUrl,
      imageUrl: post.thumbnail
        ? absMediaUrl(post.thumbnail.featureUrl)
        : undefined,
    }),
  ];

  if (post.faqBlocks && post.faqBlocks.length > 0) {
    schemas.push(faqPageSchema(post.faqBlocks));
  }

  return (
    <>
      <JsonLd data={schemas} />

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-content text-xs text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › <Link href={"/blog" as Route}>의원 블로그</Link> ›{" "}
          <Link href={`/blog/${hospital.slug}` as Route}>{hospital.nameKr}</Link>
        </div>
      </nav>

      <article className="bg-white">
        <header className="container-content pt-7 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
              의원 블로그
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {post.publishedAt}
            </span>
          </div>
          <h1 className="editorial">{post.seoTitle}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-3">
            {hospital.nameKr}
            {authorDoctor && (
              <>
                {" · "}
                <span className="text-[var(--color-text-primary)] font-medium">
                  {authorDoctor.nameKr}
                </span>
                {authorDoctor.title && ` ${authorDoctor.title}`}
              </>
            )}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            의원 공식 네이버 블로그 기반 재구성 · 원문 {post.sourcePosts.length}편
          </p>
        </header>

        {post.thumbnail && (
          <div className="container-content pb-4">
            <Thumbnail thumbnail={post.thumbnail} variant="feature" priority />
          </div>
        )}

        <div className="container-content">
          <ShortAnswerBlock
            answer={post.shortAnswer}
            authorName={authorName}
            authorTitle={authorTitle}
          />

          <Markdown source={post.body} />

          {post.faqBlocks && post.faqBlocks.length > 0 && (
            <FaqBlock faqs={post.faqBlocks} />
          )}

          <BlogSourceAttribution
            hospitalName={hospital.nameKr}
            sourceBlogName={post.sourceBlogName}
            sourceBlogUrl={post.sourceBlogUrl}
            sourcePosts={post.sourcePosts}
          />

          {authorDoctor && (
            <AuthorProfile
              authorDoctor={authorDoctor}
              authorHospital={hospital}
              authorName={post.authorName}
              authorTitle={post.authorTitle}
            />
          )}

          <section className="my-8 pt-6 border-t border-[var(--color-surface-border)]">
            <h2 className="text-lg font-medium mb-3">관련 메디록 의원</h2>
            <HospitalCard hospital={hospital} />
          </section>

          <MedicalDisclaimer type={post.disclaimerType} />
        </div>
      </article>

      {otherPosts.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-7 border-t border-[var(--color-surface-border)]">
          <div className="container-content">
            <h2 className="text-lg font-medium mb-3">
              {hospital.nameKr}의 다른 글
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {otherPosts.slice(0, 3).map((p) => (
                <BlogPostCard
                  key={p.slug}
                  post={p}
                  hospitalSlug={hospital.slug}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
