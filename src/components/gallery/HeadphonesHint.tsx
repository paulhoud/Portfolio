"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/context";
import { isSoundOn, useSoundOn } from "@/lib/sound/sound";
import { cn } from "@/lib/utils";

const SHOWN_KEY = "portfolio-headphones";
/** Temps d'affichage (ms) : un peu plus long quand il propose d'activer le son. */
const STAY_MS = 3400;
const STAY_WITH_BUTTON_MS = 6000;

/**
 * Message bref juste après le rideau d'ouverture : l'expérience se vit
 * mieux au casque. Une fois par session, sans rien bloquer (seule la pastille
 * capte les clics). Le son étant coupé par défaut, il propose alors de
 * l'activer ; survolé ou atteint au clavier, il reste le temps qu'on le lise.
 */
export function HeadphonesHint({ ready, calm, onDone }: { ready: boolean; calm: boolean; onDone?: () => void }) {
  const { t } = useTranslation();
  const [soundOn, toggleSound] = useSoundOn();
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  // Le bouton reste proposé jusqu'à la fin, même une fois le son activé.
  const [offered, setOffered] = useState(false);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    try {
      if (window.sessionStorage.getItem(SHOWN_KEY)) return;
      window.sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* stockage indisponible : on l'affiche quand même, une fois par page */
    }
    window.setTimeout(() => {
      setOffered(!isSoundOn());
      setVisible(true);
    }, 450);
  }, [ready]);

  // Il s'efface de lui-même, sauf tant qu'on le survole ou qu'il a le focus.
  useEffect(() => {
    if (!visible || held) return;
    const timer = window.setTimeout(() => setVisible(false), offered ? STAY_WITH_BUTTON_MS : STAY_MS);
    return () => window.clearTimeout(timer);
  }, [visible, held, offered]);

  const ease = [0.22, 1, 0.36, 1] as const;
  return (
    <AnimatePresence onExitComplete={() => done.current?.()}>
      {visible ? (
        <motion.div
          role="status"
          initial={calm ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: calm ? 0.2 : 0.7, ease } }}
          exit={{ opacity: 0, y: calm ? 0 : -6, filter: calm ? "blur(0px)" : "blur(4px)", transition: { duration: 0.35, ease: "easeIn" } }}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          className={cn(
            "pointer-events-auto fixed left-1/2 top-[calc(var(--header-height)+0.75rem)] z-40 flex min-h-10 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full border py-1 pl-3.5 text-[0.7rem] text-ink/85 sm:gap-2.5 sm:text-xs",
            offered ? "pr-1" : "pr-4",
            "bg-glass/60 backdrop-blur-xl backdrop-saturate-150",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_14px_40px_-18px_rgba(0,0,0,0.8)]",
            "[border-color:color-mix(in_srgb,var(--accent-glow,#ffffff)_16%,rgba(255,255,255,0.08))]",
          )}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 [color:var(--accent-glow,#ffffff)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
            <rect x="3" y="13.5" width="4.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
            <rect x="16.5" y="13.5" width="4.5" height="6.5" rx="1.6" fill="currentColor" stroke="none" />
          </svg>
          <span className="min-w-0 leading-tight tracking-[0.04em]">{t.site.gallery.headphones}</span>
          {offered ? (
            <button
              type="button"
              onClick={soundOn ? undefined : toggleSound}
              disabled={soundOn}
              className={cn(
                "ml-0.5 flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.7rem] font-medium transition-colors duration-300 sm:text-xs",
                "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-ink/60",
                soundOn ? "bg-ink/10 text-ink/70" : "cursor-pointer bg-ink text-page hover:bg-ink/85",
              )}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z" fill="currentColor" stroke="none" />
                <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
                {soundOn ? <path d="M18 6.8a7.4 7.4 0 0 1 0 10.4" /> : null}
              </svg>
              {soundOn ? (
                t.site.sound.on
              ) : (
                <>
                  <span className="sm:hidden">{t.site.sound.unmuteShort}</span>
                  <span className="hidden sm:inline">{t.site.sound.unmute}</span>
                </>
              )}
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
