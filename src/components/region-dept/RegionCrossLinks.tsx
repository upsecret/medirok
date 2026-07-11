import Link from "next/link";
import type { Route } from "next";
import type { Region, Department } from "@/types";
import { deptUrlName } from "@/lib/hospitals-data";

// 하단 내부링크 — 같은 진료과의 인근 구 + 같은 구의 다른 진료과
export function RegionCrossLinks({
  nearbyGus,
  otherDepts,
  sido,
  gu,
  dept,
  sidoName,
  regionName,
  regionFull,
  deptName,
}: {
  nearbyGus: Region[];
  otherDepts: Department[];
  sido: string;
  gu: string;
  dept: string;
  sidoName: string;
  regionName: string;
  regionFull: string;
  deptName: string;
}) {
  if (nearbyGus.length === 0 && otherDepts.length === 0) return null;
  return (
    <section className="bg-white py-6 border-t border-[var(--color-surface-border)]">
      <div className="container-page space-y-5">
        {nearbyGus.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2.5">
              {sidoName} 다른 지역 {deptName}
            </h2>
            <div className="flex gap-2 flex-wrap">
              {nearbyGus.map((g) => (
                <Link
                  key={g.slug}
                  href={`/hospitals/${sido}/${g.slug}/${dept}` as Route}
                  className="text-xs px-3 py-1.5 rounded-full border bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-400)]"
                >
                  {g.nameKr} {deptName}
                </Link>
              ))}
            </div>
          </div>
        )}
        {otherDepts.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2.5">
              {regionFull} 다른 진료과
            </h2>
            <div className="flex gap-2 flex-wrap">
              {otherDepts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/hospitals/${sido}/${gu}/${deptUrlName(d)}` as Route}
                  className="text-xs px-3 py-1.5 rounded-full border bg-white border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-400)]"
                >
                  {regionName} {d.nameKr}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
