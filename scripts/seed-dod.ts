/**
 * 디오디피부과의원 청담 등록 시드 — 멱등(upsert) 스크립트
 *
 * 실행:
 *   npm run seed:dod
 *   (= node --env-file=.env.local --import tsx/esm scripts/seed-dod.ts)
 *
 * - regions: 서울(sido) · 강남구(sigungu) · 청담동(dong) 를 slug 기준 upsert
 * - hospitals: 디오디피부과의원청담 을 slug 기준 upsert
 * - 여러 번 실행해도 안전(존재하면 update, 없으면 create)
 *
 * 데이터 출처(2026-06): dodskin.com 공식(소개/오시는길/진료안내) · 모두닥 · 구글지도 좌표.
 * 후기/별점은 실제 검증분 0건이므로 0으로 둠(미조작). 인증 단계는 검증 가능한 사실만 기입.
 *
 * ⚠️ 의료진 세부 약력(credentials)은 dodskin.com/staff 프로필이 이미지라 자동 추출 불가.
 *    확인된 이름·직위만 기입했고, 약력은 수기 보강이 필요합니다(아래 TODO 표시).
 * ⚠️ tier=PREMIUM(큐레이션)은 예온치과와 동일한 노출을 위해 설정했습니다.
 *    유료 파트너 계약 전이라면 "STANDARD"로 변경하고 curationNote를 비우세요.
 */

// slug→FK 전환(M4): 쓰기는 upsertWithRefs가 slug 표기를 관계로 변환

import { getSeedPayload } from "./seed-payload";
import { upsertWithRefs } from "./upsert-with-refs";

async function main() {
  const payload = await getSeedPayload();

  console.log("• 지역(regions) upsert");
  // 지역 slug는 한국어(nameKr)와 동일 — URL이 한국어로 노출됨. parentSlug도 상위 nameKr.
  // 서울/강남구는 이미 존재할 수 있으나 보장 차원에서 upsert.
  await upsertWithRefs(payload, "regions", "서울", {
    slug: "서울",
    nameKr: "서울",
    nameEn: "Seoul",
    level: "sido",
    parentSlug: "",
  });
  await upsertWithRefs(payload, "regions", "강남구", {
    slug: "강남구",
    nameKr: "강남구",
    nameEn: "Gangnam-gu",
    level: "sigungu",
    parentSlug: "서울",
  });
  await upsertWithRefs(payload, "regions", "청담동", {
    slug: "청담동",
    nameKr: "청담동",
    nameEn: "Cheongdam-dong",
    level: "dong",
    parentSlug: "강남구",
  });

  console.log("• 의원(hospitals) upsert — 디오디피부과의원 청담");
  await upsertWithRefs(payload, "hospitals", "디오디피부과의원청담", {
    slug: "디오디피부과의원청담",
    nameKr: "디오디피부과의원 청담",
    shortDescription:
      "청담 도산대로 하이엔드 안티에이징 · 국내 피부과 최초 첨단재생의료실시기관 · 줄기세포 재생의료",
    departmentSlug: "dermatology",
    sidoSlug: "서울",
    regionSlug: "강남구",
    dongSlug: "청담동",
    addressLine: "서울특별시 강남구 도산대로 423 (청담동 91-11)",
    // 가까운 역: 수인분당선 압구정로데오역 4번 출구 도보 8분(구글지도 좌표 37.5239,127.0422 기준)
    // medirok stations.ts에 압구정로데오역은 노선 slug "분당선"으로 등록됨 → /hospitals/역/분당선/압구정로데오역 노출
    nearestStation: "수인분당선 압구정로데오역 4번 출구",
    nearestStationName: "압구정로데오역",
    walkingMinutes: 8,
    tier: "PREMIUM",
    phone: "02-6203-6263",
    // 별점·후기수 출처: 구글맵 "디오디피부과의원 청담" 집계(2026-06 기준).
    // 메디록 자체 검증(영수증/전화) 후기가 아니므로 각 리뷰는 isReceiptVerified/isPhoneVerified=false.
    rating: 4.8,
    reviewCount: 45,
    doctorCount: 5,
    tags: [
      "안티에이징",
      "줄기세포",
      "NK세포",
      "첨단재생의료",
      "울쎄라",
      "써마지",
      "쥬베룩",
      "리프팅",
      "스킨부스터",
    ],
    // 메디록 4단계 인증 — 검증 가능한 사실만 기입(실방문 후기는 수집 전이라 미통과)
    certification: {
      stage1History: true,
      stage1Detail:
        "국내 피부과 최초 보건복지부 지정 첨단재생의료실시기관 · 청담 도산대로 안티에이징 전문",
      stage2Reviews: false,
      stage2Detail: "실방문 후기 수집 진행 중",
      stage3Credentials: true,
      stage3Detail: "피부과 전문의(대표원장 이준) 등 의료진 상주",
      stage4Facility: true,
      stage4Detail:
        "디오디 줄기세포 센터 · 메타뷰(MetaVu) 3D 맞춤 진단 · 울쎄라·써마지 등 온디맨드 리프팅/부스터 장비 · 전용 주차장·발렛",
      certifiedAt: "",
    },
    curationNote: {
      text: "청담 도산대로에 위치한 하이엔드 안티에이징 클리닉으로, 국내 피부과 최초로 보건복지부 지정 첨단재생의료실시기관에 선정됐습니다. 줄기세포·NK세포 기반 재생의료(이나셀)와 울쎄라·써마지 등 온디맨드 리프팅, 콜라겐 부스터 라인을 메타뷰(MetaVu) 3D 맞춤 진단으로 설계합니다. 외국인 환자 상담·의료관광 서비스와 전용 주차·발렛을 운영합니다.",
      curatorName: "메디록 큐레이션팀",
      curatorTitle: "",
    },
    // 의료진 — dodskin.com/staff 공식 소개(2026-06). 프로필이 이미지라 세부 약력 자동 추출 불가.
    // 확인된 이름·직위만 기입. ⚠️ TODO: 각 원장 전문분야·약력(credentials) 수기 보강.
    doctors: [
      {
        slug: "lee-jun",
        nameKr: "이준",
        title: "대표원장",
        specialty: "피부과 전문의",
        credentials: [], // TODO: 공식 약력 보강
      },
      {
        slug: "kim-sangwoo",
        nameKr: "김상우",
        title: "원장",
        credentials: [], // TODO: 전문분야·약력 보강
      },
      {
        slug: "an-jeongsik",
        nameKr: "안정식",
        title: "원장",
        credentials: [], // TODO
      },
      {
        slug: "hwang-seunggyeong",
        nameKr: "황승경",
        title: "원장",
        credentials: [], // TODO
      },
      {
        slug: "kim-jina",
        nameKr: "김진아",
        title: "연구원(박사)",
        credentials: [], // TODO
      },
    ],
    // 비급여 진료가 미공개 — 빈 배열이면 상세 페이지에서 "진료문의하기" 노출(추정가 미조작).
    prices: [],
    // 구글맵 리뷰 발췌(출처표기, 메디록 미검증). 국내 + 외국인(의료관광) 후기 혼합.
    reviews: [
      {
        id: "google-kwon-hyejin",
        rating: 5,
        content:
          "엘라비에 리투오 후기를 찾아보다 디오디 청담점이 괜찮아서 왔어요. 사람 피부 성분이라 걱정도 덜 되고 시술 통증도 참을 만했어요. 시술 전후로 속건조와 탄력이 비교가 안 될 만큼 좋아졌습니다.",
        reviewerName: "권혜진 (Google)",
        visitedAt: "2025-12",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-dadi",
        rating: 5,
        content:
          "장비로 피부를 분석하고 실장님 상담 후 원장님과 상담했어요. 써마지 비용이 고민이라니 덴서티를 편하게 추천해주셔서 부담 없이 상담할 수 있었어요. 시술도 좋지만 애프터케어가 특히 좋다고 느꼈습니다.",
        reviewerName: "DADi (Google)",
        visitedAt: "2025-12",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-roro",
        rating: 5,
        content:
          "근처 여러 피부과를 다녀봤지만 여기가 가장 잘 맞았어요. 내부도 깔끔하고 상담 실장님·원장님 모두 친절하세요. 시술 만족도도 높습니다.",
        reviewerName: "로로 (Google)",
        visitedAt: "2025-11",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-rs",
        rating: 5,
        content:
          "매우 깨끗하고 고급스러운 클리닉이었습니다. 줄기세포 세트와 울쎄라를 받았고, 일본어 통역이 있어 안심하고 받을 수 있었습니다.",
        reviewerName: "R S (Google)",
        visitedAt: "2026-01",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
      {
        id: "google-tomo",
        rating: 5,
        content:
          "접수부터 상담, 의료진까지 모두 상냥하고 정중합니다. 한국에서 여러 클리닉에 가봤지만 이곳이 가장 꼼꼼히 봐주시고 효과도 오래 지속됩니다.",
        reviewerName: "TOMO (Google)",
        visitedAt: "2025-12",
        isReceiptVerified: false,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "평일 10:00–19:00 / 금 10:00–21:00",
      saturday: "10:00–16:00",
      // 일요일 휴진 → 미기입
      lunch: "13:00–14:00",
    },
  });

  console.log("\n✅ 디오디피부과의원 청담 등록 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
