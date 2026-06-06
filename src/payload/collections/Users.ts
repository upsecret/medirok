// 관리자 사용자 (CMS 영업팀)
// 퍼블릭 사이트엔 회원가입 없음. Admin 접근용 only.

import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  access: {
    read: () => true,
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "role",
      type: "select",
      defaultValue: "editor",
      options: [
        { label: "관리자", value: "admin" },
        { label: "에디터 (매거진 작성)", value: "editor" },
        { label: "영업팀", value: "sales" },
        { label: "큐레이터 (의사)", value: "curator" },
      ],
    },
  ],
};
