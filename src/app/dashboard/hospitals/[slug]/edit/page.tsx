import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { loadHospitals } from "@/lib/storage";
import { HospitalForm } from "../../HospitalForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditHospitalPage({ params }: PageProps) {
  const { slug } = await params;
  const list = await loadHospitals();
  const hospital = list.find((h) => h.slug === slug);
  if (!hospital) notFound();

  return (
    <div>
      <nav className="text-xs text-[var(--color-text-muted)] mb-3">
        <Link href={"/dashboard/hospitals" as Route}>의원 관리</Link> › {hospital.nameKr}
      </nav>
      <h1 className="text-2xl font-medium mb-1">{hospital.nameKr} 수정</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        slug: <code className="font-mono">{hospital.slug}</code>
      </p>
      <HospitalForm mode="edit" initial={hospital} />
    </div>
  );
}
