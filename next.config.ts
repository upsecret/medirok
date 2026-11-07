import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Payload Media → Vercel Blob. payload.config.ts의 serverURL +
    // disablePayloadAccessControl 조합이 켜져 있어야 url이 이 호스트로 나온다.
    // 토큰이 없는 환경은 동일 출처 /api/media/file/*로 폴백하며 그쪽은 localPatterns
    // 기본값(전체 허용)이 받는다.
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    // 기본 deviceSizes는 8단계(640~3840)다. 원본이 card 768px / feature 1280px라
    // 상위 후보들이 **같은 결과물을 서로 다른 캐시 키로** 만든다(실측: w=828·1920·3840이
    // 전부 8,968 bytes로 동일). 후보를 좁혀 최적화기 캐시 파편화를 없앤다.
    //
    // 2차 조정: 1080·1200도 card(768px 원본)에서는 828과 바이트가 완전히 같았다
    // (실측 w=828·1080·1200 모두 7,093 B). 잉여 캐시 키는 각각 첫 요청에서
    // 400ms짜리 콜드 미스를 한 번씩 물리므로 제거한다. 1280은 feature 파생본의
    // 원본 폭과 정확히 일치시켜 상세 히어로가 클램프 없이 떨어지게 둔다.
    deviceSizes: [640, 828, 1280],
    imageSizes: [96, 256, 384],
    formats: ["image/avif", "image/webp"],
    // 파일명이 콘텐츠와 1:1이고 교체 시 파일명이 바뀌므로 길게 잡아도 안전하다.
    minimumCacheTTL: 31536000,
  },
  typedRoutes: true,
  // /sitemap.xml은 빌드 프리렌더(ISR) 대신 요청마다 생성한다(src/app/sitemap.ts 주석).
  // 신선도 상한을 여기서 건다 — s-maxage=60이라 시드 후 최대 1분이면 반영된다.
  // stale-while-revalidate는 일부러 안 쓴다: 만료 후 첫 요청이 바로 새 내용을 받아야
  // 발행 직후 검증(e2e 사이트맵 단언)이 한 번에 결론 난다.
  // max-age=0으로 브라우저 캐시는 끈다 — 공유 캐시(CDN)만 쓴다.
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=60" },
        ],
      },
    ];
  },
  // 한국어 URL 전환에 따른 구(舊) 영문 경로 → 신규 한국어 경로 301 리다이렉트(SEO 보존)
  async redirects() {
    return [
      {
        source: "/hospital/yeon-dental",
        destination: "/hospital/예온치과병원",
        permanent: true,
      },
      {
        source: "/hospitals/incheon/incheon-seo/dental",
        destination: "/hospitals/인천/서구/치과",
        permanent: true,
      },
      {
        source: "/hospitals/incheon/incheon-seo",
        destination: "/hospitals/인천/서구",
        permanent: true,
      },
      {
        source: "/hospitals/incheon",
        destination: "/hospitals/인천",
        permanent: true,
      },
      {
        source: "/hospitals/seoul/gangnam/dental",
        destination: "/hospitals/서울/강남구/치과",
        permanent: true,
      },
      // 환자 대상 무료견적 폼 폐지 → 병원(client) 대상 인증제 신청으로 대체.
      // /estimate는 sitemap에 실려 색인되어 있었으므로 301로 넘긴다.
      {
        source: "/estimate",
        destination: "/verification/apply",
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig);
