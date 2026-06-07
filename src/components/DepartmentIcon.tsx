// 진료과 미니멀 라인 픽토그램
// 한자(齒骨眼婦皮內診心腎) 대체용 — 모든 세대 친화

import type { DepartmentSlug } from "@/types";

interface DepartmentIconProps {
  slug: DepartmentSlug;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DepartmentIcon({
  slug,
  size = 24,
  strokeWidth = 1.5,
  className,
}: DepartmentIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (slug) {
    case "dental":
      // 치아 — 둥근 크라운 + 두 뿌리
      return (
        <svg {...common}>
          <path d="M8 3c-2 0-3 2-3 4 0 1.5.4 3 .8 4.5L7 21c.2 1 .8 1.2 1.2.3l1-3.5c.2-.6.5-1.5 1-1.5h1.6c.5 0 .8.9 1 1.5l1 3.5c.4.9 1 .7 1.2-.3l1.2-9.5c.4-1.5.8-3 .8-4.5 0-2-1-4-3-4-.7 0-1.3.3-2 .7-.7-.4-1.3-.7-2-.7Z" />
        </svg>
      );

    case "orthopedics":
      // 뼈 — 양끝 둥근 막대
      return (
        <svg {...common}>
          <path d="M6.5 6.5c-.7-.7-.7-2 0-2.7s2-.7 2.7 0c.4.4.6 1 .5 1.5l5.6 5.6c.5-.1 1.1.1 1.5.5.7.7.7 2 0 2.7s-2 .7-2.7 0c-.4-.4-.6-1-.5-1.5L7 6.5c-.5.1-.1-.1-.5 0Z" />
          <path d="M17.5 17.5c.7.7.7 2 0 2.7s-2 .7-2.7 0c-.4-.4-.6-1-.5-1.5L8.7 13c-.5.1-1.1-.1-1.5-.5-.7-.7-.7-2 0-2.7s2-.7 2.7 0c.4.4.6 1 .5 1.5l5.6 5.6c.5-.1 1.1.1 1.5.5Z" />
        </svg>
      );

    case "ophthalmology":
      // 눈 — 아몬드 + 동공
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "obstetrics":
      // 산부인과 — 부드러운 곡선 (모성·생명)
      return (
        <svg {...common}>
          <path d="M12 21c-4-4-9-7.5-9-12 0-3 2.5-5 5-5 1.5 0 3 .7 4 2 1-1.3 2.5-2 4-2 2.5 0 5 2 5 5 0 4.5-5 8-9 12Z" />
          <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );

    case "dermatology":
      // 피부 — 층층 곡선
      return (
        <svg {...common}>
          <path d="M3 7c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
          <path d="M3 12c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
          <path d="M3 17c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        </svg>
      );

    case "internal-medicine":
      // 내과 — 청진기
      return (
        <svg {...common}>
          <path d="M5 3v6c0 3 2 5 5 5s5-2 5-5V3" />
          <path d="M5 3h2M13 3h2" />
          <circle cx="18" cy="17" r="3" />
          <path d="M15 17v-2c0-.5-.5-1-1-1h-4" />
        </svg>
      );

    case "checkup":
      // 종합검진 — 체크리스트
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 3h6v3H9z" />
          <path d="M9 12l2 2 4-4" strokeWidth={strokeWidth + 0.3} />
          <path d="M9 17h6" opacity="0.5" />
        </svg>
      );

    case "cardiology":
      // 심혈관 — 심장 + 맥박선
      return (
        <svg {...common}>
          <path d="M12 20C8 16 4 13 4 9c0-2.5 2-4 4-4 1.5 0 3 .8 4 2 1-1.2 2.5-2 4-2 2 0 4 1.5 4 4 0 4-4 7-8 11Z" />
          <path d="M4 12h3l2-3 2 6 2-4 1 1h4" strokeWidth={strokeWidth + 0.2} />
        </svg>
      );

    case "urology":
      // 비뇨기 — 신장 (콩 모양)
      return (
        <svg {...common}>
          <path d="M9 4C6 4 4 7 4 11c0 5 3 9 7 9 2 0 4-1 4-3 0-1.5-1-2-1-3.5 0-1 .5-1.5 1-2.5.6-1 1-2 1-3.5C16 5 13 4 9 4Z" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
