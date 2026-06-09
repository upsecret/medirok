import Link from "next/link";
import { getRegionsByLevel } from "@/lib/hospitals-data";

export const metadata = {
  title: "병원찾기",
  description: "메디록 4단계 인증 병원을 지역·진료과별로 찾아보세요.",
};

export default async function HospitalsIndex() {
  const sidos = await getRegionsByLevel("sido");

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › 병원찾기
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-page">
          <h1>지역으로 병원 찾기</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            먼저 지역을 선택하세요. 시·군·구를 고르면 해당 지역의 전체 진료과를
            볼 수 있습니다.
          </p>

          <p className="text-[10px] tracking-[0.08em] text-[var(--color-text-muted)] uppercase mt-6 mb-2.5">
            시 / 도
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {sidos.map((s) => (
              <Link
                key={s.slug}
                href={`/hospitals/${s.slug}`}
                className="bg-white rounded-md py-4 text-center border border-[var(--color-surface-border)] hover:border-[var(--color-accent-400)] transition"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {s.nameKr}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
