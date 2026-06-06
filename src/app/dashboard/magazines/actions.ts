"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { upsertMagazine, deleteMagazine, loadMagazines } from "@/lib/storage";
import type { Magazine, MagazineType } from "@/lib/magazines";

const TYPE_CATEGORY: Record<MagazineType, string> = {
  article: "시술 가이드",
  qna: "Q&A",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

function parseArrayField(input: string | null): string[] {
  if (!input) return [];
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseFaqBlocks(formData: FormData): Magazine["faqBlocks"] {
  const rows: NonNullable<Magazine["faqBlocks"]> = [];
  for (let i = 0; i < 8; i++) {
    const q = String(formData.get(`faq_${i}_q`) ?? "").trim();
    const a = String(formData.get(`faq_${i}_a`) ?? "").trim();
    if (q && a) rows.push({ question: q, answer: a });
  }
  return rows.length > 0 ? rows : undefined;
}

function parsePriceTable(formData: FormData): Magazine["priceTable"] {
  const rows: NonNullable<Magazine["priceTable"]> = [];
  for (let i = 0; i < 8; i++) {
    const t = String(formData.get(`price_${i}_treatment`) ?? "").trim();
    const p = String(formData.get(`price_${i}_range`) ?? "").trim();
    if (t && p) {
      const note = String(formData.get(`price_${i}_note`) ?? "").trim();
      rows.push({ treatment: t, priceRange: p, note: note || undefined });
    }
  }
  return rows.length > 0 ? rows : undefined;
}

export async function saveMagazineAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) throw new Error("slug 필요");

  const type = String(formData.get("type") ?? "article") as MagazineType;

  const magazine: Magazine = {
    slug,
    type,
    seoTitle: String(formData.get("seoTitle") ?? ""),
    metaDescription: String(formData.get("metaDescription") ?? ""),
    shortAnswer: String(formData.get("shortAnswer") ?? ""),
    body: String(formData.get("body") ?? ""),
    targetKeywords: parseArrayField(String(formData.get("targetKeywords") ?? "")),
    faqBlocks: parseFaqBlocks(formData),
    priceTable: parsePriceTable(formData),
    linkedHospitalSlugs:
      parseArrayField(String(formData.get("linkedHospitalSlugs") ?? "")).length > 0
        ? parseArrayField(String(formData.get("linkedHospitalSlugs") ?? ""))
        : undefined,
    linkedDepartmentSlug:
      String(formData.get("linkedDepartmentSlug") ?? "").trim() || undefined,
    linkedRegionSlug:
      String(formData.get("linkedRegionSlug") ?? "").trim() || undefined,
    linkedTreatmentSlug:
      String(formData.get("linkedTreatmentSlug") ?? "").trim() || undefined,
    authorDoctorSlug:
      String(formData.get("authorDoctorSlug") ?? "").trim() || undefined,
    authorName: String(formData.get("authorName") ?? "").trim() || undefined,
    authorTitle: String(formData.get("authorTitle") ?? "").trim() || undefined,
    disclaimerType: String(formData.get("disclaimerType") ?? "general") as Magazine["disclaimerType"],
    publishedAt: String(formData.get("publishedAt") ?? new Date().toISOString().slice(0, 10)),
    category: String(formData.get("category") ?? TYPE_CATEGORY[type]),
  };

  await upsertMagazine(magazine);
  revalidatePath("/magazine");
  revalidatePath(`/magazine/${slug}`);
  revalidatePath("/dashboard/magazines");
  redirect(`/dashboard/magazines?saved=${encodeURIComponent(slug)}`);
}

export async function deleteMagazineAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  await deleteMagazine(slug);
  revalidatePath("/magazine");
  revalidatePath("/dashboard/magazines");
  redirect("/dashboard/magazines");
}

export async function listMagazinesForAdmin() {
  return loadMagazines();
}
