"use client";

// ── 공용 프리미티브 ────────────────────────────

import { useEffect } from "react";

export function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? "border-[var(--color-primary-600)] text-[var(--color-text-primary)]"
          : "border-transparent text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Chip({
  label,
  active,
  onClick,
  chevron = "down",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  chevron?: "down" | "sort";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
        active
          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white font-medium"
          : "border-[var(--color-surface-border)] bg-white text-[var(--color-text-secondary)]"
      }`}
    >
      <span className="truncate max-w-[40vw]">{label}</span>
      {chevron === "down" ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export function RegionRow({
  active,
  chevron,
  full,
  onClick,
  children,
}: {
  active?: boolean;
  chevron?: boolean;
  full?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${full ? "col-span-2 " : ""}relative flex items-center justify-center w-full text-center text-base px-3 py-3.5 rounded-md border ${
        active
          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white font-medium"
          : "border-[var(--color-surface-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)]"
      }`}
    >
      <span className="truncate">{children}</span>
      {chevron && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 opacity-60">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl p-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--color-text-muted)] text-xl leading-none px-2"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Cell({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-sm px-2.5 py-2 rounded-md ${
        active
          ? "bg-[var(--color-primary-600)] text-white font-medium"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
      {children}
    </p>
  );
}
