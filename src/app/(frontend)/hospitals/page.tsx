import Link from "next/link";
import { HospitalCard } from "@/components/HospitalCard";
import { HospitalFilterBar } from "@/components/hospital-finder/HospitalFilterBar";
import {
  getAllRegions,
  getAllDepartments,
  getAllHospitals,
} from "@/lib/hospitals-data";

export const metadata = {
  title: "병원찾기",
  description: "메디록 4단계 인증 병원을 지역·진료과로 찾아보세요.",
};

interface PageProps {
  searchParams: Promise<{ region?: string; dong?: string; dept?: string }>;
}

export default async function HospitalsPage({ searchParams }: PageProps) {
  const { region, dong, dept } = await searchParams;

  const [regions, departments, all] = await Promise.all([
    getAllRegions(),
    getAllDepartments(),
    getAllHospitals(),
  ]);

  let hospitals = all;
  if (region) hospitals = hospitals.filter((h) => h.regionSlug === region);
  if (dong) hospitals = hospitals.filter((h) => h.dongSlug === dong);
  if (dept) hospitals = hospitals.filter((h) => h.departmentSlug === dept);

  const regionLabel =
    (dong && regions.find((r) => r.slug === dong)?.nameKr) ||
    (region && regions.find((r) => r.slug === region)?.nameKr) ||
    "지역";
  const deptLabel =
    (dept && departments.find((d) => d.slug === dept)?.nameKr) || "진료과";

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › 병원찾기
        </div>
      </nav>

      <section className="bg-white py-4 border-b border-[var(--color-surface-border)] sticky top-[57px] z-30">
        <div className="container-page">
          <HospitalFilterBar
            regions={regions}
            departments={departments}
            region={region}
            dong={dong}
            dept={dept}
            regionLabel={regionLabel}
            deptLabel={deptLabel}
          />
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-5 min-h-[50vh]">
        <div className="container-page">
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            메디록 인증 병원 {hospitals.length}곳
          </p>

          {hospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitals.map((h) => (
                <HospitalCard key={h.slug} hospital={h} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-[var(--color-text-muted)]">
                선택한 조건에 맞는 메디록 인증 병원이 아직 없습니다.
              </p>
              <Link
                href="/hospitals"
                className="inline-block mt-3 text-xs text-[var(--color-accent-700)]"
              >
                필터 초기화 →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
