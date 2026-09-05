import type { Hospital } from "@/types";

// 의료진 섹션 — 의사 없으면 렌더하지 않음
export function DoctorsSection({ hospital }: { hospital: Hospital }) {
  if (hospital.doctors.length === 0) return null;
  return (
    <section className="section-space bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <p className="eyebrow">MEDICAL TEAM</p>
        <h2 className="mb-6 mt-2">의료진 ({hospital.doctorCount}명)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {hospital.doctors.map((d) => (
            <div
              key={d.slug}
              className="rounded-xl border border-[var(--color-surface-border)] bg-white p-5"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-700)]">
                <span className="text-lg font-medium text-[var(--color-accent-300)]">
                  {d.nameKr[0]}
                </span>
              </div>
              <p className="text-lg font-semibold">{d.nameKr}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{d.title}</p>
              {d.specialty && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-accent-700)]">
                  {d.specialty}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
