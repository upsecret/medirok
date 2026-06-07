import Link from "next/link";
import { loginAction } from "./actions";

export const metadata = {
  title: "대시보드 로그인",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function DashboardLoginPage({ searchParams }: PageProps) {
  const { next = "/dashboard", error } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-bg)] px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-6">
          <span className="hanja text-[var(--color-primary-600)] text-4xl">錄</span>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">메디록 관리자</p>
        </Link>

        <form
          action={loginAction}
          className="bg-white border border-[var(--color-surface-border)] rounded-lg p-6 space-y-4"
        >
          <input type="hidden" name="next" value={next} />

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              id="password"
              autoFocus
              required
              className="w-full border border-[var(--color-surface-border)] rounded-md py-3 px-3 text-base"
              placeholder="비밀번호 입력"
            />
            {error && (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 text-sm"
          >
            로그인
          </button>

          <p className="text-[10px] text-[var(--color-text-muted)] text-center pt-2">
            관리자 전용 페이지입니다.
          </p>
        </form>
      </div>
    </main>
  );
}
