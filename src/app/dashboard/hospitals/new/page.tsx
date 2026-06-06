import Link from "next/link";
import type { Route } from "next";
import { HospitalForm } from "../HospitalForm";

export default function NewHospitalPage() {
  return (
    <div>
      <nav className="text-xs text-[var(--color-text-muted)] mb-3">
        <Link href={"/dashboard/hospitals" as Route}>의원 관리</Link> › 추가
      </nav>
      <h1 className="text-2xl font-medium mb-1">의원 추가</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        영업한 의원 정보를 입력하세요. <span className="hanja">醫錄</span> 4단계 검증
        통과 후 노출됩니다.
      </p>
      <HospitalForm mode="new" />
    </div>
  );
}
