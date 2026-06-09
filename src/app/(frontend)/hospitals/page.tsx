import { HospitalFinder } from "@/components/hospital-finder/HospitalFinder";
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
  searchParams: Promise<{
    sido?: string;
    region?: string;
    dong?: string;
    dept?: string;
    sort?: string;
  }>;
}

export default async function HospitalsPage({ searchParams }: PageProps) {
  const { sido, region, dong, dept, sort } = await searchParams;

  const [regions, departments, hospitals] = await Promise.all([
    getAllRegions(),
    getAllDepartments(),
    getAllHospitals(),
  ]);

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › 병원찾기
        </div>
      </nav>

      <HospitalFinder
        hospitals={hospitals}
        regions={regions}
        departments={departments}
        initialSido={sido}
        initialRegion={region}
        initialDong={dong}
        initialDept={dept}
        initialSort={sort}
      />
    </>
  );
}
