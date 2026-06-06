import Link from "next/link";
import type { Route } from "next";
import { loadMagazines } from "@/lib/storage";
import { deleteMagazineAction } from "./actions";
import type { MagazineType } from "@/lib/magazines";
import { DeleteConfirmButton } from "../_components/DeleteConfirmButton";

const TYPE_LABELS: Record<MagazineType, string> = {
  article: "시술 가이드",
  qna: "Q&A",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스",
};

interface PageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function DashboardMagazinesPage({ searchParams }: PageProps) {
  const { saved } = await searchParams;
  const list = await loadMagazines();
  const sorted = [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div>
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <h1 className="text-2xl font-medium">매거진 관리</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            <span className="hanja">醫錄</span> 매거진 {list.length}편
          </p>
        </div>
        <Link
          href={"/dashboard/magazines/new" as Route}
          className="btn-primary px-4 py-2 text-sm"
        >
          + 새 매거진
        </Link>
      </div>

      {saved && (
        <div className="bg-[var(--color-accent-50)] border border-[var(--color-accent-400)] rounded-md p-3 mb-4 text-sm">
          ✓ <code className="font-mono">{saved}</code> 저장 완료.
        </div>
      )}

      <div className="bg-white border border-[var(--color-surface-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-bg)] text-[var(--color-text-muted)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">제목</th>
              <th className="text-left px-4 py-3 font-medium">템플릿</th>
              <th className="text-left px-4 py-3 font-medium">저자</th>
              <th className="text-left px-4 py-3 font-medium">발행일</th>
              <th className="text-right px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr
                key={m.slug}
                className="border-t border-[var(--color-surface-divider)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/magazines/${m.slug}/edit` as Route}
                    className="font-medium hover:text-[var(--color-accent-700)] line-clamp-1"
                  >
                    {m.seoTitle}
                  </Link>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                    /{m.slug}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                  {TYPE_LABELS[m.type]}
                </td>
                <td className="px-4 py-3 text-xs">
                  {m.authorDoctorSlug ? (
                    <span className="text-[var(--color-accent-700)]">
                      {m.authorName} (의사)
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">
                      {m.authorName ?? "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{m.publishedAt}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/magazine/${m.slug}` as Route}
                      className="text-xs text-[var(--color-text-muted)]"
                      target="_blank"
                    >
                      보기
                    </Link>
                    <Link
                      href={`/dashboard/magazines/${m.slug}/edit` as Route}
                      className="text-xs text-[var(--color-accent-700)]"
                    >
                      수정
                    </Link>
                    <form action={deleteMagazineAction} className="inline">
                      <input type="hidden" name="slug" value={m.slug} />
                      <DeleteConfirmButton
                        confirmMessage={`'${m.seoTitle}' 매거진 삭제?`}
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            발행된 매거진이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
