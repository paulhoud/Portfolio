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
/** Sortie commune de tous les sons : son gain est le volume choisi par le visiteur. */
let output: GainNode | null = null;

/* Volume du visiteur (0 à 1), mémorisé comme le son lui-même. */
const VOLUME_KEY = "portfolio-volume";
const volumeListeners = new Set<() => void>();
let volumeMemory = 0.8;

function readVolume(): number {
  try {
    const stored = window.localStorage.getItem(VOLUME_KEY);
    const value = stored === null ? NaN : Number(stored);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : volumeMemory;
  } catch {
    return volumeMemory;
  }
}

/** Gain d'un réglage : la courbe suit l'oreille (la moitié du curseur sonne à moitié, pas au quart). */
const gainFor = (volume: number) => volume * volume;

/** Change le volume (0 à 1) ; un volume au-dessus de zéro active le son s'il était coupé. */
export function setSoundVolume(volume: number) {
  const value = Math.min(1, Math.max(0, volume));
  volumeMemory = value;
  try {
    window.localStorage.setItem(VOLUME_KEY, String(Math.round(value * 100) / 100));
  } catch {
    /* stockage indisponible : le réglage vaut pour cette page seulement */
  }
  if (context && output) {
    const now = context.currentTime;
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(gainFor(value), now, 0.03);
  }
  for (const listener of volumeListeners) listener();
  if (value > 0 && !getSnapshot()) setSoundOn(true);
}

/** Volume choisi (0 à 1) ; 0,8 au rendu serveur. */
export function useSoundVolume(): number {
  return useSyncExternalStore(
    (listener) => {
      volumeListeners.add(listener);
      return () => {
        volumeListeners.delete(listener);
      };
    },
    readVolume,
    () => 0.8,
  );
}

/*
 * En développement, le rechargement à chaud réévalue ce module : l'ancien
 * contexte audio (sa nappe) et l'ancien thème continueraient de jouer, hors
 * de portée du bouton. On les retrouve sur la fenêtre et on les coupe.
 */
type LiveSound = { context: AudioContext | null; theme: HTMLAudioElement | null };
const live: LiveSound = { context: null, theme: null };
if (typeof window !== "undefined") {
  const host = window as unknown as { __portfolioSound?: LiveSound };
  const previous = host.__portfolioSound;
  if (previous) {
    void previous.context?.close().catch(() => {});
    previous.theme?.pause();
  }
  host.__portfolioSound = live;
}
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
      engine = createSoundEngine(ctx, output ?? ctx.destination);
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
  // est masqué.
  if (theme) {
    if (!getSnapshot()) haltTheme();
    else if (document.hidden) theme.audio.pause();
    else void theme.audio.play().catch(() => {});
  }
  // Dans une dimension, la nappe d'ambiance se tait jusqu'au retour, même
  // une fois ses musiques terminées : elles ont la place pour elles seules.
  // De même le temps d'un morceau (le CD).
  const ambient = on && !inDimension && !clipPlaying?.music;
  if (!context || (!ambient && !engine)) return;
  // Pendant un morceau ou la musique d'une dimension, la nappe se tait sans
  // mettre le son en veille : la veille les couperait aussi.
  const keepAwake = Boolean(clipPlaying?.music) || theme !== null;
  void ensureEngine().then((ready) => ready?.setOn(ambient, { keepAwake }));
}

/*
 * Musiques des dimensions (public/sounds/dimensions) : jouées l'une après
 * l'autre à l'arrivée, une seule fois, avec un fondu enchaîné entre deux
 * pistes. Lues en flux (élément audio) : les décoder en entier pèserait lourd.
 */
/**
 * Une musique de dimension et son volume (0 à 1) : chacune est réglée pour
 * sonner au niveau de la nappe d'ambiance du site, ou un peu en dessous.
 */
export type Theme = { src: string; volume: number };
/** Durée du fondu enchaîné entre deux musiques qui se suivent (secondes). */
const THEME_CROSSFADE = 1.5;

/**
 * Lecteurs des musiques : deux, pour le fondu enchaîné, créés et débloqués au
 * premier geste. Safari (iPhone surtout) refuse de lancer un son hors d'un
 * geste, sauf sur un lecteur qu'un geste a déjà lancé une fois : la musique
 * d'une dimension démarre plusieurs secondes après le geste qui y mène. Leur
 * volume passe par le contexte audio : sur iPhone, celui d'un lecteur est
 * figé au maximum.
 */
type Player = { audio: HTMLAudioElement; gain: GainNode | null; busy: boolean };
const players: Player[] = [];
/** Un dixième de seconde de silence, joué pour débloquer les lecteurs. */
const SILENCE = "/sounds/silence.wav";

function preparePlayers(ctx: AudioContext, out: AudioNode) {
  if (players.length > 0) return;
  for (let i = 0; i < 2; i += 1) {
    const audio = new Audio();
    audio.preload = "auto";
    let gain: GainNode | null = null;
    try {
      gain = ctx.createGain();
      ctx.createMediaElementSource(audio).connect(gain).connect(out);
    } catch {
      gain = null;
    }
    players.push({ audio, gain, busy: false });
  }
}

/** Dans un geste : chaque lecteur libre joue un silence, ce qui le débloque. */
function unlockPlayers() {
  for (const player of players) {
    if (player.busy || player.audio.dataset.unlocked) continue;
    player.audio.src = SILENCE;
    void player.audio
      .play()
      .then(() => {
        player.audio.dataset.unlocked = "1";
        if (!player.busy) player.audio.pause();
      })
      .catch(() => {});
  }
}

function setPlayerVolume(player: Player, volume: number) {
  if (player.gain) {
    player.gain.gain.value = volume;
    player.audio.volume = 1;
  } else {
    player.audio.volume = volume;
  }
}

const playerVolume = (player: Player) => (player.gain ? player.gain.gain.value : player.audio.volume);

let theme: Player | null = null;
let themeQueue: Theme[] = [];
/** Le visiteur est dans une dimension (de l'arrivée au retour). */
let inDimension = false;

/** Amène le volume d'une piste à `to` en `seconds`, puis appelle `done`. */
function fadePlayer(player: Player, to: number, seconds: number, done?: () => void) {
  const from = playerVolume(player);
  const steps = Math.max(1, Math.round((seconds * 1000) / 50));
  let step = 0;
  const timer = window.setInterval(() => {
    step += 1;
    setPlayerVolume(player, Math.min(1, Math.max(0, from + ((to - from) * step) / steps)));
    if (step >= steps) {
      window.clearInterval(timer);
      done?.();
    }
  }, 50);
}

/** Un lecteur libre ; à défaut (aucun geste encore), un lecteur ordinaire. */
function takePlayer(): Player {
  const free = players.find((player) => !player.busy);
  if (free) {
    free.busy = true;
    return free;
  }
  return { audio: new Audio(), gain: null, busy: true };
}

function releasePlayer(player: Player) {
  player.audio.pause();
  player.busy = false;
}

function nextTheme(crossfade = false) {
  const next = themeQueue.shift();
  if (!next) {
    theme = null;
    return;
  }
  const player = takePlayer();
  const audio = player.audio;
  audio.src = next.src;
  setPlayerVolume(player, crossfade ? 0 : next.volume);
  // Juste avant la fin, la piste suivante entre pendant que celle-ci s'efface.
  let handedOver = false;
  const handOver = () => {
    if (handedOver || theme !== player) return;
    handedOver = true;
    fadePlayer(player, 0, THEME_CROSSFADE, () => releasePlayer(player));
    nextTheme(true);
  };
  audio.ontimeupdate = () => {
    if (themeQueue.length > 0 && audio.duration - audio.currentTime <= THEME_CROSSFADE) handOver();
  };
  audio.onended = () => {
    if (theme !== player || handedOver) return;
    releasePlayer(player);
    if (themeQueue.length > 0) nextTheme();
    else {
      theme = null;
      apply();
    }
  };
  theme = player;
  live.theme = audio;
  // Le contexte audio (par où passe le son) doit tourner pendant la musique.
  if (context && context.state !== "running") void context.resume().catch(() => {});
  void audio
    .play()
    .then(() => {
      if (crossfade) fadePlayer(player, next.volume, THEME_CROSSFADE);
    })
    .catch(() => {
      releasePlayer(player);
      if (theme !== player) return;
      theme = null;
      themeQueue = [];
    });
}

/** Coupe le thème en cours en un court fondu. */
function haltTheme() {
  themeQueue = [];
  const player = theme;
  theme = null;
  if (player) fadePlayer(player, 0, 0.6, () => releasePlayer(player));
}

/**
 * Arrivée dans une dimension : la nappe se tait et ses musiques se jouent à
 * la suite, si le son du site est actif.
 */
export function playThemes(themes: Theme[]) {
  haltTheme();
  if (context) stopClip(context);
  inDimension = true;
  if (getSnapshot()) {
    themeQueue = [...themes];
    nextTheme();
  }
  apply();
}

/** Retour d'une dimension (ou départ de la page) : sa musique s'arrête, la nappe revient. */
export function stopThemes() {
  if (!inDimension && !theme) return;
  inDimension = false;
  haltTheme();
  apply();
}

/**
 * Prépare le son. Safari n'autorise le son que dans un geste du visiteur
 * (toucher, clic, touche) : au premier, le contexte audio et les lecteurs de
 * musique sont créés ; aux suivants, le contexte est relancé s'il s'est arrêté
 * (iPhone : appel, retour sur l'onglet, verrouillage). Il se tait quand
 * l'onglet est masqué.
 */
export function initSound() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  // iPhone : sans cela, le mode silencieux (bouton sur le côté) coupe tout le
  // son de la page, comme une sonnerie ; le site joue alors comme une vidéo.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
    } catch {
      /* réglage refusé : le mode silencieux garde la main */
    }
  }

  const wake = () => {
    if (!context) {
      try {
        context = new AudioCtx({ latencyHint: "playback" });
      } catch {
        // Anciens Safari : pas d'options au constructeur.
        try {
          context = new AudioCtx();
        } catch {
          context = null;
          return;
        }
      }
      live.context = context;
      output = context.createGain();
      output.gain.value = gainFor(readVolume());
      output.connect(context.destination);
      preparePlayers(context, output);
      unlockPlayers();
      apply();
    } else {
      unlockPlayers();
    }
    if (getSnapshot() && !document.hidden && context.state !== "running") void context.resume().catch(() => {});
  };
  for (const type of ["pointerup", "touchend", "click", "keydown"] as const) window.addEventListener(type, wake, true);
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
  // Dans le geste lui-même (le bouton du son) : Safari n'accepterait pas une
  // reprise plus tard.
  if (on && context && context.state !== "running") void context.resume().catch(() => {});
  for (const listener of listeners) listener();
  apply();
}

/** Son actif (lecture ponctuelle, hors React). */
export function isSoundOn() {
  return getSnapshot();
}

/** `[son actif, basculer]` - coupé au rendu serveur. */
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
 * joue à la fois - le précédent s'efface vite - et les plus longs (générique,
 * chanson) s'estompent au bout de quelques secondes.
 */

type Clip = { buffer: AudioBuffer; gain: number };

/**
 * Niveau visé (valeur efficace des passages audibles) : le même pour tous les
 * sons, un peu sous la nappe d'ambiance, mesurée vers 0,013 en sortie.
 */
const CLIP_LEVEL = 0.011;

/**
 * Niveau d'un son sur ses seuls passages audibles (tranches de 50 ms à moins
 * de 20 dB de la plus forte) : les silences ne faussent pas la mesure.
 */
function loudness(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const size = Math.max(1, Math.round(buffer.sampleRate * 0.05));
  const slices: number[] = [];
  for (let start = 0; start + size <= samples.length; start += size) {
    let sum = 0;
    for (let i = start; i < start + size; i += 2) sum += samples[i] * samples[i];
    slices.push(sum / Math.ceil(size / 2));
  }
  if (slices.length === 0) return 1;
  const loudest = slices.reduce((max, value) => Math.max(max, value), 0);
  const audible = slices.filter((value) => value > loudest * 0.01);
  return Math.sqrt(audible.reduce((total, value) => total + value, 0) / Math.max(1, audible.length)) || 1;
}
/** Durée au-delà de laquelle un son s'estompe (secondes). */
const CLIP_LONGEST = 8;

const clips = new Map<string, Promise<Clip | null>>();
let clipPlaying: { source: AudioBufferSourceNode; gain: GainNode; url: string; music: boolean } | null = null;

function loadClip(ctx: AudioContext, url: string): Promise<Clip | null> {
  let clip = clips.get(url);
  if (!clip) {
    clip = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => ({ buffer, gain: Math.min(1, CLIP_LEVEL / loudness(buffer)) }))
      .catch(() => null);
    clips.set(url, clip);
  }
  return clip;
}

const warmed = new Set<string>();
/**
 * Prépare un son d'objet (survol, projet affiché) pour que le clic le joue
 * sans attendre son chargement : décodé si le son est déjà débloqué, sinon
 * seulement téléchargé. Rien si le son du site est coupé.
 */
export function preloadClip(url: string) {
  if (!getSnapshot()) return;
  if (context) void loadClip(context, url);
  else if (!warmed.has(url)) {
    warmed.add(url);
    void fetch(url).catch(() => {});
  }
}

function stopClip(ctx: AudioContext) {
  if (!clipPlaying) return;
  const { source, gain, music } = clipPlaying;
  clipPlaying = null;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  // Un morceau s'efface un peu plus doucement qu'un bruitage.
  const fade = music ? 0.4 : 0.08;
  gain.gain.linearRampToValueAtTime(0, now + fade);
  source.stop(now + fade + 0.02);
  // La nappe revient après un morceau.
  if (music) apply();
}

/**
 * Joue le son d'un objet, si le son du site est actif et débloqué.
 * `music` : un morceau (l'extrait du CD), joué en entier pendant que la
 * nappe se tait ; le relancer pendant qu'il joue l'arrête.
 */
export function playClip(url: string, { music = false }: { music?: boolean } = {}) {
  if (!context || !getSnapshot() || document.hidden) return;
  const ctx = context;
  if (music && clipPlaying?.url === url) {
    stopClip(ctx);
    return;
  }
  if (ctx.state === "suspended") void ctx.resume();
  void loadClip(ctx, url).then((clip) => {
    if (!clip || !getSnapshot()) return;
    stopClip(ctx);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = clip.gain;
    const source = ctx.createBufferSource();
    source.buffer = clip.buffer;
    source.connect(gain).connect(output ?? ctx.destination);
    // Lancé avant tout arrêt programmé : le navigateur refuse l'inverse.
    source.start(now);
    if (!music && clip.buffer.duration > CLIP_LONGEST) {
      gain.gain.setValueAtTime(clip.gain, now + CLIP_LONGEST - 1.5);
      gain.gain.linearRampToValueAtTime(0, now + CLIP_LONGEST);
      source.stop(now + CLIP_LONGEST + 0.05);
    }
    const playing = { source, gain, url, music };
    clipPlaying = playing;
    if (music) apply();
    source.onended = () => {
      if (clipPlaying !== playing) return;
      clipPlaying = null;
      if (music) apply();
    };
  });
}
