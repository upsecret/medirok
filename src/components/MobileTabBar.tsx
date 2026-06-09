import Link from "next/link";
import type { Route } from "next";

interface TabItem {
  href: Route;
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { href: "/", label: "홈", icon: "M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" },
  { href: "/hospitals" as Route, label: "병원찾기", icon: "M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" },
  { href: "/magazine" as Route, label: "매거진", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { href: "/estimate", label: "무료견적", icon: "M3 7l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/verification", label: "메디록 인증", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--color-surface-border)]">
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              className="flex flex-col items-center justify-center py-2.5 text-[var(--color-text-muted)]"
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
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
