// TIER 1 — 醫錄 큐레이션 카드 (매거진 톤)

import Link from "next/link";
import type { Route } from "next";
import type { Hospital } from "@/types";
import { departments } from "@/lib/data";

interface CurationCardProps {
  hospital: Hospital;
  size?: "lg" | "sm";
}

export function CurationCard({ hospital, size = "lg" }: CurationCardProps) {
  const dept = departments.find((d) => d.slug === hospital.departmentSlug);
  const isLarge = size === "lg";

  return (
    <article className="tier1-card p-5 md:p-6 relative">
      <span className="absolute top-4 right-4 hanja text-[10px] font-medium tracking-[0.06em] px-2.5 py-1 rounded-full bg-[var(--color-primary-600)] text-[var(--color-accent-400)]">
        CURATION
      </span>

      <div className={`grid ${isLarge ? "grid-cols-[80px_1fr]" : "grid-cols-1"} gap-4 items-start`}>
        {isLarge && (
          <div className="w-20 h-20 bg-[var(--color-primary-600)] rounded-lg flex items-center justify-center">
            <span className="hanja text-[var(--color-accent-400)] text-4xl">
              {dept?.hanja}
            </span>
          </div>
        )}
        <div>
          <p className="editorial text-xs tracking-[0.1em] text-[var(--color-accent-600)]">
            {dept?.hanja} · {dept?.nameEn?.toUpperCase()}
          </p>
          <h3 className={`editorial mt-1.5 ${isLarge ? "text-xl" : "text-base"} text-[var(--color-text-primary)]`}>
            {hospital.nameKr}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            {hospital.yearEstablished && `${new Date().getFullYear() - hospital.yearEstablished}년차 · `}
            {hospital.certification?.stage1Detail}
          </p>
        </div>
      </div>

      {hospital.curationNote && (
        <div className="mt-4 pt-4 border-t border-[var(--color-surface-border)]">
          <p className="editorial text-[10px] tracking-[0.08em] text-[var(--color-accent-600)] mb-1.5">
            CURATOR&apos;S NOTE
          </p>
          <p className="editorial italic text-[var(--color-text-primary)] text-sm leading-relaxed">
            &ldquo;{hospital.curationNote.text}&rdquo;
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2 tracking-[0.04em]">
            — <span className="hanja">醫錄</span> 큐레이터 {hospital.curationNote.curatorName}
            {hospital.curationNote.curatorTitle && ` (${hospital.curationNote.curatorTitle})`}
          </p>
        </div>
      )}

      {isLarge && (
        <div className="mt-4 flex justify-between items-center gap-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            ★ {hospital.rating} ({hospital.reviewCount})
          </p>
          <div className="flex gap-2">
            <Link
              href={`/hospital/${hospital.slug}/booking` as Route}
              className="btn-accent text-xs tracking-wide"
            >
              CURATION 예약
            </Link>
            <Link
              href={`/hospital/${hospital.slug}`}
              className="btn-outline text-xs"
            >
              상세 보기
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
