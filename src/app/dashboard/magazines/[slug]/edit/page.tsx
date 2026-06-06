import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { loadMagazines } from "@/lib/storage";
import { MagazineForm } from "../../MagazineForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditMagazinePage({ params }: PageProps) {
  const { slug } = await params;
  const list = await loadMagazines();
  const magazine = list.find((m) => m.slug === slug);
  if (!magazine) notFound();

  return (
    <div>
      <nav className="text-xs text-[var(--color-text-muted)] mb-3">
        <Link href={"/dashboard/magazines" as Route}>매거진 관리</Link> · 수정
      </nav>
      <h1 className="text-2xl font-medium mb-1">매거진 수정</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        slug: <code className="font-mono">{magazine.slug}</code>
      </p>
      <MagazineForm type={magazine.type} mode="edit" initial={magazine} />
    </div>
  );
}
