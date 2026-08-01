import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      // Payload Media → Vercel Blob (토큰 미설정 시엔 동일 출처 /api/media/file/*로 서빙되어
      // remotePattern이 필요 없다)
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
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
    ];
  },
};

export default withPayload(nextConfig);
