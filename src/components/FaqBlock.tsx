// FAQ 블록 - FAQPage schema와 함께 렌더링
// 매거진 상세·지역×진료과 페이지에서 공용 (h2 텍스트는 e2e가 검증하는 계약)

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqBlockProps {
  faqs: FaqItem[];
  title?: string;
  /** 첫 항목을 펼친 상태로 렌더 (매거진 기본값). 지역 페이지는 false */
  defaultOpenFirst?: boolean;
  /** 바깥 여백 — 페이지 컨텍스트에 맞게 조정 */
  className?: string;
}

export function FaqBlock({
  faqs,
  title = "자주 묻는 질문",
  defaultOpenFirst = true,
  className = "my-8",
}: FaqBlockProps) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className={className} aria-label={title}>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="bg-white rounded-md border border-[var(--color-surface-border)] p-4 group"
            open={defaultOpenFirst && i === 0}
          >
            <summary className="text-sm font-medium cursor-pointer flex justify-between items-center">
              <span>Q. {f.question}</span>
              <span className="text-[var(--color-text-muted)] group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
