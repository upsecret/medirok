/**
 * 힐하우스피부과 5개 지점 등록 시드 — 멱등(upsert) 스크립트
 *
 * 실행:
 *   npm run seed:healhouse
 *   (= node --env-file=.env.local --import tsx/esm scripts/seed-healhouse.ts)
 *
 * - regions: 경기 › 분당구 · 경기 › 팔달구 · 대구 › 동구 를 신규 upsert
 *   (서울·경기·대구, 강남구·광진구는 운영 DB에 이미 있다 — 2026-09-16 조회)
 * - hospitals: 강남·건대·판교·수원·대구 5개 지점을 slug 기준 upsert, 소속 전문의 16명 포함
 * - 여러 번 실행해도 안전(존재하면 update, 없으면 create)
 *
 * 데이터 출처(2026-09): healhouseskin.com 공식 — 지점 페이지의 JSON-LD(MedicalClinic: 주소·전화·요일별 진료시간),
 * 지점 페이지 본문(역 출구·도보 시간), 의료진 페이지(경력·전문 영역·소속 지점).
 *
 * 원칙 — 공식 사이트에서 확인되는 것만 쓴다.
 *   - 후기·별점: 예온·디오디와 같은 방식 — 구글맵 공개 집계를 rating/reviewCount에, 발췌 3건을
 *     reviews[]에 출처 표기로 넣는다(2026-10-31 확인). 메디록 자체 검증(영수증/전화) 후기가 아니라
 *     각 리뷰는 isReceiptVerified/isPhoneVerified=false이고 stage2Reviews도 false다.
 *     **JSON-LD aggregateRating에는 넘기지 않는다** — 런북 §11-5.
 *     네이버는 2021년 별점 폐지로 평점을 제공하지 않아 집계 출처로 쓸 수 없다(런북 §11-4).
 *   - 인증 단계: stage3(피부과 전문의)만 근거가 있다. stage1(진료이력)·stage4(시설장비)는 근거 문서가
 *     없어 false — 영업 확인 후 올린다. 사이트의 자체 수치("시술 55종" 등)는 쓰지 않는다.
 *   - 동(dong): 주소에 동 표기가 없어 연결하지 않는다.
 *   - tier=PREMIUM: 유료 고객(2026-09 계약).
 *
 * ⚠️ regions.slug는 전국 unique다. "동구"는 부산·인천·광주·대전·울산에도 있는 이름인데 이번에 대구가
 *    선점한다(현재 운영 DB에 다른 동구 없음). 다른 시의 동구 병원을 들일 때는 unique 제약을 먼저 풀어야 한다.
 */

import { getSeedPayload } from "./seed-payload";
import { upsertWithRefs } from "./upsert-with-refs";

async function main() {
  const payload = await getSeedPayload();

  console.log("• 지역(regions) upsert");
  // 시도는 이미 존재하지만 e2e 등 다른 환경에서도 부모가 보장되도록 함께 upsert(기존 값과 동일).
  await upsertWithRefs(payload, "regions", "경기", { slug: "경기", nameKr: "경기", nameEn: "Gyeonggi", level: "sido", parentSlug: "" });
  await upsertWithRefs(payload, "regions", "대구", { slug: "대구", nameKr: "대구", nameEn: "Daegu", level: "sido", parentSlug: "" });
  await upsertWithRefs(payload, "regions", "분당구", {
    slug: "분당구",
    nameKr: "분당구",
    nameEn: "Bundang-gu",
    level: "sigungu",
    parentSlug: "경기",
  });
  await upsertWithRefs(payload, "regions", "팔달구", {
    slug: "팔달구",
    nameKr: "팔달구",
    nameEn: "Paldal-gu",
    level: "sigungu",
    parentSlug: "경기",
  });
  await upsertWithRefs(payload, "regions", "동구", {
    slug: "동구",
    nameKr: "동구",
    nameEn: "Dong-gu",
    level: "sigungu",
    parentSlug: "대구",
  });

  console.log("• 의원(hospitals) upsert — 힐하우스피부과 강남점");
  await upsertWithRefs(payload, "hospitals", "힐하우스피부과강남점", {
    slug: "힐하우스피부과강남점",
    nameKr: "힐하우스피부과 강남점",
    shortDescription: "강남대로 논현역 인근 · 피부과 전문의 직접 진료 · 백반증 진료와 안티에이징",
    departmentSlug: "dermatology",
    sidoSlug: "서울",
    regionSlug: "강남구",
    // 주소에 동 표기가 없어 동은 연결하지 않는다(추정 금지) — 구 단위로 연결
    addressLine: "서울특별시 강남구 강남대로 518, 4·5층",
    nearestStation: "7호선·신분당선 논현역 3번 출구",
    nearestStationName: "논현역",
    walkingMinutes: 2,
    tier: "PREMIUM",
    phone: "02-6951-5761",
    // 평점·후기 출처: 구글맵 "힐하우스피부과의원 강남점" 집계, 2026-10-31 확인.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    // JSON-LD aggregateRating에는 넘기지 않는다 — 런북 §11-5.
    rating: 5.0,
    reviewCount: 48,
    doctorCount: 4,
    tags: ["안티에이징", "리프팅", "스킨부스터", "필러", "색소", "여드름 흉터", "백반증"],
    certification: {
      stage1History: false,
      stage1Detail: "",
      stage2Reviews: false,
      stage2Detail:
        "구글맵 공개 후기 48개 중 3건 발췌 게시(2026-10 확인) · 메디록 영수증·휴대폰 인증 후기는 수집 전",
      stage3Credentials: true,
      stage3Detail: "공식 사이트 의료진 소개 기준 피부과 전문의 4명 진료",
      stage4Facility: false,
      stage4Detail: "",
      certifiedAt: "",
    },
    curationNote: {
      text: "강남대로 논현역 3번 출구 인근의 힐하우스피부과 강남점입니다. 피부과 전문의 4명이 진단부터 시술 설계까지 직접 진료하며, 대학병원에서 백반증을 진료·연구해 온 전문의가 백반증 진료를 맡고 있습니다. 리프팅·스킨부스터 등 안티에이징 진료를 함께 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — healhouseskin.com/ko/doctors/<slug>/ 공식 소개(2026-09). credentials는 "경력" 항목 그대로.
    doctors: [
      {
        slug: "bae-jungmin",
        nameKr: "배정민",
        title: "원장",
        specialty: "백반증·항산화·롱제비티",
        credentials: [
          "가톨릭대학교 의과대학 피부과 조교수·부교수",
          "가톨릭대학교 의과대학 피부과 임상강사·연구계약교원",
          "연세대학교 의과대학 세브란스병원 피부과 임상강사",
          "보건복지부 인증 피부과 전문의",
          "가톨릭대학교 의과대학 대학원 의학박사",
          "가톨릭대학교 의과대학 의학과 졸업",
          "가톨릭중앙의료원 인턴 및 피부과 전공의",
        ],
      },
      {
        slug: "jung-hanmi",
        nameKr: "정한미",
        title: "원장",
        specialty: "퍼스널 안티에이징·콜라겐 볼륨 디자인·스킨 롱제비티",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "가톨릭중앙의료원 인턴 및 피부과 전공의",
          "가톨릭대학교 성빈센트병원 피부과 임상강사",
          "후즈후피부과 동탄점 원장",
          "힐하우스피부과 강남점 대표원장",
          "가톨릭대학교 의과대학 졸업",
        ],
      },
      {
        slug: "park-saemi",
        nameKr: "박새미",
        title: "원장",
        specialty: "퍼스널 안티에이징·디자인 리프팅",
        credentials: [
          "힐하우스피부과 대표",
          "전) 후즈후피부과 압구정점",
          "보건복지부 인증 피부과 전문의",
          "가톨릭중앙의료원 인턴 및 피부과 전공의 수료",
        ],
      },
      {
        slug: "chu-jiyoon",
        nameKr: "추지윤",
        title: "원장",
        specialty: "퍼스널 안티에이징·디자인 리프팅·백반증",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "전) 모델로피부과 청담점",
          "전) 차앤박피부과 도곡양재점",
          "가톨릭중앙의료원 인턴 및 피부과 전공의",
          "가톨릭대학교 의과대학 의학과 졸업",
        ],
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 "힐하우스피부과의원 강남점" 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-hanryang-lilit",
        rating: 5,
        content:
          "사진을 찍으면 얼굴이 실제보다 넓어 보이는 게 아쉬워 상담을 받았어요. 얼굴 비율과 근육 발달 정도를 하나씩 확인해 주시고, 어떤 부위를 관리하면 자연스러운 변화가 생기는지 설명해 주셔서 신뢰가 갔습니다. 피부과 전문의 원장님이 직접 상담과 시술을 진행해 주셔서 안심하고 받았어요.",
        reviewerName: "hanryang_lilit (Google)",
        visitedAt: "2026-08",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-milboriboli",
        rating: 5,
        content:
          "턱 라인이 흐릿해지고 탄력이 떨어진 느낌이 있어 상담했고, 제 상태에 맞춰 올타이트 레이저를 진행했어요. 설명을 자세히 해주시고 시술 중간중간 체크해 주셔서 부담 없이 받았습니다. 드라마틱하기보다 얼굴선이 자연스럽게 정리된 느낌이라 만족하고 있어요.",
        reviewerName: "밀보리보리 (Google)",
        visitedAt: "2026-04",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-ahn-hyerim",
        rating: 5,
        content:
          "더엘주사를 1회·2회차로 나눠 진행했어요. 평소 긴장하면 어금니를 꽉 깨무는 편인데 그래서 커진 부분까지 꼼꼼하게 체크해서 잡아주셨어요. 시설도 깔끔했습니다.",
        reviewerName: "안혜림 (Google)",
        visitedAt: "2026-07",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "평일 10:00–20:00",
      saturday: "09:00–15:00",
      // 일요일·공휴일 휴진 → 미기입. 점심시간은 사이트에 표기가 없어 미기입.
    },
  });

  console.log("• 의원(hospitals) upsert — 힐하우스피부과 건대점");
  await upsertWithRefs(payload, "hospitals", "힐하우스피부과건대점", {
    slug: "힐하우스피부과건대점",
    nameKr: "힐하우스피부과 건대점",
    shortDescription: "건대입구역 도보 5분 · 피부과 전문의 직접 진료 · 안티에이징",
    departmentSlug: "dermatology",
    sidoSlug: "서울",
    regionSlug: "광진구",
    // 주소에 동 표기가 없어 동은 연결하지 않는다(추정 금지) — 구 단위로 연결
    addressLine: "서울특별시 광진구 능동로 90, 더클래식 500 B동 2층",
    nearestStation: "건대입구역 5번 출구",
    nearestStationName: "건대입구역",
    walkingMinutes: 5,
    tier: "PREMIUM",
    phone: "02-444-7585",
    // 평점·후기 출처: 구글맵 "힐하우스피부과의원 건대점" 집계, 2026-10-31 확인.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    // JSON-LD aggregateRating에는 넘기지 않는다 — 런북 §11-5.
    rating: 4.4,
    reviewCount: 25,
    doctorCount: 2,
    tags: ["안티에이징", "리프팅", "스킨부스터", "필러", "색소", "여드름 흉터"],
    certification: {
      stage1History: false,
      stage1Detail: "",
      stage2Reviews: false,
      stage2Detail:
        "구글맵 공개 후기 25개 중 3건 발췌 게시(2026-10 확인) · 메디록 영수증·휴대폰 인증 후기는 수집 전",
      stage3Credentials: true,
      stage3Detail: "공식 사이트 의료진 소개 기준 피부과 전문의 2명 진료",
      stage4Facility: false,
      stage4Detail: "",
      certifiedAt: "",
    },
    curationNote: {
      text: "건대입구역 5번 출구에서 도보 5분 거리의 힐하우스피부과 건대점입니다. 피부과 전문의가 진단부터 시술 설계까지 직접 진료하며, 리프팅·스킨부스터 등 안티에이징과 색소·여드름 흉터 진료를 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — healhouseskin.com/ko/doctors/<slug>/ 공식 소개(2026-09). credentials는 "경력" 항목 그대로.
    doctors: [
      {
        slug: "lee-doyoung",
        nameKr: "이도영",
        title: "원장",
        specialty: "퍼스널 안티에이징·얼굴 균형 디자인·저통증 리프팅·무통 스킨부스터",
        credentials: [
          "울산대학교 의과대학 피부과 외래교수",
          "리더스피부과 건대점 대표원장",
          "서울대학교 의과대학 졸업",
          "서울아산병원 피부과 전공의",
          "서울아산병원 피부과 임상전임강사",
        ],
      },
      {
        slug: "kang-hyunjin",
        nameKr: "강현진",
        title: "원장",
        specialty: "퍼스널 안티에이징·색소·여드름/흉터·백반증",
        credentials: [
          "힐하우스피부과의원 수원점",
          "토론토대학교 생명과학 전공",
          "가톨릭대학교 의과대학 졸업",
          "가톨릭중앙의료원 인턴 및 피부과 전공의",
        ],
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 "힐하우스피부과의원 건대점" 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-joy-seol",
        rating: 5,
        content:
          "원장님이 상담부터 꼼꼼하게 진행해 주시고, 어떤 시술이 필요한지 과하게 권유하지 않고 제 피부에 맞게 솔직하게 설명해 주셔서 신뢰가 갔습니다. 리프팅도 무조건 받는 게 아니라 얼굴 라인과 피부 상태에 맞춰 자연스럽게 디자인해 주시는 느낌이었어요. 리쥬란 통증이 걱정이었는데 실제로 받아 보니 훨씬 편했습니다.",
        reviewerName: "Jeonghye Joy Seol (Google)",
        visitedAt: "2026-06",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-kang-seokjun",
        rating: 5,
        content:
          "피부과는 처음이었는데 안내를 친절하게 해주셨어요. 이것저것 더 하고 싶었는데 그러면 오히려 효과가 떨어질 수도 있다고 솔직하게 말해 주셔서 단골이 됐습니다.",
        reviewerName: "강석준 (Google)",
        visitedAt: "2026-06",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-hannah",
        rating: 5,
        content:
          "리프팅 시술을 처음 받아 걱정이 많았는데 전문의 선생님이 차근차근 설명해 주시고 질문에도 잘 답해 주셨어요. 실장님도 친절하시고 강요 같은 것도 하나 없었습니다. 세르프 시술을 받았는데 아프지 않았고 만족도가 높았어요.",
        reviewerName: "Hannah (Google)",
        visitedAt: "2025-10",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "월·금 10:00–20:00 / 화·수·목 10:00–19:00",
      saturday: "10:00–15:00",
      // 일요일·공휴일 휴진 → 미기입. 점심시간은 사이트에 표기가 없어 미기입.
    },
  });

  console.log("• 의원(hospitals) upsert — 힐하우스피부과 판교점");
  await upsertWithRefs(payload, "hospitals", "힐하우스피부과판교점", {
    slug: "힐하우스피부과판교점",
    nameKr: "힐하우스피부과 판교점",
    shortDescription: "판교역 1번 출구 연결 · 피부과 전문의 직접 진료 · 안티에이징",
    departmentSlug: "dermatology",
    sidoSlug: "경기",
    regionSlug: "분당구",
    // 주소에 동 표기가 없어 동은 연결하지 않는다(추정 금지) — 구 단위로 연결
    addressLine: "경기도 성남시 분당구 분당내곡로 131, 2층",
    nearestStation: "신분당선·경강선 판교역 1번 출구 연결",
    nearestStationName: "판교역",
    // 사이트 표기가 "출구 연결"뿐이라 도보 시간은 지어내지 않는다(상세 페이지는 값이 없으면 생략).
    tier: "PREMIUM",
    phone: "031-701-7438",
    // 평점·후기 출처: 구글맵 "힐하우스피부과의원 판교점" 집계, 2026-10-31 확인.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    // JSON-LD aggregateRating에는 넘기지 않는다 — 런북 §11-5.
    rating: 4.3,
    reviewCount: 47,
    doctorCount: 3,
    tags: ["안티에이징", "리프팅", "스킨부스터", "필러", "색소", "여드름 흉터"],
    certification: {
      stage1History: false,
      stage1Detail: "",
      stage2Reviews: false,
      stage2Detail:
        "구글맵 공개 후기 47개 중 3건 발췌 게시(2026-10 확인) · 메디록 영수증·휴대폰 인증 후기는 수집 전",
      stage3Credentials: true,
      stage3Detail: "공식 사이트 의료진 소개 기준 피부과 전문의 3명 진료",
      stage4Facility: false,
      stage4Detail: "",
      certifiedAt: "",
    },
    curationNote: {
      text: "판교역 1번 출구와 연결된 힐하우스피부과 판교점입니다. 피부과 전문의 3명이 진단부터 시술 설계까지 직접 진료하며, 리프팅·스킨부스터 등 안티에이징과 색소 진료를 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — healhouseskin.com/ko/doctors/<slug>/ 공식 소개(2026-09). credentials는 "경력" 항목 그대로.
    doctors: [
      {
        slug: "kim-jongsik",
        nameKr: "김종식",
        title: "원장",
        specialty: "디자인 리프팅·얼굴 비대칭 개선·자연스러운 안티에이징",
        credentials: [
          "새봄피부과 원장",
          "서울대학교 기계항공공학부 졸업",
          "가톨릭대학교 의과대학 졸업",
          "가톨릭중앙의료원 피부과 전공의",
        ],
      },
      {
        slug: "byun-hyunjung",
        nameKr: "변현정",
        title: "원장",
        specialty: "안티에이징·디자인 리프팅",
        credentials: [
          "리뉴미피부과 분당점 원장",
          "닥터스피부과(신사·신도림) 원장",
          "용산 오아로피부과 원장",
          "성균관대학교 의과대학 졸업",
          "삼성서울병원 인턴 및 피부과 전공의",
        ],
      },
      {
        slug: "kim-sunjin",
        nameKr: "김선진",
        title: "원장",
        specialty: "디자인 리프팅·색소",
        credentials: [
          "킴벨피부과 원장",
          "보건복지부 인증 피부과 전문의",
          "을지대학교병원 피부과 전공의 수료",
          "을지대학교 대학원 의학석사",
          "을지대학교 의과대학 졸업",
        ],
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 "힐하우스피부과의원 판교점" 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-park-hyeri",
        rating: 5,
        content:
          "피부 탄력이 떨어지는 게 느껴져 써마지를 받았어요. 상담 때부터 제 피부 상태에 맞게 꼼꼼히 설명해 주셨고, 통증은 아예 없진 않지만 참을 만했습니다. 시술 직후 얼굴이 살짝 붉어졌지만 몇 시간 뒤 가라앉고 다음 날부터는 일상생활에 지장이 없었어요.",
        reviewerName: "박혜리 (Google)",
        visitedAt: "2026-04",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-jjoni",
        rating: 5,
        content:
          "부위별로 고민을 나눠 상담해 주셔서 턱 근육과 이마 주름을 맞춤으로 진행했어요. 단순히 주사만 놓는 게 아니라 얼굴 균형을 같이 봐주셔서 좋았습니다. 과하게 굳는 느낌 없이 자연스럽게 정리됐어요.",
        reviewerName: "쪼니 (Google)",
        visitedAt: "2026-03",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-jihye-yoon",
        rating: 5,
        content:
          "결혼을 앞두고 웨딩케어를 받으러 갔어요. 어떤 시술이 필요한지 짚어 주셔서 믿고 받을 수 있었고, 과한 권유 없이 필요한 관리만 안내해 주셔서 더 좋았습니다.",
        reviewerName: "JiHye Yoon (Google)",
        visitedAt: "2026-08",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "월·수·목 10:00–19:00 / 화·금 10:00–20:30",
      saturday: "09:30–14:00",
      // 일요일·공휴일 휴진 → 미기입. 점심시간은 사이트에 표기가 없어 미기입.
    },
  });

  console.log("• 의원(hospitals) upsert — 힐하우스피부과 수원점");
  await upsertWithRefs(payload, "hospitals", "힐하우스피부과수원점", {
    slug: "힐하우스피부과수원점",
    nameKr: "힐하우스피부과 수원점",
    shortDescription: "수원역 도보 3분 · 피부과 전문의 직접 진료 · 안티에이징과 흉터",
    departmentSlug: "dermatology",
    sidoSlug: "경기",
    regionSlug: "팔달구",
    // 주소에 동 표기가 없어 동은 연결하지 않는다(추정 금지) — 구 단위로 연결
    addressLine: "경기도 수원시 팔달구 매산로 24, 3층",
    nearestStation: "수원역 9번 출구",
    nearestStationName: "수원역",
    walkingMinutes: 3,
    tier: "PREMIUM",
    phone: "031-248-7730",
    // 평점·후기 출처: 구글맵 "힐하우스피부과의원 수원점" 집계, 2026-10-31 확인.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    // JSON-LD aggregateRating에는 넘기지 않는다 — 런북 §11-5.
    rating: 4.4,
    reviewCount: 17,
    doctorCount: 4,
    tags: ["안티에이징", "리프팅", "스킨부스터", "필러", "색소", "여드름 흉터"],
    certification: {
      stage1History: false,
      stage1Detail: "",
      stage2Reviews: false,
      stage2Detail:
        "구글맵 공개 후기 17개 중 3건 발췌 게시(2026-10 확인) · 메디록 영수증·휴대폰 인증 후기는 수집 전",
      stage3Credentials: true,
      stage3Detail: "공식 사이트 의료진 소개 기준 피부과 전문의 4명 진료",
      stage4Facility: false,
      stage4Detail: "",
      certifiedAt: "",
    },
    curationNote: {
      text: "수원역 9번 출구에서 도보 3분 거리의 힐하우스피부과 수원점입니다. 피부과 전문의 4명이 진단부터 시술 설계까지 직접 진료하며, 리프팅·스킨부스터 등 안티에이징과 여드름 흉터 진료를 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — healhouseskin.com/ko/doctors/<slug>/ 공식 소개(2026-09). credentials는 "경력" 항목 그대로.
    doctors: [
      {
        slug: "kwon-soohyun",
        nameKr: "권수현",
        title: "원장",
        specialty: "퍼스널 안티에이징·시그니처 윤곽 솔루션·백반증",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "아주대학교병원 인턴 및 피부과 전공의",
          "아주대학교병원 임상강사",
          "닥터스피부과 광교점 원장",
          "아주대학교 의과대학 박사 수료",
        ],
      },
      {
        slug: "ko-hyerim",
        nameKr: "고혜림",
        title: "원장",
        specialty: "콜라겐 볼륨 리프팅·시그니처 윤곽 솔루션·퍼스널 안티에이징",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "가톨릭중앙의료원 인턴",
          "가톨릭중앙의료원 피부과 전공의",
          "오라클피부과 천안신부점 원장",
        ],
      },
      {
        slug: "kim-soohyung",
        nameKr: "김수형",
        title: "원장",
        specialty: "퍼스널 흉터 솔루션·시그니처 리프팅·콜라겐 볼륨 디자인",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "MJ피부과 원장",
          "가톨릭대학교 의과대학 졸업",
          "가톨릭중앙의료원 인턴 및 피부과 전공의",
        ],
      },
      {
        slug: "kim-sujeong",
        nameKr: "김수정",
        title: "원장",
        specialty: "퍼스널 튼살 솔루션·디자인 리프팅·콜라겐 볼륨 디자인",
        credentials: [
          "보건복지부 인증 피부과 전문의",
          "아름다운피부과 영통점 원장",
          "오라클피부과 대전둔산점 원장",
          "Kyushu University Hospital 파견의",
          "충남대학교병원 피부과 외래교수",
          "충남대학교병원 인턴 및 피부과 전공의",
        ],
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 "힐하우스피부과의원 수원점" 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-jung-song",
        rating: 5,
        content:
          "이마 주름 때문에 상담 갔다가 자세하고 친절한 안내에 신뢰가 생겨 보톡스와 써마지를 받았어요. 시술 전부터 마무리까지 편안했습니다. 결과는 아직 며칠 되지 않아 말씀드릴 수 없지만 기대하고 있어요. 다만 마취 크림을 바르고 있던 방의 머리받침이 조금 걸렸습니다.",
        reviewerName: "JUNG SONG (Google)",
        visitedAt: "2025-10",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-hwayeon",
        rating: 5,
        content:
          "여드름 때문에 방문했는데 예약하고 가니 많이 기다리지 않고 진료받았어요. 원장님이 친절하고 꼼꼼하셨고, 상담해 주신 분도 제가 원하는 걸 바로 파악해 주셨습니다. 관리해 주시는 분들도 친절했어요.",
        reviewerName: "화연 (Google)",
        visitedAt: "2024-10",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-paatjuk",
        rating: 5,
        content:
          "피부과 전문의 선생님들이 모두 꼼꼼하게 진료를 봐주시고 친절하셨어요. 리프팅 기계가 다양해서 좋았습니다.",
        reviewerName: "달달한팥죽 (Google)",
        visitedAt: "2022-10",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "월·금 09:30–20:00 / 화·수·목 09:30–18:30",
      saturday: "09:00–14:00",
      // 일요일·공휴일 휴진 → 미기입. 점심시간은 사이트에 표기가 없어 미기입.
    },
  });

  console.log("• 의원(hospitals) upsert — 힐하우스피부과 대구점");
  await upsertWithRefs(payload, "hospitals", "힐하우스피부과대구점", {
    slug: "힐하우스피부과대구점",
    nameKr: "힐하우스피부과 대구점",
    shortDescription: "동대구역 도보 4분 · 피부과 전문의 직접 진료 · 안티에이징",
    departmentSlug: "dermatology",
    sidoSlug: "대구",
    regionSlug: "동구",
    // 주소에 동 표기가 없어 동은 연결하지 않는다(추정 금지) — 구 단위로 연결
    addressLine: "대구광역시 동구 동대구로 525, 2층",
    nearestStation: "대구 1호선 동대구역 2번 출구",
    nearestStationName: "동대구역",
    walkingMinutes: 4,
    tier: "PREMIUM",
    phone: "053-710-1127",
    // 평점·후기 출처: 구글맵 "힐하우스피부과의원 대구점" 집계, 2026-10-31 확인.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    // JSON-LD aggregateRating에는 넘기지 않는다 — 런북 §11-5.
    rating: 5.0,
    reviewCount: 4,
    doctorCount: 3,
    tags: ["안티에이징", "리프팅", "스킨부스터", "필러", "색소", "여드름 흉터"],
    certification: {
      stage1History: false,
      stage1Detail: "",
      stage2Reviews: false,
      stage2Detail:
        "구글맵 공개 후기 4개 중 3건 발췌 게시(2026-10 확인) · 메디록 영수증·휴대폰 인증 후기는 수집 전",
      stage3Credentials: true,
      stage3Detail: "공식 사이트 의료진 소개 기준 피부과 전문의 3명 진료",
      stage4Facility: false,
      stage4Detail: "",
      certifiedAt: "",
    },
    curationNote: {
      text: "동대구역 2번 출구에서 도보 4분 거리의 힐하우스피부과 대구점입니다. 피부과 전문의 3명이 진단부터 시술 설계까지 직접 진료하며, 리프팅·스킨부스터·윤곽 등 안티에이징 진료를 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — healhouseskin.com/ko/doctors/<slug>/ 공식 소개(2026-09). credentials는 "경력" 항목 그대로.
    doctors: [
      {
        slug: "park-hyojin",
        nameKr: "박효진",
        title: "원장",
        specialty: "시그니처 윤곽 솔루션·퍼스널 안티에이징·얼굴형 전체 설계",
        credentials: [
          "힐하우스피부과의원 수원점",
          "더퍼스트피부과 대구점 원장",
          "계명대학교 의과대학 졸업",
          "서울성모병원·부천성모병원 피부과 전공의",
        ],
      },
      {
        slug: "yoon-jimin",
        nameKr: "윤지민",
        title: "원장",
        specialty: "퍼스널 안티에이징·색소·여드름/흉터",
        credentials: [
          "계명대학교 동산병원 전임의 및 임상교수요원",
          "계명대학교 의과대학 졸업",
          "계명대학교 동산병원 피부과 전공의",
        ],
      },
      {
        slug: "kim-hyunwook",
        nameKr: "김현욱",
        title: "원장",
        specialty: "콜라겐 볼륨 디자인·얼굴 전체 균형 설계·퍼스널 안티에이징",
        credentials: [
          "계룡대 지구병원 피부과장",
          "계명대학교 의과대학 졸업",
          "계명대학교 의과대학 의학석사",
          "계명대학교 동산병원 피부과 전공의",
        ],
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 "힐하우스피부과의원 대구점" 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-sirisiri",
        rating: 5,
        content:
          "진단기로 찍은 사진으로 원장님이 직접 자세히 상담해 주시고, 꼭 필요한 것만 콕 집어 우선순위를 정해 주시니 믿음이 갔어요. 30대 중후반이 되면서 처지는 윤곽 라인이 고민이었는데 스컬트라 시술을 받았습니다.",
        reviewerName: "sirisiri (Google)",
        visitedAt: "2026-03",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-jjkk",
        rating: 5,
        content:
          "리쥬란이 처음이라 아프다는 후기를 보고 걱정했는데 할 만했어요. 원장님이 얼굴을 살펴가며 한 방 한 방 정성스럽게 놔주시는 게 느껴졌고, 시술 중에 제 피부 타입과 앞으로 어떤 관리가 도움될지도 알려주셨어요. 하루에 여러 시술을 받다 보니 과하지 않게 하는 게 좋다고 솔직히 말해 주신 것도 신뢰가 갔습니다.",
        reviewerName: "JJKK (Google)",
        visitedAt: "2026-04",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-kumihomi",
        rating: 5,
        content:
          "탄력과 생기를 주고 싶어 방문했어요. 콜라겐 촉진을 돕는다는 리투오를 받았는데 쫀득해진 것 같고, 울쎄라도 받았습니다. 무엇을 하라고 강요하지 않으시고 원장님 직접 상담이 먼저라 진정성이 느껴졌어요.",
        reviewerName: "Kumihomi (Google)",
        visitedAt: "2026-05",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "월·금 09:30–20:30 / 화·수·목 09:30–18:30",
      saturday: "09:00–14:00",
      // 일요일·공휴일 휴진 → 미기입. 점심시간은 사이트에 표기가 없어 미기입.
    },
  });

  console.log("\n✅ 힐하우스피부과 5개 지점 등록 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
