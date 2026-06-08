import Link from "next/link";
import type { Route } from "next";
import { loadHospitals } from "@/lib/storage";
import { getAllMagazines } from "@/lib/magazines-data";

export default async function DashboardHomePage() {
  const [hospitals, magazines] = await Promise.all([
    loadHospitals(),
    getAllMagazines(),
  ]);

  const premium = hospitals.filter((h) => h.tier === "PREMIUM").length;
  const totalReviews = hospitals.reduce((sum, h) => sum + (h.reviewCount ?? 0), 0);
  const recent = [...magazines]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-medium">대시보드</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">
        의원 정보를 관리하고 메디록 매거진을 작성하세요.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard label="등록 의원" value={hospitals.length} suffix="곳" />
        <StatCard label="PREMIUM 큐레이션" value={premium} suffix="곳" />
        <StatCard label="매거진" value={magazines.length} suffix="편" />
        <StatCard label="누적 리뷰" value={totalReviews.toLocaleString()} suffix="건" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <ActionCard
          href={"/dashboard/hospitals/new" as Route}
          title="의원 추가"
          description="신규 메디록 인증 의원을 등록합니다. 영업한 의원의 정보를 입력하세요."
        />
        <a
          href="/admin/collections/magazines/create"
          className="block bg-white border border-[var(--color-surface-border)] rounded-lg p-5 hover:border-[var(--color-accent-400)]"
        >
          <p className="text-base font-medium">매거진 작성</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
            Payload CMS(/admin)에서 SEO/AEO 매거진을 작성·관리합니다.
          </p>
          <p className="mt-3 text-xs text-[var(--color-accent-700)]">
            /admin 에서 작성 →
          </p>
        </a>
      </div>

      <section className="bg-white border border-[var(--color-surface-border)] rounded-lg p-5 mt-8">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-base font-medium">최근 매거진</h2>
          <a
            href="/admin/collections/magazines"
            className="text-xs text-[var(--color-accent-700)]"
          >
            /admin 에서 관리 →
          </a>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            아직 발행된 매거진이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((m) => (
              <li
                key={m.slug}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  href={`/magazine/${m.slug}` as Route}
                  className="flex-1 truncate hover:text-[var(--color-accent-700)]"
                >
                  {m.seoTitle}
                </Link>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {m.category} · {m.publishedAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="bg-white border border-[var(--color-surface-border)] rounded-lg p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="text-2xl font-medium mt-1">
        {value}
        {suffix && (
          <span className="text-sm text-[var(--color-text-muted)] ml-1">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: Route;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-[var(--color-surface-border)] rounded-lg p-5 hover:border-[var(--color-accent-400)]"
    >
      <p className="text-base font-medium">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
        {description}
      </p>
      <p className="mt-3 text-xs text-[var(--color-accent-700)]">시작하기 →</p>
    </Link>
  );
}
