// 사이트 전역 상수 — 정식 도메인의 유일한 출처.
// sitemap/robots/metadataBase/JSON-LD 절대 URL이 모두 이 값을 사용한다.

export const SITE_URL = "https://medirok.com";

/** 상대 경로 → 절대 URL (JSON-LD·sitemap용) */
export function absUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
