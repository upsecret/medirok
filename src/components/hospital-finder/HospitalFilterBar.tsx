"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Region, Department } from "@/types";

interface Props {
  regions: Region[];
  departments: Department[];
  region?: string; // 선택된 구 slug
  dong?: string; // 선택된 동 slug
  dept?: string; // 선택된 진료과 slug
  regionLabel: string;
  deptLabel: string;
}

export function HospitalFilterBar({
  regions,
  departments,
  region,
  dong,
  dept,
  regionLabel,
  deptLabel,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "region" | "dept">(null);

  const sidos = regions.filter((r) => r.level === "sido");
  const currentGu = regions.find((r) => r.slug === region);
  const [activeSido, setActiveSido] = useState<string | null>(
    currentGu?.parentSlug ?? "seoul"
  );
  const [activeGu, setActiveGu] = useState<string | null>(region ?? null);

  const gus = activeSido
    ? regions.filter((r) => r.parentSlug === activeSido && r.level === "sigungu")
    : [];
  const dongs = activeGu
    ? regions.filter((r) => r.parentSlug === activeGu && r.level === "dong")
    : [];

  function apply(next: {
    region?: string | null;
    dong?: string | null;
    dept?: string | null;
  }) {
    const params = new URLSearchParams();
    const r = next.region !== undefined ? next.region : region;
    const dg = next.dong !== undefined ? next.dong : dong;
    const dp = next.dept !== undefined ? next.dept : dept;
    if (r) params.set("region", r);
    if (dg) params.set("dong", dg);
    if (dp) params.set("dept", dp);
    const qs = params.toString();
    router.push(qs ? `/hospitals?${qs}` : "/hospitals");
    setOpen(null);
  }

  function selectGu(guSlug: string) {
    const hasDongs = regions.some(
      (r) => r.parentSlug === guSlug && r.level === "dong"
    );
    setActiveGu(guSlug);
    if (!hasDongs) apply({ region: guSlug, dong: null });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <ListBox
          label={regionLabel}
          active={!!region}
          onClick={() => setOpen("region")}
        />
        <ListBox
          label={deptLabel}
          active={!!dept}
          onClick={() => setOpen("dept")}
        />
      </div>

      {/* 지역 모달 */}
      {open === "region" && (
        <Modal title="지역 선택" onClose={() => setOpen(null)}>
          <button
            className="text-xs text-[var(--color-accent-700)] mb-2"
            onClick={() => apply({ region: null, dong: null })}
          >
            지역 전체
          </button>
          <div className="grid grid-cols-3 gap-2 h-[55vh]">
            <Column>
              {sidos.map((s) => (
                <Cell
                  key={s.slug}
                  active={activeSido === s.slug}
                  onClick={() => {
                    setActiveSido(s.slug);
                    setActiveGu(null);
                  }}
                >
                  {s.nameKr}
                </Cell>
              ))}
            </Column>
            <Column>
              {gus.length === 0 ? (
                <Empty>준비 중</Empty>
              ) : (
                gus.map((g) => (
                  <Cell
                    key={g.slug}
                    active={activeGu === g.slug}
                    onClick={() => selectGu(g.slug)}
                  >
                    {g.nameKr}
                  </Cell>
                ))
              )}
            </Column>
            <Column>
              {activeGu && dongs.length > 0 ? (
                <>
                  <Cell
                    active={!dong}
                    onClick={() => apply({ region: activeGu, dong: null })}
                  >
                    전체
                  </Cell>
                  {dongs.map((d) => (
                    <Cell
                      key={d.slug}
                      active={dong === d.slug}
                      onClick={() => apply({ region: activeGu, dong: d.slug })}
                    >
                      {d.nameKr}
                    </Cell>
                  ))}
                </>
              ) : (
                <Empty>{activeGu ? "세부 지역 없음" : "구 선택"}</Empty>
              )}
            </Column>
          </div>
        </Modal>
      )}

      {/* 진료과 모달 */}
      {open === "dept" && (
        <Modal title="진료과 선택" onClose={() => setOpen(null)}>
          <div className="grid grid-cols-3 gap-2">
            <Cell active={!dept} onClick={() => apply({ dept: null })}>
              전체 진료과
            </Cell>
            {departments.map((d) => (
              <Cell
                key={d.slug}
                active={dept === d.slug}
                onClick={() => apply({ dept: d.slug })}
              >
                {d.nameKr}
              </Cell>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function ListBox({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-md border text-sm ${
        active
          ? "border-[var(--color-accent-400)] text-[var(--color-text-primary)] font-medium"
          : "border-[var(--color-surface-border)] text-[var(--color-text-secondary)]"
      } bg-white`}
    >
      <span className="truncate">{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 ml-1 text-[var(--color-text-muted)]">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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

function Column({ children }: { children: React.ReactNode }) {
  return <div className="overflow-y-auto space-y-1 pr-1">{children}</div>;
}

function Cell({
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
      {children}
    </p>
  );
}
