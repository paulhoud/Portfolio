import type { Metadata } from "next";
import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { StatsLogin } from "@/components/stats/StatsLogin";
import { projects } from "@/content/projects";
import { isStatsReader, statsPasswordSet } from "@/lib/stats/auth";
import { readStats } from "@/lib/stats/queries";

/**
 * Statistiques du portfolio, pour Paul seul : fermée par un mot de passe
 * (cf. lib/stats/auth), jamais indexée, absente du plan du site.
 */

export const metadata: Metadata = {
  title: "Statistiques",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90, 365];

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  if (!(await isStatsReader())) return <StatsLogin ready={statsPasswordSet()} />;
  const { p } = await searchParams;
  const days = PERIODS.includes(Number(p)) ? Number(p) : 30;
  let data = null;
  let failed = false;
  try {
    data = await readStats(
      days,
      projects.map((project) => project.slug),
    );
  } catch (error) {
    console.error("[stats] lecture impossible", error);
    failed = true;
  }
  return (
    <StatsDashboard
      data={data}
      failed={failed}
      days={days}
      periods={PERIODS}
      projects={projects.map((project) => ({ slug: project.slug, title: project.title, mediaKey: project.mediaKey ?? null }))}
    />
  );
}
