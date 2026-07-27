/**
 * Planificateur d'animation passive — logique pure, sans dépendance au DOM ni à
 * React, afin d'être testable unitairement. Le provider n'en est qu'un mince
 * adaptateur qui lui fournit les accès au DOM (cartes visibles, lecture vidéo)
 * et les minuteurs.
 *
 * Garanties :
 * - une seule animation passive à la fois (aucun nouveau minuteur n'est armé
 *   tant que l'animation en cours n'est pas terminée ou interrompue) ;
 * - déclenchement après un délai d'inactivité légèrement aléatoire ;
 * - toute activité interrompt l'animation en cours et réarme le cycle ;
 * - désactivable (mouvements réduits, onglet masqué).
 */
export type PassiveSchedulerDeps = {
  /** Ids des cartes éligibles (visibles, non survolées, montées). */
  getCandidates: () => string[];
  /** Joue l'animation passive d'une carte ; `onEnded` signale la fin naturelle. */
  play: (id: string, onEnded: () => void) => void;
  /** Interrompt l'animation passive d'une carte. */
  stop: (id: string) => void;
  /** Planifie un rappel différé (injecté pour les tests). */
  setTimer: (callback: () => void, delayMs: number) => number;
  /** Annule un rappel différé (injecté pour les tests). */
  clearTimer: (handle: number) => void;
  /** Source d'aléa dans [0, 1). Par défaut `Math.random`. */
  random?: () => number;
  /** Horloge monotone en ms. Par défaut `performance.now`. */
  now?: () => number;
  minDelayMs?: number;
  maxDelayMs?: number;
  rescheduleThrottleMs?: number;
};

export class PassiveScheduler {
  private readonly getCandidates: () => string[];
  private readonly play: (id: string, onEnded: () => void) => void;
  private readonly stop: (id: string) => void;
  private readonly setTimer: (callback: () => void, delayMs: number) => number;
  private readonly clearTimer: (handle: number) => void;
  private readonly random: () => number;
  private readonly now: () => number;
  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly rescheduleThrottleMs: number;

  private enabled = false;
  private activeId: string | null = null;
  private timer: number | null = null;
  private lastReschedule = Number.NEGATIVE_INFINITY;

  constructor(deps: PassiveSchedulerDeps) {
    this.getCandidates = deps.getCandidates;
    this.play = deps.play;
    this.stop = deps.stop;
    this.setTimer = deps.setTimer;
    this.clearTimer = deps.clearTimer;
    this.random = deps.random ?? Math.random;
    this.now = deps.now ?? (() => performance.now());
    this.minDelayMs = deps.minDelayMs ?? 10_000;
    this.maxDelayMs = deps.maxDelayMs ?? 15_000;
    this.rescheduleThrottleMs = deps.rescheduleThrottleMs ?? 250;
  }

  /** Carte en cours de lecture passive, ou `null`. Exposé pour les tests. */
  get activePassiveId(): string | null {
    return this.activeId;
  }

  /** Active/désactive le cycle. Le passage à l'état actif (re)démarre le cycle. */
  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.scheduleNext();
    } else {
      this.interrupt();
      this.cancelTimer();
    }
  }

  /** Signale une activité utilisateur : interrompt et réarme (throttlé). */
  notifyActivity(): void {
    if (!this.enabled) return;
    if (this.activeId !== null) this.interrupt();
    const now = this.now();
    if (now - this.lastReschedule > this.rescheduleThrottleMs) {
      this.lastReschedule = now;
      this.scheduleNext();
    }
  }

  /** Interrompt l'animation passive en cours, s'il y en a une. */
  interrupt(): void {
    const id = this.activeId;
    if (id !== null) {
      this.activeId = null;
      this.stop(id);
    }
  }

  /** À appeler lorsqu'une carte disparaît, pour ne pas rester bloqué sur elle. */
  handleTileGone(id: string): void {
    if (this.activeId === id) {
      this.activeId = null;
      this.scheduleNext();
    }
  }

  /** Libère les ressources (minuteur, animation en cours). */
  dispose(): void {
    this.cancelTimer();
    this.interrupt();
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    this.cancelTimer();
    if (!this.enabled) return;
    const delay = this.minDelayMs + this.random() * (this.maxDelayMs - this.minDelayMs);
    this.timer = this.setTimer(() => this.run(), delay);
  }

  private run(): void {
    this.timer = null;
    if (!this.enabled) return;

    const candidates = this.getCandidates();
    if (candidates.length === 0) {
      // Rien à jouer pour l'instant : on réessaiera plus tard.
      this.scheduleNext();
      return;
    }

    const pick = candidates[Math.floor(this.random() * candidates.length)];
    this.activeId = pick;
    this.play(pick, () => {
      // Fin naturelle : on repart pour un tour (sauf si déjà interrompu).
      if (this.activeId === pick) this.activeId = null;
      this.scheduleNext();
    });
  }
}
