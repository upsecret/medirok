import { notFound } from "next/navigation";
import { CurationCard } from "@/components/CurationCard";
import { HospitalCard } from "@/components/HospitalCard";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqBlock } from "@/components/FaqBlock";
import { DongFilterChips } from "@/components/region-dept/DongFilterChips";
import { RegionCrossLinks } from "@/components/region-dept/RegionCrossLinks";
import { itemListSchema, faqPageSchema } from "@/lib/schema-generator";
import {
  fullRegionName,
  hospitalUrl,
  regionDeptUrl,
  regionDeptIntro,
  regionDeptFaqs,
} from "@/lib/local-seo";
import {
  getDepartmentByUrlName,
  getSigunguRegion,
  getSidoRegion,
  getChildRegions,
  getHospitalsByDeptAndRegion,
  getAllDepartments,
  decodeParam,
} from "@/lib/hospitals-data";

// SEO 리스트 페이지 — 30분 ISR 캐시(크롤 효율·LCP 개선).
// 어드민 변경 즉시 반영이 필요하면 Payload afterChange 훅에서 revalidatePath 호출 권장.
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ sido: string; gu: string; dept: string }>;
  searchParams: Promise<{ dong?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { sido: rawSido, gu: rawGu, dept: rawDept } = await params;
  const sido = decodeParam(rawSido);
  const gu = decodeParam(rawGu);
  const dept = decodeParam(rawDept);
  const { dong } = await searchParams;

  const [department, region, sidoRegion] = await Promise.all([
    getDepartmentByUrlName(dept),
    getSigunguRegion(sido, gu),
    getSidoRegion(sido),
  ]);
  if (!department || !region) return {};

  const sidoName = sidoRegion?.nameKr ?? sido;
  const regionFull = fullRegionName(sidoName, region.nameKr);
  const hospitals = await getHospitalsByDeptAndRegion(department.slug, gu, sido);
  const count = hospitals.length;
  const canonical = regionDeptUrl(sido, gu, dept);

  // 동(洞) 필터(?dong=)는 본문이 거의 동일 → canonical을 전체 페이지로 고정 + noindex.
  // 등록 병원이 없는 빈약 페이지도 색인 품질 보호 차원에서 noindex.
  const isThinOrFiltered = Boolean(dong) || count === 0;

  const countLabel = count > 0 ? ` ${count}곳` : "";
  return {
    title: `${regionFull} ${department.nameKr} 추천 | 메디록 인증 병원${countLabel}`,
    description: `${regionFull} ${department.nameKr} 메디록 4단계 인증 병원${countLabel}. 정상가·이벤트가와 실방문 후기, 야간·주말 진료를 비교하고 가까운 ${department.nameKr}을(를) 찾으세요.`,
    alternates: { canonical },
    openGraph: {
      title: `${regionFull} ${department.nameKr} 추천 | 메디록`,
      description: `${regionFull} 메디록 4단계 인증 ${department.nameKr}${countLabel}을(를) 비교하세요.`,
      url: canonical,
      type: "website",
    },
    robots: isThinOrFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function HospitalListPage({ params, searchParams }: PageProps) {
  const { sido: rawSido, gu: rawGu, dept: rawDept } = await params;
  const sido = decodeParam(rawSido);
  const gu = decodeParam(rawGu);
  const dept = decodeParam(rawDept);
  const { dong } = await searchParams;

  const [department, region, sidoRegion, dongs, allDepartments, siblingGus] =
    await Promise.all([
      getDepartmentByUrlName(dept),
      getSigunguRegion(sido, gu),
      getSidoRegion(sido),
      getChildRegions(gu),
      getAllDepartments(),
      getChildRegions(sido),
    ]);
  if (!department || !region || region.level !== "sigungu") notFound();

  const sidoName = sidoRegion?.nameKr ?? sido;
  const regionFull = fullRegionName(sidoName, region.nameKr);
  let hospitals = await getHospitalsByDeptAndRegion(department.slug, gu, sido);

  // 인트로 카피·FAQ는 동 필터와 무관하게 지역 전체 기준으로 산출(일관성).
  const introCopy = regionDeptIntro(sidoName, region.nameKr, department.nameKr, hospitals.length);
  const faqs = regionDeptFaqs(sidoName, region.nameKr, department.nameKr, hospitals);

  const activeDong = dong && dongs.some((d) => d.slug === dong) ? dong : undefined;
  if (activeDong) hospitals = hospitals.filter((h) => h.dongSlug === activeDong);

  const curated = hospitals.filter((h) => h.tier === "PREMIUM" && h.curationNote);
  const standard = hospitals;
  const base = `/hospitals/${sido}/${gu}/${dept}`;

  // 같은 진료과의 인근 구(시·도 내) — 내부링크
  const nearbyGus = siblingGus.filter((g) => g.slug !== gu).slice(0, 6);
  // 같은 구의 다른 진료과 — 내부링크
  const otherDepts = allDepartments.filter((d) => d.slug !== department.slug).slice(0, 8);

  // ── JSON-LD (AEO/GEO) — BreadcrumbList는 <Breadcrumbs>가 주입 ──
  const schemas: Record<string, unknown>[] = [];
  if (standard.length > 0) {
    schemas.push(
      itemListSchema({
        name: `${regionFull} ${department.nameKr} 메디록 인증 병원`,
        items: standard.map((h) => ({
          name: h.nameKr,
          url: hospitalUrl(h.slug),
          description: h.shortDescription,
        })),
      })
    );
  }
  if (faqs.length > 0) schemas.push(faqPageSchema(faqs));

  return (
    <>
      <JsonLd data={schemas} />
      <Breadcrumbs
        items={[
          { name: "홈", path: "/" },
          { name: "병원찾기", path: "/hospitals", link: true },
          { name: sidoName, path: `/hospitals/${sido}`, link: true },
          { name: region.nameKr, path: `/hospitals/${sido}/${gu}`, link: true },
          { name: department.nameKr, path: base },
        ]}
      />

      <section className="bg-[var(--color-surface-bg)] py-6">
        <div className="container-page">
          <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
            {regionFull} · <span className="hanja">{department.hanja}</span>{" "}
            {department.nameKr}
          </span>
          <h1>
            {regionFull} {department.nameKr}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2.5 leading-relaxed max-w-2xl">
            {introCopy}
          </p>

          <DongFilterChips dongs={dongs} base={base} activeDong={activeDong} />
        </div>
      </section>

      {curated.length > 0 && (
        <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
          <div className="container-page">
            <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-600)] mb-1">
              TIER 01 · MEDIROK CURATION
            </p>
            <h2 className="editorial mb-4">
              {regionFull} {department.nameKr} 메디록 큐레이션
            </h2>
            <div className="space-y-3">
              {curated.map((h) => (
                <CurationCard key={h.slug} hospital={h} size="lg" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-text-muted)]">
            TIER 02 · DIRECTORY
          </p>
          <div className="flex justify-between items-baseline mt-1 mb-4">
            <h2 className="text-base font-medium">
              전체 메디록 인증 병원 ({standard.length})
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">방문 많은 순 ▾</span>
          </div>
          {standard.length > 0 ? (
            <div className="space-y-2">
              {standard.map((h) => (
                <HospitalCard key={h.slug} hospital={h} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
              해당 지역·진료과에 등록된 메디록 인증 병원이 아직 없습니다.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-6 border-t border-[var(--color-surface-border)]">
        <div className="container-page">
          <FaqBlock faqs={faqs} defaultOpenFirst={false} className="" />
        </div>
      </section>

      <RegionCrossLinks
        nearbyGus={nearbyGus}
        otherDepts={otherDepts}
        sido={sido}
        gu={gu}
        dept={dept}
        sidoName={sidoName}
        regionName={region.nameKr}
        regionFull={regionFull}
        deptName={department.nameKr}
      />
    </>
  );
}
