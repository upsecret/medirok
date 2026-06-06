// FAQ 블록 - FAQPage schema와 함께 렌더링

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqBlockProps {
  faqs: FaqItem[];
  title?: string;
}

export function FaqBlock({ faqs, title = "자주 묻는 질문" }: FaqBlockProps) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="my-8" aria-label={title}>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="bg-white rounded-md border border-[var(--color-surface-border)] p-4 group"
            open={i === 0}
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
