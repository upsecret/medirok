import Link from "next/link";
import { departments } from "@/lib/data";
import { DepartmentIcon } from "@/components/DepartmentIcon";

export const metadata = {
  title: "의원 찾기",
  description: "메디록 4단계 인증 의원을 진료과·지역별로 직접 비교하세요.",
};

export default function HospitalsIndex() {
  return (
    <section className="bg-[var(--color-surface-bg)] py-8">
      <div className="container-page">
        <h1>내가 직접 고르는 메디록 의원</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          메디록 4단계 인증 의원을 진료과·지역별로 직접 비교하세요.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {departments.map((d) => (
            <Link
              key={d.slug}
              href={`/hospitals/${d.slug}`}
              className="bg-white p-5 rounded-md border border-[var(--color-surface-border)]"
            >
              <div className="flex items-center gap-3">
                <DepartmentIcon
                  slug={d.slug}
                  size={32}
                  className="text-[var(--color-primary-600)] shrink-0"
                />
                <div>
                  <p className="font-medium">{d.nameKr}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{d.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
