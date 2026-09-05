import Link from "next/link";

export const metadata = {
  title: "醫錄 4단계 의원 인증제",
  description: "메디록의 의원 인증 시스템 — 진료이력·후기·자격·시설 4단계 검증.",
};

const stages = [
  {
    num: "01",
    title: "진료 이력 검증",
    detail: "5년 이상 운영, 누적 시술 건수, 의료사고 이력 등을 검증합니다.",
  },
  {
    num: "02",
    title: "실방문자 후기 검증",
    detail: "영수증 인증 + 전화 인증을 거친 진짜 환자 후기만 수집합니다.",
  },
  {
    num: "03",
    title: "의료진 자격 검증",
    detail: "전문의 자격, 학력, 학회 활동, 논문 등 의료진의 전문성을 검증합니다.",
  },
  {
    num: "04",
    title: "시설·장비 검증",
    detail: "3D CT, 위생 등급, 시설 안전 등 환자 안전 기준을 검증합니다.",
  },
];

export default function VerificationPage() {
  return (
    <>
      <section className="bg-[var(--color-primary-800)] py-14 md:py-20">
        <div className="container-content text-center">
          <p className="eyebrow !text-[var(--color-accent-300)]">
            MEDIROK CERTIFICATION
          </p>
          <h1 className="editorial mt-4 text-white">
            병원을 살펴보는 메디록의 기준
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-primary-200)]">
            모든 의원은 진료이력·실방문 후기·의료진 자격·시설장비 4단계 검증을
            통과해야 등재됩니다. 메디록이 무엇을 어떻게 확인하는지 그대로 공개합니다.
          </p>
        </div>
      </section>

      <section className="section-space bg-[var(--color-surface-bg)]">
        <div className="container-content">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {stages.map((s) => (
              <article
                key={s.num}
                className="rounded-2xl border border-[var(--color-surface-border)] bg-white p-6 md:p-8"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="hanja text-3xl text-[var(--color-accent-400)] shrink-0 leading-none"
                    style={{ width: "1.4em", textAlign: "center" }}
                  >
                    {s.num}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space border-t border-[var(--color-surface-border)] bg-white">
        <div className="container-content">
          <h2 className="editorial mb-4">
            메디록 큐레이션은 무엇이
            다른가요?
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
            4단계 인증을 통과한 의원 중 추가 큐레이터 심사를 거쳐 선정됩니다. 임상 경험,
            환자 만족도, 의료진 전문성을 종합 평가하며, 분과·지역별로 3~5곳만
            선정합니다.
          </p>

          <div className="mt-8 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-6 md:p-8">
            <h2 className="text-2xl font-semibold">인증을 신청하시는 병원이라면</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
              신청 접수 → 서류 검증 → 실사·후기 검증 → 등재 순으로 진행됩니다.
              의원 정보를 남겨주시면 담당자가 절차를 안내드립니다.
            </p>
            <Link href="/verification/apply" className="btn-accent inline-block mt-4 text-sm">
              <span className="hanja">醫錄</span> 인증제 신청하기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
