// 병원 후기 한 건이 어디서 왔는지, 그리고 메디록이 검증한 것인지 가른다.
//
// 메디록 검증 후기(영수증·휴대폰 인증)는 아직 한 건도 없고, 지금 실려 있는 것은 전부
// 공개 플랫폼에서 출처를 밝혀 발췌한 것이다. 그런데 섹션 제목은 "실방문 후기"였다 —
// 같은 페이지의 인증 박스가 "수집 진행 중"을 띄우는 것과 모순이었다.
//
// 플랫폼은 reviewerName 말미의 "(Google)"·"(네이버)" 표기로 판정한다. blog-source.ts가
// 호스트로 채널을 가른 것과 같은 이유 — 별도 필드를 두면 표기와 어긋날 자리만 는다.

import type { Review } from "@/types";

/** 발췌 출처 플랫폼 이름. 판정 실패 시 "외부 플랫폼"(네이버라고 단정하는 쪽이 더 틀리기 쉽다) */
export function reviewSourceLabel(reviewerName: string): string {
  const m = reviewerName.match(/\(([^)]+)\)\s*$/);
  const tag = m?.[1]?.trim().toLowerCase();
  if (tag === "google" || tag === "구글") return "구글맵";
  if (tag === "naver" || tag === "네이버") return "네이버";
  return "외부 플랫폼";
}

/** 메디록이 영수증·휴대폰으로 검증한 후기인지 */
export function isMedirokVerified(review: Review): boolean {
  return review.isReceiptVerified || review.isPhoneVerified;
}

export interface ReviewsProvenance {
  /** medirok: 전부 검증분 · external: 전부 외부 발췌 · mixed: 섞임 · empty: 후기 없음 */
  kind: "medirok" | "external" | "mixed" | "empty";
  /** 외부 발췌의 출처 플랫폼 목록 (중복 제거, 등장 순서) */
  platforms: string[];
}

export function reviewsProvenance(reviews: Review[]): ReviewsProvenance {
  if (reviews.length === 0) return { kind: "empty", platforms: [] };
  const verified = reviews.filter(isMedirokVerified).length;
  const platforms = [
    ...new Set(reviews.filter((r) => !isMedirokVerified(r)).map((r) => reviewSourceLabel(r.reviewerName))),
  ];
  if (verified === reviews.length) return { kind: "medirok", platforms: [] };
  if (verified === 0) return { kind: "external", platforms };
  return { kind: "mixed", platforms };
}
