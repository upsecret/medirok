// AEO 핵심 - LLM이 추출할 핵심 답변 박스
// 페이지 상단에 노출하여 사용자/AI 모두에게 핵심 정보 제공

interface ShortAnswerBlockProps {
  answer: string;
  authorName?: string;
  authorTitle?: string;
}

export function ShortAnswerBlock({ answer, authorName, authorTitle }: ShortAnswerBlockProps) {
  return (
    <aside
      className="bg-[var(--color-primary-600)] rounded-lg p-5 md:p-6 my-6"
      role="region"
      aria-label="핵심 답변"
    >
      <p className="editorial text-[10px] tracking-[0.1em] uppercase text-[var(--color-accent-400)] mb-2">
        메디록 · 핵심 답변
      </p>
      <p className="text-white text-base md:text-lg leading-relaxed">
        {answer}
      </p>
      {authorName && (
        <p className="text-[var(--color-accent-300)] text-xs mt-3">
          — {authorName}
          {authorTitle && ` (${authorTitle})`}
        </p>
      )}
    </aside>
  );
}
