import type { Hospital } from "@/types";
import { naverPlaceSearchUrl } from "@/lib/format";
import { reviewsProvenance } from "@/lib/review-source";

/**
 * 후기 섹션 — 후기가 없어도 "수집 상태"를 말한다.
 *
 * 예전에는 후기가 0건이면 섹션을 통째로 지웠고(early return), 제목은 늘 "실방문 후기"였다.
 * 그런데 메디록 검증 후기(영수증·휴대폰)는 아직 한 건도 없고 실려 있는 것은 전부 공개 플랫폼
 * 발췌라, 같은 페이지 인증 박스의 "수집 진행 중"과 정면으로 어긋났다. 제목 옆 숫자도
 * reviewCount(공개 집계 114)를 띄우면서 카드는 3장만 그렸다.
 *
 * 그래서 두 가지를 바꿨다 — 검증분이 없으면 발췌임을 밝히고 숫자를 실제 카드 수로 쓴다,
 * 후기가 0건이면 지우지 않고 "아직 수집 전"이라고 적는다(별점 0이 낮은 평가로 읽히는 것을 막는다).
 */
export function ReviewsSection({ hospital }: { hospital: Hospital }) {
  const provenance = reviewsProvenance(hospital.reviews);
  if (provenance.kind === "empty") return <ReviewsZeroState hospital={hospital} />;

  const isExcerpt = provenance.kind !== "medirok";
  const platforms = provenance.platforms.join(" · ");

  return (
    <section className="section-space bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <div className="mb-6 flex justify-between items-end gap-4">
          <div>
            <p className="eyebrow">{isExcerpt ? "EXTERNAL REVIEWS · 출처 표기" : "VERIFIED REVIEWS"}</p>
            <h2 className="mt-2">
              {isExcerpt
                ? `방문 후기 발췌 (${hospital.reviews.length})`
                : `실방문 후기 (${hospital.reviewCount})`}
            </h2>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">최신순</span>
        </div>

        {isExcerpt && (
          <div className="mb-5 rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-4">
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {platforms}에 공개된 후기에서 발췌했습니다. 메디록이 영수증·휴대폰 인증으로 실제 방문을
              확인한 후기는 아닙니다.
              {hospital.reviewCount > 0 && ` 공개 집계는 전체 ${hospital.reviewCount}개입니다.`}
            </p>
            <a
              href={naverPlaceSearchUrl(hospital.nameKr, hospital.addressLine)}
              target="_blank"
              rel="noopener nofollow"
              className="mt-2 inline-block text-sm text-[var(--color-accent-600)] underline underline-offset-2"
            >
              지도에서 공개 후기 전체 보기
            </a>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {hospital.reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-5"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  {r.rating > 0 ? (
                    <span className="text-base text-[var(--color-warning)]">{"★".repeat(r.rating)}</span>
                  ) : (
                    // 네이버는 2021년에 별점을 폐지했다 — 발췌에 별점이 없는 것이 사실이다
                    <span className="text-xs text-[var(--color-text-muted)]">별점 미제공</span>
                  )}
                  {r.isReceiptVerified && <span className="badge-certified text-[9px]">영수증</span>}
                  {r.isPhoneVerified && (
                    <span className="text-[9px] bg-[var(--color-info)] text-white px-1.5 py-0.5 rounded">
                      전화
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {r.reviewerName} · {r.visitedAt.slice(5)}
                </span>
              </div>
              <p className="text-base leading-relaxed">{r.content}</p>
              {(r.treatmentName || r.ageGroup) && (
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {[r.treatmentName, r.ageGroup].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 후기 0건 — 지우지 않고 왜 비어 있는지 적는다 */
function ReviewsZeroState({ hospital }: { hospital: Hospital }) {
  return (
    <section className="section-space bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <p className="eyebrow">REVIEWS</p>
        <h2 className="mt-2">후기 수집 상태</h2>
        <div className="mt-6 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-5">
          <p className="text-base leading-relaxed">
            메디록은 영수증과 휴대폰 인증으로 실제 방문을 확인한 후기만 싣습니다. 이 병원은 아직 그
            수집을 시작하기 전이라 올라간 후기가 없습니다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            별점과 후기 수가 비어 있는 것은 평가가 낮다는 뜻이 아니라, 메디록이 집계한 값이 아직
            없다는 뜻입니다.
          </p>
          <a
            href={naverPlaceSearchUrl(hospital.nameKr, hospital.addressLine)}
            target="_blank"
            rel="noopener nofollow"
            className="mt-4 inline-block text-sm text-[var(--color-accent-600)] underline underline-offset-2"
          >
            지도에서 공개 후기 확인
          </a>
        </div>
      </div>
    </section>
  );
}
