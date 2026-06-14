import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegionBySlug, getChildRegions, decodeParam } from "@/lib/hospitals-data";

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
  };
}

export default async function SidoPage({ params }: PageProps) {
  const sido = decodeParam((await params).sido);
  const region = await getRegionBySlug(sido);
  if (!region || region.level !== "sido") notFound();

  const gus = await getChildRegions(sido);

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › <Link href="/hospitals">병원찾기</Link> › {region.nameKr}
        </div>
      </nav>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-page">
          <h1>{region.nameKr} 시·군·구</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            시·군·구를 선택하면 해당 지역의 전체 진료과를 볼 수 있습니다.
          </p>

          {gus.length > 0 ? (
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {gus.map((g) => (
                <Link
                  key={g.slug}
                  href={`/hospitals/${sido}/${g.slug}`}
                  className="bg-white rounded-md py-3.5 text-center border border-[var(--color-surface-border)] hover:border-[var(--color-accent-400)] transition"
                >
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
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
