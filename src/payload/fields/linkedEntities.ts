// 매거진 ↔ 의원/시술/지역/진료과 연결 필드
// 큐레이션 의원 자연 노출 + 내부 링크쥬스

import type { Field } from "payload";

export const linkedHospitalsField: Field = {
  name: "linkedHospitals",
  type: "relationship",
  relationTo: "hospitals",
  hasMany: true,
  admin: {
    description: "★ 큐레이션 의원 노출. 매거진 하단·관련 의원 섹션에 자동 표시.",
  },
};

export const linkedDepartmentField: Field = {
  name: "linkedDepartment",
  type: "relationship",
  relationTo: "departments",
  hasMany: false,
};

export const linkedRegionsField: Field = {
  name: "linkedRegions",
  type: "relationship",
  relationTo: "regions",
  hasMany: true,
};

export const linkedTreatmentsField: Field = {
  name: "linkedTreatments",
  type: "relationship",
  relationTo: "treatments",
  hasMany: true,
};

export const featuredDoctorField: Field = {
  name: "featuredDoctor",
  type: "relationship",
  relationTo: "doctors",
  admin: { description: "전문 답변 의사 (E-E-A-T 강화)" },
};
