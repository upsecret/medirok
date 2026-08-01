// 사이트 전역 상수 — 정식 도메인의 유일한 출처.
// sitemap/robots/metadataBase/JSON-LD 절대 URL이 모두 이 값을 사용한다.

// 운영은 www로 서빙되고 apex(medirok.com)는 www로 308 리다이렉트된다.
// canonical이 리다이렉트되는 URL을 가리키지 않도록 서빙 호스트와 일치시킨다.
export const SITE_URL = "https://www.medirok.com";

/** 상대 경로 → 절대 URL (JSON-LD·sitemap용) */
export function absUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * 업로드 이미지 URL → 절대 URL.
 * 저장소에 따라 형태가 다르다 — Vercel Blob은 이미 절대 URL(`https://….blob.vercel-storage.com/…`),
 * 토큰 없는 폴백은 동일 출처 상대 경로(`/api/media/file/…`). 앞의 것에 SITE_URL을 덧붙이면 깨진다.
 */
export function absMediaUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : absUrl(url);
}
