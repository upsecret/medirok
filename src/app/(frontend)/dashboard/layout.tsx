import Link from "next/link";
import type { Route } from "next";
import { logoutAction } from "./actions";

export const metadata = {
  title: "메디록 대시보드",
  robots: { index: false, follow: false },
};

const NAV: { href: string; label: string; hanja?: string; external?: boolean }[] = [
  { href: "/dashboard", label: "대시보드", hanja: "錄" },
  { href: "/dashboard/hospitals", label: "의원 관리" },
  { href: "/admin/collections/magazines", label: "매거진 관리", external: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-bg)]">
      <header className="bg-[var(--color-primary-700)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="hanja text-[var(--color-accent-400)] text-2xl">錄</span>
              <span className="font-medium">메디록 관리자</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              {NAV.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-[var(--color-accent-300)] hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className="text-[var(--color-accent-300)] hover:text-white"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[var(--color-accent-300)] hover:text-white"
            >
              ↗ 사이트 보기
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 border border-[var(--color-accent-400)] text-[var(--color-accent-400)] rounded hover:bg-[var(--color-accent-400)] hover:text-[var(--color-primary-700)]"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="md:hidden bg-[var(--color-primary-600)] text-white px-4 py-2 flex gap-4 text-xs overflow-x-auto">
        {NAV.map((item) =>
          item.external ? (
            <a key={item.href} href={item.href} className="whitespace-nowrap">
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href as Route}
              className="whitespace-nowrap"
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
