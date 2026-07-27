/**
 * Planifie une tâche non urgente lorsque le navigateur est inactif, avec repli
 * sur `setTimeout` là où `requestIdleCallback` n'est pas disponible (Safari).
 * Renvoie une fonction d'annulation. No-op côté serveur.
 */
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function requestIdle(callback: () => void, timeout = 2000): () => void {
  if (typeof window === "undefined") return () => {};

  const w = window as IdleWindow;

  if (typeof w.requestIdleCallback === "function") {
    const handle = w.requestIdleCallback(callback, { timeout });
    return () => w.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1);
  return () => window.clearTimeout(handle);
}
