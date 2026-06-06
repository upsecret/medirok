import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page flex items-center justify-between py-3">
        <div className="flex items-center gap-5">
          <Link href="/" aria-label="메디록 홈으로">
            <Logo size={28} />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--color-accent-600)] bg-[var(--color-accent-50)] border border-[var(--color-accent-400)] rounded-full">
              <span className="hanja text-[var(--color-accent-400)]">醫錄</span>
              인증
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-4 ml-4 text-sm text-[var(--color-text-secondary)]">
            <Link href="/hospitals/dental">진료과</Link>
            <Link href="/hospitals">의원찾기</Link>
            <Link href={"/magazine" as Route}>매거진</Link>
            <Link href="/verification">
              <span className="hanja text-[var(--color-accent-600)]">醫錄</span> 인증제
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/estimate"
            className="btn-primary text-xs sm:text-sm"
          >
            무료 견적 받기
          </Link>
        </div>
      </div>
    </header>
  );
}
