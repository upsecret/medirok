import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary-700)] text-[var(--color-accent-300)] pt-8 pb-20 md:pb-8">
      <div className="container-page">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Logo size={22} variant="dark" />
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-accent-300)]">
              시니어 의료 가이드
              <br />
              <span className="hanja">醫錄</span> · 의료의 기록
            </p>
          </div>
          <div>
            <p className="text-white font-medium text-xs mb-2">서비스</p>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/hospitals">의원찾기</Link></li>
              <li><Link href={"/magazine" as Route}>매거진</Link></li>
              <li><Link href="/verification"><span className="hanja">醫錄</span> 인증제</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium text-xs mb-2">파트너</p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="https://partner.medirok.com">파트너 등록</a></li>
              <li><Link href={"/seo-solution" as Route}>SEO 솔루션</Link></li>
              <li><Link href={"/curation-criteria" as Route}>큐레이션 심사 기준</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium text-xs mb-2">회사</p>
            <ul className="space-y-1.5 text-xs">
              <li><Link href={"/about" as Route}>소개</Link></li>
              <li><Link href={"/careers" as Route}>채용</Link></li>
              <li><Link href={"/terms" as Route}>이용약관</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-[var(--color-primary-500)] text-[10px] text-[var(--color-accent-300)] opacity-70">
          (주) 메디록 · 사업자: 000-00-00000 · 서울특별시
          <br />
          Copyright 2026. Medirok Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
