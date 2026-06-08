import Link from "next/link";
import { getAllDepartments } from "@/lib/hospitals-data";
import { DepartmentIcon } from "./DepartmentIcon";

export async function DepartmentGrid() {
  const departments = await getAllDepartments();
  return (
    <section className="bg-[var(--color-surface-bg)] py-5 border-y border-[var(--color-surface-border)]">
      <div className="container-page">
        <p className="text-[10px] tracking-[0.08em] text-[var(--color-text-muted)] uppercase mb-2.5">
          진료과 바로가기
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/hospitals/${dept.slug}`}
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
  );
}
