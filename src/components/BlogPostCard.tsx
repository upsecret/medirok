import Link from "next/link";
import type { Route } from "next";
import { Thumbnail } from "@/components/Thumbnail";
import type { BlogPost } from "@/types";

interface BlogPostCardProps {
  post: BlogPost;
  /** URL 1단계. 한국어 slug는 Link가 자동 인코딩한다 */
  hospitalSlug: string;
  hospitalName?: string;
  /** 목록 최상단 카드에만 준다 — 그 카드가 LCP 요소인데 기본값이 lazy다 */
  priority?: boolean;
}

export function BlogPostCard({
  post,
  hospitalSlug,
  hospitalName,
  priority = false,
}: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${hospitalSlug}/${post.slug}` as Route}
      className="card-lift block rounded-2xl border border-[var(--color-surface-border)] bg-white p-4"
    >
      <Thumbnail
        thumbnail={post.thumbnail}
        placeholderLabel="병원 소식"
        priority={priority}
        className="mb-3"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-full bg-[var(--color-accent-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-700)]">
          병원 소식
        </span>
        {hospitalName && (
          <span className="text-xs text-[var(--color-text-muted)]">
            {hospitalName}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
        {post.seoTitle}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {post.metaDescription}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>{post.publishedAt}</span>
        <span>원문 {post.sourcePosts.length}편 재구성</span>
      </div>
    </Link>
  );
}
