import "server-only";
import { ensureSchema, statsDatabase } from "./db";

/**
 * Chiffres de la page des statistiques, sur une période (en jours). Une
 * « visite » est un onglet ouvert (cf. events.ts). Les données de plus de
 * 25 mois sont effacées au passage (durée maximale admise par la CNIL pour
 * une mesure d'audience exemptée de consentement).
 */

export type Count = { label: string; count: number };

export type StatsData = {
  days: number;
  kpis: {
    visits: number;
    previousVisits: number;
    views: number;
    /** Durée médiane d'une visite (s), sur les visites dont on connaît la durée. */
    medianSeconds: number | null;
    /** Part des visites qui ouvrent au moins un projet. */
    projectRate: number | null;
    /** Part des visites qui écrivent, copient l'adresse ou téléchargent le CV. */
    contactRate: number | null;
  };
  daily: { day: string; visits: number; views: number }[];
  pages: { path: string; views: number; visits: number; avgSeconds: number | null; avgDepth: number | null }[];
  /** Accueil : part des visites de l'accueil arrivées jusqu'au projet n (0 = le premier). */
  reach: { index: number; slug: string | null; share: number }[];
  homeVisits: number;
  journey: Count[];
  devices: Count[];
  themes: Count[];
  locales: Count[];
  countries: Count[];
  referrers: Count[];
  objects: Count[];
  dimensions: Count[];
  destroys: Count[];
  portals: number;
  media: Count[];
  outbound: Count[];
  contacts: Count[];
  settings: Count[];
  recent: { start: string; seconds: number | null; pages: string[]; device: string | null; country: string | null; referrer: string | null }[];
};

const num = (value: unknown) => (value === null || value === undefined ? 0 : Number(value));
const counts = (rows: readonly { label: string | null; count: unknown }[], empty = "-") =>
  rows.map((row) => ({ label: row.label ?? empty, count: num(row.count) }));

export async function readStats(days: number, slugs: string[]): Promise<StatsData | null> {
  const sql = statsDatabase();
  if (!sql) return null;
  await ensureSchema(sql);
  await sql`delete from portfolio_events where at < now() - interval '25 months'`;

  const since = new Date(Date.now() - days * 86_400_000);
  const before = new Date(Date.now() - 2 * days * 86_400_000);
  const recent = sql`select * from portfolio_events where at >= ${since}`;

  const [
    [totals],
    [previous],
    [median],
    [rates],
    daily,
    pageViews,
    pageTimes,
    deepest,
    devices,
    themes,
    locales,
    countries,
    referrers,
    targets,
    journeys,
  ] = await Promise.all([
    sql`select count(distinct session) as visits, count(*) as views from (${recent}) e where name = 'view'`,
    sql`select count(distinct session) as visits from portfolio_events where name = 'view' and at >= ${before} and at < ${since}`,
    sql`select percentile_cont(0.5) within group (order by total) as seconds
        from (select session, sum(value) as total from (${recent}) e where name = 'leave' group by session) t`,
    sql`select
          count(distinct session) filter (where name = 'view' and path like '/projects/%') as projects,
          count(distinct session) filter (where name = 'contact' or (name = 'download')) as contacts,
          count(distinct session) filter (where name = 'view' and path = '/') as home
        from (${recent}) e`,
    sql`select to_char(date_trunc('day', at at time zone 'Europe/Paris'), 'YYYY-MM-DD') as day,
          count(distinct session) as visits, count(*) as views
        from (${recent}) e where name = 'view' group by 1 order by 1`,
    sql`select path, count(*) as views, count(distinct session) as visits from (${recent}) e where name = 'view' group by path`,
    sql`select path, avg(total) as seconds, avg(depth) as depth from (
          select session, path, sum(value) as total, max(case when target ~ '^[0-9]{1,3}$' then target::int end) as depth
          from (${recent}) e where name = 'leave' group by session, path
        ) t group by path`,
    sql`select deepest, count(*) as count from (
          select session, max(value) as deepest from (${recent}) e where name = 'reach' group by session
        ) t group by deepest`,
    sql`select device as label, count(distinct session) as count from (${recent}) e where name = 'view' group by device order by count desc`,
    sql`select theme as label, count(distinct session) as count from (${recent}) e where name = 'view' group by theme order by count desc`,
    sql`select locale as label, count(distinct session) as count from (${recent}) e where name = 'view' group by locale order by count desc`,
    sql`select country as label, count(distinct session) as count from (${recent}) e where name = 'view' group by country order by count desc limit 12`,
    sql`select referrer as label, count(*) as count from (
          select session, max(referrer) as referrer from (${recent}) e where name = 'view' group by session
        ) t group by referrer order by count desc limit 12`,
    sql`select name, target as label, count(*) as count from (${recent}) e
        where name in ('object', 'dimension', 'destroy', 'portal', 'media', 'outbound', 'download', 'contact', 'theme', 'lang', 'sound', 'pager')
        group by name, target order by count desc`,
    sql`select min(at) as start, sum(value) filter (where name = 'leave') as seconds,
          array_agg(path order by at) filter (where name = 'view') as pages,
          max(device) as device, max(country) as country, max(referrer) as referrer
        from (${recent}) e group by session order by start desc limit 20`,
  ]);

  const visits = num(totals.visits);
  const homeVisits = num(rates.home);
  const times = new Map(pageTimes.map((row) => [row.path as string, row]));
  const ofName = (name: string) => counts(targets.filter((row) => row.name === name) as unknown as { label: string | null; count: unknown }[]);

  // Arrivés au moins jusqu'au projet n : ceux dont le plus loin est n ou au-delà.
  const reachedAt = new Map(deepest.map((row) => [num(row.deepest), num(row.count)]));
  const reach = slugs.map((slug, index) => {
    if (index === 0) return { index, slug, share: homeVisits > 0 ? 1 : 0 };
    let reached = 0;
    for (const [at, count] of reachedAt) if (at >= index) reached += count;
    return { index, slug, share: homeVisits > 0 ? Math.min(1, reached / homeVisits) : 0 };
  });

  const pages = pageViews
    .map((row) => {
      const time = times.get(row.path as string);
      return {
        path: row.path as string,
        views: num(row.views),
        visits: num(row.visits),
        avgSeconds: time?.seconds === null || time?.seconds === undefined ? null : Number(time.seconds),
        avgDepth: time?.depth === null || time?.depth === undefined ? null : Number(time.depth),
      };
    })
    .sort((a, b) => b.views - a.views);

  const contactPage = pages.find((page) => page.path === "/contact")?.visits ?? 0;

  return {
    days,
    kpis: {
      visits,
      previousVisits: num(previous.visits),
      views: num(totals.views),
      medianSeconds: median?.seconds === null || median?.seconds === undefined ? null : Number(median.seconds),
      projectRate: visits > 0 ? num(rates.projects) / visits : null,
      contactRate: visits > 0 ? num(rates.contacts) / visits : null,
    },
    daily: daily.map((row) => ({ day: row.day as string, visits: num(row.visits), views: num(row.views) })),
    pages,
    reach,
    homeVisits,
    journey: [
      { label: "visits", count: visits },
      { label: "home", count: homeVisits },
      { label: "project", count: num(rates.projects) },
      { label: "contactPage", count: contactPage },
      { label: "contact", count: num(rates.contacts) },
    ],
    devices: counts(devices as never),
    themes: counts(themes as never),
    locales: counts(locales as never),
    countries: counts(countries as never),
    referrers: counts(referrers as never, "(direct)"),
    objects: ofName("object"),
    dimensions: ofName("dimension"),
    destroys: ofName("destroy"),
    portals: ofName("portal").reduce((sum, row) => sum + row.count, 0),
    media: ofName("media"),
    outbound: ofName("outbound"),
    contacts: [...ofName("contact"), ...ofName("download")],
    settings: [
      ...ofName("theme").map((row) => ({ ...row, label: `theme:${row.label}` })),
      ...ofName("lang").map((row) => ({ ...row, label: `lang:${row.label}` })),
      ...ofName("sound").map((row) => ({ ...row, label: `sound:${row.label}` })),
      ...ofName("pager").map((row) => ({ ...row, label: `pager:${row.label}` })),
    ],
    recent: journeys.map((row) => ({
      start: new Date(row.start as string).toISOString(),
      seconds: row.seconds === null ? null : Number(row.seconds),
      pages: (row.pages as string[] | null) ?? [],
      device: (row.device as string | null) ?? null,
      country: (row.country as string | null) ?? null,
      referrer: (row.referrer as string | null) ?? null,
    })),
  };
}
