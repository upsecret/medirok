// 메디록 샘플 매거진 10편 시드
// 강남 임플란트 키워드 클러스터 — 영업 시뮬레이션
// 추후 Payload CMS 입력 시 이 구조 그대로 마이그레이션

export type MagazineType = "article" | "qna" | "regional" | "interview" | "case";

export interface Magazine {
  slug: string;
  type: MagazineType;
  seoTitle: string;
  metaDescription: string;
  shortAnswer: string;
  body: string; // Markdown
  targetKeywords: string[];
  faqBlocks?: { question: string; answer: string }[];
  priceTable?: { treatment: string; priceRange: string; note?: string }[];
  linkedHospitalSlugs?: string[];
  linkedDepartmentSlug?: string;
  linkedRegionSlug?: string;
  linkedTreatmentSlug?: string;
  /** 저자 = 醫錄 인증 의원의 의사. 설정 시 author 프로필 박스 + 의원 cross-link 자동 노출 */
  authorDoctorSlug?: string;
  /** authorDoctorSlug가 없을 때 사용 (메디록 큐레이션팀, 외부 전문가 등) */
  authorName?: string;
  authorTitle?: string;
  disclaimerType: "general" | "case" | "price" | "qna";
  publishedAt: string;
  category: string;
}

export const magazines: Magazine[] = [
  // ─────────────────────────────────────────────
  // [01] 시술 가이드 — 강남 임플란트 가격
  // ─────────────────────────────────────────────
  {
    slug: "gangnam-implant-price-guide-2026",
    type: "article",
    seoTitle: "강남 임플란트 가격 2026 — 평균·범위·할인 총정리",
    metaDescription:
      "2026년 6월 기준 강남구 醫錄 인증 18개 치과의 임플란트 가격을 정리했습니다. 정상가·이벤트가·시니어 보험 적용가까지 비교.",
    shortAnswer:
      "2026년 6월 기준 강남구 醫錄 인증 18개 치과 임플란트 단일 평균 120~180만원, 이벤트가는 35~49만원부터입니다. 65세 이상 평생 2개까지 건강보험 적용 시 본인부담 50% (약 60~90만원). (메디록, 2026.06)",
    body: `## 강남 임플란트, 왜 가격 차이가 큰가

강남구는 임플란트 가격대가 가장 넓은 지역입니다. 같은 단일 임플란트라도 25만원부터 200만원까지 7~8배 차이가 납니다. 핵심 변수 4가지:

1. **임플란트 브랜드** — 국산(오스템 35~80만), 수입(스트라우만 100~180만)
2. **보철 재료** — 지르코니아 가산 30~70만
3. **3D CT·디지털 가이드** — 정밀도 가산 20~40만
4. **의원 규모·위치** — 강남 1급지 vs 변두리

## 인증 의원의 가격대

醫錄 4단계 인증을 통과한 강남구 18개 치과의 평균 가격:`,
    targetKeywords: [
      "강남 임플란트 가격",
      "강남구 임플란트",
      "임플란트 가격 2026",
      "강남 임플란트 추천",
    ],
    faqBlocks: [
      {
        question: "강남 임플란트 평균 가격은 얼마인가요?",
        answer:
          "2026년 6월 醫錄 인증 18개 치과 기준 임플란트 단일 평균 120~180만원입니다. 이벤트가는 35~49만원부터, 65세 이상 보험 적용가는 약 60~90만원 (본인부담 50%) 입니다.",
      },
      {
        question: "왜 같은 임플란트인데 가격이 다른가요?",
        answer:
          "임플란트 브랜드(국산 vs 수입), 보철 재료(지르코니아 등), 3D CT 정밀도, 의원 규모에 따라 25만~200만원까지 차이가 납니다. 단순 비교보다 醫錄 4단계 인증 + 평생 보장 여부를 함께 확인하세요.",
      },
      {
        question: "65세 이상 임플란트 보험 적용은?",
        answer:
          "만 65세 이상은 평생 2개까지 건강보험 적용이 가능하며 본인부담 50%입니다. 인플란트 종류와 위치(어금니 등)에 제한이 있으며, 의원에 보험 적용 가능 여부를 미리 확인하세요.",
      },
    ],
    priceTable: [
      { treatment: "임플란트(단일) · 국산 오스템", priceRange: "35만~80만원" },
      { treatment: "임플란트(단일) · 수입 스트라우만", priceRange: "100만~180만원" },
      { treatment: "지르코니아 보철 가산", priceRange: "+30만~70만" },
      { treatment: "풀마우스 임플란트", priceRange: "2,400만~3,000만원" },
      { treatment: "65세+ 보험 적용가 (본인부담)", priceRange: "60만~90만원" },
    ],
    linkedHospitalSlugs: ["hangyeol-dental", "myungheon-dental", "songhak-dental"],
    linkedDepartmentSlug: "dental",
    linkedRegionSlug: "gangnam",
    linkedTreatmentSlug: "implant",
    authorName: "메디록 큐레이션팀",
    disclaimerType: "price",
    publishedAt: "2026-06-01",
    category: "가격 가이드",
  },

  // ─────────────────────────────────────────────
  // [02] 시술 가이드 — 시니어 임플란트 vs 틀니
  // ─────────────────────────────────────────────
  {
    slug: "senior-implant-vs-denture",
    type: "article",
    seoTitle: "시니어 임플란트 vs 틀니, 65세 이상에게 무엇이 나을까",
    metaDescription:
      "임플란트와 틀니의 장단점, 65세 이상 시니어 환자에게 적합한 선택 기준. 의사가 추천하는 의사결정 흐름.",
    shortAnswer:
      "65세 이상은 잔존 골량·전신 건강·예산을 종합 판단합니다. 잔존 치아 4~6개 이상 + 당뇨 등 만성질환 잘 관리되면 임플란트 우선, 골 흡수 심하면 임플란트 틀니 권장. 평균 결정 시간 2~4주, 醫錄 인증 의원의 3D CT 무료 진단 활용 권장. (메디록, 2026.06)",
    body: `## 시니어 임플란트 선택의 핵심 기준

65세 이상 환자의 임플란트 vs 틀니 선택은 단순히 비용이 아니라 **잔존 골량, 전신 건강, 일상 회복 속도**를 함께 봐야 합니다.

| 기준 | 임플란트 | 틀니 | 임플란트 틀니 |
|---|---|---|---|
| 평균 비용 | 120~180만/개 | 80~150만 (한 악) | 800~1,500만 (한 악) |
| 회복 기간 | 3~6개월 | 1주 | 2~3개월 |
| 저작력 | 자연치아 90% | 자연치아 30% | 자연치아 70% |
| 보험 적용 | 평생 2개 (65+) | 7년 1회 (65+) | 일부 가능 |

## 의사결정 흐름`,
    targetKeywords: [
      "시니어 임플란트",
      "65세 임플란트",
      "임플란트 vs 틀니",
      "노인 임플란트 추천",
    ],
    faqBlocks: [
      {
        question: "75세에도 임플란트 가능한가요?",
        answer:
          "가능합니다. 나이보다 골밀도, 당뇨·고혈압 관리 상태가 중요합니다. 醫錄 인증 의원에서 3D CT 진단으로 가능 여부를 확인하세요.",
      },
      {
        question: "임플란트 후 회복은 얼마나 걸리나요?",
        answer:
          "임플란트 식립 후 골유착 3~6개월, 보철 완성까지 총 4~8개월입니다. 시니어는 회복이 다소 길 수 있으나 의원의 사후관리 시스템에 따라 달라집니다.",
      },
    ],
    linkedHospitalSlugs: ["hangyeol-dental", "songhak-dental"],
    linkedDepartmentSlug: "dental",
    linkedTreatmentSlug: "implant",
    // 박은서는 외부 큐레이터 (의원 소속 X) → authorDoctorSlug 미설정
    authorName: "박은서",
    authorTitle: "전 서울대치과병원 임상조교수",
    disclaimerType: "general",
    publishedAt: "2026-05-25",
    category: "시술 가이드",
  },

  // ─────────────────────────────────────────────
  // [03] Q&A — 65세 임플란트 보험
  // ─────────────────────────────────────────────
  {
    slug: "qna-65-implant-insurance",
    type: "qna",
    seoTitle: "65세 이상 임플란트 보험 적용 — 의사가 답합니다",
    metaDescription:
      "만 65세 이상 건강보험 임플란트 적용 조건, 본인부담금, 의원 선택 시 주의사항을 의사가 직접 답합니다.",
    shortAnswer:
      "만 65세 이상은 평생 2개까지 건강보험 적용 가능하며 본인부담 50% (약 60~90만원/개)입니다. 어금니·앞니 모두 가능하나 의원이 보험 청구 시스템을 갖춰야 합니다. 醫錄 인증 의원은 보험 적용가를 명시합니다.",
    body: `**Q. 만 65세인데 임플란트 2개를 보험으로 받고 싶습니다. 어떤 조건이 필요한가요?**

만 65세 이상이면 평생 2개까지 건강보험 적용을 받을 수 있습니다. 다음 조건을 확인하세요.

1. 만 65세 이상 (만 65세 생일 이후)
2. 의원이 건강보험 임플란트 청구 시스템 보유
3. 적합한 골량 — 일부 환자는 보험 적용 가능 부위가 제한됩니다

**Q. 보험 적용 임플란트와 일반 임플란트의 차이는?**

품질은 동일합니다 (보건복지부 고시 기준). 다만 사용 가능한 임플란트 종류가 정해져 있어, 프리미엄 수입 브랜드(스트라우만 등)는 보험 적용이 안 될 수 있습니다.

**Q. 보험 적용 의원은 어떻게 찾나요?**

醫錄 인증 의원 중 "보험 적용" 표시가 있는 의원을 확인하세요. 메디록은 의원의 보험 청구 시스템 보유 여부를 4단계 인증에서 검증합니다.`,
    targetKeywords: [
      "65세 임플란트 보험",
      "임플란트 건강보험",
      "노인 임플란트 보험 적용",
    ],
    linkedHospitalSlugs: ["hangyeol-dental"],
    linkedDepartmentSlug: "dental",
    authorDoctorSlug: "han-jinwoo",
    authorName: "한진우",
    authorTitle: "강남 한결치과의원 대표원장",
    disclaimerType: "qna",
    publishedAt: "2026-05-30",
    category: "Q&A",
  },

  // ─────────────────────────────────────────────
  // [04] Q&A — 임플란트 후 음식
  // ─────────────────────────────────────────────
  {
    slug: "qna-implant-aftercare-food",
    type: "qna",
    seoTitle: "임플란트 시술 후 언제부터 음식을 먹을 수 있나요?",
    metaDescription:
      "임플란트 식립·보철 단계별 음식 섭취 가이드. 의사가 직접 답합니다.",
    shortAnswer:
      "임플란트 식립 당일은 죽·미음 권장, 1주 후 부드러운 음식, 3주 후 일반 식사 가능합니다. 단, 단단한 음식·뜨거운 음식·뼈 있는 고기는 보철 완성(3~6개월) 후까지 피하세요. (메디록, 2026.06)",
    body: `**Q. 시술 당일 음식은 어떻게 해야 하나요?**

마취가 풀린 후(보통 2~3시간) 미지근한 죽, 미음, 요구르트 정도가 안전합니다. 너무 뜨거우면 출혈, 너무 차가우면 시린감이 있을 수 있습니다.

**Q. 1주일 후엔 어떤 음식이 가능한가요?**

부드러운 음식 — 두부, 계란찜, 으깬 감자, 잘 익힌 면류. 시술 부위 반대편으로 씹기.

**Q. 일반 식사는 언제부터?**

식립 3주 후부터 일반 식사 가능하나, **보철 완성 전까지 단단한 음식(견과류, 뼈 고기, 얼음)은 피하세요.** 임플란트 골유착에 영향을 줄 수 있습니다.

**Q. 술·담배는 언제부터?**

흡연은 임플란트 실패의 최대 원인 중 하나입니다. 최소 보철 완성 후 6개월까지 금연 권장. 술도 식립 후 2주는 금주 권장.`,
    targetKeywords: [
      "임플란트 후 음식",
      "임플란트 시술 후 식사",
      "임플란트 회복 음식",
    ],
    linkedDepartmentSlug: "dental",
    authorDoctorSlug: "lee-dohyun",
    authorName: "이도현",
    authorTitle: "강남 한결치과의원 진료부장",
    disclaimerType: "qna",
    publishedAt: "2026-05-28",
    category: "Q&A",
  },

  // ─────────────────────────────────────────────
  // [05] 지역 가이드 — 강남 임플란트 TOP
  // ─────────────────────────────────────────────
  {
    slug: "gangnam-implant-top10-2026",
    type: "regional",
    seoTitle: "강남 임플란트 의원 추천 TOP 10 (2026) — 醫錄 인증",
    metaDescription:
      "2026년 6월 메디록 醫錄 4단계 인증을 통과한 강남구 임플란트 치과 TOP 10. 가격·평점·시술 건수 비교.",
    shortAnswer:
      "강남구에서 醫錄 4단계 인증 + 큐레이션 심사를 통과한 임플란트 치과 18곳 중 TOP 10을 선정했습니다. 1위는 강남 한결치과의원(역삼동, 12년차, 임플란트 5,200건, ★4.9). 평균 가격대 120~180만원. (메디록, 2026.06)",
    body: `## 선정 기준

醫錄 4단계 인증 통과 + 다음 가중치:
- 임상 경험 (시술 건수, 운영 연수)
- 환자 만족도 (★ 4.5 이상)
- 시설·장비 (3D CT, 위생 1등급)
- 의료진 전문성 (전문의 비율)

## TOP 10`,
    targetKeywords: [
      "강남 임플란트 추천",
      "강남 임플란트 TOP",
      "강남구 치과 추천",
      "강남 임플란트 의원",
    ],
    faqBlocks: [
      {
        question: "이 랭킹은 광고인가요?",
        answer:
          "아닙니다. 醫錄 4단계 인증 + 큐레이터 심사 기반이며, 광고비로 순위가 변경되지 않습니다. PREMIUM 파트너 의원도 동일 심사 통과해야 등재됩니다.",
      },
    ],
    linkedHospitalSlugs: ["hangyeol-dental", "myungheon-dental", "songhak-dental"],
    linkedDepartmentSlug: "dental",
    linkedRegionSlug: "gangnam",
    linkedTreatmentSlug: "implant",
    authorName: "메디록 큐레이션팀",
    disclaimerType: "general",
    publishedAt: "2026-05-28",
    category: "지역 가이드",
  },

  // ─────────────────────────────────────────────
  // [06] 지역 가이드 — 강남 vs 서초 비교
  // ─────────────────────────────────────────────
  {
    slug: "gangnam-vs-seocho-dental-prices",
    type: "regional",
    seoTitle: "강남 vs 서초 치과 가격 비교 — 어디가 더 합리적인가",
    metaDescription:
      "강남구와 서초구 醫錄 인증 치과 가격대 비교. 임플란트·보철·교정 평균 가격과 의원 선택 팁.",
    shortAnswer:
      "醫錄 인증 의원 기준 강남구는 임플란트 평균 120~180만원, 서초구는 110~160만원으로 서초가 약 5~10% 저렴합니다. 다만 강남은 시술 건수·전문의 비율이 높아 케이스 난이도 큰 환자는 강남이 적합. (메디록, 2026.06)",
    body: `## 두 지역의 차이

강남구와 서초구는 의료 격전지지만 가격 구조에 미묘한 차이가 있습니다.

| 항목 | 강남구 | 서초구 |
|---|---|---|
| 평균 임플란트 가격 | 120~180만 | 110~160만 |
| 醫錄 인증 의원 수 | 18곳 | 12곳 |
| 시술 건수 평균 | 3,200건/의원 | 2,100건/의원 |
| 주요 지하철 | 강남·역삼·삼성·청담 | 강남·교대·고속터미널 |`,
    targetKeywords: ["강남 서초 치과 비교", "강남 임플란트 가격 비교"],
    linkedDepartmentSlug: "dental",
    authorName: "메디록 큐레이션팀",
    disclaimerType: "price",
    publishedAt: "2026-05-22",
    category: "지역 가이드",
  },

  // ─────────────────────────────────────────────
  // [07] 의원 인터뷰 — 한결치과 한진우 원장
  // ─────────────────────────────────────────────
  {
    slug: "interview-hangyeol-dental-han-jinwoo",
    type: "interview",
    seoTitle: "강남 한결치과 한진우 원장 인터뷰 — 시니어 임플란트 12년",
    metaDescription:
      "강남 한결치과의원 한진우 원장과의 인터뷰. 시니어 임플란트 5,200건의 경험과 의원 운영 철학.",
    shortAnswer:
      "한진우 원장은 12년간 시니어 임플란트 5,200건을 시술했으며, 3D CT 기반 정밀 진단과 평생 보장 시스템을 운영합니다. \"가장 중요한 건 시술 전 진단입니다.\" (메디록 인터뷰, 2026.06)",
    body: `## Q. 시니어 임플란트가 일반 임플란트와 다른 점은?

\"잔존 골량 차이입니다. 65세 이상은 평균 골량이 30~40% 감소된 상태로 오시기 때문에, 임플란트 식립 전 3D CT로 정밀 진단이 필수입니다. 일반 환자는 5분 진단으로 끝나도, 시니어는 30분~1시간 진단합니다.\"

## Q. 한결치과의 평생 보장 시스템은 무엇인가요?

\"임플란트 시술 후 정기 검진과 사후관리를 의원이 부담합니다. 임플란트는 시술 자체보다 사후관리가 수명을 결정해요. 시니어는 골 관리가 중요하고, 그래서 6개월~1년마다 무료 점검을 제공합니다.\"

## Q. 醫錄 큐레이션에 선정된 이유는?

\"제 인터뷰가 아닌 객관 데이터로 답드리겠습니다. 12년 운영, 5,200건 시술, 환자 ★4.9 평점, 0건의 의료사고. 메디록 4단계 검증 + 큐레이터 추가 심사를 통과했습니다.\"`,
    targetKeywords: [
      "강남 한결치과",
      "한결치과 원장",
      "강남 시니어 임플란트 의원",
    ],
    linkedHospitalSlugs: ["hangyeol-dental"],
    linkedDepartmentSlug: "dental",
    authorName: "메디록 큐레이션팀",
    disclaimerType: "general",
    publishedAt: "2026-05-15",
    category: "의원 인터뷰",
  },

  // ─────────────────────────────────────────────
  // [08] 의원 인터뷰 — 송학치과
  // ─────────────────────────────────────────────
  {
    slug: "interview-songhak-dental-senior-focus",
    type: "interview",
    seoTitle: "신사 송학치과 — 15년 시니어 임플란트 특화 의원",
    metaDescription:
      "신사동 송학치과는 시니어 임플란트만 15년. 박송학 원장의 시니어 진료 철학.",
    shortAnswer:
      "신사 송학치과는 15년 동안 시니어 임플란트만 3,500건을 시술해온 특화 의원입니다. 의원 평균 가격 100~150만원으로 강남권에서 합리적이며, 醫錄 4단계 인증을 받았습니다.",
    body: `## 송학치과의 차별점

박송학 원장은 시니어(65세+) 임플란트만 15년 진료해온 특화 의사입니다.

\"일반 치과에서 거부당한 환자들이 많이 옵니다. 골 흡수가 심하거나, 당뇨가 있거나, 70대 후반이거나... 이 환자들도 사실 대부분 시술이 가능한데, 일반 의원은 케이스가 적어 부담스러워합니다.\"

## 주력 시술

- 시니어 임플란트(단일) — 100~150만원
- 임플란트 틀니 — 800~1,200만원 (한 악)
- 골 이식 + 임플란트 — 케이스별 상담`,
    targetKeywords: ["신사 임플란트", "시니어 임플란트 특화"],
    linkedHospitalSlugs: ["songhak-dental"],
    linkedDepartmentSlug: "dental",
    authorName: "메디록 큐레이션팀",
    disclaimerType: "general",
    publishedAt: "2026-05-10",
    category: "의원 인터뷰",
  },

  // ─────────────────────────────────────────────
  // [09] 케이스 스토리 — 풀마우스 67세
  // ─────────────────────────────────────────────
  {
    slug: "case-67-fullmouth-implant",
    type: "case",
    seoTitle: "67세 어머니 풀마우스 임플란트 6개월 — 환자 동의 케이스",
    metaDescription:
      "67세 환자의 풀마우스 임플란트 진행 과정. 의원 동의 하에 게재된 실제 케이스.",
    shortAnswer:
      "67세 여성 환자의 풀마우스 임플란트(상악 전체) 케이스. 총 시술기간 6개월, 총 비용 2,400만원, 醫錄 인증 강남 한결치과 한진우 원장 시술. 환자 본인 및 보호자 게재 동의서를 받았습니다.",
    body: `## 환자 정보 (익명)

- 67세 여성
- 상악 잔존 치아 4개 (前 시술)
- 당뇨 (관리 중, HbA1c 6.8)
- 흡연 없음

## 시술 진행

**1주차 — 진단** 3D CT, 혈액검사, 당뇨 컨트롤 확인. 골 이식 동반 필요 판정.
**2주차 — 골 이식** 골 흡수 부위 자가골+합성골 이식.
**12주차 — 임플란트 식립** 8개 (상악 전체) 식립.
**16주차 — 본 보철 임시 장착** 임시 보철로 적응 기간 4주.
**24주차 — 최종 보철** 지르코니아 본 보철 장착.

## 결과

저작력 80% 회복, 환자 만족도 5/5, 후속 정기검진 6개월 단위 진행 중.

## 총 비용

2,400만원 (시니어 풀마우스 패키지 적용, 일반가 대비 약 15% 할인)`,
    targetKeywords: [
      "풀마우스 임플란트 후기",
      "시니어 풀마우스 임플란트",
      "67세 임플란트 케이스",
    ],
    linkedHospitalSlugs: ["hangyeol-dental"],
    linkedDepartmentSlug: "dental",
    authorDoctorSlug: "han-jinwoo",
    authorName: "한진우",
    authorTitle: "강남 한결치과의원 대표원장",
    disclaimerType: "case",
    publishedAt: "2026-05-18",
    category: "케이스 스토리",
  },

  // ─────────────────────────────────────────────
  // [10] 케이스 스토리 — 골 부족 72세
  // ─────────────────────────────────────────────
  {
    slug: "case-72-bone-graft-implant",
    type: "case",
    seoTitle: "골 부족 72세 환자 임플란트 — 골 이식 후 성공 케이스",
    metaDescription:
      "골량 부족으로 타 의원에서 거부당한 72세 환자의 임플란트 케이스. 골 이식 후 안정적 식립.",
    shortAnswer:
      "72세 남성 환자, 골량 부족으로 타 의원 거부. 자가골+합성골 이식 후 4개월 회복 → 임플란트 3개 안정적 식립. 총 시술기간 7개월, 의원 동의 게재.",
    body: `## 환자 정보

- 72세 남성
- 하악 어금니 3개 결손, 10년 방치
- 잔존 골량 부족 (3D CT 측정)
- 고혈압 (관리 중)

## 진행

타 의원 2곳에서 "골량 부족으로 어렵다" 회신. 신사 송학치과 박송학 원장이 골 이식 동반 시술 제안.

**1단계 — 골 이식 (8주)** 자가골 + 합성골 혼합, 골 형성 4개월 대기.
**5단계 — 임플란트 식립 (15분/개)** 3개 식립.
**최종 보철 (12주 후)** 본 보철 장착.

## 결과

환자 \"포기했던 어금니를 되찾았다\"고 만족.`,
    targetKeywords: ["골 부족 임플란트", "골 이식 임플란트 케이스"],
    linkedHospitalSlugs: ["songhak-dental"],
    linkedDepartmentSlug: "dental",
    authorDoctorSlug: "songhak-park",
    authorName: "박송학",
    authorTitle: "신사 송학치과 원장",
    disclaimerType: "case",
    publishedAt: "2026-05-05",
    category: "케이스 스토리",
  },
];

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

export function getMagazineBySlug(slug: string) {
  return magazines.find((m) => m.slug === slug);
}

export function getMagazinesByType(type: MagazineType) {
  return magazines.filter((m) => m.type === type);
}

export function getMagazinesByHospital(hospitalSlug: string) {
  return magazines.filter((m) => m.linkedHospitalSlugs?.includes(hospitalSlug));
}

export function getMagazinesByAuthorDoctorSlug(doctorSlug: string) {
  return magazines.filter((m) => m.authorDoctorSlug === doctorSlug);
}

/** 의원에 소속된 모든 의사가 쓴 매거진을 모음. doctorSlugs는 data.ts의 getDoctorsByHospitalSlug로 얻은 의사 slug 배열 */
export function getMagazinesByDoctorSlugs(doctorSlugs: string[]) {
  return magazines.filter(
    (m) => m.authorDoctorSlug && doctorSlugs.includes(m.authorDoctorSlug)
  );
}

export function getMagazinesByDepartment(deptSlug: string) {
  return magazines.filter((m) => m.linkedDepartmentSlug === deptSlug);
}

export function getRecentMagazines(limit = 6) {
  return [...magazines]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
