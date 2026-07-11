import type { Hospital } from "@/types";

// 의료진 섹션 — 의사 없으면 렌더하지 않음
export function DoctorsSection({ hospital }: { hospital: Hospital }) {
  if (hospital.doctors.length === 0) return null;
  return (
    <section className="py-5 bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
      <div className="container-page">
        <h2 className="text-base font-medium mb-3">의료진 ({hospital.doctorCount}명)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {hospital.doctors.map((d) => (
            <div
              key={d.slug}
              className="bg-white rounded-md border border-[var(--color-surface-border)] p-3 text-center"
            >
              <div className="w-12 h-12 bg-[var(--color-primary-600)] rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-[var(--color-accent-400)] text-base font-medium">
                  {d.nameKr[0]}
                </span>
              </div>
              <p className="text-xs font-medium">{d.nameKr}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{d.title}</p>
              {d.specialty && (
                <p className="text-[10px] text-[var(--color-accent-600)] font-medium mt-0.5 leading-tight">
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
