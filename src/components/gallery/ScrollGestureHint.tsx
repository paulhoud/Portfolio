"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

/** Déjà montrée dans cette session : on ne la remontre plus (retours sur l'accueil compris). */
const SHOWN_KEY = "portfolio-swipe-hint";
/** Après la fin de l'arrivée (rideau, message du casque), avant de se montrer. */
const DELAY_MS = 1000;
/** Un geste dure 2,2 s (cf. `swipe-hand` dans globals.css) : trois à la première apparition… */
const FIRST_MS = 3 * 2200;
/** …puis, si rien ne bouge pendant ce temps, un rappel plus discret de deux gestes. */
const IDLE_MS = 12000;
const AGAIN_MS = 2 * 2200;

type Phase = "waiting" | "first" | "resting" | "again" | "done";

/**
 * Indication du geste à faire sur l'accueil, au toucher (demande de Paul,
 * 28 oct. 2026 : une personne de son entourage ne faisait pas défiler la
 * page). Une main glisse vers le haut sur une petite pastille de verre, avec
 * « Glissez vers le haut ».
 *
 * - Elle attend la fin de l'arrivée (`armed`), puis une seconde, et joue trois
 *   gestes.
 * - Le moindre toucher la retire aussitôt (sans rien intercepter : elle ne
 *   capte aucun geste), et le premier défilement la retire pour de bon
 *   (`armed` repasse à faux).
 * - Sans défilement ni toucher pendant 12 s, un seul rappel, plus discret
 *   (sans texte). Toucher la page repousse ce rappel.
 * - Une fois par session : l'absence de défilement ne veut pas dire qu'on est
 *   perdu, inutile d'insister.
 * - Animations réduites : la main reste immobile, la flèche dit le sens.
 *
 * Avec une souris, l'invitation d'origine (« Faire défiler ») reste seule.
 */
export function ScrollGestureHint({ armed }: { armed: boolean }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("waiting");

  // Une fois par session, et seulement au toucher.
  useEffect(() => {
    if (!armed || phase !== "waiting") return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SHOWN_KEY) === "1";
    } catch {
      /* stockage indisponible : on la montre, une fois par page */
    }
    if (seen || !window.matchMedia("(pointer: coarse)").matches) return;
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        /* idem */
      }
      // Menu ouvert à ce moment-là : seulement le rappel, plus tard.
      setPhase(document.getElementById("mobile-menu") ? "resting" : "first");
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [armed, phase]);

  // Durée de chaque apparition, attente du rappel ; tout toucher retire
  // l'indication (ou repousse le rappel). Menu ouvert, pas de rappel.
  useEffect(() => {
    if (!armed || (phase !== "first" && phase !== "resting" && phase !== "again")) return;
    const next: Phase = phase === "first" ? "resting" : phase === "resting" ? "again" : "done";
    const wait = phase === "first" ? FIRST_MS : phase === "resting" ? IDLE_MS : AGAIN_MS;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setPhase(next === "again" && document.getElementById("mobile-menu") ? "done" : next);
      }, wait);
    };
    arm();
    const onTouch = () => {
      if (phase === "resting") arm();
      else setPhase(phase === "first" ? "resting" : "done");
    };
    window.addEventListener("pointerdown", onTouch, { capture: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onTouch, { capture: true });
    };
  }, [armed, phase]);

  // Défilement (ou départ dans une autre dimension) une fois lancée : c'est
  // fini pour cette session, même si l'accueil repart du début.
  if (!armed && (phase === "first" || phase === "resting" || phase === "again")) setPhase("done");

  const visible = armed && (phase === "first" || phase === "again");
  const discreet = phase === "again";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={phase}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5 } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center"
        >
          <div
            className={cn(
              "flex flex-col items-center rounded-[1.75rem] border px-4 pt-2",
              "bg-glass/60 shadow-[var(--glass-shadow)] backdrop-blur-xl backdrop-saturate-150 [border-color:var(--glass-border)]",
              discreet ? "pb-2" : "pb-3",
            )}
          >
            {/* Dessinée sur 40 × 64, affichée un quart plus grande. */}
            <svg viewBox="0 0 40 64" width="50" height="80" className="overflow-visible text-ink">
              {/* Le sens du geste : un rail et sa flèche. */}
              <path d="M20 10v30M16 14l4-4 4 4" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <g transform="translate(6.5 26)">
                <g className="swipe-hand">
                  {/* Le point touché, qui s'élargit quand le doigt se pose. */}
                  <circle className="swipe-tap" cx="13.5" cy="6.5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  {/* La main, index tendu : remplie à l'encre, cernée du verre pour se détacher du rail. */}
                  <path
                    d="M11 25.5V6.5a2.5 2.5 0 0 1 5 0V16a2.25 2.25 0 0 1 4.5 0V17a2.25 2.25 0 0 1 4.5 0v1.5a2 2 0 0 1 4 0V27c0 5.5-3.5 9-8.5 9h-3c-3 0-5-1.3-6.6-3.6L4.6 26.8a2.2 2.2 0 0 1 3.3-2.9Z"
                    fill="currentColor"
                    stroke="var(--glass)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M16 16v5M20.5 17v4.5M25 18.5v4" stroke="var(--glass)" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </g>
            </svg>
            {discreet ? null : (
              <span className="mt-1.5 whitespace-nowrap text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink">
                {t.site.gallery.swipeHint}
              </span>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
