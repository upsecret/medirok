import type { BlogSourcePost } from "@/types";

interface BlogSourceAttributionProps {
  hospitalName: string;
  sourceBlogName: string;
  sourceBlogUrl: string;
  sourcePosts: BlogSourcePost[];
}

/**
 * 원출처 고지 — 모든 블로그 상세 하단에 노출한다.
 *
 * 네이버 원문은 그대로 두고 메디록은 재구성본만 싣는다는 관계를 사람과 크롤러 양쪽에
 * 밝히는 자리다. 구조화 선언은 blogPostingSchema의 isBasedOn/citation이 담당하고
 * 여기서는 사람이 읽는 형태로 같은 사실을 반복한다.
 *
 * 외부 링크이므로 rel="noopener nofollow" target="_blank"를 직접 부여한다
 * (Markdown 경유가 아니라 자동 처리가 걸리지 않는다).
 */
export function BlogSourceAttribution({
  hospitalName,
  sourceBlogName,
  sourceBlogUrl,
  sourcePosts,
}: BlogSourceAttributionProps) {
  return (
    <section
      aria-label="원문 출처"
      className="my-8 pt-6 border-t border-[var(--color-surface-border)]"
    >
      <p className="editorial text-[10px] tracking-[0.1em] uppercase text-[var(--color-accent-600)] mb-2">
        SOURCE · 원문 출처
      </p>
      <div className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-4">
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          이 글은 <span className="font-medium">{hospitalName}</span>이 직접 작성해
          공개한{" "}
          <a
            href={sourceBlogUrl}
            target="_blank"
            rel="noopener nofollow"
            className="text-[var(--color-accent-600)] underline underline-offset-2"
          >
            {sourceBlogName}
          </a>
          의 포스팅 {sourcePosts.length}편을 메디록이 주제별로 재구성한 것입니다.
          원문은 네이버 블로그에서 그대로 확인하실 수 있습니다.
        </p>

        <ul className="mt-4 space-y-2">
          {sourcePosts.map((p) => (
            <li key={p.url} className="text-xs leading-relaxed">
              <a
                href={p.url}
                target="_blank"
                rel="noopener nofollow"
                className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-600)] underline underline-offset-2"
              >
                {p.title}
              </a>
              <span className="text-[var(--color-text-muted)]"> · {p.postedAt}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
