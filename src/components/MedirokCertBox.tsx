import type { MedirokCertification } from "@/types";

interface MedirokCertBoxProps {
  cert: MedirokCertification;
  compact?: boolean;
}

const stages = [
  { num: "01", labelKr: "진료 이력" },
  { num: "02", labelKr: "실방문 후기" },
  { num: "03", labelKr: "의료진" },
  { num: "04", labelKr: "시설·장비" },
];

export function MedirokCertBox({ cert, compact = false }: MedirokCertBoxProps) {
  const details = [cert.stage1Detail, cert.stage2Detail, cert.stage3Detail, cert.stage4Detail];

  return (
    <section className="rounded-2xl bg-[var(--color-primary-800)] px-5 py-7 md:px-8 md:py-9">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow !text-[var(--color-accent-300)]">
            MEDIROK CERTIFICATION
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">
            이 병원에서 확인한 4가지 기준
          </h3>
        </div>
        <span className="text-sm text-[var(--color-primary-300)]">{cert.certifiedAt} 확인 완료</span>
      </div>
      <div className={`grid ${compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"} gap-3`}>
        {stages.map((stage, i) => (
          <div
            key={stage.num}
            className="rounded-xl border border-white/15 bg-white/5 p-4"
          >
            <span className="editorial text-lg font-medium text-[var(--color-accent-300)]">
              {stage.num}
            </span>
            <p className="mt-2 text-base font-semibold text-white">{stage.labelKr}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-primary-200)]">
              {details[i]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
