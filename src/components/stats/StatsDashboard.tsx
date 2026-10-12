"use client";

import Link from "next/link";
import { useEffect } from "react";
import { leaveStats } from "@/app/stats/actions";
import type { StatsData } from "@/lib/stats/queries";
import { optOutChosen, setOptOut, useOptOut } from "@/lib/stats/track";
import { cn } from "@/lib/utils";
import {
  BarList,
  Card,
  ReachColumns,
  Sparkline,
  SplitBar,
  TrendChart,
  formatCount,
  formatDuration,
  formatShare,
  type DayPoint,
} from "./charts";

/**
 * Page des statistiques (privée, en français) : une ligne de chiffres clés,
 * la courbe des visites, puis ce que les visiteurs regardent et font, et les
 * dernières visites, page par page. La période se choisit en haut et vaut
 * pour tout ce qui suit.
 */

type ProjectRef = { slug: string; title: string; mediaKey: string | null };

const OBJECTS: Record<string, string> = {
  dog: "Chiot", burger: "Burger", pokeball: "Pokéball", sneakers: "Sneaker", smartphone: "Téléphone", lego: "Personnage Lego",
  sushi: "Sushis", minecraftCube: "Bloc Minecraft", football: "Ballon de foot", tv: "Petite télé", powerCube: "Power Cube",
  cat: "Petit chat", kitsuneMask: "Masque de kitsune", banana: "Banane", earbuds: "Écouteurs", skateboard: "Skate",
  candy: "Bonbon", jigglypuff: "Rondoudou", minecraftSword: "Épée Minecraft", sodaCan: "Canette", potatOS: "Potat OS",
  shuriken: "Shuriken", teddy: "Ours en peluche", crowbar: "Pied-de-biche", cd: "CD « La Banquise »", pikachu: "Pikachu",
  speaker: "Enceinte", marioStar: "Étoile de Mario", wineGlass: "Verre de vin", flower: "Fleur", cheese: "Fromage", chessPawn: "Pion",
};
const DIMENSIONS: Record<string, string> = { lattice: "Treillis", dofus: "Dofus", southpark: "South Park" };
const TRIGGERS: Record<string, string> = { keyboard: "« destroy » au clavier", konami: "Code Konami", clicks: "Sept clics dans le vide", shake: "Secousse du téléphone" };
const DEVICES: Record<string, string> = { desktop: "Ordinateur", mobile: "Téléphone", tablet: "Tablette" };
const THEMES: Record<string, string> = { dark: "Sombre", light: "Clair" };
const LOCALES: Record<string, string> = { fr: "Français", en: "Anglais" };
const CONTACTS: Record<string, string> = { write: "Écrire (messagerie ouverte)", copy: "Adresse copiée" };
const SETTINGS: Record<string, string> = {
  "theme:light": "Passe en thème clair", "theme:dark": "Passe en thème sombre", "lang:en": "Passe en anglais", "lang:fr": "Passe en français",
  "sound:on": "Active le son", "sound:off": "Coupe le son", "pager:next": "Projet suivant (bas de page)", "pager:previous": "Projet précédent (bas de page)",
};

/** Sites connus, sous leur nom (sinon le domaine). */
const SITES: Record<string, string> = {
  "linkedin.com": "LinkedIn", "behance.net": "Behance", "github.com": "GitHub", "figma.com": "Figma", "youtube.com": "YouTube",
  "google.com": "Google", "bing.com": "Bing", "duckduckgo.com": "DuckDuckGo", "instagram.com": "Instagram", "malt.fr": "Malt",
  "upikajob.com": "UpikaJob", "t.co": "X (Twitter)", "lnkd.in": "LinkedIn",
};
const siteName = (host: string) => SITES[host] ?? SITES[host.split(".").slice(-2).join(".")] ?? host;

/** Pages d'une visite, sans les rechargements d'une même page à la suite. */
const steps = (pages: string[]) => pages.filter((path, index) => path !== pages[index - 1]);

const regions = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
const countryName = (code: string) => {
  if (code === "-" || !code) return "Inconnu";
  try {
    return regions?.of(code) ?? code;
  } catch {
    return code;
  }
};

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const keyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" });
const stampFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Tous les jours de la période, même sans visite (la courbe ne saute pas de jour). */
function fillDays(daily: StatsData["daily"], days: number): DayPoint[] {
  const known = new Map(daily.map((row) => [row.day, row]));
  const seen = new Set<string>();
  const points: DayPoint[] = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    const date = new Date(Date.now() - back * 86_400_000);
    const key = keyFormat.format(date);
    if (seen.has(key)) continue;
    seen.add(key);
    const row = known.get(key);
    points.push({ day: key, label: dayFormat.format(date), visits: row?.visits ?? 0, views: row?.views ?? 0 });
  }
  return points;
}

export function StatsDashboard({
  data,
  failed,
  days,
  periods,
  projects,
}: {
  data: StatsData | null;
  failed: boolean;
  days: number;
  periods: number[];
  projects: ProjectRef[];
}) {
  const titles = new Map(projects.map((project) => [project.slug, project.title]));
  const pageName = (path: string) => {
    if (path === "/") return "Accueil";
    if (path === "/method") return "Méthodologie";
    if (path === "/about") return "À propos";
    if (path === "/contact") return "Contact";
    const slug = path.split("/")[2];
    return titles.get(slug) ?? path;
  };
  const periodName = (value: number) => (value === 365 ? "1 an" : `${value} j`);

  return (
    <section className="min-h-screen [background:var(--reading-surface)_fixed] px-6 page-top pb-16 md:px-12 [--viz-1:#3987e5] [--viz-2:#d95926] [--viz-3:#199e70] light:[--viz-1:#2a78d6] light:[--viz-2:#eb6834] light:[--viz-3:#1baf7a]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 pt-12 md:flex-row md:items-end md:justify-between md:pt-2">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink/55">Mesure d&apos;audience anonyme</p>
            <h1 className="mt-2 text-3xl font-medium uppercase tracking-[0.06em] text-ink/75">Statistiques</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Période" className="flex rounded-full border border-ink/12 p-1">
              {periods.map((value) => (
                <Link
                  key={value}
                  href={`/stats?p=${value}`}
                  scroll={false}
                  aria-current={value === days ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition",
                    value === days ? "bg-ink font-bold text-page" : "text-ink/70 hover:bg-ink/[0.06] hover:text-ink",
                  )}
                >
                  {periodName(value)}
                </Link>
              ))}
            </nav>
            <form action={leaveStats}>
              <button type="submit" className="cursor-pointer rounded-full px-3 py-1.5 text-sm text-ink/60 transition hover:bg-ink/[0.06] hover:text-ink">
                Se déconnecter
              </button>
            </form>
          </div>
        </header>

        <DeviceNotice />

        {failed ? (
          <p className="mt-10 rounded-2xl border border-ink/10 bg-glass p-6 text-sm text-ink/75">
            La base de données ne répond pas. Réessaie dans un instant ; si ça dure, regarde les journaux du projet sur Vercel.
          </p>
        ) : data === null ? (
          <SetupSteps />
        ) : (
          <Dashboard data={data} days={days} pageName={pageName} titles={titles} />
        )}
      </div>
    </section>
  );
}

/** Les visites de Paul ne comptent pas : cet appareil est écarté dès sa première venue ici. */
function DeviceNotice() {
  const optedOut = useOptOut();
  useEffect(() => {
    if (!optOutChosen()) setOptOut(true);
  }, []);
  if (optedOut === null) return null;
  return (
    <p className="mt-6 text-xs text-ink/55">
      {optedOut ? "Tes visites sur cet appareil ne sont pas comptées." : "Tes visites sur cet appareil sont comptées."}{" "}
      <button type="button" onClick={() => setOptOut(!optedOut)} className="cursor-pointer underline underline-offset-2 hover:text-ink">
        {optedOut ? "Les compter quand même" : "Ne plus les compter"}
      </button>
    </p>
  );
}

function SetupSteps() {
  return (
    <div className="mt-10 rounded-2xl border border-ink/10 bg-glass p-6 md:p-8">
      <h2 className="text-base font-bold text-ink">Encore une étape : relier la base de données</h2>
      <ol className="copy mt-4 list-decimal space-y-2 pl-5">
        <li>Sur vercel.com, ouvre le projet du portfolio, onglet Storage.</li>
        <li>Create Database, puis Neon (Serverless Postgres), offre gratuite, région Europe (Francfort).</li>
        <li>Relie-la au projet pour les environnements Production et Preview : Vercel ajoute DATABASE_URL tout seul.</li>
        <li>Redéploie (onglet Deployments, Redeploy). La table se crée à la première visite.</li>
      </ol>
    </div>
  );
}

function Dashboard({
  data,
  days,
  pageName,
  titles,
}: {
  data: StatsData;
  days: number;
  pageName: (path: string) => string;
  titles: Map<string, string>;
}) {
  const points = fillDays(data.daily, days);
  const { kpis } = data;
  const delta = kpis.previousVisits > 0 ? (kpis.visits - kpis.previousVisits) / kpis.previousVisits : null;
  const projectPages = data.pages.filter((page) => page.path.startsWith("/projects/"));
  const otherPages = data.pages.filter((page) => !page.path.startsWith("/projects/"));
  const detailOf = (page: StatsData["pages"][number]) =>
    [page.avgSeconds !== null ? `${formatDuration(page.avgSeconds)} en moyenne` : null, page.avgDepth !== null ? `lue à ${Math.round(page.avgDepth)} %` : null]
      .filter(Boolean)
      .join(" · ") || undefined;
  const journeyNames: Record<string, string> = {
    visits: "Visites",
    home: "Voient l'accueil",
    project: "Ouvrent un projet",
    contactPage: "Vont sur Contact",
    contact: "Prennent contact",
  };
  const visits = Math.max(1, kpis.visits);

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="Visites" value={formatCount(kpis.visits)} wide>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-xs text-ink/55">
              {delta === null ? "Pas de période précédente" : `${delta >= 0 ? "▲" : "▼"} ${formatShare(Math.abs(delta))} vs ${days === 365 ? "l'année" : `les ${days} j`} d'avant`}
            </p>
            <Sparkline values={points.slice(-Math.min(points.length, 30)).map((point) => point.visits)} />
          </div>
        </Tile>
        <Tile label="Pages vues" value={formatCount(kpis.views)} hint={kpis.visits ? `${(kpis.views / kpis.visits).toFixed(1).replace(".", ",")} par visite` : undefined} />
        <Tile label="Durée médiane" value={formatDuration(kpis.medianSeconds)} hint="d'une visite" />
        <Tile label="Ouvrent un projet" value={kpis.projectRate === null ? "-" : formatShare(kpis.projectRate)} hint="des visites" />
        <Tile label="Prennent contact" value={kpis.contactRate === null ? "-" : formatShare(kpis.contactRate)} hint="e-mail, adresse copiée ou CV" />
      </div>

      <Card title="Visites par jour" note="Une visite = un onglet ouvert sur le site. Survole la courbe pour le détail d'un jour.">
        <TrendChart points={points} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Projets consultés" note="Pages vues ; dessous, temps moyen passé et part de la page lue.">
          <BarList
            rows={projectPages.map((page) => ({ key: page.path, label: pageName(page.path), value: page.views, detail: detailOf(page) }))}
            limit={11}
          />
        </Card>
        <div className="flex flex-col gap-5">
          <Card
            title="Jusqu'où on descend dans la galerie"
            note={`Part des ${formatCount(data.homeVisits)} visites de l'accueil arrivées jusqu'à chaque projet (%), dans l'ordre de la galerie.`}
          >
            <ReachColumns
              columns={data.reach.map((column) => ({
                key: String(column.index),
                label: String(column.index + 1).padStart(2, "0"),
                name: (column.slug && titles.get(column.slug)) ?? "",
                share: column.share,
              }))}
            />
          </Card>
          <Card title="Parcours" note="Part des visites qui passent par chaque étape.">
            <BarList
              rows={data.journey.map((step) => ({
                key: step.label,
                label: journeyNames[step.label] ?? step.label,
                value: step.count,
                display: `${formatShare(step.count / visits)} · ${formatCount(step.count)}`,
              }))}
            />
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Autres pages">
          <BarList rows={otherPages.map((page) => ({ key: page.path, label: pageName(page.path), value: page.views, detail: detailOf(page) }))} />
        </Card>
        <Card title="Contact" note="Actions sur l'e-mail et le CV, puis liens vers tes profils.">
          <BarList
            rows={[
              ...data.contacts.map((row) => ({
                key: `c-${row.label}`,
                label: CONTACTS[row.label] ?? (row.label.endsWith(".pdf") ? "CV téléchargé" : row.label),
                value: row.count,
              })),
              ...data.outbound.map((row) => ({ key: `o-${row.label}`, label: siteName(row.label), value: row.count })),
            ]}
          />
        </Card>
        <Card title="Provenance" note="Site d'où arrive la visite ; « direct » : lien tapé, favori ou appli.">
          <BarList rows={data.referrers.map((row) => ({ key: row.label, label: row.label === "(direct)" ? "Direct" : siteName(row.label), value: row.count }))} />
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card title="Appareils">
          <SplitBar parts={data.devices.map((row) => ({ key: row.label, label: DEVICES[row.label] ?? row.label, count: row.count }))} />
        </Card>
        <Card title="Thème">
          <SplitBar parts={data.themes.map((row) => ({ key: row.label, label: THEMES[row.label] ?? "Inconnu", count: row.count }))} />
        </Card>
        <Card title="Langue">
          <SplitBar parts={data.locales.map((row) => ({ key: row.label, label: LOCALES[row.label] ?? "Inconnue", count: row.count }))} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Objets 3D touchés" note="Touchés ou attrapés sur l'accueil.">
          <BarList rows={data.objects.map((row) => ({ key: row.label, label: OBJECTS[row.label] ?? row.label, value: row.count }))} limit={12} />
        </Card>
        <Card title="Trou noir et dimensions" note={`${formatCount(data.portals)} passage${data.portals > 1 ? "s" : ""} par le portail.`}>
          <BarList
            rows={[
              ...data.destroys.map((row) => ({ key: `d-${row.label}`, label: TRIGGERS[row.label] ?? row.label, value: row.count })),
              ...data.dimensions.map((row) => ({ key: `m-${row.label}`, label: `Arrivée : ${DIMENSIONS[row.label] ?? row.label}`, value: row.count })),
            ]}
            empty="Personne n'a encore ouvert le trou noir."
          />
        </Card>
        <Card title="Pays">
          <BarList rows={data.countries.map((row) => ({ key: row.label, label: countryName(row.label), value: row.count }))} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Images agrandies">
          <BarList rows={data.media.map((row) => ({ key: row.label, label: row.label, value: row.count }))} />
        </Card>
        <Card title="Réglages et navigation">
          <BarList rows={data.settings.map((row) => ({ key: row.label, label: SETTINGS[row.label] ?? row.label, value: row.count }))} />
        </Card>
      </div>

      <Card title="Dernières visites" note="Les 20 plus récentes, page par page.">
        {data.recent.length === 0 ? (
          <p className="text-sm text-ink/45">Rien sur la période.</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/45">
                  <th className="px-2 pb-2 font-normal">Arrivée</th>
                  <th className="px-2 pb-2 font-normal">Durée</th>
                  <th className="px-2 pb-2 font-normal">Appareil</th>
                  <th className="px-2 pb-2 font-normal">Pays</th>
                  <th className="px-2 pb-2 font-normal">Provenance</th>
                  <th className="px-2 pb-2 font-normal">Parcours</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((visit) => (
                  <tr key={visit.start + visit.pages.join()} className="border-t border-ink/10 align-top text-ink/80">
                    <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{stampFormat.format(new Date(visit.start))}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{formatDuration(visit.seconds)}</td>
                    <td className="px-2 py-2.5">{visit.device ? (DEVICES[visit.device] ?? visit.device) : "-"}</td>
                    <td className="px-2 py-2.5">{visit.country ? countryName(visit.country) : "-"}</td>
                    <td className="px-2 py-2.5">{visit.referrer ? siteName(visit.referrer) : "Direct"}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {steps(visit.pages).map((path, index) => (
                          <span key={`${path}-${index}`} className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs text-ink/75">
                            {pageName(path)}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Tile({ label, value, hint, wide, children }: { label: string; value: string; hint?: string; wide?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-ink/10 bg-glass p-4 shadow-[var(--glass-shadow)] md:p-5", wide && "col-span-2 md:col-span-1")}>
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-medium text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/55">{hint}</p> : null}
      {children}
    </div>
  );
}
