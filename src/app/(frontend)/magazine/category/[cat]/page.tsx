import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import type { MagazineType } from "@/lib/magazines";
import { getMagazinesByType } from "@/lib/magazines-data";
import { MagazineCard } from "@/components/MagazineCard";

const CAT_LABELS: Partial<Record<MagazineType, string>> = {
  article: "시술 가이드",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

interface PageProps {
  params: Promise<{ cat: string }>;
}

export async function generateStaticParams() {
  return (Object.keys(CAT_LABELS) as MagazineType[]).map((cat) => ({ cat }));
}

export async function generateMetadata({ params }: PageProps) {
  const { cat } = await params;
  const label = CAT_LABELS[cat as MagazineType];
  if (!label) return {};
  return {
    title: `${label} · 메디록 매거진`,
    description: `메디록 메디록 매거진 ${label} 카테고리`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { cat } = await params;
  const label = CAT_LABELS[cat as MagazineType];
  if (!label) notFound();
  const items = await getMagazinesByType(cat as MagazineType);

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-content text-xs text-[var(--color-text-muted)]">
          <Link href="/magazine">매거진</Link> › {label}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-7">
        <div className="container-content">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)] mb-1">
            메디록 MAGAZINE
          </p>
          <h1>{label}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {items.length}편의 글
          </p>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="container-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((m) => (
              <MagazineCard key={m.slug} magazine={m} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              아직 발행된 글이 없습니다.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
