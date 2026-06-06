// 매거진 저자 프로필 박스
// 의사 저자: 의원 cross-link + 다른 글 표시
// 큐레이션팀/외부 전문가: 이름·직함만 (의원 링크 없음)

import Link from "next/link";
import type { Route } from "next";
import type { Doctor } from "@/types";
import type { Magazine } from "@/lib/magazines";
import { getHospitalByDoctorSlug } from "@/lib/data";
import { getMagazinesByAuthorDoctorSlug } from "@/lib/magazines";

interface AuthorProfileProps {
  /** 의사 저자가 있는 경우 (이때 의원 링크 + 다른 글 자동 표시) */
  authorDoctor?: Doctor;
  /** 큐레이션팀/외부 전문가 등 비-의사 저자 */
  authorName?: string;
  authorTitle?: string;
  /** 현재 매거진 slug (다른 글 목록에서 자기 자신 제외) */
  currentMagazineSlug?: string;
}

export function AuthorProfile({
  authorDoctor,
  authorName,
  authorTitle,
  currentMagazineSlug,
}: AuthorProfileProps) {
  // 케이스 1: 의사 저자 — 의원 cross-link + 다른 글
  if (authorDoctor) {
    const hospital = getHospitalByDoctorSlug(authorDoctor.slug);
    const otherArticles = getMagazinesByAuthorDoctorSlug(authorDoctor.slug)
      .filter((m) => m.slug !== currentMagazineSlug);

    return (
      <section
        className="my-8 p-5 md:p-6 bg-white border border-[var(--color-accent-400)] rounded-lg"
        aria-label="저자 프로필"
      >
        <p className="editorial text-[10px] tracking-[0.1em] uppercase text-[var(--color-accent-600)] mb-3">
          <span className="hanja">醫錄</span> AUTHOR
        </p>

        <div className="flex gap-4">
          <div className="w-16 h-16 bg-[var(--color-primary-600)] rounded-full flex items-center justify-center shrink-0">
            <span
              className="hanja text-[var(--color-accent-400)] text-2xl"
              aria-hidden
            >
              {authorDoctor.nameHanja ?? authorDoctor.nameKr[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              {authorDoctor.nameKr}
              {authorDoctor.title && (
                <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">
                  {" "}
                  · {authorDoctor.title}
                </span>
              )}
            </h3>
            {authorDoctor.specialty && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {authorDoctor.specialty}
                {authorDoctor.yearsExperience &&
                  ` · ${authorDoctor.yearsExperience}년차`}
              </p>
            )}
            {hospital && (
              <Link
                href={`/hospital/${hospital.slug}` as Route}
                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-xs text-[var(--color-accent-700)] bg-[var(--color-accent-50)] border border-[var(--color-accent-200)] rounded hover:border-[var(--color-accent-400)]"
              >
                <span className="hanja text-[var(--color-accent-600)]">醫錄</span>
                {hospital.nameKr}
                <span className="text-[var(--color-text-muted)]">→</span>
              </Link>
            )}
          </div>
        </div>

        {otherArticles.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--color-surface-divider)]">
            <p className="text-[10px] tracking-wider uppercase text-[var(--color-text-muted)] mb-2">
              {authorDoctor.nameKr}의 다른 글
            </p>
            <ul className="space-y-1.5">
              {otherArticles.slice(0, 3).map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/magazine/${m.slug}` as Route}
                    className="text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent-700)] leading-snug block"
                  >
                    · {m.seoTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  // 케이스 2: 큐레이션팀 / 외부 전문가 (의원 cross-link 없음)
  if (authorName) {
    return (
      <section
        className="my-8 p-5 bg-[var(--color-surface-bg2)] border border-[var(--color-surface-border)] rounded-lg"
        aria-label="저자"
      >
        <p className="editorial text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-muted)] mb-2">
          AUTHOR
        </p>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {authorName}
        </p>
        {authorTitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {authorTitle}
          </p>
        )}
      </section>
    );
  }

  return null;
}
