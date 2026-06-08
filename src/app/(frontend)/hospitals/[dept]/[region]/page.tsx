import { notFound } from "next/navigation";
import Link from "next/link";
import { CurationCard } from "@/components/CurationCard";
import { HospitalCard } from "@/components/HospitalCard";
import {
  getDepartmentBySlug,
  getRegionBySlug,
  getHospitalsByDeptAndRegion,
} from "@/lib/hospitals-data";

interface PageProps {
  params: Promise<{ dept: string; region: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { dept, region } = await params;
  const d = await getDepartmentBySlug(dept);
  const r = await getRegionBySlug(region);
  if (!d || !r) return {};
  return {
    title: `${r.nameKr} ${d.nameKr} 추천 TOP — 메디록 인증`,
    description: `${r.nameKr} ${d.nameKr} 메디록 인증 의원. 평점·가격·후기를 비교하세요.`,
  };
}

export default async function DeptRegionPage({ params }: PageProps) {
  const { dept, region } = await params;
  const department = await getDepartmentBySlug(dept);
  const regionData = await getRegionBySlug(region);
  if (!department || !regionData) notFound();

  const allHospitals = await getHospitalsByDeptAndRegion(dept, region);
  const curated = allHospitals.filter((h) => h.tier === "PREMIUM" && h.curationNote);
  const standard = allHospitals;

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › 의원찾기 › {department.nameKr} › {regionData.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-6">
        <div className="container-page">
          <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
            {regionData.nameKr} · <span className="hanja">{department.hanja}</span>{" "}
            {department.nameKr}
          </span>
          <h1>
            {regionData.nameKr} {department.nameKr} 추천 TOP {standard.length}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            2026년 6월 기준, 메디록 메디록 4단계 인증을 통과한{" "}
            {regionData.nameKr} {department.nameKr} {standard.length}곳입니다.
          </p>
        </div>
      </section>

      {curated.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
          <div className="container-page">
            <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)] mb-1">
              TIER 01 · MEDIROK CURATION
            </p>
            <h2 className="editorial mb-4">
              {regionData.nameKr} {department.nameKr}{" "}
              메디록 큐레이션
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
              전체 의원 ({standard.length})
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">방문 많은 순 ▾</span>
          </div>
          <div className="space-y-2">
            {standard.map((h) => (
              <HospitalCard key={h.slug} hospital={h} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <p className="text-[10px] tracking-[0.06em] text-[var(--color-text-muted)] mb-3">
            인근 지역 · 다른 진료과
          </p>
          <div className="flex gap-2 flex-wrap">
            {["서초구", "송파구", "용산구"].map((r) => (
              <Link
                key={r}
                href={`/hospitals/${dept}/${r === "서초구" ? "seocho" : r === "송파구" ? "songpa" : "yongsan"}`}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-[var(--color-surface-border)]"
              >
                {r} {department.nameKr}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
