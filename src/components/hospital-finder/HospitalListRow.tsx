"use client";

import Link from "next/link";
import type { Hospital } from "@/types";
import { formatKRW } from "@/lib/format";
import { HospitalImage } from "@/components/HospitalImage";

interface Props {
  hospital: Hospital;
  deptName?: string;
  onSelect: (slug: string) => void;
}

export function HospitalListRow({ hospital: h, deptName, onSelect }: Props) {
  const mainPrice = h.prices[0];

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-white transition hover:border-[var(--color-accent-400)] hover:shadow-xl hover:shadow-black/5">
      <div className="grid sm:grid-cols-[220px_1fr]">
        <Link href={`/hospital/${h.slug}`} aria-label={`${h.nameKr} 상세 보기`}>
          <HospitalImage hospital={h} className="aspect-[16/9] sm:aspect-auto sm:h-full sm:min-h-[180px]" />
        </Link>
        <div className="flex min-w-0 flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              {h.certification && (
                <span className="inline-flex rounded-full bg-[var(--color-primary-700)] px-2.5 py-1 text-xs font-semibold text-white">
                  메디록 인증
                </span>
              )}
              <Link href={`/hospital/${h.slug}`}>
                <h3 className="mt-3 text-xl font-semibold hover:text-[var(--color-accent-700)]">{h.nameKr}</h3>
              </Link>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {deptName} · {h.addressLine.split(" ").slice(0, 3).join(" ")}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold">
              <span className="text-[var(--color-warning)]">★</span> {h.rating}
              <span className="font-normal text-[var(--color-text-muted)]"> ({h.reviewCount})</span>
            </p>
          </div>

          {h.shortDescription && (
            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {h.shortDescription}
            </p>
          )}
          {h.tags && h.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {h.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-[var(--color-surface-bg2)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {mainPrice ? (
                <>
                  <p className="text-xs text-[var(--color-text-muted)]">대표 진료 가격</p>
                  <p className="mt-0.5 font-semibold text-[var(--color-primary-700)]">
                    {formatKRW(mainPrice.eventLow ?? mainPrice.normalLow)}부터
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">가격 정보는 상세에서 확인</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => onSelect(h.slug)}
                className="min-h-11 whitespace-nowrap rounded-lg border border-[var(--color-surface-border)] px-4 text-sm font-semibold text-[var(--color-text-secondary)]"
              >
                빠른 보기
              </button>
              <Link href={`/hospital/${h.slug}`} className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[var(--color-primary-700)] px-4 text-sm font-semibold text-white">
                상세 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
