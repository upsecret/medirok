"use client";

// ── 역주변 — 노선 → 역 드릴다운 ──────────────────

import { useState } from "react";
import {
  SUBWAY_REGIONS,
  LINE_BY_SLUG,
  linesByRegion,
  type SubwayLine,
} from "@/lib/stations";
import { RegionRow } from "./primitives";

export function StationPicker({
  line,
  station,
  onApply,
}: {
  line?: string;
  station?: string;
  onApply: (lineSlug: string, stationSlug: string) => void;
}) {
  const presetLine = line ? LINE_BY_SLUG[line] : undefined;
  const [selRegion, setSelRegion] = useState<string | null>(
    presetLine?.region ?? null
  );
  const [selLine, setSelLine] = useState<SubwayLine | null>(presetLine ?? null);

  const step: "region" | "line" | "station" = !selRegion
    ? "region"
    : !selLine
      ? "line"
      : "station";

  return (
    <>
      {/* 경로 / 뒤로가기: 전국 › 권역 › 노선 */}
      <div className="flex items-center gap-2 mb-3 text-base flex-wrap">
        {step !== "region" && (
          <button
            type="button"
            aria-label="뒤로"
            onClick={() =>
              step === "station" ? setSelLine(null) : setSelRegion(null)
            }
            className="text-[var(--color-text-secondary)] text-3xl leading-none px-1 -ml-1"
          >
            ‹
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setSelRegion(null);
            setSelLine(null);
          }}
          className={
            step === "region"
              ? "font-medium text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)]"
          }
        >
          전국
        </button>
        {selRegion && (
          <>
            <span className="text-[var(--color-text-muted)]">›</span>
            <button
              type="button"
              onClick={() => setSelLine(null)}
              className={
                step === "line"
                  ? "font-medium text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)]"
              }
            >
              {selRegion}
            </button>
          </>
        )}
        {selLine && (
          <>
            <span className="text-[var(--color-text-muted)]">›</span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {selLine.lineName}
            </span>
          </>
        )}
      </div>

      <div className="h-[55vh] overflow-y-auto pr-1 grid grid-cols-2 gap-2 content-start">
        {step === "region" &&
          SUBWAY_REGIONS.map((r) => (
            <RegionRow key={r} chevron onClick={() => setSelRegion(r)}>
              {r}
            </RegionRow>
          ))}

        {step === "line" &&
          linesByRegion(selRegion as string).map((l) => (
            <RegionRow key={l.lineSlug} chevron onClick={() => setSelLine(l)}>
              {l.lineName}
            </RegionRow>
          ))}

        {step === "station" &&
          selLine!.stations.map((s) => (
            <RegionRow
              key={s.slug}
              active={station === s.slug}
              onClick={() => onApply(selLine!.lineSlug, s.slug)}
            >
              {s.name}
            </RegionRow>
          ))}
      </div>
    </>
  );
}
