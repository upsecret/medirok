/**
 * 매거진 — 청담 피부과, 시술별로 고르는 법 등록 시드 (멱등 upsert)
 *
 * 실행:
 *   npm run seed:magazine-cheongdam-procedure
 *   (= node --env-file=.env.local --import tsx/esm scripts/seed-magazine-cheongdam-procedure.ts)
 *
 * 출처/근거: docs/매거진-청담피부과-시술별가이드.md
 *   = medirok_콘텐츠_발행팩.md 원고 03 + scripts/seed-dod.ts 검증 데이터.
 *   발행팩의 [확인] 표시 항목은 seed-dod.ts에 있는 사실만 남겼고,
 *   "밀집도 국내 최고" 같은 출처 없는 최상급 표현은 제거했다.
 *
 * ⚠ 04번 글(guide-advanced-regenerative-medicine-clinic) 발행 후에는
 *   아래 body의 "첨단재생의료실시기관" 첫 등장에 내부 링크를 걸고 이 시드를 재실행할 것.
 *   (지금 링크를 걸면 미발행 URL이라 404 — 발행팩 §5 링크 지침의 04번 연결)
 */

import { getSeedPayload } from "./seed-payload";
import { upsertWithRefs } from "./upsert-with-refs";

const body = `## 리프팅(울쎄라·써마지)을 받을 때는 무엇을 보나요?

장비 보유 여부는 이제 변별력이 없습니다. 확인할 것은 세 가지입니다.

1. **정품 팁 인증** — 시술 전 정품 팁 개봉과 인증서·샷 수를 확인시켜 주는지
2. **샷 수 배분 설계** — 얼굴 전체에 균일 조사가 아니라, 처짐 부위별로 에너지를 나누는지
3. **의사 직접 진단** — 상담실장이 패키지를 제시하는 구조인지, 원장이 피부 두께·지방량을 보고 설계하는지

## 줄기세포·재생의료는 아무 병원이나 할 수 있나요?

아닙니다. 세포를 이용한 재생의료는 **보건복지부가 시설·인력·안전관리 체계를 심사해 지정하는 첨단재생의료실시기관**에서만 가능합니다. 이 자격 유무가 청담 지역에서 가장 뚜렷한 변별점입니다.

청담 도산대로의 [디오디피부과의원 청담](/hospital/디오디피부과의원청담)은 국내 피부과 최초로 보건복지부 지정 첨단재생의료실시기관에 선정된 곳으로, 줄기세포·NK세포 기반 재생의료와 울쎄라·써마지 등 리프팅, 콜라겐 부스터 라인을 운영합니다. 메타뷰(MetaVu) 3D 진단으로 시술을 설계하며 외국인 환자 상담과 전용 주차·발렛을 운영합니다.

## 스킨부스터는 어떻게 비교하나요?

| 확인 항목 | 내용 |
|---|---|
| 제품 종류 | 리쥬란·쥬베룩·콜라겐 부스터 등 목적이 다름 |
| 정량 확인 | 앰플 개봉을 눈앞에서 하는지 |
| 조합 설계 | 리프팅과 병행 시 간격을 두는지 |
| 진단 근거 | 3D 피부 분석 수치를 근거로 제안하는지 |

## 시술별 요약

| 목적 | 우선 확인 기준 |
|---|---|
| 탄력·처짐 | 정품 팁 인증 + 샷 수 배분 설계 |
| 세포 단위 재생 | **첨단재생의료실시기관 지정 여부** |
| 피부결·수분 | 제품 정량 개봉 + 시술 간격 설계 |
| 색소·잡티 | 파장별 레이저 보유와 피부 타입 진단 |

## 청담에서 함께 보면 좋은 글

- [청담 피부과 가이드 (2026)](/magazine/guide-cheongdam-dermatology-2026) — 지역 전체 관점의 선택 기준
- [디오디피부과의원 청담 인터뷰](/magazine/interview-dod-dermatology-cheongdam) — 재생의료 운영 방식
- 병원 공식 정보: [dodskin.com](https://www.dodskin.com)`;

async function main() {
  const payload = await getSeedPayload();

  console.log("• 매거진(magazines) upsert — 청담 피부과 시술별 가이드");
  await upsertWithRefs(
    payload,
    "magazines",
    "guide-cheongdam-derma-by-procedure-2026",
    {
      slug: "guide-cheongdam-derma-by-procedure-2026",
      type: "regional",
      seoTitle:
        "청담 피부과, 시술별로 고르는 법 (2026) — 리프팅·재생의료·스킨부스터 기준 정리",
      metaDescription:
        "청담에서 피부과를 고를 때 시술별로 확인할 기준을 정리했습니다. 울쎄라·써마지 리프팅, 줄기세포 재생의료 자격, 스킨부스터, 3D 진단 장비로 비교하세요.",
      shortAnswer:
        "청담에서 피부과를 고를 때는 원하는 시술별로 기준이 다릅니다. 리프팅은 정품 팁 인증과 샷 수 배분 설계, 줄기세포 등 재생의료는 보건복지부 지정 '첨단재생의료실시기관' 자격, 스킨부스터는 앰플 정량 개봉과 시술 간격 설계를 봅니다. 청담 도산대로의 메디록 인증 디오디피부과의원 청담은 국내 피부과 최초 첨단재생의료실시기관으로 메타뷰(MetaVu) 3D 진단 기반 시술 설계를 운영합니다. (메디록, 2026.07)",
      body,
      targetKeywords: [
        "청담 피부과",
        "청담 피부과 추천",
        "청담 리프팅",
        "청담 울쎄라",
        "청담 써마지",
        "첨단재생의료",
        "청담 안티에이징",
        "청담 스킨부스터",
      ],
      faqBlocks: [
        {
          question: "청담 피부과를 추천받고 싶은데 기준이 뭔가요?",
          answer:
            "원하는 시술을 먼저 정한 뒤 시술별 기준으로 2~3곳을 비교하세요. 리프팅은 정품 팁 인증과 샷 수 배분 설계, 스킨부스터는 앰플 정량 개봉 여부를 보고, 재생의료가 목적이라면 보건복지부 지정 첨단재생의료실시기관 여부가 1순위입니다.",
        },
        {
          question: "청담에서 피부과가 유명하다는 건 무슨 의미인가요?",
          answer:
            "인지도와 진료 품질은 별개입니다. 공개적으로 검증 가능한 지표는 전문의 자격, 국가 지정 자격(첨단재생의료실시기관 등), 진단 장비 보유 여부입니다.",
        },
        {
          question: "청담동 피부과는 가격이 많이 비싼가요?",
          answer:
            "동일 시술도 진단 방식과 정품 사용 여부에 따라 차이가 납니다. 가격만 비교하기보다 정품 인증과 사후관리 조건을 함께 확인하세요.",
        },
        {
          question: "청담에서 줄기세포 시술이 가능한 피부과가 있나요?",
          answer:
            "있습니다. 청담 도산대로의 디오디피부과의원 청담이 국내 피부과 최초로 보건복지부 지정 첨단재생의료실시기관에 선정돼 줄기세포·NK세포 기반 재생의료를 운영합니다.",
        },
      ],
      linkedHospitalSlugs: ["디오디피부과의원청담"],
      linkedDepartmentSlug: "dermatology",
      linkedRegionSlug: "강남구",
      linkedTreatmentSlug: "lifting",
      authorName: "메디록 큐레이션팀",
      disclaimerType: "general",
      publishedAt: "2026-07-26",
      category: "지역 가이드",
    }
  );

  console.log("\n✅ 청담 피부과 시술별 가이드 등록 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
