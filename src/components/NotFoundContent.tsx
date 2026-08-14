import Link from "next/link";
import type { Route } from "next";

/**
 * 404 본문 — 두 곳에서 공유한다.
 *   - src/app/(frontend)/not-found.tsx : notFound() 호출 (없는 매거진/병원/블로그 slug)
 *   - src/app/not-found.tsx            : 매칭되는 라우트가 아예 없는 URL
 * 두 진입점의 화면이 갈라지지 않도록 본문은 여기 한 곳에만 둔다.
 */

const DESTINATIONS: { href: Route; label: string; detail: string }[] = [
  {
    href: "/hospitals" as Route,
    label: "병원찾기",
    detail: "지역·진료과로 醫錄 인증 의원을 찾습니다",
  },
  {
    href: "/magazine" as Route,
    label: "메디록 매거진",
    detail: "시술 가이드·지역 비교·의원 인터뷰",
  },
  {
    href: "/blog" as Route,
    label: "의원 블로그",
    detail: "인증 의원이 직접 쓴 진료 기록",
  },
  {
    href: "/verification/apply" as Route,
    label: "醫錄 인증제 신청",
    detail: "의원을 위한 4단계 인증 심사 신청 창구",
  },
];

export function NotFoundContent() {
  return (
    <>
      <section className="bg-[var(--color-primary-600)] py-12 md:py-16">
        <div className="container-content text-center">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-400)]">
            404 · PAGE NOT FOUND
          </p>
          <p
            className="hanja text-[var(--color-accent-400)] mt-4 leading-none opacity-90"
            style={{ fontSize: "clamp(56px, 12vw, 96px)" }}
            aria-hidden="true"
          >
            錄
          </p>
          <h1 className="editorial text-white mt-4">
            찾으시는 기록이 없습니다
          </h1>
          <p className="text-[var(--color-accent-300)] text-sm mt-3 leading-relaxed max-w-md mx-auto">
            주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
            아래에서 원하시는 곳으로 이동하세요.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-content">
          <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-3">
            이동하기
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DESTINATIONS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="block bg-white border border-[var(--color-surface-border)] rounded-md p-4 transition hover:border-[var(--color-accent-400)]"
              >
                <p className="font-medium text-sm text-[var(--color-text-primary)]">
                  {d.label}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                  {d.detail}
                </p>
              </Link>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] mt-6 text-center">
            <Link
              href="/"
              className="text-[var(--color-accent-600)] underline underline-offset-2"
            >
              메디록 홈으로 돌아가기
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
