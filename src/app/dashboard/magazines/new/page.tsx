import Link from "next/link";
import type { Route } from "next";

interface TemplateInfo {
  type: "article" | "qna" | "regional" | "interview" | "case";
  title: string;
  description: string;
  hanja: string;
}

const TEMPLATES: TemplateInfo[] = [
  {
    type: "article",
    title: "시술 가이드",
    description: "키워드 타겟 SEO 메인. 가격·방법·비교 정보 + FAQ + 가격 비교 표.",
    hanja: "解",
  },
  {
    type: "qna",
    title: "Q&A 의사 답변",
    description: "AEO 핵심. 실제 환자 질문 + 의사 직접 답변. shortAnswer가 LLM에 인용됨.",
    hanja: "問",
  },
  {
    type: "regional",
    title: "지역 가이드",
    description: "Local SEO. 지역×시술 TOP 랭킹. 메디록 인증 의원 중 큐레이션.",
    hanja: "地",
  },
  {
    type: "interview",
    title: "의원 인터뷰",
    description: "큐레이션 의원 노출 + E-E-A-T 강화. 의사 인터뷰 Q&A 5~10개.",
    hanja: "訪",
  },
  {
    type: "case",
    title: "케이스 스토리",
    description: "전환 직격. 실제 시술 사례 (환자 동의 필수). 의료법 disclaimer 자동.",
    hanja: "案",
  },
];

export default function NewMagazinePickerPage() {
  return (
    <div>
      <nav className="text-xs text-[var(--color-text-muted)] mb-3">
        <Link href={"/dashboard/magazines" as Route}>매거진 관리</Link> › 새 글
      </nav>
      <h1 className="text-2xl font-medium mb-1">템플릿 선택</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        매거진의 5종 템플릿 중 작성할 종류를 선택하세요. 템플릿마다 폼 필드가
        다릅니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <Link
            key={t.type}
            href={`/dashboard/magazines/new/${t.type}` as Route}
            className="block bg-white border border-[var(--color-surface-border)] rounded-lg p-5 hover:border-[var(--color-accent-400)]"
          >
            <div className="flex gap-4 items-start">
              <span className="hanja text-3xl text-[var(--color-accent-600)]">
                {t.hanja}
              </span>
              <div className="flex-1">
                <h3 className="font-medium">{t.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  {t.description}
                </p>
                <p className="mt-3 text-xs text-[var(--color-accent-700)]">
                  이 템플릿으로 작성 →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
