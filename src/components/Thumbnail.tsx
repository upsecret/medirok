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
  className?: string;
}

export function Thumbnail({
  thumbnail,
  accentColor = "var(--color-accent-600)",
  placeholderLabel,
  variant = "card",
  priority = false,
  className = "",
}: ThumbnailProps) {
  const isFeature = variant === "feature";
  const radius = isFeature ? "rounded-lg" : "rounded";
  const wrapper = `relative w-full aspect-[16/9] overflow-hidden ${radius} bg-[var(--color-surface-bg3)] ${className}`;

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
    </div>
  );
}
