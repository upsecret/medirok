import { notFound } from "next/navigation";
import Link from "next/link";
import { CurationCard } from "@/components/CurationCard";
import { HospitalCard } from "@/components/HospitalCard";
import {
  getDepartmentBySlug,
  getHospitalsByDeptAndRegion,
  regions,
} from "@/lib/data";

interface PageProps {
  params: Promise<{ dept: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { dept } = await params;
  const department = getDepartmentBySlug(dept);
  if (!department) return {};
  return {
    title: `${department.nameKr} 醫錄 인증 의원`,
    description: `${department.nameKr} 醫錄 4단계 인증 의원. 평점·가격·후기를 비교하세요.`,
  };
}

export default async function DeptListPage({ params }: PageProps) {
  const { dept } = await params;
  const department = getDepartmentBySlug(dept);
  if (!department) notFound();

  const allHospitals = getHospitalsByDeptAndRegion(dept);
  const curated = allHospitals.filter((h) => h.tier === "PREMIUM" && h.curationNote);
  const standard = allHospitals;
  const regionList = regions.filter((r) => r.parentSlug === "seoul");

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › 의원찾기 › {department.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-6">
        <div className="container-page">
          <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
            <span className="hanja">{department.hanja}</span> · {department.nameEn?.toUpperCase()}
          </span>
          <h1>
            {department.nameKr} <span className="hanja">醫錄</span> 인증 의원 추천 TOP{" "}
            {standard.length}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            메디록 <span className="hanja">醫錄</span> 4단계 인증을 통과한 {department.nameKr}{" "}
            {standard.length}곳입니다. 평점·가격·후기를 비교해 보세요.
          </p>

          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-text-muted)] py-1.5">지역:</span>
            {regionList.map((r) => (
              <Link
                key={r.slug}
                href={`/hospitals/${department.slug}/${r.slug}`}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
              >
                {r.nameKr}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {curated.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
          <div className="container-page">
            <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)] mb-1">
              TIER 01 · MEDIROK CURATION
            </p>
            <h2 className="editorial mb-4">
              {department.nameKr} <span className="hanja">醫錄</span> 큐레이션
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
              전체 <span className="hanja">醫錄</span> 인증 의원 ({standard.length})
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">방문 많은 순 ▾</span>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {["가격공개", "예약가능", "醫錄 4단계", "시니어 패키지", "진료중"].map((f) => (
              <span
                key={f}
                className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-bg)]"
              >
                {f}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {standard.map((h) => (
              <HospitalCard key={h.slug} hospital={h} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-7 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <h2 className="text-base font-medium mb-3">자주 묻는 질문</h2>
          <details className="bg-white rounded-md p-4 border border-[var(--color-surface-border)] mb-2">
            <summary className="text-sm font-medium cursor-pointer">
              Q. {department.nameKr} 평균 가격은 얼마인가요?
            </summary>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              <span className="hanja">醫錄</span> 인증 의원 평균 가격은 의원별로 정상가/이벤트가가
              공개됩니다. 각 의원 카드에서 확인하세요.
            </p>
          </details>
          <details className="bg-white rounded-md p-4 border border-[var(--color-surface-border)] mb-2">
            <summary className="text-sm font-medium cursor-pointer">
              Q. <span className="hanja">醫錄</span> 인증이 뭔가요?
            </summary>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              메디록이 진료이력·실방문 후기·의료진 자격·시설장비 4단계를 직접 검증한 의원에만
              부여하는 인증입니다.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
