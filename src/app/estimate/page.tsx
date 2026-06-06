export const metadata = {
  title: "백내장·임플란트 무료 견적",
  description: "醫錄 인증 의원에서 시니어 시술 무료 견적을 받으세요.",
};

export default function EstimatePage() {
  return (
    <section className="bg-[var(--color-surface-bg)] py-8 min-h-[60vh]">
      <div className="container-content">
        <span className="inline-block text-[10px] tracking-[0.05em] bg-[var(--color-accent-100)] text-[var(--color-accent-600)] px-2.5 py-1 rounded font-medium mb-2.5">
          <span className="hanja">醫錄</span> 인증 의원만 매칭
        </span>
        <h1>백내장·임플란트 무료 견적</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed max-w-xl">
          희망 진료과·지역·시술명을 알려주시면, <span className="hanja">醫錄</span> 4단계 인증
          의원 3곳에서 견적을 받아드립니다. 24시간 내 연락.
        </p>

        <form className="bg-white border border-[var(--color-surface-border)] rounded-lg p-5 md:p-7 mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">시술 선택</label>
            <select className="w-full border border-[var(--color-surface-border)] rounded-md py-2.5 px-3 text-sm bg-white">
              <option>임플란트</option>
              <option>풀마우스 임플란트</option>
              <option>백내장 (다초점 렌즈)</option>
              <option>도수치료</option>
              <option>종합검진</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">희망 지역</label>
            <select className="w-full border border-[var(--color-surface-border)] rounded-md py-2.5 px-3 text-sm bg-white">
              <option>강남구</option>
              <option>서초구</option>
              <option>송파구</option>
              <option>용산구</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">연령대</label>
            <div className="flex gap-2 flex-wrap">
              {["50대", "60대", "70대", "80대 이상"].map((a) => (
                <label key={a} className="text-sm">
                  <input type="radio" name="age" className="mr-1" /> {a}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">연락처</label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              className="w-full border border-[var(--color-surface-border)] rounded-md py-2.5 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">증상·요청사항 (선택)</label>
            <textarea
              rows={3}
              className="w-full border border-[var(--color-surface-border)] rounded-md py-2.5 px-3 text-sm"
            />
          </div>
          <button type="submit" className="btn-accent w-full py-3 text-sm">
            <span className="hanja">醫錄</span> 인증 의원 3곳 견적 받기
          </button>
        </form>
      </div>
    </section>
  );
}
