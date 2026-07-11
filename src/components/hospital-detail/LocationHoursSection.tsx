import type { Hospital } from "@/types";

// 위치 · 진료시간 섹션 — 진료시간 정보 없으면 렌더하지 않음
export function LocationHoursSection({ hospital }: { hospital: Hospital }) {
  if (!hospital.hours) return null;
  return (
    <section className="py-5 bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
      <div className="container-page">
        <h2 className="text-base font-medium mb-3">위치 · 진료시간</h2>
        <div className="bg-[var(--color-surface-border)] h-24 rounded-md flex items-center justify-center mb-3">
          <span className="text-xs text-[var(--color-text-muted)]">📍 지도</span>
        </div>
        <p className="text-sm">{hospital.addressLine}</p>
        <table className="w-full text-xs mt-3">
          <tbody>
            <tr>
              <td className="text-[var(--color-text-muted)] py-1">평일</td>
              <td className="text-right py-1">{hospital.hours.weekday}</td>
            </tr>
            {hospital.hours.saturday && (
              <tr>
                <td className="text-[var(--color-text-muted)] py-1">토요일</td>
                <td className="text-right py-1">{hospital.hours.saturday}</td>
              </tr>
            )}
            {hospital.hours.sunday && (
              <tr>
                <td className="text-[var(--color-text-muted)] py-1">일/공휴일</td>
                <td className="text-right py-1 text-[var(--color-danger)]">
                  {hospital.hours.sunday}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
