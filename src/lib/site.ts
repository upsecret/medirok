// 사이트 전역 상수 — 정식 도메인의 유일한 출처.
// sitemap/robots/metadataBase/JSON-LD 절대 URL이 모두 이 값을 사용한다.

// 운영은 www로 서빙되고 apex(medirok.com)는 www로 308 리다이렉트된다.
// canonical이 리다이렉트되는 URL을 가리키지 않도록 서빙 호스트와 일치시킨다.
export const SITE_URL = "https://www.medirok.com";

/** 상대 경로 → 절대 URL (JSON-LD·sitemap용) */
export function absUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
