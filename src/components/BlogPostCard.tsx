import Link from "next/link";
import type { Route } from "next";
import { Thumbnail } from "@/components/Thumbnail";
import type { BlogPost } from "@/types";

interface BlogPostCardProps {
  post: BlogPost;
  /** URL 1단계. 한국어 slug는 Link가 자동 인코딩한다 */
  hospitalSlug: string;
  hospitalName?: string;
}

export function BlogPostCard({ post, hospitalSlug, hospitalName }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${hospitalSlug}/${post.slug}` as Route}
      className="block bg-white border border-[var(--color-surface-border)] rounded-md p-4 transition hover:border-[var(--color-accent-400)]"
    >
      <Thumbnail
        thumbnail={post.thumbnail}
        placeholderLabel="의원 블로그"
        className="mb-3"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
          의원 블로그
        </span>
        {hospitalName && (
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {hospitalName}
          </span>
        )}
      </div>
      <h3 className="font-medium text-sm text-[var(--color-text-primary)] leading-snug">
        {post.seoTitle}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed line-clamp-2">
        {post.metaDescription}
      </p>
      <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--color-text-muted)]">
        <span>{post.publishedAt}</span>
        <span>원문 {post.sourcePosts.length}편 재구성</span>
      </div>
    </Link>
  );
}
