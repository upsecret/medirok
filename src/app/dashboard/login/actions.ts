"use server";

import { redirect } from "next/navigation";
import { DASHBOARD_PASSWORD, setDashboardCookie } from "@/lib/dashboard-auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (password !== DASHBOARD_PASSWORD) {
    redirect("/dashboard/login?error=1");
  }

  await setDashboardCookie();
  redirect(next);
}
