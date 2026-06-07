"use server";

import { redirect } from "next/navigation";
import { clearDashboardCookie } from "@/lib/dashboard-auth";

export async function logoutAction() {
  await clearDashboardCookie();
  redirect("/dashboard/login");
}
