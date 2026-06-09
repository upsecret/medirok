"use client";

// GooDoc 스타일 세로 리스팅 행 — 클릭 시 퀵뷰 모달 오픈

import type { Hospital } from "@/types";
import { formatKRW } from "@/lib/data";
import { DepartmentIcon } from "@/components/DepartmentIcon";

interface Props {
  hospital: Hospital;
  deptName?: string;
  onSelect: (slug: string) => void;
}

export function HospitalListRow({ hospital: h, deptName, onSelect }: Props) {
  const isPremium = h.tier === "PREMIUM" || h.tier === "HERITAGE";
  const mainPrice = h.prices[0];
  const region = h.addressLine.split(" ").slice(1, 3).join(" ");

  return (
    <button
      type="button"
      onClick={() => onSelect(h.slug)}
      className={`w-full text-left flex gap-3 p-3.5 bg-white rounded-lg border transition-colors hover:bg-[var(--color-surface-bg)] ${
        isPremium
          ? "border-[var(--color-accent-400)] border-[1.5px]"
          : "border-[var(--color-surface-border)]"
      }`}
    >
      {/* 썸네일 */}
      <div className="w-[60px] h-[60px] bg-[var(--color-surface-bg2)] rounded-md shrink-0 flex items-center justify-center">
        <DepartmentIcon
          slug={h.departmentSlug}
          size={30}
          className="text-[var(--color-primary-600)]"
        />
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        {(isPremium || h.certification?.stage4Facility) && (
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-primary-600)] text-white">
              <span className="hanja">醫錄</span> 인증
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] leading-tight">
            {h.nameKr}
          </h3>
          {deptName && (
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {deptName}
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          <span className="text-[var(--color-warning)]">★</span> {h.rating}
          <span className="text-[var(--color-text-muted)]">
            {" "}
            ({h.reviewCount})
          </span>
          {region && <span> · {region}</span>}
        </p>

        {h.nearestStation && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            {h.nearestStation}
            {h.walkingMinutes ? ` 도보 ${h.walkingMinutes}분` : ""}
          </p>
        )}

        {h.tags && h.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {h.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-[var(--color-text-secondary)] bg-[var(--color-surface-bg2)] px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 가격 */}
      {mainPrice && (
        <div className="text-right shrink-0 self-center">
          {mainPrice.eventLow && (
            <p className="text-[10px] text-[var(--color-text-muted)] line-through">
              {formatKRW(mainPrice.normalLow)}~
            </p>
          )}
          <p className="text-sm font-medium text-[var(--color-primary-600)]">
            {formatKRW(mainPrice.eventLow ?? mainPrice.normalLow)}~
          </p>
          <span className="text-[10px] text-[var(--color-accent-700)]">
            자세히 ›
          </span>
        </div>
      )}
    </button>
  );
}
