import Link from "next/link";
import type { Route } from "next";
import { CurationCard } from "@/components/CurationCard";
import { HospitalCard } from "@/components/HospitalCard";
import { DepartmentGrid } from "@/components/DepartmentGrid";
import { hospitals, articles, getCurationHospitals } from "@/lib/data";

export default function HomePage() {
  const curated = getCurationHospitals(3);
  const standardHospitals = hospitals.filter((h) => h.departmentSlug === "dental").slice(0, 5);
  const featuredCuration = curated[0];
  const sideCurations = curated.slice(1, 3);

  return (
    <>
      <section className="bg-[var(--color-surface-bg)] py-7 md:py-10">
        <div className="container-page">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)]">
            TIER 01 · MEDIROK CURATION
          </p>
          <h1 className="editorial mt-1">
            내가 직접 고른 메디록 큐레이션 의원
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl leading-relaxed">
            메디록 큐레이터가 4단계 인증 + 추가 심사를 통과한 의원만 매월
            선정합니다.
          </p>

          {featuredCuration && (
            <div className="mt-5">
              <CurationCard hospital={featuredCuration} size="lg" />
            </div>
          )}

          {sideCurations.length > 0 && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {sideCurations.map((h) => (
                <CurationCard key={h.slug} hospital={h} size="sm" />
              ))}
            </div>
          )}
        </div>
      </section>

      <DepartmentGrid />

      <section className="bg-white py-7 border-b border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="flex justify-between items-baseline mb-3">
            <h2>
              6월 특가전
            </h2>
            <Link href={"/event" as Route} className="text-xs text-[var(--color-text-muted)]">
              모든 특가 →
            </Link>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {["시니어 임플란트", "백내장 다초점", "도수치료", "종합검진", "노안교정"].map(
              (tag, i) => (
                <span
                  key={tag}
                  className={`text-xs px-3 py-1.5 rounded-full ${
                    i === 0
                      ? "bg-[var(--color-primary-600)] text-white"
                      : "bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]"
                  }`}
                >
                  {tag}
                </span>
              )
            )}
          </div>
          <div className="bg-[var(--color-surface-bg)] rounded-md p-3 flex gap-3 items-center">
            <div className="w-14 h-14 bg-[var(--color-primary-600)] rounded-md flex items-center justify-center shrink-0">
              <span className="text-[var(--color-accent-400)] text-base font-medium">치과</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">시니어 임플란트 패키지</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                서울 18곳 · 메디록 인증
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[var(--color-text-muted)] line-through">120만~</p>
              <p className="text-sm font-medium text-[var(--color-danger)]">75만원~</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-7 border-b border-[var(--color-surface-border)]">
        <div className="container-page">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-muted)]">
            TIER 02 · DIRECTORY
          </p>
          <div className="flex justify-between items-baseline mt-1 mb-1">
            <h2 className="text-base font-medium">
              전체 메디록 인증 의원
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">312개 · 정렬 ▾</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 mb-4">
            메디록 4단계 인증을 통과한 의원만. 가격·평점·거리·후기를
            직접 비교하고 선택하세요.
          </p>
          <div className="space-y-2">
            {standardHospitals.map((h) => (
              <HospitalCard key={h.slug} hospital={h} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/hospitals/dental"
              className="inline-block btn-outline text-xs"
            >
              치과 의원 309개 더 보기 →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-primary-600)] py-6">
        <div className="container-page">
          <div className="flex gap-3 items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.06em] text-[var(--color-accent-400)]">
                메디록 매거진 오픈
              </p>
              <p className="text-white font-medium text-sm mt-1">
                &ldquo;시니어 임플란트, 의사가 답합니다&rdquo;
              </p>
              <p className="text-[var(--color-accent-300)] text-xs mt-1">
                시리즈 12편 · 의사 직접 답변
              </p>
            </div>
            <Link href={"/magazine" as Route} className="btn-accent text-xs">
              읽기 →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-7 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <h2 className="text-base font-medium mb-3">
            메디록 매거진
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/magazine/${a.slug}` as Route}
                className="block bg-white rounded-md p-3 border border-[var(--color-surface-border)]"
              >
                <p className="text-[10px] text-[var(--color-accent-600)] tracking-wide">
                  {a.category}
                </p>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mt-1.5 leading-snug">
                  {a.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2 leading-relaxed">
                  {a.excerpt}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-2">{a.publishedAt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl md:text-2xl font-medium">312</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                메디록 인증 의원
              </p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-medium">12,847</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">시니어 리뷰</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-medium">96%</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">재방문율</p>
            </div>
          </div>
        </div>
      </section>

      <a
        href="https://partner.medirok.com"
        className="block bg-[var(--color-primary-700)] py-3 text-center text-xs text-[var(--color-accent-400)]"
      >
        혹시 의원장님이신가요?{" "}
        <span className="text-white">메디록 큐레이션 파트너 신청하기 →</span>
      </a>
    </>
  );
}
