// 매거진 본문 등 마크다운 → React 엘리먼트 렌더 (서버 컴포넌트)
// react-markdown + remark-gfm(표·인라인 강조·리스트·링크). raw HTML 비허용(기본값) → XSS 안전.
// 각 요소를 사이트 디자인 토큰에 매핑해 톤 유지(테이블은 PriceTable과 동일 스타일).

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// 자사 호스트 — 본문에 절대 URL로 쓰인 내부 링크가 nofollow 처리되지 않도록 판별한다.
// (기존 매거진 본문은 https://www.medirok.com/... 절대 URL을 쓰고 있고,
//  canonical은 apex를 쓰므로 두 호스트 모두 내부로 본다.)
const INTERNAL_HOSTS = new Set(["medirok.com", "www.medirok.com"]);

/** 절대 URL이면 내부/외부를 호스트로 판정하고, 내부면 경로만 남겨 정규화한다. */
function resolveHref(href?: string): { href?: string; external: boolean } {
  if (typeof href !== "string" || !/^https?:\/\//i.test(href)) {
    return { href, external: false };
  }
  try {
    const url = new URL(href);
    if (INTERNAL_HOSTS.has(url.hostname.toLowerCase())) {
      return { href: `${url.pathname}${url.search}${url.hash}`, external: false };
    }
  } catch {
    // 파싱 불가한 URL은 외부로 취급(보수적)
  }
  return { href, external: true };
}

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-xl font-medium mt-7 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-medium mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-medium mt-5 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-base leading-relaxed my-3">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-3 space-y-1.5 text-base leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-3 space-y-1.5 text-base leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => {
    const { href: resolved, external } = resolveHref(href);
    return (
      <a
        href={resolved}
        className="text-[var(--color-accent-700)] underline underline-offset-2 hover:opacity-80"
        {...(external ? { target: "_blank", rel: "noopener nofollow" } : {})}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--color-surface-border)] pl-4 my-4 text-[var(--color-text-secondary)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-[var(--color-surface-border)]" />,
  // 표 — PriceTable과 동일 톤. 모바일 가로 스크롤 래퍼.
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-md border border-[var(--color-surface-border)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--color-surface-bg)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)] border-b border-[var(--color-surface-border)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 align-top border-b border-[var(--color-surface-divider)] text-[var(--color-text-primary)]">
      {children}
    </td>
  ),
  code: ({ className, children }) => {
    const isBlock =
      typeof className === "string" && className.includes("language-");
    if (isBlock) return <code className={className}>{children}</code>;
    return (
      <code className="rounded bg-[var(--color-surface-bg)] px-1.5 py-0.5 text-[0.85em] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md bg-[var(--color-surface-bg)] p-3 text-sm">
      {children}
    </pre>
  ),
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="max-w-none text-[var(--color-text-primary)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
