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
  // Son coupé ou onglet masqué : le son d'objet en cours s'arrête aussi.
  if (context && !on) stopClip(context);
  // Thème d'une dimension : arrêté si l'on coupe le son, en pause si l'onglet
  // est masqué ; la nappe d'ambiance se tait tant qu'il joue.
  if (theme) {
    if (!getSnapshot()) haltTheme();
    else if (document.hidden) theme.pause();
    else void theme.play().catch(() => {});
  }
  const ambient = on && !theme;
  if (!context || (!ambient && !engine)) return;
  void ensureEngine().then((ready) => ready?.setOn(ambient));
}

/*
 * Musiques des dimensions (public/sounds/dimensions) : jouées l'une après
 * l'autre à l'arrivée, une seule fois, puis le silence (la nappe reprend).
 * Lues en flux (élément audio) : les décoder en entier pèserait lourd.
 */
const THEME_VOLUME = 0.4;
let theme: HTMLAudioElement | null = null;
let themeQueue: string[] = [];

function nextTheme() {
  const url = themeQueue.shift();
  if (!url) {
    theme = null;
    apply();
    return;
  }
  const audio = new Audio(url);
  audio.volume = THEME_VOLUME;
  audio.addEventListener("ended", () => {
    if (theme === audio) nextTheme();
  });
  theme = audio;
  apply();
  void audio.play().catch(() => {
    if (theme !== audio) return;
    theme = null;
    themeQueue = [];
    apply();
  });
}

/** Coupe le thème en cours en un court fondu, sans relancer la nappe. */
function haltTheme() {
  themeQueue = [];
  const audio = theme;
  theme = null;
  if (!audio) return;
  const start = audio.volume;
  let step = 0;
  const fade = window.setInterval(() => {
    step += 1;
    audio.volume = Math.max(0, start * (1 - step / 12));
    if (step >= 12) {
      window.clearInterval(fade);
      audio.pause();
    }
  }, 50);
}

/** Joue les musiques d'une dimension à la suite, si le son du site est actif. */
export function playThemes(urls: string[]) {
  haltTheme();
  if (!getSnapshot()) return;
  themeQueue = [...urls];
  nextTheme();
}

/** Arrête la musique d'une dimension (retour, départ de la page). */
export function stopThemes() {
  if (!theme && themeQueue.length === 0) return;
  haltTheme();
  apply();
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

/*
 * Sons des objets de la galerie (fichiers de public/sounds/objects) : chargés
 * au premier toucher, gardés en mémoire. Ils viennent de sources variées, très
 * inégales en volume : chacun est ramené au même niveau moyen, modéré. Un seul
 * joue à la fois — le précédent s'efface vite — et les plus longs (générique,
 * chanson) s'estompent au bout de quelques secondes.
 */

type Clip = { buffer: AudioBuffer; gain: number };

/** Niveau moyen visé (valeur efficace) : audible sans couvrir la musique. */
const CLIP_LEVEL = 0.06;
const CLIP_MAX_GAIN = 0.7;
/** Durée au-delà de laquelle un son s'estompe (secondes). */
const CLIP_LONGEST = 8;

const clips = new Map<string, Promise<Clip | null>>();
let clipPlaying: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

function loadClip(ctx: AudioContext, url: string): Promise<Clip | null> {
  let clip = clips.get(url);
  if (!clip) {
    clip = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        const samples = buffer.getChannelData(0);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < samples.length; i += 4) {
          sum += samples[i] * samples[i];
          count += 1;
        }
        const rms = Math.sqrt(sum / Math.max(1, count)) || 1;
        return { buffer, gain: Math.min(CLIP_MAX_GAIN, CLIP_LEVEL / rms) };
      })
      .catch(() => null);
    clips.set(url, clip);
  }
  return clip;
}

function stopClip(ctx: AudioContext) {
  if (!clipPlaying) return;
  const { source, gain } = clipPlaying;
  clipPlaying = null;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.08);
  source.stop(now + 0.1);
}

/** Joue le son d'un objet, si le son du site est actif et débloqué. */
export function playClip(url: string) {
  if (!context || !getSnapshot() || document.hidden) return;
  const ctx = context;
  if (ctx.state === "suspended") void ctx.resume();
  void loadClip(ctx, url).then((clip) => {
    if (!clip || !getSnapshot()) return;
    stopClip(ctx);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = clip.gain;
    const source = ctx.createBufferSource();
    source.buffer = clip.buffer;
    source.connect(gain).connect(ctx.destination);
    if (clip.buffer.duration > CLIP_LONGEST) {
      gain.gain.setValueAtTime(clip.gain, now + CLIP_LONGEST - 1.5);
      gain.gain.linearRampToValueAtTime(0, now + CLIP_LONGEST);
      source.stop(now + CLIP_LONGEST + 0.05);
    }
    source.start(now);
    const playing = { source, gain };
    clipPlaying = playing;
    source.onended = () => {
      if (clipPlaying === playing) clipPlaying = null;
    };
  });
}
