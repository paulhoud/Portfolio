"use client";

import { useActionState } from "react";
import { enterStats } from "@/app/(fr)/stats/actions";

/** Entrée de la page des statistiques (page privée de Paul, en français seulement). */
export function StatsLogin({ ready }: { ready: boolean }) {
  const [state, action, pending] = useActionState(enterStats, { failed: false });

  return (
    <section className="flex min-h-screen items-center justify-center [background:var(--reading-surface)_fixed] px-6 page-top pb-24">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-medium uppercase tracking-[0.06em] text-ink/75">Statistiques</h1>
        {ready ? (
          <form action={action} className="mt-10 flex flex-col gap-3">
            <label htmlFor="stats-password" className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink/55">
              Mot de passe
            </label>
            <input
              id="stats-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={state.failed || undefined}
              aria-describedby={state.failed ? "stats-error" : undefined}
              className="h-12 rounded-xl border border-ink/15 bg-glass px-4 text-ink outline-none transition focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/20"
            />
            {state.failed ? (
              <p id="stats-error" role="alert" className="text-sm text-ink/70">
                Ce n&apos;est pas le bon mot de passe.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 h-12 cursor-pointer rounded-full bg-ink text-sm font-bold text-page transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60"
            >
              {pending ? "Vérification…" : "Entrer"}
            </button>
          </form>
        ) : (
          <p className="copy mt-8 text-center">
            Page fermée : aucun mot de passe n&apos;est défini. Ajoute la variable STATS_PASSWORD (8 caractères au moins) dans
            les réglages du projet sur Vercel, puis redéploie.
          </p>
        )}
      </div>
    </section>
  );
}
