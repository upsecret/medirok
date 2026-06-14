import { notFound } from "next/navigation";
import Link from "next/link";
import { HospitalCard } from "@/components/HospitalCard";
import { getAllHospitals } from "@/lib/hospitals-data";
import { findStation } from "@/lib/stations";

interface PageProps {
  params: Promise<{ line: string; station: string }>;
}

function decode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { line, station } = await params;
  const found = findStation(decode(line), decode(station));
  if (!found) return {};
  return {
    title: `${found.station.name} 인근 메디록 인증 병원 | ${found.line.lineName}`,
    description: `${found.line.lineName} ${found.station.name} 주변 메디록 4단계 인증 병원. 평점·가격·후기를 비교하세요.`,
  };
}

export default async function StationHospitalsPage({ params }: PageProps) {
  const { line, station } = await params;
  const found = findStation(decode(line), decode(station));
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
