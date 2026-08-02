import Link from "next/link";
import type { Route } from "next";
import { getBlogHospitals } from "@/lib/blog-data";
import { JsonLd } from "@/components/JsonLd";
import { HospitalBrandCover } from "@/components/HospitalBrandCover";
import { itemListSchema, breadcrumbSchema } from "@/lib/schema-generator";
import { SITE_URL } from "@/lib/site";

// DB를 매 요청 시 반영 — 시드 즉시 노출
export const dynamic = "force-dynamic";

export const metadata = {
  title: "의원 블로그 · 메디록",
  description:
    "메디록 인증 의원이 공식 블로그에 직접 쓴 진료 기록을 주제별로 재구성했습니다. 원문 출처를 함께 밝힙니다.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const groups = await getBlogHospitals();

  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: SITE_URL },
      { name: "의원 블로그", url: `${SITE_URL}/blog` },
    ]),
  ];

  if (groups.length > 0) {
    schemas.push(
      itemListSchema({
        name: "메디록 의원 블로그",
        items: groups.map((g) => ({
          name: `${g.hospital.nameKr} 블로그`,
          url: `${SITE_URL}/blog/${encodeURIComponent(g.hospital.slug)}`,
          description: g.hospital.shortDescription,
        })),
      })
    );
  }

  return (
    <>
      <JsonLd data={schemas} />

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-content text-xs text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › 의원 블로그
        </div>
      </nav>

      <section className="bg-[var(--color-primary-600)] py-8 md:py-10">
        <div className="container-content">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-400)]">
            MEDIROK CLINIC BLOG · 메디록
          </p>
          <h1 className="editorial text-white mt-2">의원 블로그</h1>
          <p className="text-[var(--color-accent-300)] text-sm mt-3 leading-relaxed max-w-xl">
            메디록 인증 의원이 공식 블로그에 직접 쓴 진료 기록을 주제별로 재구성했습니다.
            각 글에는 재구성의 근거가 된 원문 목록과 링크를 함께 싣습니다.
          </p>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="container-content">
          {groups.length === 0 ? (
            <div className="border border-dashed border-[var(--color-surface-border)] rounded-md py-12 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                아직 공개된 의원 블로그가 없습니다.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                준비 중인 콘텐츠는 순차적으로 공개됩니다.{" "}
                <Link
                  href={"/magazine" as Route}
                  className="text-[var(--color-accent-600)] underline underline-offset-2"
                >
                  메디록 매거진 보기
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-3">
                블로그 운영 의원 ({groups.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups.map(({ hospital, posts }) => (
                  <Link
                    key={hospital.slug}
                    href={`/blog/${hospital.slug}` as Route}
                    className="block bg-white border border-[var(--color-surface-border)] rounded-md p-4 transition hover:border-[var(--color-accent-400)]"
                  >
                    {/*
                      의원 단위 목록이므로 카드의 주인공은 의원 로고다.
                      배경(coverImage)은 어둡게·흐리게 깔아 로고만 또렷하게 남긴다.
                    */}
                    <HospitalBrandCover
                      cover={hospital.coverImage}
                      logo={hospital.logo}
                      hospitalName={hospital.nameKr}
                      className="mb-3"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
                        의원 블로그
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {posts.length}편
                      </span>
                    </div>
                    <h2 className="font-medium text-base text-[var(--color-text-primary)] leading-snug">
                      {hospital.nameKr}
                    </h2>
                    {hospital.shortDescription && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed line-clamp-2">
                        {hospital.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)] mt-3 leading-snug">
                      최근 글 · {posts[0].seoTitle}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
