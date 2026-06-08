// Payload Local API 클라이언트
// 서버 컴포넌트/라우트에서 getPayloadClient()로 DB 직접 조회
// getPayload는 내부적으로 인스턴스를 메모이즈하므로 매 호출 비용이 낮음

import { getPayload } from "payload";
import config from "@payload-config";

export function getPayloadClient() {
  return getPayload({ config });
}
