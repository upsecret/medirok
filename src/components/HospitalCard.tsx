// TIER 2 — 일반 의원 디렉터리 카드 (정보 톤)

import Link from "next/link";
import type { Hospital } from "@/types";
import { formatKRW } from "@/lib/data";
import { getDepartmentBySlug } from "@/lib/hospitals-data";
import { DepartmentIcon } from "./DepartmentIcon";

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
      className={`block tier2-card p-3 ${isPremium ? "border-[var(--color-accent-400)] border-[1.5px]" : ""}`}
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-[var(--color-surface-border)] rounded-md shrink-0 flex items-center justify-center">
          {dept && (
            <DepartmentIcon
              slug={dept.slug}
              size={32}
              className="text-[var(--color-primary-600)]"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {isPremium && <span className="badge-premium">PREMIUM</span>}
            {hospital.certification?.stage4Facility && (
              <span className="badge-certified">메디록 4단계</span>
            )}
          </div>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            {hospital.nameKr}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            ★ {hospital.rating} ({hospital.reviewCount}) ·{" "}
            {hospital.addressLine.split(" ").slice(1, 3).join(" ")}
          </p>
          {hospital.monthlyVisitors && (
            <p className="text-[10px] text-[var(--color-success)] mt-1">
              한 달간 메디록을 통해 {hospital.monthlyVisitors}명 방문완료
            </p>
          )}
        </div>
        {showPrice && mainPrice && (
          <div className="text-right shrink-0">
            {mainPrice.eventLow && (
              <p className="text-[10px] text-[var(--color-text-muted)] line-through">
                {formatKRW(mainPrice.normalLow)}~
              </p>
            )}
            <p className="text-sm font-medium text-[var(--color-primary-600)]">
              {formatKRW(mainPrice.eventLow ?? mainPrice.normalLow)}~
            </p>
          </div>
        )}
      </div>

      {hospital.tags && hospital.tags.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-[var(--color-surface-divider)] flex flex-wrap gap-1">
          {hospital.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] text-[var(--color-text-muted)]">
              · {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
