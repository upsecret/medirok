"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { upsertHospital, deleteHospital, loadHospitals } from "@/lib/storage";
import type { Hospital, HospitalTier, DepartmentSlug } from "@/types";

function parseTags(input: string | null): string[] | undefined {
  if (!input) return undefined;
  const tags = input.split(",").map((t) => t.trim()).filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

function parsePrices(formData: FormData): Hospital["prices"] {
  const rows: Hospital["prices"] = [];
  for (let i = 0; i < 5; i++) {
    const name = String(formData.get(`price_${i}_name`) ?? "").trim();
    if (!name) continue;
    const normalLow = Number(formData.get(`price_${i}_low`) || 0);
    const normalHigh = Number(formData.get(`price_${i}_high`) || 0);
    const eventLow = Number(formData.get(`price_${i}_eventLow`) || 0);
    const eventHigh = Number(formData.get(`price_${i}_eventHigh`) || 0);
    const note = String(formData.get(`price_${i}_note`) ?? "").trim() || undefined;
    rows.push({
      treatmentName: name,
      treatmentNote: note,
      normalLow,
      normalHigh,
      ...(eventLow > 0 && { eventLow }),
      ...(eventHigh > 0 && { eventHigh }),
    });
  }
  return rows;
}

function parseDoctors(formData: FormData): Hospital["doctors"] {
  const rows: Hospital["doctors"] = [];
  for (let i = 0; i < 6; i++) {
    const name = String(formData.get(`doctor_${i}_name`) ?? "").trim();
    if (!name) continue;
    const slug = String(formData.get(`doctor_${i}_slug`) ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) continue;
    rows.push({
      slug,
      nameKr: name,
      nameHanja: String(formData.get(`doctor_${i}_hanja`) ?? "") || undefined,
      title: String(formData.get(`doctor_${i}_title`) ?? "원장"),
      yearsExperience: Number(formData.get(`doctor_${i}_years`) || 0),
      specialty: String(formData.get(`doctor_${i}_specialty`) ?? "") || undefined,
    });
  }
  return rows;
}

export async function saveHospitalAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) throw new Error("slug 필요");

  const hospital: Hospital = {
    slug,
    nameKr: String(formData.get("nameKr") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? "") || undefined,
    departmentSlug: String(formData.get("departmentSlug") ?? "dental") as DepartmentSlug,
    regionSlug: String(formData.get("regionSlug") ?? "gangnam"),
    addressLine: String(formData.get("addressLine") ?? ""),
    nearestStation: String(formData.get("nearestStation") ?? "") || undefined,
    walkingMinutes: Number(formData.get("walkingMinutes") || 0) || undefined,
    phone: String(formData.get("phone") ?? "") || undefined,
    yearEstablished: Number(formData.get("yearEstablished") || 0) || undefined,
    rating: Number(formData.get("rating") || 0),
    reviewCount: Number(formData.get("reviewCount") || 0),
    doctorCount: Number(formData.get("doctorCount") || 0),
    monthlyVisitors: Number(formData.get("monthlyVisitors") || 0) || undefined,
    tier: (String(formData.get("tier") ?? "STANDARD") as HospitalTier),
    tags: parseTags(String(formData.get("tags") ?? "")),
    certification: {
      stage1History: !!formData.get("cert_stage1"),
      stage1Detail: String(formData.get("cert_stage1Detail") ?? ""),
      stage2Reviews: !!formData.get("cert_stage2"),
      stage2Detail: String(formData.get("cert_stage2Detail") ?? ""),
      stage3Credentials: !!formData.get("cert_stage3"),
      stage3Detail: String(formData.get("cert_stage3Detail") ?? ""),
      stage4Facility: !!formData.get("cert_stage4"),
      stage4Detail: String(formData.get("cert_stage4Detail") ?? ""),
      certifiedAt: String(formData.get("cert_at") ?? "2026-06"),
    },
    curationNote:
      String(formData.get("curationText") ?? "").trim().length > 0
        ? {
            text: String(formData.get("curationText") ?? ""),
            curatorName: String(formData.get("curationCurator") ?? ""),
            curatorTitle: String(formData.get("curationCuratorTitle") ?? "") || undefined,
          }
        : undefined,
    doctors: parseDoctors(formData),
    prices: parsePrices(formData),
    reviews: [],
    hours: {
      weekday: String(formData.get("hours_weekday") ?? "09:00 - 18:30"),
      saturday: String(formData.get("hours_saturday") ?? "09:00 - 14:00") || undefined,
      sunday: String(formData.get("hours_sunday") ?? "휴진") || undefined,
      lunch: String(formData.get("hours_lunch") ?? "13:00 - 14:00") || undefined,
    },
  };

  await upsertHospital(hospital);
  revalidatePath("/");
  revalidatePath(`/hospital/${slug}`);
  revalidatePath("/dashboard/hospitals");
  redirect(`/dashboard/hospitals?saved=${encodeURIComponent(slug)}`);
}

export async function deleteHospitalAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  await deleteHospital(slug);
  revalidatePath("/");
  revalidatePath("/dashboard/hospitals");
  redirect("/dashboard/hospitals");
}

export async function listHospitalsForAdmin() {
  return loadHospitals();
}
