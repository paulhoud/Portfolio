"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { PassiveScheduler } from "./passiveScheduler";

/**
 * Poignée exposée par chaque carte au contrôleur passif. Le contrôleur ne
 * connaît des cartes que leur élément (pour la visibilité) et deux commandes.
 */
export type TileHandle = {
  /** Élément racine de la carte, observé pour déterminer la visibilité. */
  element: HTMLElement;
  /** Joue l'animation en mode passif ; `onEnded` est appelé à la fin naturelle. */
  playPassive: (onEnded: () => void) => void;
  /** Interrompt une animation passive en cours et revient au placeholder. */
  stopPassive: () => void;
};

type PassiveContextValue = {
  registerTile: (id: string, handle: TileHandle) => () => void;
  setVisible: (id: string, visible: boolean) => void;
  setHovered: (id: string, hovered: boolean) => void;
};

const PassiveContext = createContext<PassiveContextValue | null>(null);

/** Accès au contrôleur passif ; `null` hors provider (le survol reste actif). */
export function usePassiveAnimation() {
  return useContext(PassiveContext);
}

/** Événements considérés comme une activité utilisateur. */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
  "touchmove",
  "scroll",
] as const;

/**
 * Orchestre l'animation passive du damier : après une période d'inactivité,
 * une carte visible tirée au hasard joue son animation (une seule à la fois),
 * puis revient au placeholder. Toute interaction interrompt et réarme le cycle.
 * Désactivé si l'utilisateur préfère les mouvements réduits ou si l'onglet est
 * masqué. La logique de planification vit dans {@link PassiveScheduler} ; ce
 * composant n'en est que l'adaptateur DOM.
 */
export function PassiveAnimationProvider({ children }: { children: ReactNode }) {
  const tilesRef = useRef(new Map<string, TileHandle>());
  const visibleRef = useRef(new Set<string>());
  const hoveredRef = useRef<string | null>(null);
  const schedulerRef = useRef<PassiveScheduler | null>(null);
  // Exposé aux callbacks du contexte pour signaler une activité (survol).
  const activityRef = useRef<(() => void) | null>(null);

  const registerTile = useCallback((id: string, handle: TileHandle) => {
    tilesRef.current.set(id, handle);
    return () => {
      tilesRef.current.delete(id);
      visibleRef.current.delete(id);
      if (hoveredRef.current === id) hoveredRef.current = null;
      schedulerRef.current?.handleTileGone(id);
    };
  }, []);

  const setVisible = useCallback((id: string, visible: boolean) => {
    if (visible) visibleRef.current.add(id);
    else visibleRef.current.delete(id);
  }, []);

  const setHovered = useCallback((id: string, hovered: boolean) => {
    if (hovered) hoveredRef.current = id;
    else if (hoveredRef.current === id) hoveredRef.current = null;
    // Survol = présence de l'utilisateur : traité comme une activité.
    activityRef.current?.();
  }, []);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const scheduler = new PassiveScheduler({
      getCandidates: () => {
        const hovered = hoveredRef.current;
        const candidates: string[] = [];
        for (const id of visibleRef.current) {
          if (id !== hovered && tilesRef.current.has(id)) candidates.push(id);
        }
        return candidates;
      },
      play: (id, onEnded) => {
        const handle = tilesRef.current.get(id);
        if (handle) handle.playPassive(onEnded);
        else onEnded();
      },
      stop: (id) => tilesRef.current.get(id)?.stopPassive(),
      setTimer: (callback, delay) => window.setTimeout(callback, delay),
      clearTimer: (handle) => window.clearTimeout(handle),
    });
    schedulerRef.current = scheduler;

    const recomputeEnabled = () => {
      scheduler.setEnabled(!reduceMotionQuery.matches && !document.hidden);
    };
    const onActivity = () => scheduler.notifyActivity();
    activityRef.current = onActivity;

    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", recomputeEnabled);
    reduceMotionQuery.addEventListener("change", recomputeEnabled);

    recomputeEnabled();

    return () => {
      activityRef.current = null;
      schedulerRef.current = null;
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity);
      }
      document.removeEventListener("visibilitychange", recomputeEnabled);
      reduceMotionQuery.removeEventListener("change", recomputeEnabled);
      scheduler.dispose();
    };
  }, []);

  const value = useMemo<PassiveContextValue>(
    () => ({ registerTile, setVisible, setHovered }),
    [registerTile, setVisible, setHovered],
  );

  return <PassiveContext.Provider value={value}>{children}</PassiveContext.Provider>;
}
