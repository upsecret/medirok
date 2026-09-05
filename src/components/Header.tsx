import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-[var(--color-surface-border)] backdrop-blur-md">
      <div className="container-page flex min-h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="메디록 홈으로">
            <Logo size={28} />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[var(--color-text-secondary)]">
            <Link href="/hospitals" className="hover:text-[var(--color-accent-700)]">병원 찾기</Link>
            <Link href={"/magazine" as Route}>매거진</Link>
            <Link href={"/blog" as Route}>병원 소식</Link>
            <Link href="/verification">인증 기준</Link>
          </nav>
        </div>
        <Link href="/hospitals" className="btn-primary hidden min-h-0 px-5 py-2.5 text-sm md:inline-flex md:items-center">
          내게 맞는 병원 찾기
        </Link>
      </div>
    </header>
  );
}
