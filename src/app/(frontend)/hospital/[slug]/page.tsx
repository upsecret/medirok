import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getHospitalBySlug,
  getDepartmentBySlug,
  getSimilarHospitals,
  getSidoRegion,
  getSigunguRegion,
  deptUrlName,
  decodeParam,
} from "@/lib/hospitals-data";
import { getMagazinesByDoctorSlugs } from "@/lib/magazines-data";
import { MedirokCertBox } from "@/components/MedirokCertBox";
import { HospitalCard } from "@/components/HospitalCard";
import { MagazineCard } from "@/components/MagazineCard";
import { JsonLd } from "@/components/JsonLd";
import { PriceSection } from "@/components/hospital-detail/PriceSection";
import { DoctorsSection } from "@/components/hospital-detail/DoctorsSection";
import { ReviewsSection } from "@/components/hospital-detail/ReviewsSection";
import { LocationHoursSection } from "@/components/hospital-detail/LocationHoursSection";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { medicalOrgSchema } from "@/lib/schema-generator";
import { fullRegionName, hospitalUrl } from "@/lib/local-seo";

// 병원 상세 — 30분 ISR 캐시. 어드민 변경 즉시 반영 필요 시 revalidatePath 권장.
export const revalidate = 1800;

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

  // 이 의원에 소속된 의사들이 쓴 매거진
  const doctorSlugs = hospital.doctors.map((d) => d.slug);
  const hospitalMagazines = await getMagazinesByDoctorSlugs(doctorSlugs);

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

  return (
    <>
      <JsonLd data={schemas} />

      <Breadcrumbs items={navItems} schemaItems={schemaItems} />

      <div className="bg-[var(--color-surface-border)] h-44 md:h-56 flex items-center justify-center relative">
        <span className="text-xs text-[var(--color-text-muted)]">의원 사진 (1 / 8)</span>
        <span className="absolute bottom-3 right-4 text-[10px] bg-black/60 text-white px-2 py-1 rounded-full">
          1 / 8
        </span>
      </div>

      <section className="bg-white py-5 border-b border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="flex gap-1.5 flex-wrap">
            {hospital.tier === "PREMIUM" && <span className="badge-premium">PREMIUM</span>}
            {hospital.certification && (
              <span className="badge-certified">
                메디록 4단계 인증
              </span>
            )}
            <span className="text-[10px] font-medium bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2 py-0.5 rounded">
              시니어 친화
            </span>
          </div>
          <h1 className="mt-2">{hospital.nameKr}</h1>
          <div className="flex gap-2 items-center mt-2 text-sm">
            <span className="font-medium">★ {hospital.rating}</span>
            <span className="text-[var(--color-text-muted)]">({hospital.reviewCount})</span>
            <span className="text-[var(--color-text-muted)]">·</span>
            <span className="text-[var(--color-success)]">● 진료 중</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {hospital.addressLine}
            {hospital.nearestStation && ` · ${hospital.nearestStation} 도보 ${hospital.walkingMinutes}분`}
          </p>
          {hospital.monthlyVisitors && (
            <p className="text-xs text-[var(--color-success)] mt-2">
              한 달간 메디록을 통해 {hospital.monthlyVisitors}명 방문완료
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-3 border-b border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="grid grid-cols-4 gap-1.5">
            <button className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md py-3 text-center">
              <span className="text-xl">📞</span>
              <p className="text-[10px] font-medium mt-1">전화</p>
            </button>
            <button className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md py-3 text-center">
              <span className="text-xl">📍</span>
              <p className="text-[10px] font-medium mt-1">길찾기</p>
            </button>
            <button className="bg-[var(--color-primary-600)] rounded-md py-3 text-center">
              <span className="text-xl">📅</span>
              <p className="text-[10px] font-medium text-white mt-1">예약</p>
            </button>
            <Link
              href="/estimate"
              className="bg-[var(--color-accent-400)] rounded-md py-3 text-center block"
            >
              <span className="text-xl">💎</span>
              <p className="text-[10px] font-medium text-[var(--color-text-on-gold)] mt-1">
                무료견적
              </p>
            </Link>
          </div>
        </div>
      </section>

      {hospital.certification && (
        <section className="py-5 bg-[var(--color-surface-bg)]">
          <div className="container-page">
            <MedirokCertBox cert={hospital.certification} />
          </div>
        </section>
      )}

      {hospital.curationNote && (
        <section className="py-5 bg-white border-y border-[var(--color-surface-border)]">
          <div className="container-page">
            <p className="editorial text-[10px] tracking-[0.1em] uppercase text-[var(--color-accent-600)] mb-2">
              CURATOR&apos;S NOTE
            </p>
            <blockquote className="editorial italic text-base leading-relaxed border-l-2 border-[var(--color-accent-400)] pl-4">
              &ldquo;{hospital.curationNote.text}&rdquo;
            </blockquote>
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
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
                  {hospital.nameKr} 의료진이 직접 쓴 글
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
