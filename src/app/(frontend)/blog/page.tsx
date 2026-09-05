import Link from "next/link";
import type { Route } from "next";
import { getBlogHospitals } from "@/lib/blog-data";
import { JsonLd } from "@/components/JsonLd";
import { HospitalBrandCover } from "@/components/HospitalBrandCover";
import { itemListSchema, breadcrumbSchema } from "@/lib/schema-generator";
import { SITE_URL } from "@/lib/site";

// 시드는 즉시 라이브라 캐시를 안 쓰고 있었다. 이제 ISR로 두고 발행 직후 반영은
// /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts · 런북 §9-3).
export const revalidate = 1800;

export const metadata = {
  title: "병원 소식 · 메디록",
  description:
    "메디록 인증 의원이 공식 블로그에 직접 쓴 진료 기록을 주제별로 재구성했습니다. 원문 출처를 함께 밝힙니다.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const groups = await getBlogHospitals();

  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "홈", url: SITE_URL },
      { name: "병원 소식", url: `${SITE_URL}/blog` },
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

      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2.5">
        <div className="container-page text-sm text-[var(--color-text-muted)]">
          <Link href="/">홈</Link> › 병원 소식
        </div>
      </nav>

      <section className="bg-[var(--color-primary-800)] py-14 md:py-20">
        <div className="container-page">
          <p className="eyebrow !text-[var(--color-accent-300)]">
            MEDIROK CLINIC BLOG · 메디록
          </p>
          <h1 className="editorial mt-4 text-white">인증 병원의 진료 이야기</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-200)]">
            메디록 인증 병원이 발행한 진료 정보를 주제별로 정리했습니다.
            모든 글에서 작성 병원과 재구성의 근거가 된 원문을 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container-page">
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
              <p className="eyebrow mb-3">CLINIC STORIES</p>
              <h2 className="editorial mb-7">소식을 전하는 병원 <span className="font-sans text-base text-[var(--color-text-muted)]">{groups.length}곳</span></h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {groups.map(({ hospital, posts }, i) => (
                  <Link
                    key={hospital.slug}
                    href={`/blog/${hospital.slug}` as Route}
                    className="card-lift block rounded-2xl border border-[var(--color-surface-border)] bg-white p-5"
                  >
                    {/*
                      의원 단위 목록이므로 카드의 주인공은 의원 로고다.
                      배경(coverImage)은 어둡게·흐리게 깔아 로고만 또렷하게 남긴다.
                    */}
                    <HospitalBrandCover
                      cover={hospital.coverImage}
                      logo={hospital.logo}
                      hospitalName={hospital.nameKr}
                      // 첫 카드가 LCP 요소다 (2열 그리드라 첫 행 2장까지)
                      priority={i < 2}
                      className="mb-3"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
                        병원 소식
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {posts.length}편
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold leading-snug text-[var(--color-text-primary)]">
                      {hospital.nameKr}
                    </h3>
                    {hospital.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                        {hospital.shortDescription}
                      </p>
                    )}
                    <p className="mt-4 text-sm leading-snug text-[var(--color-text-secondary)]">
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
