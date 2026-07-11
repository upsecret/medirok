"use client";

// 병원찾기 — GooDoc 스타일 리스팅 + 모달 필터/정렬 + 퀵뷰
// 칩바(지역·진료과·정렬) → 바텀시트 모달, 클라이언트 필터·정렬, URL 동기화
// 지역 모달은 지역(시도) → 시군구 → 동 단계별 드릴다운

import { useState } from "react";
import type { Hospital, Region, Department } from "@/types";
import { HospitalListRow } from "./HospitalListRow";
import { HospitalQuickView } from "./HospitalQuickView";
import { LocationModal } from "./LocationModal";
import { Modal, Chip, Cell } from "./primitives";
import { SORT_OPTIONS, type RegionSelection } from "./types";
import { useHospitalFilters } from "./useHospitalFilters";

interface Props {
  hospitals: Hospital[];
  regions: Region[];
  departments: Department[];
  initialSido?: string;
  initialRegion?: string;
  initialDong?: string;
  initialDept?: string;
  initialSort?: string;
  initialLine?: string;
  initialStation?: string;
}

export function HospitalFinder({
  hospitals,
  regions,
  departments,
  initialSido,
  initialRegion,
  initialDong,
  initialDept,
  initialSort,
  initialLine,
  initialStation,
}: Props) {
  const {
    sido,
    setSido,
    region,
    setRegion,
    dong,
    setDong,
    line,
    setLine,
    station,
    setStation,
    dept,
    setDept,
    sort,
    setSort,
    deptMap,
    regionMap,
    results,
  } = useHospitalFilters({
    hospitals,
    regions,
    departments,
    initialSido,
    initialRegion,
    initialDong,
    initialDept,
    initialSort,
    initialLine,
    initialStation,
  });

  const [open, setOpen] = useState<null | "region" | "dept" | "sort">(null);
  const [quickView, setQuickView] = useState<string | null>(null);

  // ── 칩 라벨 ──────────────────────────────
  const regionLabel =
    station || // 역주변 선택 시 역명 표시
    (dong && regionMap.get(dong)?.nameKr) ||
    (region && regionMap.get(region)?.nameKr) ||
    (sido && regionMap.get(sido)?.nameKr) ||
    "지역";
  const deptLabel = (dept && deptMap.get(dept)) || "진료과";
  const sortLabel = SORT_OPTIONS.find((s) => s.key === sort)?.label ?? "정렬";

  const activeHospital = quickView
    ? results.find((h) => h.slug === quickView) ??
      hospitals.find((h) => h.slug === quickView)
    : undefined;

  const hasRegion = !!(sido || region || dong || station);
  const hasFilter = hasRegion || !!dept;

  // 지역별 선택 → 역주변 해제(상호배타)
  function applyRegion(sel: RegionSelection) {
    setSido(sel.sido);
    setRegion(sel.region);
    setDong(sel.dong);
    setLine(undefined);
    setStation(undefined);
    setOpen(null);
  }

  // 역주변 선택 → 지역별 해제(상호배타)
  function applyStation(lineSlug: string, stationSlug: string) {
    setLine(lineSlug);
    setStation(stationSlug);
    setSido(undefined);
    setRegion(undefined);
    setDong(undefined);
    setOpen(null);
  }

  function resetAll() {
    setSido(undefined);
    setRegion(undefined);
    setDong(undefined);
    setLine(undefined);
    setStation(undefined);
    setDept(undefined);
  }

  return (
    <>
      {/* 칩바 */}
      <section className="bg-white py-3 border-b border-[var(--color-surface-border)] sticky top-[57px] z-30">
        <div className="container-page flex items-center gap-2 overflow-x-auto">
          <Chip label={regionLabel} active={hasRegion} onClick={() => setOpen("region")} />
          <Chip label={deptLabel} active={!!dept} onClick={() => setOpen("dept")} />
          <Chip label={sortLabel} active={sort !== "recommended"} onClick={() => setOpen("sort")} chevron="sort" />
          {hasFilter && (
            <button
              type="button"
              onClick={resetAll}
              className="shrink-0 text-xs text-[var(--color-text-muted)] px-2 py-1 whitespace-nowrap"
            >
              초기화
            </button>
          )}
        </div>
      </section>

      {/* 결과 리스트 */}
      <section className="bg-[var(--color-surface-bg)] py-5 min-h-[50vh]">
        <div className="container-page">
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            醫錄 인증 병원 {results.length}곳
          </p>

          {results.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {results.map((h) => (
                <HospitalListRow
                  key={h.slug}
                  hospital={h}
                  deptName={deptMap.get(h.departmentSlug)}
                  onSelect={setQuickView}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-[var(--color-text-muted)]">
                선택한 조건에 맞는 醫錄 인증 병원이 아직 없습니다.
              </p>
              <button
                type="button"
                onClick={resetAll}
                className="inline-block mt-3 text-xs text-[var(--color-accent-700)]"
              >
                필터 초기화 →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 지역 모달 — 지역별 / 역주변 탭 */}
      {open === "region" && (
        <LocationModal
          regions={regions}
          sido={sido}
          region={region}
          dong={dong}
          line={line}
          station={station}
          onClose={() => setOpen(null)}
          onApply={applyRegion}
          onApplyStation={applyStation}
        />
      )}

      {/* 진료과 모달 */}
      {open === "dept" && (
        <Modal title="진료과 선택" onClose={() => setOpen(null)}>
          <div className="grid grid-cols-3 gap-2">
            <Cell
              active={!dept}
              onClick={() => {
                setDept(undefined);
                setOpen(null);
              }}
            >
              전체 진료과
            </Cell>
            {departments.map((d) => (
              <Cell
                key={d.slug}
                active={dept === d.slug}
                onClick={() => {
                  setDept(d.slug);
                  setOpen(null);
                }}
              >
                {d.nameKr}
              </Cell>
            ))}
          </div>
        </Modal>
      )}

      {/* 정렬 모달 */}
      {open === "sort" && (
        <Modal title="정렬" onClose={() => setOpen(null)}>
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setSort(s.key);
                  setOpen(null);
                }}
                className={`flex items-center justify-between w-full text-left text-sm px-3 py-2.5 rounded-md ${
                  sort === s.key
                    ? "bg-[var(--color-surface-bg2)] text-[var(--color-text-primary)] font-medium"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                {s.label}
                {sort === s.key && (
                  <span className="text-[var(--color-accent-600)]">✓</span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* 퀵뷰 모달 */}
      {activeHospital && (
        <HospitalQuickView
          hospital={activeHospital}
          deptName={deptMap.get(activeHospital.departmentSlug)}
          onClose={() => setQuickView(null)}
        />
      )}
    </>
  );
}
