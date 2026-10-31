// TIER 2 — 일반 의원 디렉터리 카드 (정보 톤)

import Link from "next/link";
import type { Hospital } from "@/types";
import { formatKRW, hasRatingAggregate } from "@/lib/format";
import { getDepartmentBySlug } from "@/lib/hospitals-data";
import { HospitalImage } from "./HospitalImage";

interface HospitalCardProps {
  hospital: Hospital;
  showPrice?: boolean;
}

export async function HospitalCard({ hospital, showPrice = true }: HospitalCardProps) {
  const dept = await getDepartmentBySlug(hospital.departmentSlug);
  const isPremium = hospital.tier === "PREMIUM";
  const mainPrice = hospital.prices[0];

  return (
    <Link
      href={`/hospital/${hospital.slug}`}
      className={`group block tier2-card card-lift overflow-hidden ${isPremium ? "border-[var(--color-accent-400)]" : ""}`}
    >
      <div className="grid grid-cols-[112px_1fr] md:grid-cols-[160px_1fr]">
        <HospitalImage hospital={hospital} className="h-full min-h-[150px]" />
        <div className="min-w-0 p-4 md:p-5">
          {(isPremium || hospital.certification?.stage4Facility) && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-700)] px-2.5 py-1 text-xs font-semibold text-white">
                <span className="hanja">醫錄</span> 인증
              </span>
            </div>
          )}
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {hospital.nameKr}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {dept?.nameKr} · {hospital.addressLine.split(" ").slice(0, 3).join(" ")}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
            {hasRatingAggregate(hospital.rating, hospital.reviewCount) ? (
              <>
                <span className="text-[var(--color-warning)]">★</span> {hospital.rating} · 후기{" "}
                {hospital.reviewCount}개
              </>
            ) : (
              <span className="text-[var(--color-text-muted)]">후기 집계 전</span>
            )}
          </p>
          {showPrice && mainPrice && (
          <div className="mt-3 flex items-baseline gap-2">
            {mainPrice.eventLow && (
              <p className="text-xs text-[var(--color-text-muted)] line-through">
                {formatKRW(mainPrice.normalLow)}~
              </p>
            )}
            <p className="text-base font-semibold text-[var(--color-primary-700)]">
              {formatKRW(mainPrice.eventLow ?? mainPrice.normalLow)}~
            </p>
          </div>
          )}
        </div>
      </div>

      {hospital.tags && hospital.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-surface-divider)] px-4 py-3 md:px-5">
          {hospital.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs text-[var(--color-text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
