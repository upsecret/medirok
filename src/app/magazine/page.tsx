import Link from "next/link";
import type { Route } from "next";
import { loadMagazines } from "@/lib/storage";
import { MagazineCard } from "@/components/MagazineCard";

export const metadata = {
  title: "메디록 매거진 · 醫錄",
  description:
    "醫錄 큐레이션 의원이 직접 답하는 시니어 의료 가이드. 시술 가이드·Q&A·지역 비교·의원 인터뷰·실제 케이스.",
};

const TYPE_TABS = [
  { type: "all", label: "전체" },
  { type: "article", label: "시술 가이드" },
  { type: "qna", label: "Q&A" },
  { type: "regional", label: "지역 가이드" },
  { type: "interview", label: "의원 인터뷰" },
  { type: "case", label: "케이스" },
] as const;

export default async function MagazineListPage() {
  const all = await loadMagazines();
  const recent = [...all]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <>
      <section className="bg-[var(--color-primary-600)] py-8 md:py-10">
        <div className="container-content">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-400)]">
            MEDIROK MAGAZINE · <span className="hanja">醫錄</span>
          </p>
          <h1 className="editorial text-white mt-2">
            의료의 기록 · <span className="hanja">醫錄</span> 매거진
          </h1>
          <p className="text-[var(--color-accent-300)] text-sm mt-3 leading-relaxed max-w-xl">
            <span className="hanja">醫錄</span> 큐레이션 의원이 직접 답하는 의료 가이드.
            치과·산부인과·피부과·정형·안과·내과·검진. 광고가 아닌 신뢰 기반.
          </p>
        </div>
      </section>

      <section className="bg-white py-3 border-b border-[var(--color-surface-border)] sticky top-[57px] z-30">
        <div className="container-content flex gap-2 overflow-x-auto">
          {TYPE_TABS.map((t) => (
            <Link
              key={t.type}
              href={(t.type === "all" ? "/magazine" : `/magazine/category/${t.type}`) as Route}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                t.type === "all"
                  ? "bg-[var(--color-primary-600)] text-white"
                  : "bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-6 border-b border-[var(--color-surface-border)]">
        <div className="container-content">
          <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-3">
            최신 글
          </p>
          <div className="space-y-3">
            {recent.map((m) => (
              <MagazineCard key={m.slug} magazine={m} size="lg" />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="container-content">
          <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-3">
            전체 매거진 ({all.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {all.map((m) => (
              <MagazineCard key={m.slug} magazine={m} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
