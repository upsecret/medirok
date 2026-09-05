import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSigunguRegion,
  getSidoRegion,
  getAllDepartments,
  deptUrlName,
  decodeParam,
} from "@/lib/hospitals-data";
import { DepartmentIcon } from "@/components/DepartmentIcon";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { fullRegionName } from "@/lib/local-seo";
import { getRegionRouteParams } from "@/lib/route-params";

export const revalidate = 1800;

// 없으면 위 revalidate가 무시된다 — route-params.ts 주석 참고.
export async function generateStaticParams() {
  return (await getRegionRouteParams()).gu;
}

interface PageProps {
  params: Promise<{ sido: string; gu: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { sido: rawSido, gu: rawGu } = await params;
  const sido = decodeParam(rawSido);
  const gu = decodeParam(rawGu);
  const [region, sidoRegion] = await Promise.all([
    getSigunguRegion(sido, gu),
    getSidoRegion(sido),
  ]);
  if (!region) return {};
  const regionFull = fullRegionName(sidoRegion?.nameKr ?? sido, region.nameKr);
  return {
    title: `${regionFull} 진료과별 병원찾기`,
    description: `${regionFull} 메디록 4단계 인증 병원을 진료과별로 찾아보세요.`,
    alternates: { canonical: `/hospitals/${sido}/${gu}` },
  };
}

export default async function GuPage({ params }: PageProps) {
  const { sido: rawSido, gu: rawGu } = await params;
  const sido = decodeParam(rawSido);
  const gu = decodeParam(rawGu);
  const region = await getSigunguRegion(sido, gu);
  if (!region || region.level !== "sigungu") notFound();

  const [departments, sidoRegion] = await Promise.all([
    getAllDepartments(),
    getSidoRegion(sido),
  ]);
  const sidoName = sidoRegion?.nameKr ?? sido;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "홈", path: "/" },
          { name: "병원찾기", path: "/hospitals", link: true },
          { name: sidoName, path: `/hospitals/${sido}`, link: true },
          { name: region.nameKr, path: `/hospitals/${sido}/${gu}` },
        ]}
      />

      <section className="section-space bg-[var(--color-surface-bg)]">
        <div className="container-page">
          <p className="eyebrow">DEPARTMENT</p>
          <h1 className="editorial mt-3">{sidoName} {region.nameKr} 진료과 선택</h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
            진료과를 선택하면 {sidoName} {region.nameKr}의 메디록 인증 병원을
            비교할 수 있습니다.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {departments.map((dept) => (
              <Link
                key={dept.slug}
                href={`/hospitals/${sido}/${gu}/${deptUrlName(dept)}`}
                className="card-lift rounded-xl border border-[var(--color-surface-border)] bg-white p-5 text-center"
              >
                <DepartmentIcon
                  slug={dept.slug}
                  size={34}
                  className="text-[var(--color-primary-600)] mx-auto"
                />
                <p className="mt-3 text-base font-semibold text-[var(--color-text-primary)]">
                  {dept.nameKr}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
