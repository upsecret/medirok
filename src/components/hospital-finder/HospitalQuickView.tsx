"use client";

// 병원 퀵뷰 모달 — 리스트에서 카드 클릭 시 요약 표시 + 상세 이동

import Link from "next/link";
import { useEffect } from "react";
import type { Hospital } from "@/types";
import { formatKRW } from "@/lib/format";
import { DepartmentIcon } from "@/components/DepartmentIcon";

interface Props {
  hospital: Hospital;
  deptName?: string;
  onClose: () => void;
}

export function HospitalQuickView({ hospital: h, deptName, onClose }: Props) {
  const isPremium = h.tier === "PREMIUM" || h.tier === "HERITAGE";
  const region = h.addressLine.split(" ").slice(1, 3).join(" ");

  // 모달 열림 동안 배경 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-[var(--color-surface-divider)] flex items-start gap-3">
          <div className="w-12 h-12 bg-[var(--color-surface-bg2)] rounded-md shrink-0 flex items-center justify-center">
            <DepartmentIcon
              slug={h.departmentSlug}
              size={26}
              className="text-[var(--color-primary-600)]"
            />
          </div>
          <div className="flex-1 min-w-0">
            {(isPremium || h.certification?.stage4Facility) && (
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-primary-600)] text-white">
                  <span className="hanja">醫錄</span> 인증
                </span>
              </div>
            )}
            <h2 className="text-base font-medium leading-tight">{h.nameKr}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {deptName}
              {region && ` · ${region}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--color-text-muted)] text-2xl leading-none px-1 shrink-0"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {h.shortDescription && (
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {h.shortDescription}
            </p>
          )}

          {/* 핵심 지표 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat
              label="평점"
              value={
                <>
                  <span className="text-[var(--color-warning)]">★</span>{" "}
                  {h.rating}
                </>
              }
              sub={`리뷰 ${h.reviewCount}`}
            />
            <Stat label="의료진" value={`${h.doctorCount}명`} />
            {h.monthlyVisitors ? (
              <Stat
                label="월 방문"
                value={`${h.monthlyVisitors}명`}
                sub="메디록 경유"
              />
            ) : h.yearEstablished ? (
              <Stat label="설립" value={`${h.yearEstablished}년`} />
            ) : (
              <Stat label="진료과" value={deptName ?? "-"} />
            )}
          </div>

          {/* 정보 행 */}
          <div className="space-y-1.5 text-sm">
            <InfoRow label="주소" value={h.addressLine} />
            {h.nearestStation && (
              <InfoRow
                label="교통"
                value={`${h.nearestStation}${
                  h.walkingMinutes ? ` 도보 ${h.walkingMinutes}분` : ""
                }`}
              />
            )}
            {h.hours?.weekday && (
              <InfoRow label="진료시간" value={h.hours.weekday} />
            )}
            {h.phone && <InfoRow label="전화" value={h.phone} />}
          </div>

          {/* 가격 */}
          {h.prices.length > 0 && (
            <div className="border-t border-[var(--color-surface-divider)] pt-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1.5">
                주요 진료비
              </p>
              <div className="space-y-1">
                {h.prices.slice(0, 3).map((p) => (
                  <div
                    key={p.treatmentName}
                    className="flex items-baseline justify-between text-sm"
                  >
                    <span className="text-[var(--color-text-secondary)]">
                      {p.treatmentName}
                    </span>
                    <span className="font-medium text-[var(--color-primary-600)]">
                      {p.eventLow && (
                        <span className="text-[11px] text-[var(--color-text-muted)] line-through mr-1">
                          {formatKRW(p.normalLow)}
                        </span>
                      )}
                      {formatKRW(p.eventLow ?? p.normalLow)}~
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 태그 */}
          {h.tags && h.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {h.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface-bg2)] px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 CTA */}
        <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-[var(--color-surface-divider)] flex gap-2">
          {h.phone && (
            <a
              href={`tel:${h.phone}`}
              className="btn-outline flex-1 text-center"
            >
              전화
            </a>
          )}
          <Link
            href={`/hospital/${h.slug}`}
            className="btn-primary flex-1 text-center"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-[var(--color-surface-bg)] rounded-md py-2">
      <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">
        {value}
      </p>
      {sub && (
        <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[var(--color-text-muted)] shrink-0 w-14 text-xs pt-0.5">
        {label}
      </span>
      <span className="text-[var(--color-text-secondary)] flex-1">{value}</span>
    </div>
  );
}
