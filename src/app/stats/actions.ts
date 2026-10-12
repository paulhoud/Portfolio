"use server";

import { redirect } from "next/navigation";
import { signInStats, signOutStats } from "@/lib/stats/auth";

/** Connexion à la page des statistiques ; une mauvaise tentative attend un peu. */
export async function enterStats(_state: { failed: boolean }, form: FormData): Promise<{ failed: boolean }> {
  const attempt = String(form.get("password") ?? "");
  if (await signInStats(attempt)) redirect("/stats");
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { failed: true };
}

export async function leaveStats() {
  await signOutStats();
  redirect("/stats");
}
