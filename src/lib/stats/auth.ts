import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Accès à la page des statistiques : un mot de passe, choisi par Paul et
 * rangé dans les variables du projet sur Vercel (STATS_PASSWORD). Une fois
 * entré, un cookie signé le retient deux mois sur cet appareil ; changer le
 * mot de passe les invalide tous. Sans mot de passe défini, la page reste
 * fermée.
 */

const COOKIE = "portfolio-stats";
const MAX_AGE = 60 * 60 * 24 * 60;

function password() {
  const value = process.env.STATS_PASSWORD;
  return value && value.length >= 8 ? value : null;
}

const pass = (secret: string) => createHmac("sha256", secret).update("portfolio-stats-v1").digest("base64url");
const digest = (value: string) => createHash("sha256").update(value).digest();

export function statsPasswordSet() {
  return password() !== null;
}

export async function isStatsReader() {
  const secret = password();
  if (!secret) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  return timingSafeEqual(digest(value), digest(pass(secret)));
}

/** Vrai si le mot de passe est le bon ; le cookie est alors posé. */
export async function signInStats(attempt: string) {
  const secret = password();
  if (!secret || !timingSafeEqual(digest(attempt), digest(secret))) return false;
  (await cookies()).set(COOKIE, pass(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOutStats() {
  (await cookies()).delete(COOKIE);
}
