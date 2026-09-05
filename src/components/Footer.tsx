import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary-800)] text-[var(--color-primary-200)] pt-12 pb-24 md:pb-10">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-9 md:grid-cols-3 md:gap-12 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Logo size={22} variant="dark" />
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-primary-200)]">
              나와 가족의 병원 선택을 돕는<br />의료 정보 플랫폼
              <br />
              <span className="hanja">醫錄</span> · 의료의 기록
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">서비스</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hospitals">병원 찾기</Link></li>
              <li><Link href={"/magazine" as Route}>매거진</Link></li>
              <li><Link href={"/blog" as Route}>병원 소식</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">병원 관계자</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/verification"><span className="hanja">醫錄</span> 인증제 안내</Link></li>
              <li><Link href="/verification/apply"><span className="hanja">醫錄</span> 인증제 신청</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--color-primary-600)] text-xs leading-relaxed text-[var(--color-primary-300)]">
          주식회사 루코르다 · 사업자등록번호 481-87-02246 · 경기도 용인시 기흥구
          <br />
          대표전화 070-8064-0972
          <br />
          Copyright 2026. Medirok Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
