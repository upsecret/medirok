import Link from "next/link";
import type { Route } from "next";
import type { Region } from "@/types";

// 동(洞) 필터 칩 — "전체" + 동별 ?dong= 링크
export function DongFilterChips({
  dongs,
  base,
  activeDong,
}: {
  dongs: Region[];
  base: string;
  activeDong?: string;
}) {
  if (dongs.length === 0) return null;
  return (
    <div className="mt-4 flex gap-2 flex-wrap">
      <span className="text-xs text-[var(--color-text-muted)] py-1.5">동:</span>
      <Link
        href={base as Route}
        className={`text-xs px-3 py-1.5 rounded-full border ${
          !activeDong
            ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
            : "bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
        }`}
      >
        전체
      </Link>
      {dongs.map((d) => (
        <Link
          key={d.slug}
          href={`${base}?dong=${d.slug}` as Route}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            activeDong === d.slug
              ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
              : "bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
          }`}
        >
          {d.nameKr}
        </Link>
      ))}
    </div>
  );
}
