// 의료법 광고심의 안전 disclaimer 자동 주입 컴포넌트

interface MedicalDisclaimerProps {
  type: "general" | "case" | "price" | "qna";
}

const TEXTS: Record<MedicalDisclaimerProps["type"], string> = {
  general:
    "본 콘텐츠는 일반 의학 정보이며, 개별 진단이나 처방을 대체하지 않습니다. 시술 결정 전 반드시 의료진과 상담하시기 바랍니다.",
  case:
    "본 사례는 환자·의원 동의 하에 게시되었으며, 동일 시술 시 결과가 다를 수 있습니다. 모든 의료 행위에는 예상치 못한 결과가 발생할 수 있으며, 시술 결정은 의료진 상담 후 진행하시기 바랍니다.",
  price:
    "본 가격 정보는 의원이 제공한 자료를 기반으로 하며, 개인의 상태·치료 범위에 따라 달라질 수 있습니다. 정확한 견적은 의원 상담을 통해 확인하세요. 본 정보는 의료광고가 아닌 정보 제공 목적입니다.",
  qna:
    "본 답변은 일반적인 의학 정보 제공이며, 개별 진단이 아닙니다. 증상이 있으시면 반드시 의료진의 진료를 받으시기 바랍니다.",
};

const LABELS: Record<MedicalDisclaimerProps["type"], string> = {
  general: "의료정보 안내",
  case: "케이스 게재 동의 및 안내",
  price: "가격정보 안내",
  qna: "Q&A 의료정보 안내",
};

export function MedicalDisclaimer({ type }: MedicalDisclaimerProps) {
  return (
    <aside
      className="mt-8 p-4 bg-[var(--color-surface-bg2)] border-l-2 border-[var(--color-accent-400)] rounded-r-md"
      role="note"
    >
      <p className="text-[10px] font-medium text-[var(--color-accent-600)] tracking-wider uppercase mb-1.5">
        ⚖ {LABELS[type]}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {TEXTS[type]}
      </p>
    </aside>
  );
}
