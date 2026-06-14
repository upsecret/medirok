"use client";

// 병원찾기 — GooDoc 스타일 리스팅 + 모달 필터/정렬 + 퀵뷰
// 칩바(지역·진료과·정렬) → 바텀시트 모달, 클라이언트 필터·정렬, URL 동기화
// 지역 모달은 지역(시도) → 시군구 → 동 단계별 드릴다운

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { Hospital, Region, Department } from "@/types";
import {
  SUBWAY_REGIONS,
  LINE_BY_SLUG,
  linesByRegion,
  type SubwayLine,
} from "@/lib/stations";
import { HospitalListRow } from "./HospitalListRow";
import { HospitalQuickView } from "./HospitalQuickView";

type SortKey = "recommended" | "rating" | "reviews" | "visitors";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "추천순" },
  { key: "rating", label: "평점 높은순" },
  { key: "reviews", label: "리뷰 많은순" },
  { key: "visitors", label: "방문 많은순" },
];

/** 지역 선택 결과 — 시도/구/동 중 가장 구체적인 단위만 채워짐 */
interface RegionSelection {
  sido?: string;
  region?: string; // 시군구 slug
  dong?: string;
}

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
  const router = useRouter();

  // dept URL 파라미터는 한국어(nameKr, 예: "치과")로 노출하되 내부 상태/필터는 slug(dental) 유지.
  // URL에서 들어온 값이 한국어든 slug든 slug로 정규화.
  const normalizeDept = (v?: string): string | undefined => {
    if (!v) return undefined;
    if (departments.some((d) => d.slug === v)) return v;
    const byName = departments.find((d) => d.nameKr === v);
    return byName ? byName.slug : v;
  };

  const [sido, setSido] = useState<string | undefined>(initialSido);
  const [region, setRegion] = useState<string | undefined>(initialRegion);
  const [dong, setDong] = useState<string | undefined>(initialDong);
  // 역주변 필터 (지역 필터와 상호배타): line=노선 slug, station=역 slug(=역명)
  const [line, setLine] = useState<string | undefined>(initialLine);
  const [station, setStation] = useState<string | undefined>(initialStation);
  const [dept, setDept] = useState<string | undefined>(() => normalizeDept(initialDept));
  const [sort, setSort] = useState<SortKey>(
    SORT_OPTIONS.find((s) => s.key === initialSort)?.key ?? "recommended"
  );
  const [open, setOpen] = useState<null | "region" | "dept" | "sort">(null);
  const [quickView, setQuickView] = useState<string | null>(null);

  // ── 룩업 맵 ──────────────────────────────
  const deptMap = useMemo(
    () => new Map<string, string>(departments.map((d) => [d.slug, d.nameKr])),
    [departments]
  );
  const regionMap = useMemo(
    () => new Map(regions.map((r) => [r.slug, r])),
    [regions]
  );
  // 시군구 slug → 시도 slug (시도 단위 필터용)
  const guToSido = useMemo(
    () =>
      new Map<string, string>(
        regions
          .filter((r) => r.level === "sigungu" && r.parentSlug)
          .map((r) => [r.slug, r.parentSlug as string])
      ),
    [regions]
  );

  // ── URL 동기화 (공유·SEO용, 초기 렌더 제외) ──
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (sido) params.set("sido", sido);
    if (region) params.set("region", region);
    if (dong) params.set("dong", dong);
    if (line) params.set("line", line);
    if (station) params.set("station", station);
    if (dept) params.set("dept", deptMap.get(dept) ?? dept); // URL엔 한국어 진료과명
    if (sort !== "recommended") params.set("sort", sort);
    const qs = params.toString();
    const url = (qs ? `/hospitals?${qs}` : "/hospitals") as Route;
    router.replace(url, { scroll: false });
  }, [sido, region, dong, line, station, dept, sort, router]);

  // ── 필터 + 정렬 ──────────────────────────
  const results = useMemo(() => {
    let list = hospitals;
    // 역주변 필터(우선) — 지역 필터와 상호배타
    if (station) {
      list = list.filter((h) => h.nearestStationName === station);
    } else if (dong) list = list.filter((h) => h.dongSlug === dong);
    else if (region) list = list.filter((h) => h.regionSlug === region);
    else if (sido)
      list = list.filter((h) => guToSido.get(h.regionSlug) === sido);
    if (dept) list = list.filter((h) => h.departmentSlug === dept);

    const tierRank = (t: Hospital["tier"]) =>
      t === "HERITAGE" ? 0 : t === "PREMIUM" ? 1 : 2;

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        case "reviews":
          return b.reviewCount - a.reviewCount;
        case "visitors":
          return (b.monthlyVisitors ?? 0) - (a.monthlyVisitors ?? 0);
        default: // recommended
          return tierRank(a.tier) - tierRank(b.tier) || b.rating - a.rating;
      }
    });
    return sorted;
  }, [hospitals, sido, region, dong, station, dept, guToSido, sort]);

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

// ── 위치 모달 — 지역별 / 역주변 탭 ──────────────────
function LocationModal({
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

// ── 역주변 — 노선 → 역 드릴다운 ──────────────────
function StationPicker({
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

// ── 공용 프리미티브 ────────────────────────────
function TabBtn({
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

function Chip({
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

function RegionRow({
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

function Modal({
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
