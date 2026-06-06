import { saveMagazineAction } from "./actions";
import type { Magazine, MagazineType } from "@/lib/magazines";
import { hospitals, departments } from "@/lib/data";

const TYPE_LABELS: Record<MagazineType, string> = {
  article: "시술 가이드",
  qna: "Q&A 의사 답변",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

const TYPE_DISCLAIMERS: Record<MagazineType, Magazine["disclaimerType"]> = {
  article: "general",
  qna: "qna",
  regional: "price",
  interview: "general",
  case: "case",
};

interface Props {
  type: MagazineType;
  initial?: Partial<Magazine>;
  mode: "new" | "edit";
}

export function MagazineForm({ type, initial, mode }: Props) {
  // 의원에 소속된 모든 의사 (저자 후보)
  const allDoctors = hospitals.flatMap((h) =>
    h.doctors.map((d) => ({
      slug: d.slug,
      label: `${d.nameKr} (${d.title}) · ${h.nameKr}`,
    }))
  );

  return (
    <form action={saveMagazineAction} className="space-y-6">
      <input type="hidden" name="type" value={type} />

      <FormSection title="기본 정보">
        <Field label="템플릿">
          <p className="text-sm font-medium">{TYPE_LABELS[type]}</p>
        </Field>
        <Field label="Slug (URL)" required hint="예: gangnam-implant-price-2026">
          <input
            name="slug"
            defaultValue={initial?.slug ?? ""}
            required
            pattern="[a-z0-9-]+"
            readOnly={mode === "edit"}
            className="input"
          />
        </Field>
        <Field label="제목 (H1 + <title>)" required hint="60자 이내, 키워드 포함">
          <input
            name="seoTitle"
            defaultValue={initial?.seoTitle ?? ""}
            required
            maxLength={80}
            className="input"
          />
        </Field>
        <Field label="검색 스니펫 (meta description)" required hint="155자 이내">
          <textarea
            name="metaDescription"
            defaultValue={initial?.metaDescription ?? ""}
            required
            maxLength={160}
            rows={2}
            className="input"
          />
        </Field>
        <Field
          label="짧은 답변 (shortAnswer) ★ AEO 핵심"
          required
          hint="200자 이내. LLM이 그대로 인용할 1~2문장. (출처: 메디록, 발행연월) 포함 권장"
        >
          <textarea
            name="shortAnswer"
            defaultValue={initial?.shortAnswer ?? ""}
            required
            maxLength={240}
            rows={3}
            className="input"
          />
        </Field>
        <Field label="타겟 키워드 (쉼표 구분)" hint="예: 강남 임플란트 가격, 임플란트 2026">
          <input
            name="targetKeywords"
            defaultValue={initial?.targetKeywords?.join(", ") ?? ""}
            className="input"
          />
        </Field>
      </FormSection>

      <FormSection title={type === "qna" ? "Q&A 본문" : "본문"}>
        <Field
          label={
            type === "qna"
              ? "상세 답변 (3-5문단)"
              : "본문 (Markdown 가능)"
          }
          required
        >
          <textarea
            name="body"
            defaultValue={initial?.body ?? ""}
            required
            rows={14}
            className="input font-mono"
          />
        </Field>
      </FormSection>

      {(type === "article" || type === "regional") && (
        <FormSection
          title="FAQ 블록"
          hint="FAQPage schema 자동 생성. AI 답변 인용 핵심."
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border border-[var(--color-surface-divider)] rounded-md p-3 space-y-2"
            >
              <input
                name={`faq_${i}_q`}
                defaultValue={initial?.faqBlocks?.[i]?.question ?? ""}
                className="input"
                placeholder={`Q${i + 1}. 질문`}
              />
              <textarea
                name={`faq_${i}_a`}
                defaultValue={initial?.faqBlocks?.[i]?.answer ?? ""}
                className="input"
                rows={2}
                placeholder="A. 답변"
              />
            </div>
          ))}
        </FormSection>
      )}

      {type === "article" && (
        <FormSection title="가격 비교 표 (선택)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-2 border border-[var(--color-surface-divider)] rounded-md p-2"
            >
              <input
                name={`price_${i}_treatment`}
                defaultValue={initial?.priceTable?.[i]?.treatment ?? ""}
                className="input"
                placeholder="항목"
              />
              <input
                name={`price_${i}_range`}
                defaultValue={initial?.priceTable?.[i]?.priceRange ?? ""}
                className="input"
                placeholder="가격"
              />
              <input
                name={`price_${i}_note`}
                defaultValue={initial?.priceTable?.[i]?.note ?? ""}
                className="input"
                placeholder="비고"
              />
            </div>
          ))}
        </FormSection>
      )}

      <FormSection title="저자">
        <Field
          label="의사 저자 (의원 소속)"
          hint="선택 시 매거진에 저자 프로필 박스 + 의원 cross-link 자동 노출. 의원 페이지에도 자동으로 이 글이 표시됨."
        >
          <select
            name="authorDoctorSlug"
            defaultValue={initial?.authorDoctorSlug ?? ""}
            className="input"
          >
            <option value="">— 의사 저자 없음 (큐레이션팀/외부) —</option>
            {allDoctors.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="저자 이름 (의사 미선택 시)">
            <input
              name="authorName"
              defaultValue={initial?.authorName ?? ""}
              className="input"
              placeholder="메디록 큐레이션팀"
            />
          </Field>
          <Field label="저자 직함">
            <input
              name="authorTitle"
              defaultValue={initial?.authorTitle ?? ""}
              className="input"
              placeholder="전 서울대치과병원 임상조교수"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="관련 의원 / 분류">
        <Field
          label="관련 의원 (slug, 쉼표)"
          hint="예: hangyeol-dental, songhak-dental. 매거진 하단 + 관련 의원 섹션에 자동 노출"
        >
          <input
            name="linkedHospitalSlugs"
            defaultValue={initial?.linkedHospitalSlugs?.join(", ") ?? ""}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="진료과">
            <select
              name="linkedDepartmentSlug"
              defaultValue={initial?.linkedDepartmentSlug ?? "dental"}
              className="input"
            >
              <option value="">— 선택 —</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.nameKr}
                </option>
              ))}
            </select>
          </Field>
          <Field label="지역 (slug)">
            <input
              name="linkedRegionSlug"
              defaultValue={initial?.linkedRegionSlug ?? ""}
              className="input"
              placeholder="gangnam"
            />
          </Field>
          <Field label="시술 (slug)">
            <input
              name="linkedTreatmentSlug"
              defaultValue={initial?.linkedTreatmentSlug ?? ""}
              className="input"
              placeholder="implant"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="발행 + 의료법 disclaimer">
        <div className="grid grid-cols-3 gap-3">
          <Field label="카테고리">
            <input
              name="category"
              defaultValue={initial?.category ?? TYPE_LABELS[type]}
              className="input"
            />
          </Field>
          <Field label="발행일">
            <input
              type="date"
              name="publishedAt"
              defaultValue={initial?.publishedAt ?? new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </Field>
          <Field label="Disclaimer 유형">
            <select
              name="disclaimerType"
              defaultValue={initial?.disclaimerType ?? TYPE_DISCLAIMERS[type]}
              className="input"
            >
              <option value="general">일반 의학정보</option>
              <option value="case">케이스 스토리</option>
              <option value="price">가격 정보</option>
              <option value="qna">Q&A 의료정보</option>
            </select>
          </Field>
        </div>
      </FormSection>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary py-3 px-6 text-sm">
          {mode === "new" ? "발행" : "변경 저장"}
        </button>
        <a
          href="/dashboard/magazines"
          className="btn-outline py-3 px-6 text-sm inline-flex items-center"
        >
          취소
        </a>
      </div>

      <style>{`
        .input { width: 100%; padding: 9px 10px; font-size: 14px; border: 0.5px solid var(--color-surface-border); border-radius: 8px; background: white; }
        .input:focus { outline: none; border-color: var(--color-accent-400); box-shadow: 0 0 0 3px rgba(184,153,104,0.15); }
        .input.font-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px; }
      `}</style>
    </form>
  );
}

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[var(--color-surface-border)] rounded-lg p-5">
      <div className="mb-4">
        <h2 className="text-base font-medium">{title}</h2>
        {hint && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] text-[var(--color-text-muted)] mt-1">
          {hint}
        </span>
      )}
    </label>
  );
}
