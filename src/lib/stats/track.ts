import { useSyncExternalStore } from "react";
import type { EventName, SentBatch, SentEvent } from "./events";

/**
 * Envoi des évènements de la mesure d'audience (cf. events.ts), côté
 * navigateur : ils sont regroupés et partent toutes les quelques secondes, et
 * au plus tard quand on quitte la page (sendBeacon, qui survit à la fermeture).
 *
 * Rien n'est envoyé quand le visiteur a demandé à ne pas être compté (lien du
 * pied de page, ou page des statistiques pour Paul), quand son navigateur
 * signale qu'il refuse le suivi (Global Privacy Control, Do Not Track), ni
 * depuis un navigateur piloté par un programme (tests, robots).
 */

const ENDPOINT = "/api/track";
const SESSION_KEY = "portfolio-visit";
const OPT_OUT_KEY = "portfolio-no-track";
const FLUSH_DELAY = 4000;

let queue: SentEvent[] = [];
let timer = 0;
let context: { locale?: string; theme?: string } = {};

// --- Refus d'être compté -------------------------------------------------------

const listeners = new Set<() => void>();

function readOptOut() {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Le visiteur a-t-il déjà choisi (dans un sens ou dans l'autre) sur cet appareil ? */
export function optOutChosen() {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) !== null;
  } catch {
    return false;
  }
}

/** Le refus est retenu (« 1 »), et son retrait aussi (« 0 ») : un choix explicite d'être compté. */
export function setOptOut(optOut: boolean) {
  try {
    window.localStorage.setItem(OPT_OUT_KEY, optOut ? "1" : "0");
  } catch {
    /* stockage indisponible : le choix vaut pour la page seulement */
  }
  if (optOut) queue = [];
  for (const listener of listeners) listener();
}

/** Le visiteur a-t-il demandé à ne pas être compté ? (`null` côté serveur). */
export function useOptOut(): boolean | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    readOptOut,
    () => null,
  );
}

function allowed() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.webdriver || nav.globalPrivacyControl || nav.doNotTrack === "1") return false;
  return !readOptOut();
}

// --- Visite ------------------------------------------------------------------

function visitId() {
  try {
    const known = window.sessionStorage.getItem(SESSION_KEY);
    if (known) return known;
    const fresh = Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => (byte % 36).toString(36)).join("");
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

/** Langue et thème du moment, joints à chaque envoi. */
export function setTrackingContext(next: { locale?: string; theme?: string }) {
  context = { ...context, ...next };
}

// --- Envoi -------------------------------------------------------------------

export function track(name: EventName, target?: string, value?: number, extra: { path?: string; referrer?: string } = {}) {
  if (!allowed()) return;
  queue.push({
    n: name,
    p: extra.path ?? window.location.pathname,
    ...(target ? { t: target.slice(0, 80) } : {}),
    ...(value !== undefined && Number.isFinite(value) ? { v: Math.round(value * 10) / 10 } : {}),
    ...(extra.referrer ? { r: extra.referrer } : {}),
    at: Date.now(),
  });
  if (queue.length >= 20) flush();
  else if (!timer) timer = window.setTimeout(flush, FLUSH_DELAY);
}

export function flush() {
  window.clearTimeout(timer);
  timer = 0;
  if (queue.length === 0) return;
  const session = visitId();
  if (!session) {
    queue = [];
    return;
  }
  const batch: SentBatch = { s: session, now: Date.now(), ...context, e: queue };
  queue = [];
  const body = JSON.stringify(batch);
  // Texte brut : pas de requête préalable, et sendBeacon l'accepte tel quel.
  const sent = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }));
  if (!sent) void fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
}
