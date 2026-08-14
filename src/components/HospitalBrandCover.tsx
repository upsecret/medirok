import Image from "next/image";
import type { Thumbnail } from "@/types";

/**
 * 의원 블로그 집계(/blog) 카드의 얼굴.
 *
 * 주인공은 **의원 로고**다. 배경 사진은 어둡게·흐리게 깔아 로고만 또렷하게 남긴다.
 *
 * 배경을 글 썸네일이 아니라 `hospital.coverImage`에서 받는 이유: 글 썸네일을 끌어 쓰면
 * 카드뉴스 타이틀처럼 글자가 박힌 이미지가 배경에 깔릴 수 있고, 글이 늘거나 순서가
 * 바뀔 때마다 의원 카드의 얼굴이 따라 바뀐다.
 *
 * 로고를 흰 플레이트에 얹는 이유: 의원 로고는 대개 짙은 색이라 어두운 배경에
 * 그대로 올리면 읽히지 않는다. 상표 색을 바꿀 수는 없다.
 */

interface HospitalBrandCoverProps {
  /** 배경 사진 (글자 없는 시설 사진) */
  cover?: Thumbnail;
  /** 의원 로고 */
  logo?: Thumbnail;
  /** 로고가 없을 때 대신 표시할 이름 */
  hospitalName: string;
  /** 목록 최상단 카드에만 준다 — 그 카드가 LCP 요소인데 기본값이 lazy다 */
  priority?: boolean;
  className?: string;
}

export function HospitalBrandCover({
  cover,
  logo,
  hospitalName,
  priority = false,
  className = "",
}: HospitalBrandCoverProps) {
  const hasLogo = Boolean(logo && logo.width && logo.height);

  return (
    <div
      className={`relative w-full aspect-[16/9] overflow-hidden rounded bg-[var(--color-primary-600)] ${className}`}
    >
      {cover && (
        <Image
          // 어차피 블러 처리되므로 feature(1280×720)까지 받을 이유가 없다
          src={cover.cardUrl}
          alt=""
          aria-hidden="true"
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 384px"
          // scale-110이 없으면 블러가 가장자리를 먹어 컨테이너 배경이 비친다
          className="object-cover scale-110 blur-[3px]"
        />
      )}
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {hasLogo ? (
          <div className="rounded-lg bg-white/95 px-6 py-4 shadow-lg ring-1 ring-black/5">
            <Image
              // 파생 사이즈는 16:9 크롭이라 로고를 잘라 먹는다 — 원본을 쓴다
              src={logo!.url}
              alt=""
              aria-hidden="true"
              width={logo!.width}
              height={logo!.height}
              // sizes가 없으면 next/image가 표시 크기를 모른 채 원본 폭 기준
              // 1x/2x srcset을 만든다. 실제로는 h-12(48px)·md:h-14(56px)로 그리므로
              // 가로는 로고 비율을 감안해도 200px을 넘지 않는다.
              sizes="200px"
              className="h-12 w-auto md:h-14"
            />
          </div>
        ) : (
          <span className="editorial text-white text-lg md:text-xl">
            {hospitalName}
          </span>
        )}
      </div>
    </div>
  );
}
