"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

/**
 * Déroulé en boucle d'un schéma de la page Méthodologie : une suite de temps,
 * chacun avec sa durée, que le schéma traduit en états (étiquette allumée,
 * trait rempli, jeton déplacé). Le mouvement lui-même est fait en CSS, par
 * transitions de couleur ou de position : le texte n'est jamais déplacé ni
 * fondu, il garde son lissage.
 *
 * - Ne tourne que tant que le schéma est à l'écran (et l'onglet visible).
 * - `paused` : arrêté le temps d'un survol ou d'un choix de la personne.
 * - Animations réduites : rien ne tourne, le schéma montre son état complet
 *   (`still`).
 *
 * `cycle` compte les tours (une version de plus à chaque boucle, etc.).
 * `restart` : le temps où reprend chaque nouveau tour (0, le premier, par
 * défaut ; la carte de la méthode ne repasse pas par son point de départ).
 */
export function useFigureLoop(ref: RefObject<HTMLElement | null>, durations: readonly number[], paused = false, restart = 0) {
  const reduceMotion = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  const [tabShown, setTabShown] = useState(true);
  useEffect(() => {
    const onVisibility = () => setTabShown(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (reduceMotion || !visible || !tabShown || paused) return;
    const timer = window.setTimeout(() => {
      const lap = phase + 1 >= durations.length;
      setPhase(lap ? restart : phase + 1);
      if (lap) setCycle((count) => count + 1);
    }, durations[phase]);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, visible, tabShown, paused, phase, durations, restart]);

  return { phase, setPhase, cycle, still: reduceMotion };
}
