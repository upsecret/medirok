import { formatKRW } from "@/lib/format";
import type { Hospital } from "@/types";

// 진료 / 가격 섹션 — 가격 미공개 시 진료문의 CTA
export function PriceSection({ hospital }: { hospital: Hospital }) {
  return (
    <section className="py-5 bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-base font-medium">진료 / 가격</h2>
          {hospital.prices.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">전체 보기 →</span>
          )}
        </div>
        {hospital.prices.length === 0 ? (
          <div className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-5 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              공개된 진료 가격 정보가 아직 없습니다.
            </p>
            {/* 전화번호가 없으면 안내만 한다. 예전엔 /estimate(견적 폼)로 보냈으나
                그 동선은 환자용이 아니라 병원 대상 인증제 신청으로 바뀌었다. */}
            {hospital.phone ? (
              <a
                href={`tel:${hospital.phone.replace(/[^0-9+]/g, "")}`}
                className="inline-block mt-3 bg-[var(--color-primary-600)] text-white text-sm font-medium px-5 py-2.5 rounded-md"
              >
                📞 진료문의하기
              </a>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                진료 문의는 의원에 직접 확인해 주세요.
              </p>
            )}
          </div>
        ) : (
        <div className="space-y-3">
          {hospital.prices.map((p, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-3"
            >
              <p className="text-sm font-medium">
                {p.treatmentName}
                {p.treatmentNote && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-2 font-normal">
                    {p.treatmentNote}
                  </span>
                )}
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
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
                    <span className="text-[var(--color-text-muted)]">{p.insuranceNote}</span>
                    <span className="text-[var(--color-text-muted)]">로그인 후 확인</span>
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
