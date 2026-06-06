// 대시보드 단순 비밀번호 인증 (MVP)
// 비밀번호는 env DASHBOARD_PASSWORD, 쿠키는 HTTP-only

import { cookies } from "next/headers";

export const DASHBOARD_COOKIE = "medirok_dashboard_auth";
export const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "meirok5349";

// 쿠키에 들어가는 토큰 (비밀번호와 다른 값, 해시처럼 작동)
function makeToken(password: string): string {
  // 단순 base64 — 실 production은 JWT 권장
  return Buffer.from(`medirok:${password}:authenticated`).toString("base64");
}

const VALID_TOKEN = makeToken(DASHBOARD_PASSWORD);

export function isAuthenticated(token?: string | null): boolean {
  if (!token) return false;
  return token === VALID_TOKEN;
}

export async function checkDashboardAuth(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(DASHBOARD_COOKIE)?.value;
  return isAuthenticated(token);
}

export async function setDashboardCookie() {
  const c = await cookies();
  c.set(DASHBOARD_COOKIE, VALID_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
}

export async function clearDashboardCookie() {
  const c = await cookies();
  c.delete(DASHBOARD_COOKIE);
}
