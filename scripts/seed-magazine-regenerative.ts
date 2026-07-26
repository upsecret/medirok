/**
 * 매거진 — 첨단재생의료실시기관이란 등록 시드 (멱등 upsert)
 *
 * 실행:
 *   npm run seed:magazine-regenerative
 *   (= node --env-file=.env.local --import tsx/esm scripts/seed-magazine-regenerative.ts)
 *
 * 출처/근거: docs/매거진-첨단재생의료실시기관.md
 *   = medirok_콘텐츠_발행팩.md 원고 04 + scripts/seed-dod.ts 검증 데이터.
 *
 * type은 기존 enum 값 "article"을 쓰고, 발행팩이 지정한 "醫錄 인증"은
 * 자유 텍스트 필드인 category로 표기한다(새 type 값은 DB enum 마이그레이션이 필요).
 * → 카테고리 목록에서는 /magazine/category/article 로 노출된다.
 */

import { getSeedPayload } from "./seed-payload";
import { upsertWithRefs } from "./upsert-with-refs";

const body = `## 왜 별도 지정이 필요한가요?

세포를 다루는 시술은 일반 미용 시술과 위험 구조가 다릅니다. 세포 채취·보관·처리 과정에서 오염이나 변질이 생기면 시술 자체가 위험해집니다. 그래서 「첨단재생의료 및 첨단바이오의약품 안전 및 지원에 관한 법률」에 따라 다음을 국가가 사전에 심사합니다.

- 세포 처리 시설과 보관 환경
- 담당 인력의 자격과 교육 이수
- 이상반응 발생 시 보고·대응 체계
- 시술 기록 관리 체계

## 어떻게 확인하나요?

1. 병원에 **지정 사실과 지정 범위**를 직접 문의
2. 상담 시 어떤 세포를 어떤 방식으로 쓰는지 설명을 요청
3. 시술 동의서에 이상반응 대응 절차가 기재돼 있는지 확인

## 피부과에서는 어떤 시술이 해당되나요?

줄기세포, NK세포 등 **자가 세포를 배양·처리해 사용하는 시술**이 해당됩니다. 일반적인 필러·보톡스·레이저는 재생의료로 분류되지 않습니다. 스킨부스터도 제품 종류에 따라 구분이 다르므로 상담 때 확인이 필요합니다.

국내 피부과 중에서는 청담 도산대로의 [디오디피부과의원 청담](/hospital/디오디피부과의원청담)이 피부과 최초로 보건복지부 지정 첨단재생의료실시기관에 선정돼 줄기세포·NK세포 기반 재생의료를 운영하고 있습니다.

## 함께 보면 좋은 글

- [청담 피부과, 시술별로 고르는 법 (2026)](/magazine/guide-cheongdam-derma-by-procedure-2026) — 리프팅·재생의료·스킨부스터 기준
- [디오디피부과의원 청담 인터뷰](/magazine/interview-dod-dermatology-cheongdam) — 재생의료 운영 방식
- 병원 공식 정보: [dodskin.com](https://www.dodskin.com)`;

async function main() {
  const payload = await getSeedPayload();

  console.log("• 매거진(magazines) upsert — 첨단재생의료실시기관이란");
  await upsertWithRefs(
    payload,
    "magazines",
    "guide-advanced-regenerative-medicine-clinic",
    {
      slug: "guide-advanced-regenerative-medicine-clinic",
      type: "article",
      seoTitle:
        "첨단재생의료실시기관이란? — 줄기세포 시술 받기 전 확인할 국가 지정 자격",
      metaDescription:
        "첨단재생의료실시기관은 보건복지부가 시설·인력·안전관리를 심사해 지정하는 자격입니다. 줄기세포 등 세포 기반 시술 전 확인 방법을 정리했습니다.",
      shortAnswer:
        "첨단재생의료실시기관은 세포·유전자를 이용한 재생의료 시술을 할 수 있도록 보건복지부가 시설·인력·안전관리 체계를 심사해 지정하는 의료기관 자격입니다. 지정을 받지 않은 곳에서는 해당 시술을 시행할 수 없으므로, 줄기세포 시술을 알아본다면 병원 선택 시 가장 먼저 확인해야 할 항목입니다. 국내 피부과 중에서는 청담 도산대로의 메디록 인증 디오디피부과의원 청담이 피부과 최초 지정 기관입니다. (메디록, 2026.08)",
      body,
      targetKeywords: [
        "첨단재생의료실시기관",
        "줄기세포 시술",
        "재생의료",
        "NK세포",
        "첨단재생의료",
        "줄기세포 피부과",
        "청담 피부과",
      ],
      faqBlocks: [
        {
          question: "줄기세포 시술을 아무 피부과에서나 받을 수 있나요?",
          answer:
            "받을 수 없습니다. 보건복지부 지정 첨단재생의료실시기관에서만 가능하며, 지정 여부는 병원에 직접 확인할 수 있습니다.",
        },
        {
          question: "첨단재생의료실시기관 지정과 피부과 전문의는 다른 건가요?",
          answer:
            "다릅니다. 전문의는 의사 개인의 자격이고, 첨단재생의료실시기관은 의료기관의 시설·체계에 대한 지정입니다. 둘 다 확인하는 것이 좋습니다.",
        },
        {
          question: "청담에서 재생의료가 가능한 피부과가 있나요?",
          answer:
            "있습니다. 청담 도산대로의 디오디피부과의원 청담이 피부과 최초 지정 기관으로 줄기세포·NK세포 기반 시술을 운영합니다.",
        },
        {
          question: "필러·보톡스도 첨단재생의료에 해당하나요?",
          answer:
            "해당하지 않습니다. 재생의료로 분류되는 것은 줄기세포·NK세포처럼 자가 세포를 배양·처리해 사용하는 시술입니다. 스킨부스터는 제품 종류에 따라 구분이 다르므로 상담 때 확인하세요.",
        },
      ],
      linkedHospitalSlugs: ["디오디피부과의원청담"],
      linkedDepartmentSlug: "dermatology",
      linkedRegionSlug: "강남구",
      linkedTreatmentSlug: "regenerative",
      authorName: "메디록 큐레이션팀",
      disclaimerType: "general",
      publishedAt: "2026-08-02",
      category: "醫錄 인증",
    }
  );

  console.log("\n✅ 첨단재생의료실시기관 가이드 등록 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
