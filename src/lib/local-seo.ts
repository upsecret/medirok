// 지역 병원 리스트 페이지 — 로컬 SEO/AEO 헬퍼
// 지역×진료과 인트로 카피·동적 FAQ를 한 곳에서 생성해
// 본문 렌더와 FAQPage JSON-LD가 항상 동일한 내용을 쓰도록 보장한다.

import type { Hospital } from "@/types";
import { formatKRW } from "@/lib/data";

/** sitemap.ts·metadataBase와 동일한 정식 도메인 (절대 URL용) */
export const SITE_URL = "https://medirok.com";

/** 시·도까지 포함한 전체 지역명 (예: "인천 서구") */
export function fullRegionName(sidoName: string, guName: string): string {
  return `${sidoName} ${guName}`;
}

/** 병원 상세 절대 URL (sitemap과 동일하게 디코드된 한국어 slug 사용) */
export function hospitalUrl(slug: string): string {
  return `${SITE_URL}/hospital/${slug}`;
}

/** 지역×진료과 리스트 페이지 절대 URL */
export function regionDeptUrl(sido: string, gu: string, deptUrlName: string): string {
  return `${SITE_URL}/hospitals/${sido}/${gu}/${deptUrlName}`;
}

/**
 * 지역×진료과 인트로 카피 (150~250자).
 * H1 아래에 노출해 thin content를 보완하고 지역·진료과·시술 키워드를 자연 포함.
 */
export function regionDeptIntro(
  sidoName: string,
  guName: string,
  deptNameKr: string,
  count: number
): string {
  const region = fullRegionName(sidoName, guName);
  if (count > 0) {
    return `${region}에서 메디록이 진료이력·실방문 후기·의료진 자격·시설장비 4단계를 직접 검증한 ${deptNameKr} ${count}곳을 모았습니다. 정상가·이벤트가와 실방문 후기, 야간·주말 진료 여부를 한눈에 비교하고 가까운 ${deptNameKr}을(를) 찾아보세요.`;
  }
  return `${region} ${deptNameKr} 메디록 인증 병원을 준비하고 있습니다. 인근 지역의 메디록 4단계 인증 병원을 먼저 살펴보세요.`;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * 지역·진료과·실제 병원 데이터를 바탕으로 동적 FAQ 생성.
 * 본문 <details> 렌더와 FAQPage JSON-LD에 동일하게 사용 → AEO/GEO 인용 대응.
 */
export function regionDeptFaqs(
  sidoName: string,
  guName: string,
  deptNameKr: string,
  hospitals: Hospital[]
): FaqItem[] {
  const region = fullRegionName(sidoName, guName);
  const faqs: FaqItem[] = [];

  // 1) 가격 — 등록 병원들의 정상가 범위에서 산출
  const lows = hospitals.flatMap((h) => h.prices.map((p) => p.normalLow)).filter((n) => n > 0);
  const highs = hospitals.flatMap((h) => h.prices.map((p) => p.normalHigh)).filter((n) => n > 0);
  if (lows.length > 0 && highs.length > 0) {
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    faqs.push({
      question: `${region} ${deptNameKr} 평균 가격은 얼마인가요?`,
      answer: `${region} 메디록 인증 ${deptNameKr}의 공개 정상가는 약 ${formatKRW(min)}부터 ${formatKRW(max)}까지 분포합니다. 시술·병원별로 정상가와 이벤트가가 각 병원 카드에 공개되니 비교 후 선택하세요.`,
    });
  } else {
    faqs.push({
      question: `${region} ${deptNameKr} 평균 가격은 얼마인가요?`,
      answer: `메디록 인증 병원은 의원별로 정상가·이벤트가를 공개합니다. 각 병원 카드에서 ${deptNameKr} 시술 가격을 확인하세요.`,
    });
  }

  // 2) 야간·주말 진료
  const weekend = hospitals.filter((h) => h.hours?.saturday || h.hours?.sunday);
  if (weekend.length > 0) {
    faqs.push({
      question: `${region}에 주말·토요일 진료하는 ${deptNameKr}가 있나요?`,
      answer: `네, ${region}의 메디록 인증 ${deptNameKr} 중 ${weekend.length}곳이 토요일 또는 일요일 진료를 운영합니다. 각 병원 상세 페이지의 진료시간에서 정확한 요일을 확인하세요.`,
    });
  }

  // 3) 접근성 — 가까운 지하철역
  const stations = Array.from(
    new Set(hospitals.map((h) => h.nearestStationName).filter((s): s is string => Boolean(s)))
  );
  if (stations.length > 0) {
    faqs.push({
      question: `${region} ${deptNameKr}는 어떤 지하철역에서 가까운가요?`,
      answer: `${stations.slice(0, 5).join(", ")} 인근에 메디록 인증 ${deptNameKr}가 있습니다. 각 병원 카드에서 가까운 역과 도보 시간을 확인할 수 있습니다.`,
    });
  }

  // 4) 인증 설명 (상시)
  faqs.push({
    question: "메디록 인증이 뭔가요?",
    answer:
      "메디록이 진료이력·실방문 후기·의료진 자격·시설장비 4단계를 직접 검증한 병원에만 부여하는 인증입니다.",
  });

  return faqs;
}
