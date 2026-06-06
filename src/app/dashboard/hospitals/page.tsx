import Link from "next/link";
import type { Route } from "next";
import { loadHospitals } from "@/lib/storage";
import { getDepartmentBySlug, getRegionBySlug } from "@/lib/data";
import { deleteHospitalAction } from "./actions";
import { DeleteConfirmButton } from "../_components/DeleteConfirmButton";

interface PageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function DashboardHospitalsPage({ searchParams }: PageProps) {
  const { saved } = await searchParams;
  const hospitals = await loadHospitals();

  return (
    <div>
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <h1 className="text-2xl font-medium">의원 관리</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            등재된 醫錄 인증 의원 {hospitals.length}곳
          </p>
        </div>
        <Link
          href={"/dashboard/hospitals/new" as Route}
          className="btn-primary px-4 py-2 text-sm"
        >
          + 의원 추가
        </Link>
      </div>

      {saved && (
        <div className="bg-[var(--color-accent-50)] border border-[var(--color-accent-400)] rounded-md p-3 mb-4 text-sm">
          ✓ <code className="font-mono">{saved}</code> 의원이 저장되었습니다.
        </div>
      )}

      <div className="bg-white border border-[var(--color-surface-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-bg)] text-[var(--color-text-muted)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">의원명</th>
              <th className="text-left px-4 py-3 font-medium">진료과</th>
              <th className="text-left px-4 py-3 font-medium">지역</th>
              <th className="text-left px-4 py-3 font-medium">등급</th>
              <th className="text-right px-4 py-3 font-medium">평점</th>
              <th className="text-right px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => {
              const dept = getDepartmentBySlug(h.departmentSlug);
              const region = getRegionBySlug(h.regionSlug);
              return (
                <tr
                  key={h.slug}
                  className="border-t border-[var(--color-surface-divider)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/hospitals/${h.slug}/edit` as Route}
                      className="font-medium hover:text-[var(--color-accent-700)]"
                    >
                      {h.nameKr}
                    </Link>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                      /{h.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="hanja text-[var(--color-accent-600)]">
                      {dept?.hanja}
                    </span>{" "}
                    {dept?.nameKr}
                  </td>
                  <td className="px-4 py-3 text-xs">{region?.nameKr}</td>
                  <td className="px-4 py-3 text-xs">
                    {h.tier === "PREMIUM" && (
                      <span className="badge-premium">PREMIUM</span>
                    )}
                    {h.tier === "STANDARD" && (
                      <span className="text-[var(--color-text-muted)]">일반</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    ★ {h.rating} ({h.reviewCount})
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/hospital/${h.slug}` as Route}
                        className="text-xs text-[var(--color-text-muted)]"
                        target="_blank"
                      >
                        보기
                      </Link>
                      <Link
                        href={`/dashboard/hospitals/${h.slug}/edit` as Route}
                        className="text-xs text-[var(--color-accent-700)]"
                      >
                        수정
                      </Link>
                      <form action={deleteHospitalAction} className="inline">
                        <input type="hidden" name="slug" value={h.slug} />
                        <DeleteConfirmButton
                          confirmMessage={`'${h.nameKr}' 의원을 삭제할까요?`}
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hospitals.length === 0 && (
          <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            등재된 의원이 없습니다.{" "}
            <Link
              href={"/dashboard/hospitals/new" as Route}
              className="text-[var(--color-accent-700)] underline"
            >
              새 의원 추가
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
