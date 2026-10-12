"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Graphiques de la page des statistiques, dessinés à la main (SVG et HTML) :
 * une seule teinte d'accent pour les séries uniques, trois couleurs au plus
 * pour les répartitions (palette vérifiée contre les fonds clair et sombre du
 * site), traits fins, grille en filet, textes à l'encre du thème (jamais à la
 * couleur des données), valeurs écrites au bout des barres et détail au survol.
 */

export const SERIES = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"];

export const formatCount = (value: number) => new Intl.NumberFormat("fr-FR").format(Math.round(value));
export const formatShare = (value: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value < 0.1 && value > 0 ? 1 : 0 }).format(value * 100)} %`;
export function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "-";
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes < 60 ? `${minutes} min${rest ? ` ${String(rest).padStart(2, "0")}` : ""}` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Largeur réelle d'un élément, pour dessiner le SVG au pixel près. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Bornes rondes d'un axe (0, puis 1, 2, 5, 10… multipliés). */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= value / 1) ?? 10;
  return step * power;
}

export function Card({ title, note, children, className }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-ink/10 bg-glass p-5 shadow-[var(--glass-shadow)] md:p-6", className)}>
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {note ? <p className="mt-1 text-xs text-ink/55">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// --- Courbe des visites par jour -------------------------------------------------

export type DayPoint = { day: string; label: string; visits: number; views: number };

export function TrendChart({ points }: { points: DayPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 220;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const plotW = Math.max(0, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const top = niceMax(Math.max(1, ...points.map((point) => point.visits)));
  const x = (index: number) => pad.left + (points.length > 1 ? (index / (points.length - 1)) * plotW : plotW / 2);
  const y = (value: number) => pad.top + plotH - (value / top) * plotH;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.visits).toFixed(1)}`).join(" ");
  const area = points.length ? `${line} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const ticks = [0, top / 2, top];
  const labelled = points.length ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [];
  const active = hover === null ? null : points[hover];

  const onMove = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    const ratio = (clientX - box.left - pad.left) / Math.max(1, plotW);
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  return (
    <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Visites par jour"
          className="block touch-pan-y"
          onPointerMove={(event) => onMove(event.clientX)}
          onPointerDown={(event) => onMove(event.clientX)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="stroke-ink/10" strokeWidth={1} />
              <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-ink/45 text-[10px] tabular-nums">
                {formatCount(tick)}
              </text>
            </g>
          ))}
          {labelled.map((index) => (
            <text
              key={index}
              x={x(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              className="fill-ink/45 text-[10px]"
            >
              {points[index].label}
            </text>
          ))}
          <path d={area} fill="var(--viz-1)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {active && hover !== null ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} className="stroke-ink/25" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(active.visits)} r={5} fill="var(--viz-1)" className="stroke-[var(--glass)]" strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {active && hover !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-ink/10 bg-glass px-3 py-2 text-xs shadow-[var(--glass-shadow)]"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), Math.max(0, width - 140)), width: 140 }}
        >
          <p className="text-ink/55">{active.label}</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-[var(--viz-1)]" />
            <strong className="text-sm text-ink">{formatCount(active.visits)}</strong>
            <span className="text-ink/55">visites</span>
          </p>
          <p className="mt-0.5 pl-5 text-ink/55">{formatCount(active.views)} pages vues</p>
        </div>
      ) : null}
      <details className="mt-3 text-xs text-ink/55">
        <summary className="cursor-pointer select-none hover:text-ink">Voir les chiffres</summary>
        <table className="mt-2 w-full max-w-sm tabular-nums">
          <thead>
            <tr className="text-left text-ink/45">
              <th className="py-1 font-normal">Jour</th>
              <th className="py-1 text-right font-normal">Visites</th>
              <th className="py-1 text-right font-normal">Pages vues</th>
            </tr>
          </thead>
          <tbody>
            {points
              .filter((point) => point.views > 0)
              .reverse()
              .map((point) => (
                <tr key={point.day} className="border-t border-ink/10 text-ink/75">
                  <td className="py-1">{point.label}</td>
                  <td className="py-1 text-right">{formatCount(point.visits)}</td>
                  <td className="py-1 text-right">{formatCount(point.views)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Petite courbe d'une tuile (les derniers jours), sans axe. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const width = 96;
  const height = 28;
  const top = Math.max(1, ...values);
  const points = values.map((value, index) => `${((index / (values.length - 1)) * width).toFixed(1)},${(height - 2 - (value / top) * (height - 4)).toFixed(1)}`);
  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      <polyline points={points.join(" ")} fill="none" stroke="var(--viz-1)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// --- Barres horizontales -----------------------------------------------------------

export type BarRow = { key: string; label: string; value: number; detail?: string; display?: string };

export function BarList({ rows, empty = "Rien sur la période.", limit = 10 }: { rows: BarRow[]; empty?: string; limit?: number }) {
  const shown = rows.slice(0, limit);
  const top = Math.max(1, ...shown.map((row) => row.value));
  if (shown.length === 0) return <p className="text-sm text-ink/45">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {shown.map((row) => (
        <li key={row.key} title={row.detail ? `${row.label} : ${row.detail}` : undefined} className="group rounded-md">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink/85 group-hover:text-ink">{row.label}</span>
            <span className="shrink-0 tabular-nums text-ink">{row.display ?? formatCount(row.value)}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-r-[4px] bg-ink/[0.06]">
            <div
              className="h-full rounded-r-[4px] bg-[var(--viz-1)] transition-[filter] group-hover:brightness-110"
              style={{ width: `${Math.max(1.5, (row.value / top) * 100)}%` }}
            />
          </div>
          {row.detail ? <p className="mt-1 text-xs text-ink/50">{row.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}

// --- Colonnes : jusqu'où on descend dans la galerie --------------------------------

export function ReachColumns({ columns }: { columns: { key: string; label: string; name: string; share: number }[] }) {
  const height = 150;
  return (
    <div>
      <div className="flex items-end justify-between gap-1" style={{ height: height + 18 }}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="group flex flex-1 flex-col items-center justify-end"
            title={`${column.label} · ${column.name} : ${formatShare(column.share)} des visites de l'accueil`}
          >
            <span className="mb-1 text-[10px] tabular-nums text-ink/55 group-hover:text-ink">{Math.round(column.share * 100)}</span>
            <div
              className="w-full max-w-6 rounded-t-[4px] bg-[var(--viz-1)] transition-[filter] group-hover:brightness-110"
              style={{ height: Math.max(2, column.share * height) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-1 border-t border-ink/15 pt-1.5">
        {columns.map((column) => (
          <span key={column.key} className="flex-1 text-center text-[10px] tabular-nums text-ink/45">
            {column.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Répartition (100 %) ---------------------------------------------------------------

export function SplitBar({ parts }: { parts: { key: string; label: string; count: number }[] }) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  if (total === 0) return <p className="text-sm text-ink/45">Rien sur la période.</p>;
  const shown = parts.slice(0, 3);
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]">
        {shown.map((part, index) => (
          <div
            key={part.key}
            title={`${part.label} : ${formatShare(part.count / total)}`}
            style={{ width: `${(part.count / total) * 100}%`, background: SERIES[index] }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {shown.map((part, index) => (
          <li key={part.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: SERIES[index] }} />
            <span className="text-ink/85">{part.label}</span>
            <span className="ml-auto tabular-nums text-ink">{formatShare(part.count / total)}</span>
            <span className="w-10 text-right tabular-nums text-xs text-ink/45">{formatCount(part.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
