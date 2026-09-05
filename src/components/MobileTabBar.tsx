import Link from "next/link";
import type { Route } from "next";

interface TabItem {
  href: Route;
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { href: "/", label: "홈", icon: "M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" },
  { href: "/hospitals" as Route, label: "병원 찾기", icon: "M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" },
  { href: "/magazine" as Route, label: "매거진", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { href: "/blog" as Route, label: "병원 소식", icon: "M4 5h16M4 12h16M4 19h10" },
];

export function MobileTabBar() {
  return (
    <nav aria-label="모바일 주요 메뉴" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-[var(--color-surface-border)] backdrop-blur-md">
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              className="flex min-h-16 flex-col items-center justify-center py-2 text-[var(--color-text-secondary)]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={tab.icon} />
              </svg>
              <span className="mt-0.5 text-xs font-medium">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
