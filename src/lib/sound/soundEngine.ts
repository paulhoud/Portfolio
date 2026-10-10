/**
 * Ambiance sonore du portfolio, synthétisée en direct (Web Audio) : aucune
 * piste à télécharger, aucun droit à gérer.
 *
 * Inspiration : les menus de la PlayStation 2. Une nappe lente et douce sur
 * quatre accords, des cloches cristallines au loin avec écho, une basse ronde
 * et beaucoup de réverbération, le tout à très faible volume. Les effets
 * accompagnent l'entrée dans un projet : un souffle pendant le trajet de la
 * caméra, un scintillement quand on entre dans la plaque, l'inverse au retour.
 */

export type SoundEffect = "travel" | "enter" | "return" | "blackhole" | "collapse" | "rebirth";

export type SoundEngine = {
  /**
   * Joue (fondu d'entrée) ou se tait (fondu de sortie, puis veille du
   * contexte audio). `keepAwake` : se taire sans mettre le contexte en
   * veille, car un autre son y joue encore (le morceau du CD).
   */
  setOn(on: boolean, options?: { keepAwake?: boolean }): void;
  /** Effet ponctuel ; `duration` en secondes pour le souffle du trajet. */
  sfx(name: SoundEffect, duration?: number): void;
  dispose(): void;
};

const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);
const random = (min: number, max: number) => min + Math.random() * (max - min);

/** Ré majeur, nappe lente : Dmaj9, Bm11, Gmaj9, A6/9 (notes MIDI). */
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 62, 64],
  [43, 50, 54, 57, 61],
  [45, 52, 54, 59, 61],
];
/** Pentatonique de ré, dans l'aigu : les cloches. */
const BELLS = [74, 76, 78, 81, 83, 86, 88, 90];
const CHORD_SECONDS = 9;
const VOLUME = 0.42;

/** Réverbération : bruit stéréo à décroissance exponentielle. */
function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
  }
  return buffer;
}

function noise(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/**
 * Crée le moteur sur un contexte audio déjà débloqué par un geste du
 * visiteur (clic, touche) : les navigateurs l'exigent.
 */
export function createSoundEngine(ctx: AudioContext): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.01;
  limiter.release.value = 0.4;
  master.connect(limiter).connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 5, 2.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.8;
  reverb.connect(wet).connect(master);

  const music = ctx.createGain();
  music.gain.value = 0.55;
  music.connect(master);
  const musicSend = ctx.createGain();
  musicSend.gain.value = 0.75;
  music.connect(musicSend).connect(reverb);

  const effects = ctx.createGain();
  effects.gain.value = 0.75;
  effects.connect(master);
  const effectsSend = ctx.createGain();
  effectsSend.gain.value = 0.5;
  effects.connect(effectsSend).connect(reverb);

  // Écho des cloches, assourdi à chaque répétition.
  const echo = ctx.createDelay(1.5);
  echo.delayTime.value = 0.42;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 2400;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  echo.connect(echoTone).connect(feedback).connect(echo);
  echoTone.connect(music);

  // Nappe : filtre doux dont l'ouverture respire lentement.
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1100;
  padFilter.Q.value = 0.4;
  padFilter.connect(music);
  const breath = ctx.createOscillator();
  breath.frequency.value = 0.06;
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = 420;
  breath.connect(breathDepth).connect(padFilter.frequency);
  breath.start();

  // Souffle d'air très discret, qui scintille.
  const whiteNoise = noise(ctx, 3);
  const air = ctx.createBufferSource();
  air.buffer = whiteNoise;
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 5200;
  airFilter.Q.value = 0.7;
  const airLevel = ctx.createGain();
  airLevel.gain.value = 0.0035;
  air.connect(airFilter).connect(airLevel).connect(music);
  air.start();

  let chordIndex = 0;
  let chordTimer = 0;
  let bellTimer = 0;
  let suspendTimer = 0;
  let on = false;
  let disposed = false;

  const voice = (
    frequency: number,
    type: OscillatorType,
    detune: number,
    level: number,
    start: number,
    hold: number,
    destination: AudioNode,
  ) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 3.2);
    gain.gain.setValueAtTime(level, start + hold);
    gain.gain.linearRampToValueAtTime(0, start + hold + 3.5);
    osc.connect(gain).connect(destination);
    osc.start(start);
    osc.stop(start + hold + 3.7);
    osc.onended = () => gain.disconnect();
  };

  const playChord = () => {
    const start = ctx.currentTime + 0.05;
    const notes = CHORDS[chordIndex % CHORDS.length];
    chordIndex += 1;
    for (const note of notes) {
      voice(midi(note), "triangle", -7, 0.02, start, CHORD_SECONDS - 0.5, padFilter);
      voice(midi(note), "sine", 6, 0.028, start, CHORD_SECONDS - 0.5, padFilter);
    }
    // Basse ronde, une octave sous la fondamentale.
    voice(midi(notes[0] - 12), "sine", 0, 0.05, start, CHORD_SECONDS - 0.5, music);
  };

  const bell = (note: number, when: number, level: number, pan = random(-0.6, 0.6)) => {
    const frequency = midi(note);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 2.8);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    panner.connect(music);
    panner.connect(echo);
    // Fondamentale et partiel inharmonique : un timbre de cloche de verre.
    for (const [ratio, share] of [
      [1, 1],
      [2.76, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency * ratio;
      const partial = ctx.createGain();
      partial.gain.value = share;
      osc.connect(partial).connect(gain);
      osc.start(when);
      osc.stop(when + 2.9);
      osc.onended = () => partial.disconnect();
    }
    window.setTimeout(() => panner.disconnect(), (when - ctx.currentTime + 3.2) * 1000);
  };

  const scheduleChords = () => {
    if (!on || disposed) return;
    playChord();
    chordTimer = window.setTimeout(scheduleChords, CHORD_SECONDS * 1000);
  };
  const scheduleBells = () => {
    if (!on || disposed) return;
    const now = ctx.currentTime + 0.05;
    bell(BELLS[Math.floor(Math.random() * BELLS.length)], now, 0.035);
    if (Math.random() < 0.35) bell(BELLS[Math.floor(Math.random() * BELLS.length)], now + 0.2, 0.022);
    bellTimer = window.setTimeout(scheduleBells, random(1800, 5000));
  };

  // --- Effets ----------------------------------------------------------------
  // Le bruit filtré ne garde qu'une petite part de son énergie : le niveau
  // de départ est donc élevé pour que le souffle passe au-dessus de la nappe.
  const whoosh = (duration: number, rising: boolean, level = 0.9) => {
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = whiteNoise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    const [from, peak, to] = rising ? [260, 1900, 520] : [1900, 420, 220];
    band.frequency.setValueAtTime(from, now);
    band.frequency.exponentialRampToValueAtTime(peak, now + duration * 0.55);
    band.frequency.exponentialRampToValueAtTime(to, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + duration * 0.45);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(rising ? -0.5 : 0.5, now);
    panner.pan.linearRampToValueAtTime(rising ? 0.5 : -0.5, now + duration);
    source.connect(band).connect(gain).connect(panner).connect(effects);
    source.start(now);
    source.stop(now + duration + 0.05);
    source.onended = () => panner.disconnect();
  };

  const thump = (when: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    osc.connect(gain).connect(effects);
    osc.start(when);
    osc.stop(when + 0.55);
    osc.onended = () => gain.disconnect();
  };

  const rumble = (duration: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(34, now);
    osc.frequency.linearRampToValueAtTime(58, now + duration);
    const low = ctx.createBufferSource();
    low.buffer = whiteNoise;
    low.loop = true;
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = "lowpass";
    lowFilter.frequency.value = 160;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + duration * 0.9);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain);
    low.connect(lowFilter).connect(gain);
    gain.connect(effects);
    osc.start(now);
    low.start(now);
    osc.stop(now + duration + 0.05);
    low.stop(now + duration + 0.05);
    osc.onended = () => gain.disconnect();
  };

  /**
   * Aspiration : de l'air happé de plus en plus fort et de plus en plus aigu,
   * qui siffle, tremble et tourne autour de l'auditeur, puis se coupe net
   * quand le trou se referme.
   */
  const suction = (duration: number) => {
    const now = ctx.currentTime;
    const end = now + duration;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.25, now + duration * 0.45);
    out.gain.exponentialRampToValueAtTime(1, end - 0.04);
    out.gain.linearRampToValueAtTime(0, end);
    // Tourbillon : le souffle passe d'une oreille à l'autre, de plus en plus vite.
    const panner = ctx.createStereoPanner();
    const swirl = ctx.createOscillator();
    swirl.frequency.setValueAtTime(0.3, now);
    swirl.frequency.exponentialRampToValueAtTime(5, end);
    const swirlDepth = ctx.createGain();
    swirlDepth.gain.value = 0.75;
    swirl.connect(swirlDepth).connect(panner.pan);
    // Turbulences : le volume tremble, de plus en plus vite.
    const shake = ctx.createGain();
    shake.gain.value = 0.7;
    const flutter = ctx.createOscillator();
    flutter.frequency.setValueAtTime(4, now);
    flutter.frequency.exponentialRampToValueAtTime(26, end);
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = 0.3;
    flutter.connect(flutterDepth).connect(shake.gain);
    shake.connect(out).connect(panner).connect(effects);

    const source = ctx.createBufferSource();
    source.buffer = whiteNoise;
    source.loop = true;
    // Souffle : une bande large qui monte vers l'aigu.
    const low = ctx.createBiquadFilter();
    low.type = "highpass";
    low.frequency.setValueAtTime(120, now);
    low.frequency.exponentialRampToValueAtTime(700, end);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.2;
    band.frequency.setValueAtTime(320, now);
    band.frequency.exponentialRampToValueAtTime(3600, end);
    const air = ctx.createGain();
    air.gain.value = 1.6;
    source.connect(low).connect(band).connect(air).connect(shake);
    // Sifflement : une bande très étroite qui monte aussi, comme l'air
    // aspiré par une fente.
    const whistle = ctx.createBiquadFilter();
    whistle.type = "bandpass";
    whistle.Q.value = 16;
    whistle.frequency.setValueAtTime(520, now);
    whistle.frequency.exponentialRampToValueAtTime(2600, end);
    const whistleLevel = ctx.createGain();
    whistleLevel.gain.value = 4.5;
    source.connect(whistle).connect(whistleLevel).connect(shake);

    for (const node of [source, swirl, flutter]) {
      node.start(now);
      node.stop(end + 0.05);
    }
    source.onended = () => panner.disconnect();
  };

  const boom = () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 1.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc.connect(gain).connect(effects);
    osc.start(now);
    osc.stop(now + 1.9);
    osc.onended = () => gain.disconnect();
    const burst = ctx.createBufferSource();
    burst.buffer = whiteNoise;
    const burstFilter = ctx.createBiquadFilter();
    burstFilter.type = "lowpass";
    burstFilter.frequency.setValueAtTime(2400, now);
    burstFilter.frequency.exponentialRampToValueAtTime(120, now + 1.2);
    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.5, now);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    burst.connect(burstFilter).connect(burstGain).connect(effects);
    burst.start(now);
    burst.stop(now + 1.4);
    burst.onended = () => burstGain.disconnect();
  };

  const arpeggio = (notes: number[], level: number) => {
    const now = ctx.currentTime + 0.02;
    notes.forEach((note, i) => bell(note, now + i * 0.07, level * (1 - i * 0.15), -0.3 + i * 0.2));
  };

  return {
    setOn(next, { keepAwake = false } = {}) {
      if (disposed) return;
      // Déjà muette : seule la veille prévue peut changer (un morceau commence).
      if (next === on) {
        if (!on && keepAwake) window.clearTimeout(suspendTimer);
        return;
      }
      on = next;
      window.clearTimeout(suspendTimer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      if (on) {
        void ctx.resume();
        master.gain.linearRampToValueAtTime(VOLUME, now + 2.5);
        scheduleChords();
        bellTimer = window.setTimeout(scheduleBells, 2500);
      } else {
        master.gain.linearRampToValueAtTime(0, now + 0.5);
        window.clearTimeout(chordTimer);
        window.clearTimeout(bellTimer);
        if (!keepAwake) suspendTimer = window.setTimeout(() => void ctx.suspend(), 700);
      }
    },
    sfx(name, duration = 1) {
      if (!on || disposed) return;
      if (name === "travel") whoosh(Math.max(0.5, duration), true);
      if (name === "enter") {
        arpeggio([81, 86, 88, 93], 0.06);
        thump(ctx.currentTime + 0.05);
        whoosh(0.7, true, 0.45);
      }
      if (name === "return") {
        arpeggio([93, 88, 86, 81], 0.05);
        whoosh(1.1, false, 0.7);
      }
      if (name === "blackhole") {
        // Grondement qui monte, et l'air aspiré jusqu'à l'effondrement (4 s).
        rumble(4);
        suction(4);
      }
      if (name === "collapse") {
        boom();
      }
      if (name === "rebirth") {
        arpeggio([74, 81, 86, 90, 93, 98], 0.07);
        whoosh(1.4, false, 0.6);
      }
    },
    dispose() {
      disposed = true;
      window.clearTimeout(chordTimer);
      window.clearTimeout(bellTimer);
      window.clearTimeout(suspendTimer);
      void ctx.close();
    },
  };
}
