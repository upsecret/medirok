import Link from "next/link";
import type { Route } from "next";
import { getAllMagazines } from "@/lib/magazines-data";
import { MagazineCard } from "@/components/MagazineCard";

// 시드는 즉시 라이브라 캐시를 안 쓰고 있었다. 이제 ISR로 두고 발행 직후 반영은
// /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts · 런북 §9-3).
export const revalidate = 1800;

export const metadata = {
  title: "메디록 매거진 · 메디록",
  description:
    "메디록 큐레이션 의원이 직접 답하는 시니어 의료 가이드. 시술 가이드·지역 비교·의원 인터뷰·실제 케이스.",
};

const TYPE_TABS = [
  { type: "all", label: "전체" },
  { type: "article", label: "시술 가이드" },
  { type: "regional", label: "지역 가이드" },
  { type: "interview", label: "의원 인터뷰" },
  { type: "case", label: "케이스" },
] as const;

export default async function MagazineListPage() {
  const all = (await getAllMagazines()).filter((m) => m.type !== "qna");
  const recent = [...all]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <>
      <section className="bg-[var(--color-primary-800)] py-14 md:py-20">
        <div className="container-page">
          <p className="eyebrow !text-[var(--color-accent-300)]">
            MEDIROK MAGAZINE · 메디록
          </p>
          <h1 className="editorial mt-4 text-white">
            병원 선택 전 읽어볼 의료 가이드
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-200)]">
            시술 이름보다 선택 기준을 먼저 설명합니다. 의료진과 편집팀이 확인한 정보를
            읽기 편한 언어로 정리했습니다.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-[var(--color-surface-border)] bg-white/95 py-4 backdrop-blur-md">
        <div className="container-page flex gap-2 overflow-x-auto">
          {TYPE_TABS.map((t) => (
            <Link
              key={t.type}
              href={(t.type === "all" ? "/magazine" : `/magazine/category/${t.type}`) as Route}
              className={`min-h-11 inline-flex items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
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

      <section className="section-space border-b border-[var(--color-surface-border)] bg-[var(--color-surface-bg)]">
        <div className="container-page">
          <p className="eyebrow mb-3">LATEST STORIES</p>
          <h2 className="editorial mb-7">최근 발행한 글</h2>
          <div className="space-y-5">
            {/* 첫 카드가 이 페이지의 LCP 요소다. Thumbnail 기본값이 lazy라
                프리로드 스캐너가 잡지 못하고 레이아웃 확정 후에야 요청이 시작됐다. */}
            {recent.map((m, i) => (
              <MagazineCard key={m.slug} magazine={m} size="lg" priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container-page">
          <h2 className="editorial mb-7">전체 매거진 <span className="font-sans text-base text-[var(--color-text-muted)]">{all.length}편</span></h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {all.map((m) => (
              <MagazineCard key={m.slug} magazine={m} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
