"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SoundEffect, SoundEngine } from "./soundEngine";

/**
 * Son du site : réglage du visiteur (mémorisé) et accès au moteur.
 *
 * Le son est coupé par défaut : le visiteur l'active avec le bouton du
 * haut-parleur, et ce choix est mémorisé. Les navigateurs n'autorisent aucun
 * son avant un premier geste (clic, toucher, touche) : le contexte audio est
 * préparé à ce moment-là, et le moteur n'est chargé que si le son est actif.
 */

const STORAGE_KEY = "portfolio-sound";
const listeners = new Set<() => void>();
let memory = false;

let context: AudioContext | null = null;
let engine: SoundEngine | null = null;
let loading: Promise<SoundEngine | null> | null = null;
let initialised = false;

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return memory;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Moteur prêt (chargé à la demande), ou `null` si le son est indisponible. */
function ensureEngine(): Promise<SoundEngine | null> {
  if (engine) return Promise.resolve(engine);
  if (!context) return Promise.resolve(null);
  const ctx = context;
  loading ??= import("./soundEngine")
    .then(({ createSoundEngine }) => {
      engine = createSoundEngine(ctx);
      return engine;
    })
    .catch(() => null);
  return loading;
}

function apply() {
  const on = getSnapshot() && !document.hidden;
  if (!context || (!on && !engine)) return;
  void ensureEngine().then((ready) => ready?.setOn(on));
}

/**
 * Prépare le son : au premier geste du visiteur, le contexte audio est créé
 * (dans le geste lui-même, comme l'exige Safari) ; il se tait quand l'onglet
 * est masqué.
 */
export function initSound() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const unlock = () => {
    for (const type of ["pointerup", "keydown", "touchend"] as const) window.removeEventListener(type, unlock, true);
    try {
      context = new AudioCtx({ latencyHint: "playback" });
      void context.resume();
    } catch {
      context = null;
      return;
    }
    apply();
  };
  for (const type of ["pointerup", "keydown", "touchend"] as const) window.addEventListener(type, unlock, true);
  document.addEventListener("visibilitychange", apply);
}

export function setSoundOn(on: boolean) {
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "on");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : le réglage vaut pour cette page seulement */
  }
  memory = on;
  for (const listener of listeners) listener();
  apply();
}

/** `[son actif, basculer]` — coupé au rendu serveur. */
export function useSoundOn(): [boolean, () => void] {
  const on = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => setSoundOn(!getSnapshot()), []);
  return [on, toggle];
}

/** Effet sonore, si le son est actif et débloqué. */
export function playSfx(name: SoundEffect, duration?: number) {
  if (!context || !getSnapshot()) return;
  void ensureEngine().then((ready) => ready?.sfx(name, duration));
}
