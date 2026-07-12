/**
 * 예온치과병원(검단) 등록 시드 — 멱등(upsert) 스크립트
 *
 * 실행:
 *   npm run seed:yeon
 *   (= node --env-file=.env.local --import tsx/esm scripts/seed-yeon.ts)
 *
 * - regions: 인천 서구(incheon-seo) · 당하동(dangha) 를 slug 기준 upsert
 * - hospitals: yeon-dental 을 slug 기준 upsert
 * - 여러 번 실행해도 안전(존재하면 update, 없으면 create)
 *
 * 데이터 출처(2026-06): gd365.ye-on.com 공식 의료진 소개 · modoodoc 비급여가 · 보도자료.
 * 후기/별점은 실제 0건이므로 0으로 둠(미조작). 인증 단계는 검증 가능한 사실만 기입.
 */

// slug→FK 전환(M4): 쓰기는 upsertWithRefs가 slug 표기를 관계로 변환

import { getSeedPayload } from "./seed-payload";
import { upsertWithRefs } from "./upsert-with-refs";

async function main() {
  const payload = await getSeedPayload();

  console.log("• 지역(regions) upsert");
  // 지역 slug는 한국어(nameKr)와 동일 — URL이 한국어로 노출됨. parentSlug도 상위 nameKr.
  // 인천 시/도 — 라이브 DB에 없을 수 있어 보장 차원에서 upsert.
  await upsertWithRefs(payload, "regions", "인천", {
    slug: "인천",
    nameKr: "인천",
    nameEn: "Incheon",
    level: "sido",
    parentSlug: "",
  });
  // 서구(시군구) + 당하동(동) 추가.
  await upsertWithRefs(payload, "regions", "서구", {
    slug: "서구",
    nameKr: "서구",
    nameEn: "Seo-gu",
    level: "sigungu",
    parentSlug: "인천",
  });
  await upsertWithRefs(payload, "regions", "당하동", {
    slug: "당하동",
    nameKr: "당하동",
    nameEn: "Dangha-dong",
    level: "dong",
    parentSlug: "서구",
  });

  console.log("• 의원(hospitals) upsert — 예온치과병원(검단)");
  await upsertWithRefs(payload, "hospitals", "예온치과병원", {
    slug: "예온치과병원",
    nameKr: "예온치과병원",
    shortDescription: "검단 900평 규모 병원급 치과 · 네비게이션 임플란트 · 자체 기공소",
    departmentSlug: "dental",
    sidoSlug: "인천",
    regionSlug: "서구",
    dongSlug: "당하동",
    addressLine: "인천광역시 서구 이음4로 6, KR법조타워 5층 (당하동)",
    nearestStation: "인천 2호선 아라역 6번 출구",
    nearestStationName: "아라역",
    walkingMinutes: 1,
    tier: "PREMIUM",
    phone: "1551-2870",
    // 평점·후기 출처: 구글맵 "예온치과병원"(gd365) 집계, 2026-06 기준.
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    rating: 5.0,
    reviewCount: 114,
    doctorCount: 13,
    tags: [
      "임플란트",
      "네비게이션 임플란트",
      "치아교정",
      "소아치과",
      "라미네이트",
      "치과보철",
      "자체 기공소",
    ],
    // 메디록 4단계 인증 — 검증 가능한 사실만 기입(실방문 후기는 수집 전이라 미통과)
    certification: {
      stage1History: true,
      stage1Detail: "병원급 치과 · 900평 규모 · 자체 기공소(Dental Lab) 운영",
      stage2Reviews: false,
      stage2Detail: "실방문 후기 수집 진행 중",
      stage3Credentials: true,
      stage3Detail:
        "보건복지부 인증 전문의 다수 — 교정·구강악안면외과·소아치과·치과보철·통합치의학과",
      stage4Facility: true,
      stage4Detail: "별도 소아진료센터 · 네비게이션 임플란트 · 디지털 맞춤교정 장비",
      certifiedAt: "",
    },
    curationNote: {
      text: "검단신도시 900평 규모의 병원급 치과로, 교정·구강악안면외과·소아치과·보철 등 보건복지부 인증 전문의가 분야별로 상주합니다. 자체 기공소(Dental Lab)를 운영해 보철물 제작 단가와 기간을 줄였고, 네비게이션 임플란트와 디지털 맞춤교정 장비를 갖췄습니다. 별도 소아진료센터와 야간·주말 진료로 가족 단위 접근성이 높습니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — gd365.ye-on.com/introduction 공식 소개 페이지 기준(2026-06).
    // title=직위(원장), specialty=대표 진료분야(전문의 여부 표기), credentials=공식 약력 전체.
    doctors: [
      {
        slug: "jang-seonho",
        nameKr: "장선호",
        nameHanja: "張",
        title: "병원장",
        specialty: "보철·임플란트·디지털치의학",
        credentials: [
          "연세대학교 졸업",
          "경희대학교 치의학전문대학원 졸업",
          "세계구강악안면초음파수술학회(WAUPS) Fellowship",
          "2015 WCUPS Oral Presentation Best Award (CAD/CAM·Digital Dentistry)",
          "Megazen Implant 국제심포지움 학술연자·Clinical Faculty",
          "대한치과보철·보존·심미·예방치과학회 정회원",
          "前 예온치과 구월365점 원장",
        ],
      },
      {
        slug: "nam-gyeongsu",
        nameKr: "남경수",
        nameHanja: "南",
        title: "원장",
        specialty: "치아교정",
        credentials: [
          "서울대학교 치과대학 졸업",
          "서울대학교 치과대학 치과교정학 석사·박사수료",
          "서울대학교 치과병원 교정과 레지던트·임상강사",
          "보건복지부 인증 치과교정과 전문의",
          "세계교정의사연맹(WFO) 펠로우",
          "미국치과교정학회(AAO) 회원",
          "前 엔치과 대표원장",
        ],
      },
      {
        slug: "lee-yumi",
        nameKr: "이유미",
        nameHanja: "李",
        title: "원장",
        specialty: "통합치의학과 전문의",
        credentials: [
          "경희대학교 치의학 석사",
          "강남세브란스 치과병원 인턴 수료",
          "통합치의학과 전문의",
          "대한소아치과학회 정회원",
          "대한치과마취과학회 정회원",
          "대한치과마취과학회 경구흡입진정법 연수회 수료",
          "BLS(Basic Life Support) Provider",
          "ACLS(Advanced Cardiovascular Life Support) Provider",
        ],
      },
      {
        slug: "choi-seungeun",
        nameKr: "최승은",
        nameHanja: "崔",
        title: "원장",
        specialty: "치과교정과 전문의",
        credentials: [
          "연세대학교 치과대학 졸업",
          "연세대학교 치과대학 대학원 교정과 전공",
          "이화여자대학교 의과대학 부속 목동병원 치과교정과 레지던트",
          "이화여자대학교 의과대학 치의학대학원 치과교정과 외래교수",
          "보건복지부 인증 치과교정과 전문의",
          "대한치과교정학회 정회원·인정의",
          "대한설측교정학회 정회원",
        ],
      },
      {
        slug: "kim-jihyun",
        nameKr: "김지현",
        nameHanja: "金",
        title: "원장",
        specialty: "구강악안면외과 전문의",
        credentials: [
          "전남대학교 치의학전문대학원 졸업",
          "전남대학교 치과병원 인턴 수료",
          "전남대학교 치과병원 구강악안면외과 레지던트 수료",
          "전남대학교 치의학 박사",
          "보건복지부 인증 구강악안면외과 전문의",
          "대한구강악안면임플란트학회 정회원",
          "대한구강악안면외과학회 정회원",
        ],
      },
      {
        slug: "yang-hyeri",
        nameKr: "양혜리",
        nameHanja: "梁",
        title: "원장",
        specialty: "소아치과 전문의",
        credentials: [
          "원광대학교 치과대학 졸업",
          "서울대학교 치과병원 인턴 수료",
          "서울아산병원 소아치과 레지던트 수료",
          "보건복지부 인증 소아치과 전문의",
          "보건복지부 인증 통합치의학과 전문의",
          "대한소아치과학회 정회원",
          "대한장애인치과학회 정회원",
          "미국소아치과학회 정회원",
        ],
      },
      {
        slug: "lee-haneul",
        nameKr: "이하늘",
        nameHanja: "李",
        title: "원장",
        specialty: "구강악안면외과 전문의",
        credentials: [
          "부산대학교 치의학전문대학원 졸업",
          "연세대학교 강남세브란스병원 인턴",
          "연세대학교 강남세브란스병원 구강악안면외과 레지던트",
          "보건복지부 인증 구강악안면외과 전문의",
          "대한구강악안면외과학회(KAOMS) 정회원",
          "대한악안면성형재건외과학회(KAMPRS) 정회원",
        ],
      },
      {
        slug: "lim-dongwon",
        nameKr: "임동원",
        nameHanja: "林",
        title: "원장",
        specialty: "임플란트·치과보존",
        credentials: [
          "경희대학교 치과대학 졸업",
          "강동경희대학교 치과병원 소아치과 서브인턴십",
          "대한구강악안면임플란트학회 회원",
          "대한치과보존학회 회원",
          "대한통합치과학회 회원",
        ],
      },
      {
        slug: "kim-jiwon",
        nameKr: "김지원",
        nameHanja: "金",
        title: "원장",
        specialty: "통합치의학과 전문의",
        credentials: [
          "부산대학교 치의학전문대학원 석사 졸업",
          "서울대학교 임상치의학 교육과정 수료",
          "보건복지부 인증 통합치의학과 전문의",
          "대한치과이식임플란트학회 정회원",
          "前 명지화이트치과의원 대표원장",
        ],
      },
      {
        slug: "lim-yuseon",
        nameKr: "임유선",
        nameHanja: "林",
        title: "원장",
        specialty: "통합치의학과 전문의",
        credentials: [
          "조선대학교 치과대학 졸업",
          "보건복지부 인증 통합치의학과 전문의",
          "MINEC 메가젠 임플란트 베이직 코스 수료",
          "덴티움 임플란트 어드밴스드 코스 수료",
        ],
      },
      {
        slug: "kim-seongyeong",
        nameKr: "김선경",
        nameHanja: "金",
        title: "원장",
        specialty: "치과보철과 전문의",
        credentials: [
          "원광대학교 치과대학 졸업",
          "원광대학교 산본치과병원 인턴",
          "가천대학교 길병원 치과보철과 레지던트",
          "보건복지부 인증 치과보철과 전문의",
          "대한치과보철학회 정회원·인정의",
          "가천대학교 의과대학 외래교수",
        ],
      },
      {
        slug: "yoon-hyejung",
        nameKr: "윤혜정",
        nameHanja: "尹",
        title: "원장",
        specialty: "치과보철",
        credentials: [
          "단국대학교 치과대학 졸업",
          "단국대학교 대학원 치과보철학 석사 수료",
          "前 윤혜정치과의원 대표원장",
          "前 중앙대학교병원 치과",
        ],
      },
      {
        slug: "hong-sanghyuk",
        nameKr: "홍상혁",
        nameHanja: "洪",
        title: "원장",
        specialty: "임플란트·검진",
        credentials: [
          "서울대학교 치과대학 졸업",
          "DR. ROOT Implant Training Course 수료",
          "대한구강악안면임플란트학회 정회원",
          "국민건강보험공단 인증 검진의",
          "前 서울OK치과의원 대표원장",
        ],
      },
    ],
    // 비급여 진료가는 공식 확인 전이라 미입력 — 빈 배열이면 상세 페이지에서
    // "진료문의하기"로 노출(추정가 미조작 원칙).
    prices: [],
    // 구글맵 리뷰 발췌 (출처 표기, 메디록 미검증)
    reviews: [
      {
        id: "google-jeon-daeun",
        rating: 5,
        content:
          "병원급이라 그런지 엄청 깨끗하고 위생적인 느낌. 과별로 전문 원장님 계셔서 너무 믿음직스러워요. 원장님 설명 꼼꼼하시고 직원들 전부 다 친절하셔서 예온치과병원으로 정착했어요.",
        reviewerName: "전다은 (Google)",
        visitedAt: "2025-07",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-hiseon",
        rating: 5,
        content:
          "치과가 엄청 크고 깨끗해서 좋았습니다! 상담해주신 분이 친절하고 꼼꼼하게 설명해주셨고, 치료해주신 원장님과 선생님들도 친절해요. 가글마취·무통마취로 진료 내내 하나도 안 아팠어요. 주변에 소개하고 싶어요.",
        reviewerName: "히선 (Google)",
        visitedAt: "2025-07",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-kim-sangbin",
        rating: 5,
        content:
          "병원이 넓고 쾌적하고 직원분들도 친절하셔서 좋았어요. 원장님도 설명 잘 해주시고, 소아치과는 놀이방도 있어서 아이들 대기할 때 지루하지 않고 선생님들도 친절하게 대해주셔서 추천합니다.",
        reviewerName: "김상빈 (Google)",
        visitedAt: "2025-07",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "월·수·금 10:00–18:30 / 화·목 10:00–20:30",
      saturday: "10:00–17:00",
      sunday: "10:00–17:00",
      lunch: "13:00–14:30",
    },
  });

  console.log("\n✅ 예온치과병원(검단) 등록 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
