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

export const revalidate = 1800;

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

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-page">
          <h1>{sidoName} {region.nameKr} 진료과 선택</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            진료과를 선택하면 {sidoName} {region.nameKr}의 메디록 인증 병원을
            비교할 수 있습니다.
          </p>

          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {departments.map((dept) => (
              <Link
                key={dept.slug}
                href={`/hospitals/${sido}/${gu}/${deptUrlName(dept)}`}
                className="bg-white rounded-md p-3 text-center transition border border-[var(--color-surface-border)] hover:border-[var(--color-accent-400)]"
              >
                <DepartmentIcon
                  slug={dept.slug}
                  size={26}
                  className="text-[var(--color-primary-600)] mx-auto"
                />
                <p className="text-[11px] font-medium text-[var(--color-text-primary)] mt-1.5">
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
