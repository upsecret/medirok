import Image from "next/image";
import type { Thumbnail as ThumbnailData } from "@/types";

/**
 * 매거진·블로그 대표 이미지.
 *
 * 썸네일이 없어도 **같은 높이의 플레이스홀더**를 그린다. 조건부로 통째 생략하면
 * 이미지가 있는 카드와 없는 카드의 높이가 달라져 목록 그리드가 어긋난다.
 *
 * 용도별 파생 사이즈:
 *   card    → 목록 카드 (768×432)
 *   feature → 상세 히어로 (1280×720)
 */

interface ThumbnailProps {
  thumbnail?: ThumbnailData;
  /** 이미지가 없을 때 플레이스홀더에 쓸 색 (CSS 색상값) */
  accentColor?: string;
  /** 플레이스홀더에 표시할 짧은 라벨 (카테고리명 등) */
  placeholderLabel?: string;
  variant?: "card" | "feature";
  /** 상세 히어로처럼 뷰포트 상단에 오는 이미지에만 지정 (LCP) */
  priority?: boolean;
  /** 좌하단 로고 배지 (의원 블로그 카드) — 이미지 위에 흰 칩으로 얹는다 */
  logo?: ThumbnailData;
  className?: string;
}

export function Thumbnail({
  thumbnail,
  accentColor = "var(--color-accent-600)",
  placeholderLabel,
  variant = "card",
  priority = false,
  logo,
  className = "",
}: ThumbnailProps) {
  const isFeature = variant === "feature";
  const radius = isFeature ? "rounded-lg" : "rounded";
  const wrapper = `relative w-full aspect-[16/9] overflow-hidden ${radius} bg-[var(--color-surface-bg3)] ${className}`;

  /**
   * 로고 배지. 파생 사이즈는 16:9 cover 크롭이라 로고를 잘라 먹으므로 **원본**을 쓴다.
   * next/image는 fill이 아니면 width/height가 필수라 없으면 렌더하지 않는다.
   * alt를 비우는 이유: 의원명이 카드 heading에 이미 있어 중복 낭독이 된다.
   */
  const badge =
    logo && logo.width && logo.height ? (
      <div className="absolute left-3 bottom-3 rounded bg-white/95 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
        <Image
          src={logo.url}
          alt=""
          aria-hidden="true"
          width={logo.width}
          height={logo.height}
          className="h-7 w-auto md:h-8"
        />
      </div>
    ) : null;

  if (!thumbnail) {
    return (
      <div
        className={wrapper}
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, var(--color-primary-600) 100%)`,
        }}
        // 장식용 — 정보를 담지 않으므로 보조기술에서 숨긴다
        aria-hidden="true"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/85">
          <span className={isFeature ? "text-4xl" : "text-2xl"}>錄</span>
          {placeholderLabel && (
            <span className={isFeature ? "text-sm" : "text-[10px]"}>
              {placeholderLabel}
            </span>
          )}
        </div>
        {badge}
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <Image
        src={isFeature ? thumbnail.featureUrl : thumbnail.cardUrl}
        alt={thumbnail.alt}
        fill
        priority={priority}
        sizes={
          isFeature
            ? "(max-width: 768px) 100vw, 768px"
            : "(max-width: 768px) 100vw, 384px"
        }
        className="object-cover"
      />
      {badge}
    </div>
  );
}
