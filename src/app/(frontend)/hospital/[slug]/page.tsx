import { notFound } from "next/navigation";
import {
  getHospitalBySlug,
  getDepartmentBySlug,
  getSimilarHospitals,
  getSidoRegion,
  getSigunguRegion,
  deptUrlName,
  decodeParam,
} from "@/lib/hospitals-data";
import {
  getMagazinesByDoctorSlugs,
  getMagazinesByHospital,
} from "@/lib/magazines-data";
import { MedirokCertBox } from "@/components/MedirokCertBox";
import { HospitalCard } from "@/components/HospitalCard";
import { HospitalImage } from "@/components/HospitalImage";
import { MagazineCard } from "@/components/MagazineCard";
import { JsonLd } from "@/components/JsonLd";
import { PriceSection } from "@/components/hospital-detail/PriceSection";
import { DoctorsSection } from "@/components/hospital-detail/DoctorsSection";
import { ReviewsSection } from "@/components/hospital-detail/ReviewsSection";
import { LocationHoursSection } from "@/components/hospital-detail/LocationHoursSection";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { medicalOrgSchema } from "@/lib/schema-generator";
import { fullRegionName, hospitalUrl } from "@/lib/local-seo";
import { getHospitalRouteParams } from "@/lib/route-params";

// 병원 상세 — 30분 ISR 캐시. 시드 직후 반영은 /revalidate 엔드포인트가 담당한다.
export const revalidate = 1800;

// 없으면 위 revalidate가 무시된다 — route-params.ts 주석 참고.
export async function generateStaticParams() {
  return getHospitalRouteParams();
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const slug = decodeParam((await params).slug);
  const h = await getHospitalBySlug(slug);
  if (!h) return {};
  const dept = await getDepartmentBySlug(h.departmentSlug);
  const deptLabel = dept ? ` ${dept.nameKr}` : "";
  const canonical = `/hospital/${slug}`;
  const desc = `${h.nameKr}${deptLabel} 평점·가격·후기·시술 정보. ${h.addressLine}. ${
    h.certification?.stage1Detail ?? "메디록 4단계 인증 의원."
  }`;
  return {
    title: `${h.nameKr} · 메디록 인증${deptLabel} 의원`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${h.nameKr} · 메디록 인증 의원`,
      description: desc,
      url: canonical,
      type: "website",
    },
  };
}

export default async function HospitalDetailPage({ params }: PageProps) {
  const slug = decodeParam((await params).slug);
  const hospital = await getHospitalBySlug(slug);
  if (!hospital) notFound();
  const dept = await getDepartmentBySlug(hospital.departmentSlug);
  // 시/도까지 스코프해 구 이름 중복(예: 여러 도시의 '서구')도 정확히 해석
  const sidoSlug = hospital.sidoSlug ?? "";
  const [sidoR, guR] = await Promise.all([
    sidoSlug ? getSidoRegion(sidoSlug) : Promise.resolve(undefined),
    getSigunguRegion(sidoSlug, hospital.regionSlug),
  ]);
  const similar = await getSimilarHospitals(hospital.departmentSlug, hospital.slug);

  // 이 의원과 연결된 매거진 — 소속 의사가 저자인 글 + linkedHospitals로 연결된 글
  // (지역 가이드류는 저자가 큐레이션팀이라 linkedHospitals로만 잡힌다)
  const doctorSlugs = hospital.doctors.map((d) => d.slug);
  const [byDoctor, byHospital] = await Promise.all([
    getMagazinesByDoctorSlugs(doctorSlugs),
    getMagazinesByHospital(hospital.slug),
  ]);
  const hospitalMagazines = [
    ...byDoctor,
    ...byHospital.filter((m) => !byDoctor.some((d) => d.slug === m.slug)),
  ];

  // ── 브레드크럼 — nav + BreadcrumbList JSON-LD는 <Breadcrumbs>가 렌더 ──
  const navItems: Crumb[] = [
    { name: "홈", path: "/" },
    { name: "병원찾기", path: "/hospitals", link: true },
    ...(sidoR
      ? [{ name: sidoR.nameKr, path: `/hospitals/${sidoR.slug}`, link: true }]
      : []),
    ...(sidoR && guR
      ? [{ name: guR.nameKr, path: `/hospitals/${sidoR.slug}/${guR.slug}`, link: true }]
      : []),
    ...(sidoR && guR && dept
      ? [
          {
            name: dept.nameKr,
            path: `/hospitals/${sidoR.slug}/${guR.slug}/${deptUrlName(dept)}`,
            link: true,
          },
        ]
      : []),
    { name: hospital.nameKr, path: `/hospital/${hospital.slug}` },
  ];
  // 스키마에는 진료과 항목 제외 (기존 동작 유지: 홈›병원찾기›시도›구›병원명)
  const schemaItems = [
    { name: "홈", path: "/" },
    { name: "병원찾기", path: "/hospitals" },
    ...(sidoR ? [{ name: sidoR.nameKr, path: `/hospitals/${sidoR.slug}` }] : []),
    ...(sidoR && guR
      ? [{ name: guR.nameKr, path: `/hospitals/${sidoR.slug}/${guR.slug}` }]
      : []),
    { name: hospital.nameKr, path: `/hospital/${hospital.slug}` },
  ];

  const schemas: Record<string, unknown>[] = [
    medicalOrgSchema({
      name: hospital.nameKr,
      url: hospitalUrl(hospital.slug),
      address:
        sidoR && guR
          ? `${fullRegionName(sidoR.nameKr, guR.nameKr)} ${hospital.addressLine}`
          : hospital.addressLine,
      phone: hospital.phone,
      rating: hospital.rating > 0 ? hospital.rating : undefined,
      reviewCount: hospital.reviewCount > 0 ? hospital.reviewCount : undefined,
      medicalSpecialty: dept?.nameKr,
    }),
  ];
  const phoneHref = hospital.phone
    ? `tel:${hospital.phone.replace(/[^0-9+]/g, "")}`
    : undefined;
  const mapHref = `https://map.naver.com/p/search/${encodeURIComponent(
    `${hospital.nameKr} ${hospital.addressLine}`
  )}`;

  return (
    <>
      <JsonLd data={schemas} />

      <Breadcrumbs items={navItems} schemaItems={schemaItems} />

      <section className="bg-white pb-10 pt-5 md:pb-16 md:pt-8">
        <div className="container-page grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <HospitalImage
            hospital={hospital}
            priority
            className="aspect-[16/10] rounded-2xl sm:min-h-[260px] lg:aspect-auto"
          />
          <div className="flex flex-col justify-center py-2 lg:px-5">
            <div className="flex flex-wrap gap-2">
              {hospital.certification && <span className="badge-certified">메디록 4단계 인증</span>}
              {dept && (
                <span className="rounded-full bg-[var(--color-accent-100)] px-3 py-1 text-xs font-semibold text-[var(--color-accent-700)]">
                  {dept.nameKr}
                </span>
              )}
            </div>
            <h1 className="editorial mt-5">{hospital.nameKr}</h1>
            {hospital.shortDescription && (
              <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                {hospital.shortDescription}
              </p>
            )}
            <p className="mt-5 text-base text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                <span className="text-[var(--color-warning)]">★</span> {hospital.rating}
              </span>
              <span className="text-[var(--color-text-muted)]"> · 후기 {hospital.reviewCount}개</span>
            </p>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              {hospital.addressLine}
              {hospital.nearestStation && ` · ${hospital.nearestStation} 도보 ${hospital.walkingMinutes}분`}
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {phoneHref ? (
                <a href={phoneHref} className="btn-primary inline-flex items-center justify-center">전화 상담</a>
              ) : (
                <span className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-surface-bg2)] px-4 text-sm text-[var(--color-text-muted)]">
                  전화번호 미등록
                </span>
              )}
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center justify-center">
                지도에서 보기
              </a>
            </div>
          </div>
        </div>
      </section>

      {hospital.certification && (
        <section className="section-space bg-[var(--color-surface-bg)]">
          <div className="container-page max-w-5xl">
            <MedirokCertBox cert={hospital.certification} />
          </div>
        </section>
      )}

      {hospital.curationNote && (
        <section className="section-space border-y border-[var(--color-surface-border)] bg-white">
          <div className="container-content">
            <p className="eyebrow mb-3">CURATOR&apos;S NOTE · 선정 이유</p>
            <blockquote className="editorial border-l-2 border-[var(--color-accent-400)] pl-5 text-xl leading-relaxed md:text-2xl">
              {hospital.curationNote.text}
            </blockquote>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              — 메디록 큐레이터 {hospital.curationNote.curatorName}
              {hospital.curationNote.curatorTitle && ` (${hospital.curationNote.curatorTitle})`}
            </p>
          </div>
        </section>
      )}

      <PriceSection hospital={hospital} />

      <DoctorsSection hospital={hospital} />

      <ReviewsSection hospital={hospital} />

      <LocationHoursSection hospital={hospital} />

      {hospitalMagazines.length > 0 && (
        <section className="py-6 bg-white border-b border-[var(--color-surface-border)]">
          <div className="container-page">
            <div className="flex justify-between items-baseline mb-3">
              <div>
                <p className="text-[10px] tracking-[0.08em] uppercase text-[var(--color-accent-600)] font-medium">
                  메디록 · 의원 매거진
                </p>
                <h2 className="text-base font-medium mt-1">
                  {hospital.nameKr} 관련 메디록 매거진
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {hospitalMagazines.length}편
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitalMagazines.map((m) => (
                <MagazineCard key={m.slug} magazine={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="py-5 bg-white">
          <div className="container-page">
            <h2 className="text-base font-medium mb-3">
              비슷한 메디록 의원
            </h2>
            <div className="space-y-2">
              {similar.slice(0, 3).map((h) => (
                <HospitalCard key={h.slug} hospital={h} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
