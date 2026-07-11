// 브레드크럼 내비게이션 + BreadcrumbList JSON-LD 동시 렌더
// nav 마크업과 스키마를 한 곳에서 책임져 본문-스키마 불일치를 원천 차단한다.
// (구: hospital/[slug]·hospitals/[sido]·[gu]·[dept] 페이지에서 각자 조립)

import Link from "next/link";
import type { Route } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema-generator";
import { SITE_URL, absUrl } from "@/lib/site";

export interface Crumb {
  name: string;
  /** 페이지 상대 경로 — JSON-LD 절대 URL 생성에 사용 */
  path: string;
  /** nav에서 링크로 렌더할지 (기본 텍스트) */
  link?: boolean;
}

interface BreadcrumbsProps {
  items: Crumb[];
  /** JSON-LD 항목이 nav와 다를 때만 지정 (예: 병원 상세 — nav에는 진료과 노출, 스키마에는 제외) */
  schemaItems?: { name: string; path: string }[];
}

function toSchemaUrl(path: string): string {
  return path === "/" ? SITE_URL : absUrl(path);
}

export function Breadcrumbs({ items, schemaItems }: BreadcrumbsProps) {
  const schema = breadcrumbSchema(
    (schemaItems ?? items).map((c) => ({ name: c.name, url: toSchemaUrl(c.path) }))
  );

  return (
    <>
      <JsonLd data={schema} />
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          {items.map((c, i) => (
            <span key={`${c.path}-${i}`}>
              {i > 0 && " › "}
              {c.link ? <Link href={c.path as Route}>{c.name}</Link> : c.name}
            </span>
          ))}
        </div>
      </nav>
    </>
  );
}
