import { Suspense } from "react";
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

// 필터는 전부 클라이언트에서 처리한다. 서버에서 searchParams를 읽으면 라우트가
// 동적이 되어 CDN 캐시를 못 쓴다 — HospitalFinder가 useSearchParams로 직접 읽는다.
export const revalidate = 1800;

export default async function HospitalsPage() {
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

      {/* useSearchParams는 Suspense 경계가 있어야 정적 셸을 유지한 채 쓸 수 있다 */}
      <Suspense fallback={null}>
        <HospitalFinder
          hospitals={hospitals}
          regions={regions}
          departments={departments}
        />
      </Suspense>
    </>
  );
}
