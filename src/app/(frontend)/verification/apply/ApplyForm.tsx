"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitApplication, type ApplyState } from "./actions";

const FIELD =
  "w-full border border-[var(--color-surface-border)] rounded-md py-2.5 px-3 text-sm bg-white";
const LABEL = "block text-sm font-medium mb-2";

const INTERESTS = [
  { value: "certification", label: "4단계 인증 심사" },
  { value: "curation", label: "큐레이션 등재" },
  { value: "content", label: "SEO·AEO 콘텐츠" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-accent w-full py-3 text-sm disabled:opacity-60">
      {pending ? "접수 중…" : "醫錄 인증제 신청하기"}
    </button>
  );
}

export function ApplyForm() {
  const [state, action] = useActionState<ApplyState, FormData>(submitApplication, {
    ok: false,
  });

  if (state.ok) {
    return (
      <div className="bg-white border border-[var(--color-accent-400)] rounded-lg p-6 md:p-8 mt-6 text-center">
        <p className="hanja text-3xl text-[var(--color-accent-400)]">錄</p>
        <h2 className="text-lg font-medium mt-3">신청이 접수되었습니다</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          담당자가 영업일 기준 2일 내에 남겨주신 연락처로 연락드립니다.
          <br />
          문의는 070-8064-0972로 주셔도 됩니다.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="bg-white border border-[var(--color-surface-border)] rounded-lg p-5 md:p-7 mt-6 space-y-5"
    >
      {/* 허니팟 — 사람에게는 보이지 않는다. 값이 채워지면 서버에서 봇으로 거른다. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="company">회사명</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className={LABEL} htmlFor="hospitalName">
          의원명 <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input id="hospitalName" name="hospitalName" type="text" required className={FIELD} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={LABEL} htmlFor="representativeName">
            담당자·원장 성함 <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="representativeName"
            name="representativeName"
            type="text"
            required
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="phone">
            연락처 <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="010-0000-0000"
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={LABEL} htmlFor="email">
            이메일
          </label>
          <input id="email" name="email" type="email" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="region">
            지역 (시/구)
          </label>
          <input id="region" name="region" type="text" placeholder="서울 강남구" className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={LABEL} htmlFor="department">
            진료과
          </label>
          <input id="department" name="department" type="text" placeholder="치과" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="homepageUrl">
            홈페이지·네이버 블로그
          </label>
          <input id="homepageUrl" name="homepageUrl" type="text" className={FIELD} />
        </div>
      </div>

      <fieldset>
        <legend className={LABEL}>관심 항목 (복수 선택)</legend>
        <div className="flex gap-4 flex-wrap">
          {INTERESTS.map((i) => (
            <label key={i.value} className="text-sm">
              <input type="checkbox" name="interests" value={i.value} className="mr-1.5" />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={LABEL} htmlFor="message">
          문의 내용 (선택)
        </label>
        <textarea id="message" name="message" rows={4} className={FIELD} />
      </div>

      <div className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-4">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          <span className="font-medium text-[var(--color-text-secondary)]">
            개인정보 수집·이용 안내
          </span>
          <br />
          수집 항목: 의원명, 담당자 성함, 연락처, 이메일, 지역·진료과, 홈페이지 주소, 문의 내용
          <br />
          이용 목적: 인증 심사 및 등재 상담 연락
          <br />
          보유 기간: 상담 종료 후 1년 (동의 철회 시 즉시 파기)
        </p>
        <label className="flex items-start gap-2 text-sm mt-3">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          <span>
            개인정보 수집·이용에 동의합니다{" "}
            <span className="text-[var(--color-danger)]">*</span>
          </span>
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
