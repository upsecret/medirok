import Link from "next/link";
import { getRegionsByLevel } from "@/lib/hospitals-data";

// 홈 — 지역(시/도)으로 병원 찾기 진입
export async function RegionQuickNav() {
  const sidos = (await getRegionsByLevel("sido"))
    .slice()
    .sort((a, b) => a.nameKr.localeCompare(b.nameKr, "ko"));

  return (
    <section className="bg-[var(--color-surface-bg)] py-5 border-y border-[var(--color-surface-border)]">
      <div className="container-page">
        <p className="text-[10px] tracking-[0.08em] text-[var(--color-text-muted)] uppercase mb-2.5">
          지역으로 찾기
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
          {sidos.map((s) => (
            <Link
              key={s.slug}
              href={`/hospitals/${s.slug}`}
              className="bg-white rounded-md py-2.5 text-center border border-[var(--color-surface-border)] hover:border-[var(--color-accent-400)] transition"
            >
              <p className="text-xs font-medium text-[var(--color-text-primary)]">
                {s.nameKr}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
