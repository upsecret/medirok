import { formatKRW } from "@/lib/format";
import type { Hospital } from "@/types";

// 진료 / 가격 섹션 — 가격 미공개 시 진료문의 CTA
export function PriceSection({ hospital }: { hospital: Hospital }) {
  return (
    <section className="section-space bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <div className="mb-6">
          <p className="eyebrow">TREATMENT & PRICE</p>
          <h2 className="mt-2">진료 · 가격 정보</h2>
        </div>
        {hospital.prices.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-8 text-center">
            <p className="text-base text-[var(--color-text-secondary)]">
              공개된 진료 가격 정보가 아직 없습니다.
            </p>
            {/* 전화번호가 없으면 안내만 한다. 예전엔 /estimate(견적 폼)로 보냈으나
                그 동선은 환자용이 아니라 병원 대상 인증제 신청으로 바뀌었다. */}
            {hospital.phone ? (
              <a
                href={`tel:${hospital.phone.replace(/[^0-9+]/g, "")}`}
                className="btn-primary mt-5 inline-flex items-center"
              >
                📞 진료문의하기
              </a>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                진료 문의는 의원에 직접 확인해 주세요.
              </p>
            )}
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hospital.prices.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-5"
            >
              <p className="text-base font-semibold">
                {p.treatmentName}
                {p.treatmentNote && (
                  <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                    {p.treatmentNote}
                  </span>
                )}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">정상가</span>
                  <span>
                    {formatKRW(p.normalLow)} ~ {formatKRW(p.normalHigh)}
                  </span>
                </div>
                {p.eventLow && p.eventHigh && (
                  <div className="flex justify-between pt-1.5 border-t border-[var(--color-surface-divider)]">
                    <span className="text-[var(--color-danger)] font-medium">이벤트가</span>
                    <span className="text-[var(--color-danger)] font-medium">
                      {formatKRW(p.eventLow)} ~ {formatKRW(p.eventHigh)}
                    </span>
                  </div>
                )}
                {p.insuranceNote && (
                  <div className="flex justify-between pt-1.5 border-t border-[var(--color-surface-divider)]">
                    <span className="text-[var(--color-text-muted)]">보험 안내</span>
                    <span className="text-right text-[var(--color-text-muted)]">{p.insuranceNote}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
