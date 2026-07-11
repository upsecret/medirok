import Link from "next/link";
import type { Route } from "next";
import type { Magazine } from "@/types";

const TYPE_LABELS: Record<Magazine["type"], string> = {
  article: "시술 가이드",
  qna: "Q&A",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스",
};

const TYPE_COLORS: Record<Magazine["type"], string> = {
  article: "var(--color-info)",
  qna: "var(--color-accent-600)",
  regional: "var(--color-success)",
  interview: "var(--color-primary-600)",
  case: "var(--color-danger)",
};

interface MagazineCardProps {
  magazine: Magazine;
  size?: "lg" | "sm";
}

export function MagazineCard({ magazine, size = "sm" }: MagazineCardProps) {
  const isLarge = size === "lg";
  return (
    <Link
      href={`/magazine/${magazine.slug}` as Route}
      className={`block bg-white border border-[var(--color-surface-border)] rounded-md p-4 ${
        isLarge ? "md:p-5" : ""
      } transition hover:border-[var(--color-accent-400)]`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded text-white"
          style={{ background: TYPE_COLORS[magazine.type] }}
        >
          {TYPE_LABELS[magazine.type]}
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {magazine.category}
        </span>
      </div>
      <h3
        className={`font-medium text-[var(--color-text-primary)] leading-snug ${
          isLarge ? "text-base md:text-lg" : "text-sm"
        }`}
      >
        {magazine.seoTitle}
      </h3>
      <p
        className={`text-[var(--color-text-muted)] mt-2 leading-relaxed line-clamp-2 ${
          isLarge ? "text-sm" : "text-xs"
        }`}
      >
        {magazine.metaDescription}
      </p>
      <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--color-text-muted)]">
        <span>
          {magazine.authorName && `${magazine.authorName} · `}
          {magazine.publishedAt}
        </span>
        {magazine.linkedHospitalSlugs && magazine.linkedHospitalSlugs.length > 0 && (
          <span className="text-[var(--color-accent-600)]">
            메디록 의원 {magazine.linkedHospitalSlugs.length}곳
          </span>
        )}
      </div>
    </Link>
  );
}
