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

interface PageProps {
  params: Promise<{ sido: string; gu: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { sido: rawSido, gu: rawGu } = await params;
  const sido = decodeParam(rawSido);
  const gu = decodeParam(rawGu);
  const region = await getSigunguRegion(sido, gu);
  if (!region) return {};
  return {
    title: `${region.nameKr} 진료과별 병원찾기`,
    description: `${region.nameKr} 메디록 4단계 인증 병원을 진료과별로 찾아보세요.`,
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
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › <Link href="/hospitals">병원찾기</Link> ›{" "}
          <Link href={`/hospitals/${sido}`}>{sidoName}</Link> › {region.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-page">
          <h1>{region.nameKr} 진료과 선택</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            진료과를 선택하면 {region.nameKr}의 메디록 인증 병원을 비교할 수
            있습니다.
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
