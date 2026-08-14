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
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [96, 256, 384],
    formats: ["image/avif", "image/webp"],
    // 파일명이 콘텐츠와 1:1이고 교체 시 파일명이 바뀌므로 길게 잡아도 안전하다.
    minimumCacheTTL: 31536000,
  },
  typedRoutes: true,
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
