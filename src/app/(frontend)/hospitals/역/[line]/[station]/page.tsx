import { notFound } from "next/navigation";
import Link from "next/link";
import { HospitalCard } from "@/components/HospitalCard";
import { getAllHospitals, decodeParam } from "@/lib/hospitals-data";
import { findStation } from "@/lib/stations";

// 이 라우트만 동적으로 남는다.
//
// generateStaticParams를 붙이면 프리렌더가 InvalidCharacterError로 깨진다
// (/hospitals/역/인천지하철1호선/아라역). 세그먼트에 **리터럴 한글 디렉터리(역/)**가
// 있는 라우트는 이 프로젝트에서 이미 알려진 문제다 — docs/e2e-test-plan.md의
// "역 페이지 404(정적 한글 세그먼트 라우팅)" 항목과 같은 뿌리로 보인다.
// 그 버그를 먼저 고쳐야 캐시를 켤 수 있다. 지금은 캐시 없이 동적 렌더 —
// 이전과 동일한 동작이다.
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ line: string; station: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { line, station } = await params;
  const found = findStation(decodeParam(line), decodeParam(station));
  if (!found) return {};
  return {
    title: `${found.station.name} 인근 메디록 인증 병원 | ${found.line.lineName}`,
    description: `${found.line.lineName} ${found.station.name} 주변 메디록 4단계 인증 병원. 평점·가격·후기를 비교하세요.`,
  };
}

export default async function StationHospitalsPage({ params }: PageProps) {
  const { line, station } = await params;
  const found = findStation(decodeParam(line), decodeParam(station));
  if (!found) notFound();

  const { line: subwayLine, station: subwayStation } = found;
  const hospitals = (await getAllHospitals()).filter(
    (h) => h.nearestStationName === subwayStation.name
  );

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › <Link href="/hospitals">병원찾기</Link> › 역주변 ›{" "}
          {subwayLine.lineName} › {subwayStation.name}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-6">
        <div className="container-page">
          <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
            {subwayLine.lineName} · 역주변
          </span>
          <h1>{subwayStation.name} 인근 병원</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            {subwayLine.lineName} {subwayStation.name} 주변의 메디록 4단계 인증
            병원입니다.
          </p>
        </div>
      </section>

      <section className="bg-white py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-base font-medium">
              메디록 인증 병원 ({hospitals.length})
            </h2>
          </div>
          {hospitals.length > 0 ? (
            <div className="space-y-2">
              {hospitals.map((h) => (
                <HospitalCard key={h.slug} hospital={h} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              {subwayStation.name} 인근에 등록된 메디록 인증 병원이 아직 없습니다.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
