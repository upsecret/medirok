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
      <section className="bg-[var(--color-primary-600)] py-10">
        <div className="container-content text-center">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-400)]">
            MEDIROK CERTIFICATION
          </p>
          <h1 className="editorial text-white mt-2">
            <span className="hanja">醫錄</span> 4단계 의원 인증제
          </h1>
          <p className="text-[var(--color-accent-300)] text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            모든 의원은 진료이력·실방문 후기·의료진 자격·시설장비 4단계 검증을
            통과해야 등재됩니다. 사용자가 신뢰할 의원을 직접 고를 수 있도록.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stages.map((s) => (
              <article
                key={s.num}
                className="bg-white border border-[var(--color-accent-400)] rounded-md p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="hanja text-3xl text-[var(--color-accent-400)] shrink-0 leading-none"
                    style={{ width: "1.4em", textAlign: "center" }}
                  >
                    {s.num}
                  </span>
                  <div>
                    <h3 className="text-base font-medium">{s.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 border-t border-[var(--color-surface-border)]">
        <div className="container-content">
          <h2 className="text-lg font-medium mb-3">
            메디록 큐레이션은 무엇이
            다른가요?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            4단계 인증을 통과한 의원 중 추가 큐레이터 심사를 거쳐 선정됩니다. 임상 경험,
            환자 만족도, 의료진 전문성을 종합 평가하며, 분과·지역별로 3~5곳만
            선정합니다.
          </p>
        </div>
      </section>
    </>
  );
}
