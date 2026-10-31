// 순수 포매터 (DB 무관)

import type { MedirokCertification } from "@/types";

/**
 * 인증 배지 문구. 통과 단계 수를 그대로 말한다.
 *
 * 예전에는 certification 객체가 있기만 하면 "메디록 4단계 인증"이라고 적었다. 힐하우스는
 * 4단계 중 1단계(의료진)만 근거가 있는데도 4단계 인증으로 읽혔다 — 런북 §9-9가 과대 표기로
 * 적어 둔 건이다.
 */
export function formatCertificationBadge(cert: MedirokCertification): string {
  const passed = [
    cert.stage1History,
    cert.stage2Reviews,
    cert.stage3Credentials,
    cert.stage4Facility,
  ].filter(Boolean).length;
  return passed === 4 ? "메디록 4단계 인증" : `메디록 인증 ${passed}/4단계`;
}

export function formatKRW(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    if (man === Math.floor(man)) return `${man.toLocaleString()}만원`;
    return `${man.toLocaleString()}만`;
  }
  return `${amount.toLocaleString()}원`;
}

/**
 * 집계 평점을 그릴 수 있는 병원인지.
 *
 * rating·reviewCount는 메디록 자체 집계(영수증·휴대폰 인증) 전용 필드라, 아직 수집하지
 * 않은 병원은 둘 다 0이다. 그대로 그리면 "★ 0 · 후기 0개"가 되는데 이건 집계가 없다는
 * 뜻인데도 평가가 낮다는 뜻으로 읽힌다 — false면 호출부가 "집계 전"으로 바꿔 그린다.
 *
 * 문자열이 아니라 판정만 돌려준다. 호출부마다 ★의 색 스팬과 레이아웃이 달라서
 * 한 문자열로 합치면 그 차이가 사라진다.
 */
export function hasRatingAggregate(rating: number, reviewCount: number): boolean {
  return rating > 0 || reviewCount > 0;
}

/** 네이버 지도 장소 검색 URL — 지점별 place id를 저장하지 않고 이름+주소로 찾아간다 */
export function naverPlaceSearchUrl(name: string, addressLine: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(`${name} ${addressLine}`)}`;
}
