import { saveHospitalAction } from "./actions";
import type { Hospital } from "@/types";
import { departments, regions } from "@/lib/data";

interface Props {
  initial?: Partial<Hospital>;
  mode: "new" | "edit";
}

export function HospitalForm({ initial, mode }: Props) {
  const v = (key: keyof Hospital, fallback = "") =>
    String((initial?.[key] ?? fallback) as string | number);

  return (
    <form action={saveHospitalAction} className="space-y-6">
      <FormSection title="기본 정보">
        <Field label="의원명 (한글)" required>
          <input
            name="nameKr"
            defaultValue={v("nameKr")}
            required
            className="input"
          />
        </Field>
        <Field label="Slug (URL용, 영문)" required hint="예: hangyeol-dental">
          <input
            name="slug"
            defaultValue={v("slug")}
            required
            pattern="[a-z0-9-]+"
            readOnly={mode === "edit"}
            className="input"
          />
        </Field>
        <Field label="짧은 설명" hint="진료과 + 전문 분야">
          <input
            name="shortDescription"
            defaultValue={v("shortDescription")}
            className="input"
            placeholder="齒 임플란트·보철 전문"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="진료과" required>
            <select
              name="departmentSlug"
              defaultValue={v("departmentSlug", "dental")}
              className="input"
            >
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.hanja} {d.nameKr}
                </option>
              ))}
            </select>
          </Field>
          <Field label="지역" required>
            <select
              name="regionSlug"
              defaultValue={v("regionSlug", "gangnam")}
              className="input"
            >
              {regions
                .filter((r) => r.parentSlug)
                .map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.nameKr}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="등급" hint="PREMIUM = 큐레이션 + 유료 파트너">
            <select name="tier" defaultValue={v("tier", "STANDARD")} className="input">
              <option value="STANDARD">STANDARD (일반 醫錄 인증)</option>
              <option value="PREMIUM">PREMIUM (큐레이션)</option>
              <option value="HERITAGE">HERITAGE</option>
            </select>
          </Field>
          <Field label="설립연도">
            <input
              type="number"
              name="yearEstablished"
              defaultValue={v("yearEstablished")}
              className="input"
              placeholder="2014"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="위치·연락처">
        <Field label="주소" required>
          <input
            name="addressLine"
            defaultValue={v("addressLine")}
            required
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="가까운 역">
            <input
              name="nearestStation"
              defaultValue={v("nearestStation")}
              className="input"
              placeholder="2호선 역삼역 3번 출구"
            />
          </Field>
          <Field label="도보 분">
            <input
              type="number"
              name="walkingMinutes"
              defaultValue={v("walkingMinutes")}
              className="input"
            />
          </Field>
        </div>
        <Field label="대표 전화">
          <input
            name="phone"
            defaultValue={v("phone")}
            className="input"
            placeholder="02-555-0123"
          />
        </Field>
      </FormSection>

      <FormSection title="醫錄 4단계 인증">
        <CertRow
          stageKey="stage1"
          boolName="cert_stage1"
          detailName="cert_stage1Detail"
          label="一 진료 이력"
          placeholder="12년 운영 · 임플란트 5,200건"
          defaultBool={initial?.certification?.stage1History ?? false}
          defaultDetail={initial?.certification?.stage1Detail ?? ""}
        />
        <CertRow
          stageKey="stage2"
          boolName="cert_stage2"
          detailName="cert_stage2Detail"
          label="二 실방문 후기"
          placeholder="312건 · 영수증 인증 100%"
          defaultBool={initial?.certification?.stage2Reviews ?? false}
          defaultDetail={initial?.certification?.stage2Detail ?? ""}
        />
        <CertRow
          stageKey="stage3"
          boolName="cert_stage3"
          detailName="cert_stage3Detail"
          label="三 의료진 자격"
          placeholder="서울대 치대 졸 · 4인 전문의"
          defaultBool={initial?.certification?.stage3Credentials ?? false}
          defaultDetail={initial?.certification?.stage3Detail ?? ""}
        />
        <CertRow
          stageKey="stage4"
          boolName="cert_stage4"
          detailName="cert_stage4Detail"
          label="四 시설·장비"
          placeholder="3D CT · 위생 1등급"
          defaultBool={initial?.certification?.stage4Facility ?? false}
          defaultDetail={initial?.certification?.stage4Detail ?? ""}
        />
        <Field label="인증 완료 연월" hint="예: 2026-05">
          <input
            name="cert_at"
            defaultValue={initial?.certification?.certifiedAt ?? "2026-06"}
            className="input"
          />
        </Field>
      </FormSection>

      <FormSection
        title="큐레이션 노트 (PREMIUM 전용)"
        hint="채우면 매거진/홈에 큐레이터 코멘트로 노출됨"
      >
        <Field label="큐레이션 코멘트">
          <textarea
            name="curationText"
            defaultValue={initial?.curationNote?.text ?? ""}
            className="input"
            rows={3}
            maxLength={200}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="큐레이터 이름">
            <input
              name="curationCurator"
              defaultValue={initial?.curationNote?.curatorName ?? ""}
              className="input"
            />
          </Field>
          <Field label="큐레이터 직함">
            <input
              name="curationCuratorTitle"
              defaultValue={initial?.curationNote?.curatorTitle ?? ""}
              className="input"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="시술 가격 (최대 5개)">
        {[0, 1, 2, 3, 4].map((i) => {
          const p = initial?.prices?.[i];
          return (
            <div
              key={i}
              className="border border-[var(--color-surface-divider)] rounded-md p-3 space-y-2"
            >
              <input
                name={`price_${i}_name`}
                defaultValue={p?.treatmentName ?? ""}
                className="input"
                placeholder={`시술명 #${i + 1} (예: 임플란트(단일))`}
              />
              <input
                name={`price_${i}_note`}
                defaultValue={p?.treatmentNote ?? ""}
                className="input"
                placeholder="비고 (예: 국산 오스템)"
              />
              <div className="grid grid-cols-4 gap-2">
                <NumInput name={`price_${i}_low`} placeholder="정상가-min" defaultValue={p?.normalLow} />
                <NumInput name={`price_${i}_high`} placeholder="정상가-max" defaultValue={p?.normalHigh} />
                <NumInput name={`price_${i}_eventLow`} placeholder="이벤트-min" defaultValue={p?.eventLow} />
                <NumInput name={`price_${i}_eventHigh`} placeholder="이벤트-max" defaultValue={p?.eventHigh} />
              </div>
            </div>
          );
        })}
      </FormSection>

      <FormSection title="의료진 (최대 6명)">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const d = initial?.doctors?.[i];
          return (
            <div
              key={i}
              className="border border-[var(--color-surface-divider)] rounded-md p-3 grid grid-cols-2 md:grid-cols-5 gap-2"
            >
              <input
                name={`doctor_${i}_slug`}
                defaultValue={d?.slug ?? ""}
                className="input"
                placeholder="slug (han-jinwoo)"
              />
              <input
                name={`doctor_${i}_name`}
                defaultValue={d?.nameKr ?? ""}
                className="input"
                placeholder="이름"
              />
              <input
                name={`doctor_${i}_hanja`}
                defaultValue={d?.nameHanja ?? ""}
                className="input"
                placeholder="한자 1자"
                maxLength={1}
              />
              <input
                name={`doctor_${i}_title`}
                defaultValue={d?.title ?? "원장"}
                className="input"
                placeholder="직함"
              />
              <input
                name={`doctor_${i}_specialty`}
                defaultValue={d?.specialty ?? ""}
                className="input"
                placeholder="전문"
              />
              <input
                type="number"
                name={`doctor_${i}_years`}
                defaultValue={d?.yearsExperience ?? ""}
                className="input"
                placeholder="경력(년)"
              />
            </div>
          );
        })}
      </FormSection>

      <FormSection title="통계·태그">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="평점">
            <NumInput name="rating" step="0.1" defaultValue={initial?.rating ?? 4.5} />
          </Field>
          <Field label="리뷰 수">
            <NumInput name="reviewCount" defaultValue={initial?.reviewCount ?? 0} />
          </Field>
          <Field label="의사 수">
            <NumInput name="doctorCount" defaultValue={initial?.doctorCount ?? initial?.doctors?.length ?? 1} />
          </Field>
          <Field label="월 방문(메디록)">
            <NumInput name="monthlyVisitors" defaultValue={initial?.monthlyVisitors ?? 0} />
          </Field>
        </div>
        <Field label="태그 (쉼표 구분)">
          <input
            name="tags"
            defaultValue={initial?.tags?.join(", ") ?? ""}
            className="input"
            placeholder="임플란트, 보철, 시니어 패키지"
          />
        </Field>
      </FormSection>

      <FormSection title="진료시간">
        <div className="grid grid-cols-2 gap-3">
          <Field label="평일">
            <input
              name="hours_weekday"
              defaultValue={initial?.hours?.weekday ?? "09:00 - 18:30"}
              className="input"
            />
          </Field>
          <Field label="토요일">
            <input
              name="hours_saturday"
              defaultValue={initial?.hours?.saturday ?? "09:00 - 14:00"}
              className="input"
            />
          </Field>
          <Field label="일/공휴일">
            <input
              name="hours_sunday"
              defaultValue={initial?.hours?.sunday ?? "휴진"}
              className="input"
            />
          </Field>
          <Field label="점심시간">
            <input
              name="hours_lunch"
              defaultValue={initial?.hours?.lunch ?? "13:00 - 14:00"}
              className="input"
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary py-3 px-6 text-sm">
          {mode === "new" ? "의원 추가" : "변경 사항 저장"}
        </button>
        <a
          href="/dashboard/hospitals"
          className="btn-outline py-3 px-6 text-sm inline-flex items-center"
        >
          취소
        </a>
      </div>

      <style>{`
        .input { width: 100%; padding: 9px 10px; font-size: 14px; border: 0.5px solid var(--color-surface-border); border-radius: 8px; background: white; }
        .input:focus { outline: none; border-color: var(--color-accent-400); box-shadow: 0 0 0 3px rgba(184,153,104,0.15); }
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

function NumInput({
  name,
  placeholder,
  defaultValue,
  step,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: number | string;
  step?: string;
}) {
  return (
    <input
      type="number"
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      step={step}
      className="input"
    />
  );
}

function CertRow({
  stageKey,
  boolName,
  detailName,
  label,
  placeholder,
  defaultBool,
  defaultDetail,
}: {
  stageKey: string;
  boolName: string;
  detailName: string;
  label: string;
  placeholder: string;
  defaultBool: boolean;
  defaultDetail: string;
}) {
  return (
    <div key={stageKey} className="flex gap-2 items-start">
      <input
        type="checkbox"
        name={boolName}
        defaultChecked={defaultBool}
        className="mt-3"
      />
      <Field label={label}>
        <input
          name={detailName}
          defaultValue={defaultDetail}
          className="input"
          placeholder={placeholder}
        />
      </Field>
    </div>
  );
}
