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
    <section className="bg-[var(--color-primary-600)] py-6 md:py-7 px-5 md:px-7 rounded-lg">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <p className="editorial text-[10px] tracking-[0.08em] text-[var(--color-accent-400)]">
            MEDIROK CERTIFICATION
          </p>
          <h3 className="text-base md:text-lg font-medium text-white mt-1">
            메디록 4단계 의원 인증
          </h3>
        </div>
        <span className="text-xs text-[var(--color-accent-300)]">{cert.certifiedAt} 완료</span>
      </div>
      <div className={`grid ${compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"} gap-2`}>
        {stages.map((stage, i) => (
          <div
            key={stage.num}
            className="bg-[var(--color-primary-700)] border border-[var(--color-accent-400)] rounded-md p-3"
          >
            <span className="editorial text-[var(--color-accent-400)] text-sm font-medium tracking-wider">
              {stage.num}
            </span>
            <p className="text-[11px] font-medium text-white mt-1.5">{stage.labelKr}</p>
            <p className="text-[10px] text-[var(--color-accent-300)] mt-1 leading-relaxed">
              {details[i]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
