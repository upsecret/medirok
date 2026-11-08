# 메디록 작업 지침 — 콘텐츠

매거진(`/magazine`)·병원 블로그(`/blog`) 원고를 쓰거나 고칠 때 지킬 것만 모았다. 실행 절차는 `docs/콘텐츠-발행-런북.md`, 출처 대장은 `docs/content-sources.md`.

사용자와의 대화·주석·커밋 메시지·콘텐츠는 한국어로 쓴다.

## 쓰기 전에

1. **런북 §1(사실 원칙·"문체 — 쓰지 않는 패턴")과 §9-2(병원 블로그 집필 원칙)를 읽는다.**
2. **참고 글을 한 편 읽고 시작한다.** 같은 고객사의 위성 블로그는 2026-11-08 외부 문체 QA와 네이버 원문 중복 정리를 마친 수정본이다. 문체와 요약문의 기준으로 쓴다.
   - 원장 1인칭: https://blog.dodskin.com/cheongdam-emface-effect
   - 병원 명의: https://blog.dodskin.com/cheongdam-duotite-launch · https://blog.ye-on.com/implant-with-diabetes
   - 수정 전후 예: `~/blog-dodskin/docs/voice-guide.md` (D)·(E), `~/blog-yeon/docs/content-sources.md` 0장
3. **같은 고객사·같은 주제 글이 위성 블로그에 있으면 먼저 읽는다** — 디오디 `~/blog-dodskin/content/posts`, 예온 `~/blog-yeon/content/posts`. 사실·수치·규제 판단을 확인하는 용도다. **문장은 가져오지 않는다.**

## 쓸 때

- `seoTitle`·`metaDescription`·`shortAnswer`·첫 단락에는 글 소개 메타문("~를 정리했습니다"), 반전형 대조("A가 아니라 B", "~보다 ~를 먼저"), "갈립니다/가릅니다", 대상 없는 추상 명사(지점·방향·축)를 쓰지 않는다. 본문 대조는 글당 1회까지.
- `metaDescription`은 핵심 답 1~2문장 + 지역 신호 하나. 출처·저자는 화면과 JSON-LD가 밝힌다.
- **가상 환자 대사로 열지 않는다. FAQ는 본문에 없는 질문만. 마무리는 글마다 다르게. "다만"은 글당 1회, 80자 넘는 문장 금지** — 런북 §1 "편집 권고"(외부 QA 2~21번). 위성 블로그는 이것을 빠뜨렸다가 2차 수정을 했다.
- 원문의 사실·수치·항목은 보존하되 **문장은 새로 쓴다**(체크리스트·FAQ·원장 화법·인용 블록 포함).
- 의료광고: 최상급·타 의료기관 대비 우위 주장, 단정적 효능 표현, 시술 권유·CTA 금지. 개인차 한정 문장을 붙인다(런북 §1·§9-2).

## 끝내기 전에

```bash
npm run dupcheck -- --slug <slug>   # 원문·위성 블로그와 연속 20자 이상 일치 0건 (참조 원문은 먼저 content-raw/에 받아 둔다 — 런북 §9-2)
npm run typecheck
```

- **시드는 곧 운영 반영이다**(드래프트 없음, `.env.local`은 운영 DB — 런북 §0).
- 발행·수정했으면 `docs/content-sources.md`를 갱신한다(런북 §9 머리).
