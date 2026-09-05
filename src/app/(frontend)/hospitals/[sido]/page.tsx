import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegionBySlug, getChildRegions, decodeParam } from "@/lib/hospitals-data";
import { getRegionRouteParams } from "@/lib/route-params";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const revalidate = 1800;

// generateStaticParams가 없으면 Next가 prerender 매니페스트에 항목을 만들지 않아
// 위 revalidate 선언이 통째로 무시된다(운영에서 no-store로 나가고 있었다).
export async function generateStaticParams() {
  return (await getRegionRouteParams()).sido;
}

interface PageProps {
  params: Promise<{ sido: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const sido = decodeParam((await params).sido);
  const region = await getRegionBySlug(sido);
  if (!region) return {};
  return {
    title: `${region.nameKr} 병원찾기`,
    description: `${region.nameKr} 메디록 4단계 인증 병원을 시·군·구별로 찾아보세요.`,
    alternates: { canonical: `/hospitals/${sido}` },
  };
}

export default async function SidoPage({ params }: PageProps) {
  const sido = decodeParam((await params).sido);
  const region = await getRegionBySlug(sido);
  if (!region || region.level !== "sido") notFound();

  const gus = await getChildRegions(sido);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "홈", path: "/" },
          { name: "병원찾기", path: "/hospitals", link: true },
          { name: region.nameKr, path: `/hospitals/${sido}` },
        ]}
      />

      <section className="section-space bg-[var(--color-surface-bg)]">
        <div className="container-page">
          <p className="eyebrow">REGION</p>
          <h1 className="editorial mt-3">{region.nameKr}에서 병원 찾기</h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
            시·군·구를 선택하면 해당 지역의 전체 진료과를 볼 수 있습니다.
          </p>

          {gus.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {gus.map((g) => (
                <Link
                  key={g.slug}
                  href={`/hospitals/${sido}/${g.slug}`}
                  className="card-lift flex min-h-16 items-center justify-center rounded-xl border border-[var(--color-surface-border)] bg-white px-3 text-center"
                >
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">
                    {g.nameKr}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-[var(--color-text-muted)] text-center py-10">
              아직 준비 중인 지역입니다. 곧 메디록 인증 병원을 만나보실 수 있습니다.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
