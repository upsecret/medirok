import { notFound } from "next/navigation";
import Link from "next/link";
import { formatKRW } from "@/lib/data";
import {
  getHospitalBySlug,
  getDepartmentBySlug,
  getAllHospitals,
  getSidoRegion,
  getSigunguRegion,
  deptUrlName,
  decodeParam,
} from "@/lib/hospitals-data";
import { getMagazinesByDoctorSlugs } from "@/lib/magazines-data";
import { MedirokCertBox } from "@/components/MedirokCertBox";
import { HospitalCard } from "@/components/HospitalCard";
import { MagazineCard } from "@/components/MagazineCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const slug = decodeParam((await params).slug);
  const h = await getHospitalBySlug(slug);
  if (!h) return {};
  return {
    title: `${h.nameKr} · 메디록 인증 의원`,
    description: `${h.nameKr} 평점·가격·후기·시술 정보. ${h.certification?.stage1Detail ?? ""}`,
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
  const similar = (await getAllHospitals()).filter(
    (h) => h.departmentSlug === hospital.departmentSlug && h.slug !== hospital.slug
  );

  // 이 의원에 소속된 의사들이 쓴 매거진
  const doctorSlugs = hospital.doctors.map((d) => d.slug);
  const hospitalMagazines = await getMagazinesByDoctorSlugs(doctorSlugs);

  return (
    <>
      <nav className="bg-white border-b border-[var(--color-surface-border)] py-2">
        <div className="container-page text-xs text-[var(--color-text-muted)]">
          홈 › <Link href="/hospitals">병원찾기</Link>
          {sidoR && (
            <>
              {" › "}
              <Link href={`/hospitals/${sidoR.slug}`}>{sidoR.nameKr}</Link>
            </>
          )}
          {sidoR && guR && (
            <>
              {" › "}
              <Link href={`/hospitals/${sidoR.slug}/${guR.slug}`}>{guR.nameKr}</Link>
            </>
          )}
          {sidoR && guR && dept && (
            <>
              {" › "}
              <Link href={`/hospitals/${sidoR.slug}/${guR.slug}/${deptUrlName(dept)}`}>
                {dept.nameKr}
              </Link>
            </>
          )}
          {" › "}
          {hospital.nameKr}
        </div>
      </nav>

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

      <section className="py-5 bg-white border-b border-[var(--color-surface-border)]">
        <div className="container-page">
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-base font-medium">진료 / 가격</h2>
            <span className="text-xs text-[var(--color-text-muted)]">전체 보기 →</span>
          </div>
          <div className="space-y-3">
            {hospital.prices.map((p, i) => (
              <div
                key={i}
                className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-3"
              >
                <p className="text-sm font-medium">
                  {p.treatmentName}
                  {p.treatmentNote && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-2 font-normal">
                      {p.treatmentNote}
                    </span>
                  )}
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">정상가</span>
                    <span>
                      {formatKRW(p.normalLow)} ~ {formatKRW(p.normalHigh)}
                    </span>
                  </div>
                  {p.eventLow && p.eventHigh && (
                    <div className="flex justify-between pt-1.5 border-t border-[var(--color-surface-divider)]">
                      <span className="text-[var(--color-danger)] font-medium">이벤트가</span>
                      <span className="text-[var(--color-danger)] font-medium">
                        {formatKRW(p.eventLow)} ~ {formatKRW(p.eventHigh)}
                      </span>
                    </div>
                  )}
                  {p.insuranceNote && (
                    <div className="flex justify-between pt-1.5 border-t border-[var(--color-surface-divider)]">
                      <span className="text-[var(--color-text-muted)]">{p.insuranceNote}</span>
                      <span className="text-[var(--color-text-muted)]">로그인 후 확인</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hospital.doctors.length > 0 && (
        <section className="py-5 bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
          <div className="container-page">
            <h2 className="text-base font-medium mb-3">의료진 ({hospital.doctorCount}명)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {hospital.doctors.map((d) => (
                <div
                  key={d.slug}
                  className="bg-white rounded-md border border-[var(--color-surface-border)] p-3 text-center"
                >
                  <div className="w-12 h-12 bg-[var(--color-primary-600)] rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-[var(--color-accent-400)] text-base font-medium">
                      {d.nameKr[0]}
                    </span>
                  </div>
                  <p className="text-xs font-medium">{d.nameKr}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{d.title}</p>
                  {d.specialty && (
                    <p className="text-[10px] text-[var(--color-accent-600)] font-medium mt-0.5 leading-tight">
                      {d.specialty}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hospital.reviews.length > 0 && (
        <section className="py-5 bg-white border-b border-[var(--color-surface-border)]">
          <div className="container-page">
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="text-base font-medium">실방문 후기 ({hospital.reviewCount})</h2>
              <span className="text-xs text-[var(--color-text-muted)]">최신순 ▾</span>
            </div>
            <div className="space-y-2">
              {hospital.reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-3"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{"★".repeat(r.rating)}</span>
                      {r.isReceiptVerified && (
                        <span className="badge-certified text-[9px]">영수증</span>
                      )}
                      {r.isPhoneVerified && (
                        <span className="text-[9px] bg-[var(--color-info)] text-white px-1.5 py-0.5 rounded">
                          전화
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {r.reviewerName} · {r.visitedAt.slice(5)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{r.content}</p>
                  {(r.treatmentName || r.ageGroup) && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
                      {r.treatmentName} · {r.ageGroup}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hospital.hours && (
        <section className="py-5 bg-[var(--color-surface-bg)] border-b border-[var(--color-surface-border)]">
          <div className="container-page">
            <h2 className="text-base font-medium mb-3">위치 · 진료시간</h2>
            <div className="bg-[var(--color-surface-border)] h-24 rounded-md flex items-center justify-center mb-3">
              <span className="text-xs text-[var(--color-text-muted)]">📍 지도</span>
            </div>
            <p className="text-sm">{hospital.addressLine}</p>
            <table className="w-full text-xs mt-3">
              <tbody>
                <tr>
                  <td className="text-[var(--color-text-muted)] py-1">평일</td>
                  <td className="text-right py-1">{hospital.hours.weekday}</td>
                </tr>
                {hospital.hours.saturday && (
                  <tr>
                    <td className="text-[var(--color-text-muted)] py-1">토요일</td>
                    <td className="text-right py-1">{hospital.hours.saturday}</td>
                  </tr>
                )}
                {hospital.hours.sunday && (
                  <tr>
                    <td className="text-[var(--color-text-muted)] py-1">일/공휴일</td>
                    <td className="text-right py-1 text-[var(--color-danger)]">
                      {hospital.hours.sunday}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
