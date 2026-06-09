import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { CurationCard } from "@/components/CurationCard";
import { HospitalCard } from "@/components/HospitalCard";
import {
  getDepartmentBySlug,
  getRegionBySlug,
  getRegionPath,
  getChildRegions,
  getHospitalsByDeptAndRegion,
} from "@/lib/hospitals-data";

interface PageProps {
  params: Promise<{ sido: string; gu: string; dept: string }>;
  searchParams: Promise<{ dong?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { gu, dept } = await params;
  const [department, region] = await Promise.all([
    getDepartmentBySlug(dept),
    getRegionBySlug(gu),
  ]);
  if (!department || !region) return {};
  return {
    title: `${region.nameKr} ${department.nameKr} 메디록 인증 병원`,
    description: `${region.nameKr} ${department.nameKr} 메디록 4단계 인증 병원. 평점·가격·후기를 비교하세요.`,
  };
}

export default async function HospitalListPage({ params, searchParams }: PageProps) {
  const { sido, gu, dept } = await params;
  const { dong } = await searchParams;

  const [department, region, path, dongs] = await Promise.all([
    getDepartmentBySlug(dept),
    getRegionBySlug(gu),
    getRegionPath(gu),
    getChildRegions(gu),
  ]);
  if (!department || !region || region.level !== "sigungu") notFound();

  const sidoName = path[0]?.nameKr ?? sido;
  let hospitals = await getHospitalsByDeptAndRegion(dept, gu);

  const activeDong = dong && dongs.some((d) => d.slug === dong) ? dong : undefined;
  if (activeDong) hospitals = hospitals.filter((h) => h.dongSlug === activeDong);

  const curated = hospitals.filter((h) => h.tier === "PREMIUM" && h.curationNote);
  const standard = hospitals;
  const base = `/hospitals/${sido}/${gu}/${dept}`;

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › <Link href="/hospitals">병원찾기</Link> ›{" "}
          <Link href={`/hospitals/${sido}`}>{sidoName}</Link> ›{" "}
          <Link href={`/hospitals/${sido}/${gu}`}>{region.nameKr}</Link> ›{" "}
          {department.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-6">
        <div className="container-page">
          <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
            {region.nameKr} · <span className="hanja">{department.hanja}</span>{" "}
            {department.nameKr}
          </span>
          <h1>
            {region.nameKr} {department.nameKr}
          </h1>

          {dongs.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="text-xs text-[var(--color-text-muted)] py-1.5">동:</span>
              <Link
                href={base as Route}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  !activeDong
                    ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                    : "bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
                }`}
              >
                전체
              </Link>
              {dongs.map((d) => (
                <Link
                  key={d.slug}
                  href={`${base}?dong=${d.slug}` as Route}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    activeDong === d.slug
                      ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                      : "bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {d.nameKr}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {curated.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
          <div className="container-page">
            <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)] mb-1">
              TIER 01 · MEDIROK CURATION
            </p>
            <h2 className="editorial mb-4">
              {region.nameKr} {department.nameKr} 메디록 큐레이션
            </h2>
            <div className="space-y-3">
              {curated.map((h) => (
                <CurationCard key={h.slug} hospital={h} size="lg" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-muted)]">
            TIER 02 · DIRECTORY
          </p>
          <div className="flex justify-between items-baseline mt-1 mb-4">
            <h2 className="text-base font-medium">
              전체 메디록 인증 병원 ({standard.length})
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">방문 많은 순 ▾</span>
          </div>
          {standard.length > 0 ? (
            <div className="space-y-2">
              {standard.map((h) => (
                <HospitalCard key={h.slug} hospital={h} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              해당 지역·진료과에 등록된 메디록 인증 병원이 아직 없습니다.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <h2 className="text-base font-medium mb-3">자주 묻는 질문</h2>
          <details className="bg-white rounded-md p-4 border border-[var(--color-surface-border)] mb-2">
            <summary className="text-sm font-medium cursor-pointer">
              Q. {region.nameKr} {department.nameKr} 평균 가격은 얼마인가요?
            </summary>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              메디록 인증 병원은 의원별로 정상가·이벤트가가 공개됩니다. 각 병원
              카드에서 확인하세요.
            </p>
          </details>
          <details className="bg-white rounded-md p-4 border border-[var(--color-surface-border)] mb-2">
            <summary className="text-sm font-medium cursor-pointer">
              Q. 메디록 인증이 뭔가요?
            </summary>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              메디록이 진료이력·실방문 후기·의료진 자격·시설장비 4단계를 직접
              검증한 병원에만 부여하는 인증입니다.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
