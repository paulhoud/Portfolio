import { projects } from "@/content/projects";
import { ensureSchema, statsDatabase } from "@/lib/stats/db";
import { EVENT_NAMES, MAX_BODY, MAX_EVENTS, type EventName, type SentBatch } from "@/lib/stats/events";

/**
 * Réception de la mesure d'audience (cf. lib/stats). Tout ce qui ne
 * ressemble pas à un envoi du site est ignoré : nom d'évènement inconnu, page
 * qui n'existe pas, texte trop long. Robots connus écartés. Réponse vide dans
 * tous les cas : le navigateur n'attend rien.
 */

export const runtime = "nodejs";

const PAGES = new Set(["/", "/method", "/about", "/contact", ...projects.map((project) => `/projects/${project.slug}`)]);
const NAMES = new Set<string>(EVENT_NAMES);
const TARGET = /^[\p{L}\p{N} .,:'’@/&()+_-]{1,80}$/u;
const HOST = /^[a-z0-9.-]{1,80}$/;
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i;

function deviceOf(agent: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(agent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(agent)) return "mobile";
  return "desktop";
}

const empty = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const sql = statsDatabase();
  if (!sql) return empty();
  const agent = request.headers.get("user-agent") ?? "";
  if (!agent || BOTS.test(agent)) return empty();

  const text = await request.text();
  if (text.length > MAX_BODY) return empty();
  let batch: SentBatch;
  try {
    batch = JSON.parse(text) as SentBatch;
  } catch {
    return empty();
  }
  if (typeof batch?.s !== "string" || !/^[a-z0-9]{8,32}$/.test(batch.s)) return empty();
  if (!Array.isArray(batch.e) || batch.e.length === 0 || batch.e.length > MAX_EVENTS) return empty();
  const clientNow = Number(batch.now);
  if (!Number.isFinite(clientNow)) return empty();

  const serverNow = Date.now();
  const device = deviceOf(agent);
  const country = (request.headers.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase() || null;
  const locale = batch.locale === "fr" || batch.locale === "en" ? batch.locale : null;
  const theme = batch.theme === "light" || batch.theme === "dark" ? batch.theme : null;

  const rows = batch.e.flatMap((event) => {
    if (!event || !NAMES.has(event.n) || typeof event.p !== "string" || !PAGES.has(event.p)) return [];
    const target = typeof event.t === "string" && TARGET.test(event.t) ? event.t : null;
    const value = typeof event.v === "number" && Number.isFinite(event.v) ? Math.min(Math.max(event.v, 0), 86_400) : null;
    const referrer = typeof event.r === "string" && HOST.test(event.r) ? event.r : null;
    // Recalé sur l'horloge du serveur ; jamais plus d'une heure en arrière.
    const age = Math.min(Math.max(clientNow - Number(event.at), 0), 3_600_000);
    return [
      {
        at: new Date(serverNow - (Number.isFinite(age) ? age : 0)),
        session: batch.s,
        name: event.n as EventName,
        path: event.p,
        target,
        value,
        device,
        country,
        referrer,
        locale,
        theme,
      },
    ];
  });
  if (rows.length === 0) return empty();

  try {
    await ensureSchema(sql);
    await sql`insert into portfolio_events ${sql(rows, "at", "session", "name", "path", "target", "value", "device", "country", "referrer", "locale", "theme")}`;
  } catch (error) {
    console.error("[stats] enregistrement impossible", error);
  }
  return empty();
}
