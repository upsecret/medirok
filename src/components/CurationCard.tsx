// TIER 1 — 메디록 큐레이션 카드 (매거진 톤)

import Link from "next/link";
import type { Route } from "next";
import type { Hospital } from "@/types";
import { getDepartmentBySlug } from "@/lib/hospitals-data";
import { HospitalImage } from "./HospitalImage";

interface CurationCardProps {
  hospital: Hospital;
  size?: "lg" | "sm";
}

export async function CurationCard({ hospital, size = "lg" }: CurationCardProps) {
  const dept = await getDepartmentBySlug(hospital.departmentSlug);
  const isLarge = size === "lg";

  return (
    <article className={`group tier1-card card-lift overflow-hidden ${isLarge ? "grid lg:grid-cols-[1.05fr_1fr]" : ""}`}>
      <HospitalImage
        hospital={hospital}
        priority={isLarge}
        className={isLarge ? "aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px]" : "aspect-[16/9]"}
      />
      <div className={isLarge ? "flex flex-col p-6 md:p-8" : "p-5"}>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{dept?.nameKr} · MEDIROK PICK</p>
          <span className="rounded-full bg-[var(--color-primary-700)] px-3 py-1 text-xs font-semibold text-[var(--color-accent-300)]">
            메디록 선정
          </span>
        </div>
        <h3 className={`editorial mt-3 ${isLarge ? "text-3xl" : "text-2xl"}`}>
          {hospital.nameKr}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {hospital.shortDescription || hospital.certification?.stage1Detail}
        </p>

      {hospital.curationNote && (
        <div className="mt-5 border-l-2 border-[var(--color-accent-400)] pl-4">
          <p className="text-sm font-semibold text-[var(--color-accent-700)]">선정 이유</p>
          <p className={`mt-2 text-base leading-relaxed text-[var(--color-text-primary)] ${isLarge ? "line-clamp-4" : "line-clamp-3"}`}>
            {hospital.curationNote.text}
          </p>
        </div>
      )}

        <div className={`mt-auto flex items-center justify-between gap-3 ${hospital.curationNote ? "pt-6" : "pt-5"}`}>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-warning)]">★</span> {hospital.rating} · 후기 {hospital.reviewCount}개
          </p>
          <Link href={`/hospital/${hospital.slug}` as Route} className="inline-flex min-h-12 items-center rounded-lg bg-[var(--color-primary-700)] px-5 text-sm font-semibold text-white">
            상세 보기 <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
