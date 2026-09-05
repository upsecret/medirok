import Link from "next/link";
import type { Route } from "next";
import { CurationCard } from "@/components/CurationCard";
import { HomeHospitalSearch } from "@/components/HomeHospitalSearch";
import { MagazineCard } from "@/components/MagazineCard";
import {
  getAllDepartments,
  getAllHospitals,
  getAllRegions,
  getCurationHospitals,
} from "@/lib/hospitals-data";
import { getAllMagazines } from "@/lib/magazines-data";

export const revalidate = 1800;

const verificationSteps = [
  { number: "01", title: "진료 이력", body: "운영 이력과 공개된 진료 정보를 살펴봅니다." },
  { number: "02", title: "방문 후기", body: "실제 방문을 확인할 수 있는 후기를 구분합니다." },
  { number: "03", title: "의료진 자격", body: "전문의 자격과 주요 진료 분야를 확인합니다." },
  { number: "04", title: "시설과 장비", body: "환자 안전과 진료에 필요한 환경을 확인합니다." },
];

export default async function HomePage() {
  const [curated, allHospitals, magazines, regions, departments] = await Promise.all([
    getCurationHospitals(3),
    getAllHospitals(),
    getAllMagazines(),
    getAllRegions(),
    getAllDepartments(),
  ]);
  const recentMagazines = magazines
    .filter((magazine) => magazine.type !== "qna")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--color-primary-800)] text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_82%_25%,#B89968_0,transparent_28%)]" />
        <div className="container-page relative py-14 md:py-24">
          <div className="max-w-4xl">
            <p className="eyebrow !text-[var(--color-accent-300)]">MEDIROK · 의료 선택의 기준</p>
            <h1 className="editorial mt-4 !text-white">
              나와 가족의 병원 선택,<br className="hidden sm:block" /> 기록을 보고 결정하세요.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-100)] md:text-xl">
              광고 문구보다 확인 가능한 정보를 먼저 봅니다. 지역과 진료과를 선택해
              메디록이 살펴본 병원을 비교해 보세요.
            </p>
          </div>
          <HomeHospitalSearch regions={regions} departments={departments} />
          <p className="mt-4 text-sm text-[var(--color-primary-300)]">
            현재 등록 병원 {allHospitals.length}곳 · 조건을 선택하지 않아도 전체 병원을 볼 수 있습니다.
          </p>
        </div>
      </section>

      <section className="section-space bg-[var(--color-surface-bg)]">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">MEDIROK CURATION</p>
              <h2 className="editorial mt-3">메디록이 직접 살펴본 병원</h2>
              <p className="mt-3 max-w-2xl text-base text-[var(--color-text-secondary)] md:text-lg">
                인증 항목과 의료진, 진료 환경을 확인한 뒤 선택한 병원입니다.
              </p>
            </div>
            <Link href="/hospitals" className="text-base font-semibold text-[var(--color-accent-700)]">
              모든 병원 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>

          {curated.length > 0 ? (
            <div className="mt-8 space-y-5">
              <CurationCard hospital={curated[0]} size="lg" />
              {curated.length === 2 && <CurationCard hospital={curated[1]} size="lg" />}
              {curated.length > 2 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {curated.slice(1).map((hospital) => (
                    <CurationCard key={hospital.slug} hospital={hospital} size="sm" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-[var(--color-surface-border)] bg-white p-8 text-center">
              <p className="text-[var(--color-text-secondary)]">선정 병원을 준비하고 있습니다.</p>
              <Link href="/hospitals" className="btn-primary mt-5 inline-flex items-center">등록 병원 보기</Link>
            </div>
          )}
        </div>
      </section>

      <section className="section-space border-y border-[var(--color-surface-border)] bg-white">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="eyebrow">BEFORE YOUR VISIT</p>
              <h2 className="editorial mt-3">병원 선택 전 읽어볼 가이드</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                시술 이름보다 선택 기준을 먼저 설명합니다. 의료진과 메디록 편집팀이
                정리한 글을 확인해 보세요.
              </p>
              <Link href={"/magazine" as Route} className="btn-outline mt-6 inline-flex items-center">매거진 전체 보기</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {recentMagazines.map((magazine, index) => (
                <div key={magazine.slug} className={index === 0 ? "sm:col-span-2" : ""}>
                  <MagazineCard magazine={magazine} size={index === 0 ? "lg" : "sm"} priority={index === 0} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-[var(--color-primary-800)] text-white">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow !text-[var(--color-accent-300)]">MEDIROK VERIFICATION</p>
            <h2 className="editorial mt-3 !text-white">무엇을 확인했는지 공개합니다</h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-primary-200)]">
              ‘좋은 병원’이라는 말 대신, 메디록이 확인한 항목을 병원 상세에서 직접 볼 수 있습니다.
            </p>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 md:grid-cols-4">
            {verificationSteps.map((step) => (
              <article key={step.number} className="bg-[var(--color-primary-800)] p-6 md:p-7">
                <p className="editorial text-2xl text-[var(--color-accent-300)]">{step.number}</p>
                <h3 className="mt-4 !text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-primary-200)]">{step.body}</p>
              </article>
            ))}
          </div>
          <Link href="/verification" className="btn-accent mt-8 inline-flex items-center">인증 기준 자세히 보기</Link>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-page flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">병원 관계자이신가요?</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">메디록 인증 및 등재 절차를 안내해 드립니다.</p>
          </div>
          <Link href="/verification/apply" className="text-sm font-semibold text-[var(--color-accent-700)]">
            인증 신청 안내 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
