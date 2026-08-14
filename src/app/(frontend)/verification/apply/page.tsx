import Link from "next/link";
import { ApplyForm } from "./ApplyForm";

export const metadata = {
  title: "醫錄 인증제 신청",
  description:
    "의원을 위한 醫錄 4단계 인증제 신청. 진료이력·후기·의료진 자격·시설장비 검증을 거쳐 메디록에 등재됩니다.",
};

const steps = [
  { num: "01", title: "신청 접수", detail: "아래 폼으로 의원 정보를 남기면 담당자가 연락드립니다." },
  { num: "02", title: "서류 검증", detail: "개설 이력, 의료진 자격, 시설·장비 자료를 확인합니다." },
  { num: "03", title: "실사·후기 검증", detail: "실방문 확인과 영수증 인증 후기 수집 절차를 안내합니다." },
  { num: "04", title: "등재", detail: "4단계를 통과하면 인증 배지와 함께 메디록에 등재됩니다." },
];

export default function VerificationApplyPage() {
  return (
    <>
      <section className="bg-[var(--color-primary-600)] py-10">
        <div className="container-content text-center">
          <p className="editorial text-[10px] tracking-[0.14em] uppercase text-[var(--color-accent-400)]">
            MEDIROK CERTIFICATION
          </p>
          <h1 className="editorial text-white mt-2">
            <span className="hanja">醫錄</span> 인증제 신청
          </h1>
          <p className="text-[var(--color-accent-300)] text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            의원을 위한 신청 창구입니다. 4단계 검증을 통과한 의원만 메디록에 등재되며,
            등재 이후 지역·진료과 검색 노출과 콘텐츠 자산 구축을 함께 진행합니다.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-surface-bg)] py-8">
        <div className="container-content">
          <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-3">
            진행 절차
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((s) => (
              <article
                key={s.num}
                className="bg-white border border-[var(--color-surface-border)] rounded-md p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="hanja text-2xl text-[var(--color-accent-400)] shrink-0 leading-none"
                    style={{ width: "1.4em", textAlign: "center" }}
                  >
                    {s.num}
                  </span>
                  <div>
                    <h2 className="text-sm font-medium">{s.title}</h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            심사 기준은{" "}
            <Link
              href="/verification"
              className="text-[var(--color-accent-600)] underline underline-offset-2"
            >
              <span className="hanja">醫錄</span> 4단계 의원 인증제
            </Link>
            에서 확인하실 수 있습니다.
          </p>

          <ApplyForm />
        </div>
      </section>
    </>
  );
}
