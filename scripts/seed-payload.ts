/**
 * 시드 전용 Payload 부트스트랩 — 스키마 push를 끄고 데이터만 쓴다.
 *
 * 시드는 upsert(데이터 쓰기)만 필요한데 getPayload()는 dev 기본값으로 스키마
 * 자동 동기화(push)까지 수행한다. .env.local이 운영 DB를 가리키는 이 프로젝트에서는
 * 코드-DB 스키마 드리프트(예: P3 전 레거시 slug 컬럼)를 push가 DROP으로 메꾸려 들기
 * 때문에, 시드 경로에서는 항상 push를 차단한다.
 *
 * env 설정 후 dynamic import로 config를 로드해야 한다 — 정적 import는 호이스팅되어
 * payload.config.ts가 PAYLOAD_DB_PUSH를 읽은 뒤에 값이 설정되는 순서 역전이 생긴다.
 * (npm 스크립트 인라인 env 구문은 Windows cmd에서 동작하지 않아 여기서 설정한다.)
 */

import type { Payload } from "payload";

export async function getSeedPayload(): Promise<Payload> {
  process.env.PAYLOAD_DB_PUSH ??= "false";
  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  return getPayload({ config });
}
