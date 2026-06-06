import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { MagazineForm } from "../../MagazineForm";
import type { MagazineType } from "@/lib/magazines";

const TYPE_LABELS: Record<MagazineType, string> = {
  article: "시술 가이드",
  qna: "Q&A 의사 답변",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function NewMagazineByTypePage({ params }: PageProps) {
  const { type } = await params;
  if (!(type in TYPE_LABELS)) notFound();
  const t = type as MagazineType;

  return (
    <div>
      <nav className="text-xs text-[var(--color-text-muted)] mb-3">
        <Link href={"/dashboard/magazines" as Route}>매거진 관리</Link> ›{" "}
        <Link href={"/dashboard/magazines/new" as Route}>새 글</Link> › {TYPE_LABELS[t]}
      </nav>
      <h1 className="text-2xl font-medium mb-1">{TYPE_LABELS[t]} 작성</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        SEO + AEO 최적화 필드를 채우세요. 의사 저자 선택 시 의원과 자동 연결됩니다.
      </p>
      <MagazineForm type={t} mode="new" />
    </div>
  );
}
