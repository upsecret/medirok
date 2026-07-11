"use client";

// ── 위치 모달 — 지역별 / 역주변 탭 ──────────────────
// 지역 모달은 지역(시도) → 시군구 → 동 단계별 드릴다운

import { useState } from "react";
import type { Region } from "@/types";
import type { RegionSelection } from "./types";
import { Modal, TabBtn, RegionRow, Empty } from "./primitives";
import { StationPicker } from "./StationPicker";

export function LocationModal({
  regions,
  sido,
  region,
  dong,
  line,
  station,
  onClose,
  onApply,
  onApplyStation,
}: {
  regions: Region[];
  sido?: string;
  region?: string;
  dong?: string;
  line?: string;
  station?: string;
  onClose: () => void;
  onApply: (sel: RegionSelection) => void;
  onApplyStation: (lineSlug: string, stationSlug: string) => void;
}) {
  const [tab, setTab] = useState<"region" | "station">(
    station ? "station" : "region"
  );
  const sidos = regions
    .filter((r) => r.level === "sido")
    .sort((a, b) => a.nameKr.localeCompare(b.nameKr, "ko"));
  const curGu = regions.find((r) => r.slug === region);

  const [selSido, setSelSido] = useState<string | null>(
    curGu?.parentSlug ?? sido ?? null
  );
  const [selGu, setSelGu] = useState<string | null>(region ?? null);
  const [step, setStep] = useState<"sido" | "sigungu" | "dong">(
    region && dong ? "dong" : region || sido ? "sigungu" : "sido"
  );

  const name = (slug: string | null) =>
    (slug && regions.find((r) => r.slug === slug)?.nameKr) || "";
  const hasDongs = (guSlug: string) =>
    regions.some((r) => r.parentSlug === guSlug && r.level === "dong");

  const gus = selSido
    ? regions
        .filter((r) => r.parentSlug === selSido && r.level === "sigungu")
        .sort((a, b) => a.nameKr.localeCompare(b.nameKr, "ko"))
    : [];
  const dongs = selGu
    ? regions
        .filter((r) => r.parentSlug === selGu && r.level === "dong")
        .sort((a, b) => a.nameKr.localeCompare(b.nameKr, "ko"))
    : [];

  // 상위 클릭 → 하위 초기화 후 드릴다운
  function openSido(slug: string) {
    setSelSido(slug);
    setSelGu(null);
    setStep("sigungu");
  }
  function openGu(slug: string) {
    setSelGu(slug);
    if (hasDongs(slug)) setStep("dong");
    else onApply({ region: slug }); // 동 없는 구 → 구 단위로 확정
  }

  return (
    <Modal title="지역 선택" onClose={onClose}>
      {/* 탭: 지역별 / 역주변 */}
      <div className="flex border-b border-[var(--color-surface-border)] mb-3 -mt-1">
        <TabBtn active={tab === "region"} onClick={() => setTab("region")}>
          지역별
        </TabBtn>
        <TabBtn active={tab === "station"} onClick={() => setTab("station")}>
          역주변
        </TabBtn>
      </div>

      {tab === "station" && (
        <StationPicker line={line} station={station} onApply={onApplyStation} />
      )}

      {tab === "region" && (
        <>
      {/* 경로 / 뒤로가기 */}
      <div className="flex items-center gap-2 mb-3 text-2xl">
        {step !== "sido" && (
          <button
            type="button"
            aria-label="뒤로"
            onClick={() => setStep(step === "dong" ? "sigungu" : "sido")}
            className="text-[var(--color-text-secondary)] text-4xl leading-none px-1 -ml-1"
          >
            ‹
          </button>
        )}
        <button
          type="button"
          onClick={() => setStep("sido")}
          className={
            step === "sido"
              ? "font-medium text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)]"
          }
        >
          전국
        </button>
        {selSido && step !== "sido" && (
          <>
            <span className="text-[var(--color-text-muted)]">›</span>
            <button
              type="button"
              onClick={() => setStep("sigungu")}
              className={
                step === "sigungu"
                  ? "font-medium text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)]"
              }
            >
              {name(selSido)}
            </button>
          </>
        )}
        {selGu && step === "dong" && (
          <>
            <span className="text-[var(--color-text-muted)]">›</span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {name(selGu)}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        className="text-xs text-[var(--color-accent-700)] mb-2"
        onClick={() => onApply({})}
      >
        지역 전체
      </button>

      <div className="h-[55vh] overflow-y-auto pr-1 grid grid-cols-2 gap-2 content-start">
        {/* 1단계: 시도 */}
        {step === "sido" &&
          sidos.map((s) => (
            <RegionRow
              key={s.slug}
              active={selSido === s.slug}
              chevron
              onClick={() => openSido(s.slug)}
            >
              {s.nameKr}
            </RegionRow>
          ))}

        {/* 2단계: 시군구 */}
        {step === "sigungu" &&
          (gus.length === 0 ? (
            <Empty>준비 중</Empty>
          ) : (
            <>
              <RegionRow
                full
                active={!!sido && !region}
                onClick={() => selSido && onApply({ sido: selSido })}
              >
                {name(selSido)} 전체
              </RegionRow>
              {gus.map((g) => (
                <RegionRow
                  key={g.slug}
                  active={selGu === g.slug}
                  chevron={hasDongs(g.slug)}
                  onClick={() => openGu(g.slug)}
                >
                  {g.nameKr}
                </RegionRow>
              ))}
            </>
          ))}

        {/* 3단계: 동 */}
        {step === "dong" &&
          (dongs.length === 0 ? (
            <Empty>세부 지역 없음</Empty>
          ) : (
            <>
              <RegionRow
                full
                active={!dong && !!region}
                onClick={() => selGu && onApply({ region: selGu })}
              >
                {name(selGu)} 전체
              </RegionRow>
              {dongs.map((d) => (
                <RegionRow
                  key={d.slug}
                  active={dong === d.slug}
                  onClick={() =>
                    selGu && onApply({ region: selGu, dong: d.slug })
                  }
                >
                  {d.nameKr}
                </RegionRow>
              ))}
            </>
          ))}
      </div>
        </>
      )}
    </Modal>
  );
}
