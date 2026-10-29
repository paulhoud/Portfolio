"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import type { ProjectStoryMascot } from "@/content/projects";
import { cn } from "@/lib/utils";
import { createMascotScene, MASCOT_STAGE, type MascotScene, type MascotState } from "./mascotScene";
import { SYSTEM_LABEL, SystemHeading } from "./ProjectStorySection";

const STAGE_SIZES = "(max-width: 768px) 92vw, 544px";

/**
 * Chapitre de la mascotte, après le design system (UpikaJob, demande de Paul
 * du 29 oct. 2026) : Upikat, de la 2D à la 3D.
 * - Six états, dessinés puis modelés au même cadrage : une poignée fait
 *   passer de l'un à l'autre (elle balaie une fois le personnage quand il
 *   arrive à l'écran, pour montrer qu'elle se déplace).
 * - Le modèle allégé du site vitrine, qu'on fait tourner, avec ses
 *   animations et son squelette.
 * - Les autres états de l'avatar, en vidéos courtes qui ne jouent qu'à
 *   l'écran.
 * Les rendus, le modèle et les vidéos partagent le fond de ses planches.
 */
export function ProjectMascot({ mascot }: { mascot: ProjectStoryMascot }) {
  return (
    <section aria-label={mascot.title} className="pb-20 md:pb-28">
      <ScrollReveal>
        <div className="mx-auto mb-2 max-w-2xl text-center">
          <span className={SYSTEM_LABEL}>{mascot.label}</span>
          <h2 className="mt-4 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">{mascot.title}</h2>
          <p className="copy mt-4">{mascot.body}</p>
        </div>
      </ScrollReveal>

      <SystemHeading>{mascot.compare.title}</SystemHeading>
      <ScrollReveal>
        <Compare compare={mascot.compare} />
      </ScrollReveal>

      <SystemHeading>{mascot.viewer.title}</SystemHeading>
      <ScrollReveal>
        <Viewer viewer={mascot.viewer} />
      </ScrollReveal>

      <SystemHeading>{mascot.clips.title}</SystemHeading>
      <ScrollReveal>
        <p className="copy -mt-2 mb-6 max-w-2xl md:mb-8">{mascot.clips.body}</p>
      </ScrollReveal>
      <ScrollRevealGroup className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {mascot.clips.items.map((item) => (
          <ScrollRevealItem key={item.video}>
            <Clip item={item} />
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    </section>
  );
}

/** Pastille d'un choix (état, animation) : enfoncée, elle prend le fond de la page active. */
function choiceClasses(active: boolean) {
  return cn(
    "cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/60",
    active ? "border-ink/25 bg-ink/[0.08] font-semibold text-ink" : "border-ink/12 text-ink/70 hover:border-ink/25 hover:text-ink",
  );
}

function Compare({ compare }: { compare: ProjectStoryMascot["compare"] }) {
  const [index, setIndex] = useState(0);
  const [split, setSplit] = useState(50);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const touched = useRef(false);
  const state = compare.states[index];

  // Au premier regard, la poignée balaie le personnage, puis revient au milieu.
  useEffect(() => {
    if (!inView || reduceMotion || touched.current) return;
    const sweep = animate(50, [50, 84, 16, 50], {
      duration: 2.8,
      ease: "easeInOut",
      delay: 0.3,
      onUpdate: (value) => {
        if (!touched.current) setSplit(value);
      },
    });
    return () => sweep.stop();
  }, [inView, reduceMotion]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] md:items-center md:gap-10">
      <div
        ref={stage}
        data-grid-hole
        className="relative aspect-square w-full overflow-hidden rounded-[0.75rem]"
        style={{ backgroundColor: MASCOT_STAGE }}
      >
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <Image src={state.volume} alt={`${state.name}, ${compare.volume}`} fill sizes={STAGE_SIZES} className="object-contain" />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <Image src={state.flat} alt={`${state.name}, ${compare.flat}`} fill sizes={STAGE_SIZES} className="object-contain" />
        </div>
        <span aria-hidden="true" className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[0.6875rem] font-semibold text-[#1d2f5c]">
          {compare.flat}
        </span>
        <span aria-hidden="true" className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[0.6875rem] font-semibold text-[#1d2f5c]">
          {compare.volume}
        </span>
        {/* La poignée : un trait et son bouton. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-[#1d2f5c]/35" style={{ left: `${split}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1d2f5c] shadow-[0_2px_10px_rgba(29,47,92,0.18)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(split)}
          onChange={(event) => {
            touched.current = true;
            setSplit(Number(event.target.value));
          }}
          aria-label={compare.hint}
          aria-valuetext={`${compare.flat} ${Math.round(split)} %`}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none opacity-0"
        />
      </div>

      <div>
        <ul className="flex flex-wrap gap-2 md:flex-col md:items-start">
          {compare.states.map((item, position) => (
            <li key={item.name}>
              <button type="button" aria-pressed={position === index} onClick={() => setIndex(position)} className={choiceClasses(position === index)}>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[0.8125rem] leading-relaxed text-ink/60">{compare.hint}</p>
      </div>
    </div>
  );
}

function Viewer({ viewer }: { viewer: ProjectStoryMascot["viewer"] }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<MascotScene | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<MascotState>("idle");
  const [skeleton, setSkeleton] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  // La 3D se charge à l'approche (trois, le modèle de 475 Ko) ; l'image fixe l'attend.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        void createMascotScene(element, viewer.model, reduceMotion).then((created) => {
          if (disposed) created?.dispose();
          else if (created) {
            scene.current = created;
            setReady(true);
          }
        });
      },
      { rootMargin: "400px 0px" },
    );
    near.observe(element);
    return () => {
      disposed = true;
      near.disconnect();
      scene.current?.dispose();
      scene.current = null;
      setReady(false);
    };
  }, [viewer.model, reduceMotion]);

  useEffect(() => {
    if (ready) scene.current?.play(state);
  }, [ready, state]);
  useEffect(() => {
    if (ready) scene.current?.setSkeleton(skeleton);
  }, [ready, skeleton]);

  const current = viewer.states.find((item) => item.id === state);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] md:items-center md:gap-10">
      <div
        ref={host}
        data-grid-hole
        className={cn("relative aspect-square w-full overflow-hidden rounded-[0.75rem]", ready && "cursor-grab active:cursor-grabbing")}
        style={{ backgroundColor: MASCOT_STAGE }}
      >
        <Image
          src={viewer.poster}
          alt={viewer.title}
          fill
          sizes={STAGE_SIZES}
          className={cn("object-contain p-[12%] transition-opacity duration-500", ready && "opacity-0")}
        />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/80 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-[#1d2f5c]">
          {viewer.hint}
        </span>
      </div>

      <div>
        <p className="copy max-w-md">{viewer.body}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {viewer.states.map((item) => (
            <li key={item.id}>
              <button type="button" aria-pressed={item.id === state} onClick={() => setState(item.id)} className={choiceClasses(item.id === state)}>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 min-h-[2.5rem] text-[0.8125rem] leading-relaxed text-ink/60">{current?.desc}</p>
        <button
          type="button"
          role="switch"
          aria-checked={skeleton}
          onClick={() => setSkeleton((on) => !on)}
          className={cn(choiceClasses(skeleton), "mt-2 inline-flex items-center gap-2")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="4.5" r="2" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="7" cy="19.5" r="1.6" />
            <circle cx="17" cy="19.5" r="1.6" />
            <path d="M12 6.5v3.9M11 13.4l-3.2 4.6M13 13.4l3.2 4.6" />
          </svg>
          {viewer.skeleton}
        </button>
      </div>
    </div>
  );
}

/** Une vidéo courte d'un état : elle ne joue qu'à l'écran, jamais avec les animations réduites. */
function Clip({ item }: { item: ProjectStoryMascot["clips"]["items"][number] }) {
  const video = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = video.current;
    if (!element || reduceMotion) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void element.play().catch(() => {});
        else element.pause();
      },
      { threshold: 0.4 },
    );
    watch.observe(element);
    return () => watch.disconnect();
  }, [reduceMotion]);

  return (
    <figure>
      <div data-grid-hole className="overflow-hidden rounded-[0.75rem]" style={{ backgroundColor: MASCOT_STAGE }}>
        <video
          ref={video}
          src={item.video}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={item.name}
          className="block aspect-square w-full object-cover"
        />
      </div>
      <figcaption className="mt-3">
        <span className="block text-sm font-semibold text-ink">{item.name}</span>
        <span className="mt-1 block text-[0.8125rem] leading-snug text-ink/60">{item.desc}</span>
      </figcaption>
    </figure>
  );
}
