"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import type { PointerEvent } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
/** Inclinaison au plus fort du survol, en degrés. */
const TILT = 9;
const SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

/**
 * Portrait de la page À propos (28 oct. 2026), d'après Tilted Card et Glare
 * Hover de React Bits :
 * - à l'arrivée, il s'ouvre en cercle depuis son centre et un anneau fin se
 *   trace autour ;
 * - à la souris, il s'incline doucement vers le pointeur, l'anneau flotte un
 *   peu devant lui, un reflet suit le pointeur et le halo glisse à l'opposé :
 *   de la profondeur, et rien ne bouge tant qu'on ne le survole pas ;
 * - au doigt, ou avec les animations réduites, il reste immobile.
 */
export function Portrait({ src, alt }: { src: string; alt: string }) {
  const reduceMotion = useReducedMotion();
  // Position du pointeur sur le portrait, de -0,5 à 0,5 ; survol de 0 à 1.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const hovered = useMotionValue(0);
  const x = useSpring(pointerX, SPRING);
  const y = useSpring(pointerY, SPRING);
  const lift = useSpring(hovered, { stiffness: 120, damping: 20 });
  const rotateY = useTransform(x, [-0.5, 0.5], [-TILT, TILT]);
  const rotateX = useTransform(y, [-0.5, 0.5], [TILT, -TILT]);
  const scale = useTransform(lift, [0, 1], [1, 1.03]);
  const haloX = useTransform(x, [-0.5, 0.5], [16, -16]);
  const haloY = useTransform(y, [-0.5, 0.5], [16, -16]);
  const glareX = useTransform(x, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(y, [-0.5, 0.5], [15, 85]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.28), transparent 55%)`;

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
    hovered.set(1);
  };
  const rest = () => {
    pointerX.set(0);
    pointerY.set(0);
    hovered.set(0);
  };

  return (
    <div className="relative mx-auto [perspective:900px] md:mx-0" onPointerEnter={follow} onPointerMove={follow} onPointerLeave={rest}>
      <motion.span aria-hidden="true" className="absolute -inset-4 rounded-full bg-ink/5 blur-2xl" style={{ x: haloX, y: haloY }} />
      <motion.div className="relative [transform-style:preserve-3d]" style={{ rotateX, rotateY, scale }}>
        <motion.div
          className="relative h-[200px] w-[200px] overflow-hidden rounded-full shadow-[0_24px_60px_rgba(0,0,0,0.45)] md:h-[260px] md:w-[260px]"
          // Le cercle s'ouvre jusqu'à découvrir aussi l'ombre, puis s'efface.
          initial={reduceMotion ? false : { clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(100% at 50% 50%)", transitionEnd: { clipPath: "none" } }}
          transition={{ duration: 1.6, ease, delay: 0.15 }}
        >
          <motion.div
            className="h-full w-full"
            initial={reduceMotion ? false : { scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease, delay: 0.15 }}
          >
            <Image
              src={src}
              alt={alt}
              width={260}
              height={260}
              priority
              sizes="(min-width: 768px) 260px, 200px"
              className="h-full w-full object-cover"
            />
          </motion.div>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full mix-blend-soft-light"
            style={{ backgroundImage: glare, opacity: lift }}
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-ink/15" />
        </motion.div>
        {/* L'anneau, tracé depuis le haut, un peu devant le portrait. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -left-3 -top-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] overflow-visible text-ink/30 [transform:translateZ(28px)_rotate(-90deg)]"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="49.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease, delay: 0.5 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
