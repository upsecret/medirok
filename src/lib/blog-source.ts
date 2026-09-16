// /blog 글의 원출처가 어떤 채널인지 가른다.
//
// 처음엔 네이버 블로그만 받았지만(예온·디오디), 병원 자체 웹사이트의 칼럼을
// 원출처로 쓰는 고객(힐하우스)이 생겼다. 스키마는 원래 URL만 받으므로
// 채널은 호스트로 판정한다 — 별도 필드를 두면 URL과 어긋날 자리만 는다.

export type BlogSourceKind = "naver" | "website";

export interface BlogSourceLabel {
  kind: BlogSourceKind;
  /** 채널 이름 — "네이버 블로그" / "웹사이트". "의원 공식 {channel}"처럼 앞에 "공식"을 붙여 쓴다 */
  channel: string;
  /** 괄호 안에 붙이는 짧은 표기 — "네이버" / "웹사이트" */
  short: string;
  /** 원문 한 편을 부르는 말 — "포스팅" / "글" ("공식 칼럼의 칼럼"처럼 채널명과 겹치지 않게) */
  item: string;
  /** 원문 한 편의 schema.org 타입 */
  schemaType: "BlogPosting" | "Article";
}

export function blogSourceLabel(sourceUrl: string): BlogSourceLabel {
  let host = "";
  try {
    host = new URL(sourceUrl).hostname;
  } catch {
    // 잘못된 URL이면 웹사이트로 본다 — 네이버라고 단정하는 쪽이 더 틀리기 쉽다
  }
  if (host === "blog.naver.com" || host === "m.blog.naver.com") {
    return { kind: "naver", channel: "네이버 블로그", short: "네이버", item: "포스팅", schemaType: "BlogPosting" };
  }
  return { kind: "website", channel: "웹사이트", short: "웹사이트", item: "글", schemaType: "Article" };
}
