"use server";

import { getPayloadClient } from "@/lib/payload";

/**
 * 인증제 신청 접수.
 *
 * 컬렉션의 create 권한은 닫혀 있다(CertificationApplications.ts 주석 참고).
 * 익명 REST 생성을 막기 위한 것이므로, 기록은 여기서 overrideAccess로만 한다.
 *
 * 개인정보(성함·연락처)를 다루므로 실패 로그에 입력값을 남기지 않는다.
 */

export type ApplyState = { ok: boolean; error?: string };

const INTEREST_VALUES = ["certification", "curation", "content"] as const;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  // 허니팟 — 사람에게는 보이지 않는 필드다. 채워져 있으면 봇으로 보고 조용히 성공을 반환한다.
  if (text(formData, "company")) return { ok: true };

  const hospitalName = text(formData, "hospitalName");
  const representativeName = text(formData, "representativeName");
  const phone = text(formData, "phone");

  if (!hospitalName || !representativeName || !phone) {
    return { ok: false, error: "의원명·담당자 성함·연락처는 필수입니다." };
  }

  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 9 || digits.length > 11) {
    return { ok: false, error: "연락처를 다시 확인해 주세요." };
  }

  if (formData.get("consent") !== "on") {
    return { ok: false, error: "개인정보 수집·이용에 동의해야 신청할 수 있습니다." };
  }

  const interests = formData
    .getAll("interests")
    .map(String)
    .filter((v): v is (typeof INTEREST_VALUES)[number] =>
      (INTEREST_VALUES as readonly string[]).includes(v),
    );

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "certification-applications",
      overrideAccess: true,
      data: {
        hospitalName,
        representativeName,
        phone,
        email: text(formData, "email") || undefined,
        region: text(formData, "region") || undefined,
        department: text(formData, "department") || undefined,
        homepageUrl: text(formData, "homepageUrl") || undefined,
        interests,
        message: text(formData, "message") || undefined,
        status: "pending",
      },
    });
  } catch (err) {
    // 입력값은 절대 찍지 않는다.
    console.error(
      "인증제 신청 저장 실패:",
      err instanceof Error ? err.message : "unknown",
    );
    return {
      ok: false,
      error: "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true };
}
