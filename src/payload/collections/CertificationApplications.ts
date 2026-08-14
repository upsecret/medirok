// 醫錄 인증제 신청 접수 (B2B 리드)
//
// 메디록의 고객은 일반 환자가 아니라 의원이다. /verification/apply 폼으로 들어온
// 신청을 여기에 적재하고, 영업팀이 /admin에서 상태를 관리한다.
//
// 접근 제어를 반드시 이 형태로 유지할 것:
//   - create: false  — Payload가 자동 노출하는 REST(/api/certification-applications)로
//                      익명 생성이 되면 그대로 스팸 창구가 된다. 기록은 서버 액션이
//                      overrideAccess로만 수행한다(app/(frontend)/verification/apply/actions.ts).
//   - read/update/delete: 로그인 관리자만 — 담당자 성함·연락처가 담기는 개인정보다.

import type { CollectionConfig } from "payload";

const adminOnly = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

export const CertificationApplications: CollectionConfig = {
  slug: "certification-applications",
  labels: { singular: "인증제 신청", plural: "인증제 신청" },
  admin: {
    useAsTitle: "hospitalName",
    group: "영업",
    defaultColumns: ["hospitalName", "representativeName", "phone", "status", "createdAt"],
  },
  access: {
    create: () => false,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "hospitalName",
      type: "text",
      required: true,
      label: "의원명",
    },
    {
      name: "representativeName",
      type: "text",
      required: true,
      label: "담당자·원장 성함",
    },
    {
      name: "phone",
      type: "text",
      required: true,
      label: "연락처",
    },
    { name: "email", type: "email", label: "이메일" },
    { name: "region", type: "text", label: "지역 (시/구)" },
    { name: "department", type: "text", label: "진료과" },
    {
      name: "homepageUrl",
      type: "text",
      label: "홈페이지·네이버 블로그",
    },
    {
      name: "interests",
      type: "select",
      hasMany: true,
      label: "관심 항목",
      options: [
        { label: "4단계 인증 심사", value: "certification" },
        { label: "큐레이션 등재", value: "curation" },
        { label: "SEO·AEO 콘텐츠", value: "content" },
      ],
    },
    { name: "message", type: "textarea", label: "문의 내용" },
    {
      name: "status",
      type: "select",
      label: "진행 상태",
      defaultValue: "pending",
      options: [
        { label: "접수", value: "pending" },
        { label: "연락 완료", value: "contacted" },
        { label: "심사 중", value: "reviewing" },
        { label: "등재", value: "listed" },
        { label: "보류", value: "closed" },
      ],
    },
  ],
};
