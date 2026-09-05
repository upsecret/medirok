import type { Hospital } from "@/types";

// 위치 · 진료시간 섹션 — 진료시간 정보 없으면 렌더하지 않음
export function LocationHoursSection({ hospital }: { hospital: Hospital }) {
  if (!hospital.hours) return null;
  const mapHref = `https://map.naver.com/p/search/${encodeURIComponent(
    `${hospital.nameKr} ${hospital.addressLine}`
  )}`;
  return (
    <section className="section-space bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2>위치 · 진료시간</h2>
          <a href={mapHref} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--color-accent-700)]">지도에서 보기 →</a>
        </div>
        <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mb-5 flex min-h-32 items-center justify-center rounded-2xl border border-[var(--color-surface-border)] bg-white text-base font-semibold text-[var(--color-primary-700)]">
          📍 {hospital.addressLine}
        </a>
        <table className="w-full overflow-hidden rounded-xl bg-white text-sm">
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
