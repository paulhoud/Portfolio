"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import Image from "next/image";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";
const sizes: Record<Project["logoSize"], string> = {
  sm: "w-16 md:w-20",
  md: "w-24 md:w-32",
  lg: "w-36 md:w-44",
  xl: "w-44 md:w-56",
};

const loopEase = "easeInOut" as const;

const logoMotions: Record<Project["animation"], TargetAndTransition> = {
  float: {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: loopEase },
  },
  orbit: {
    rotate: [0, 1.5, -1.5, 0],
    transition: { duration: 5, repeat: Infinity, ease: loopEase },
  },
  sweep: {
    x: [0, 4, 0],
    transition: { duration: 3.8, repeat: Infinity, ease: loopEase },
  },
  pulse: {
    scale: [1, 1.04, 1],
    transition: { duration: 3.2, repeat: Infinity, ease: loopEase },
  },
  tilt: {
    rotate: [-1.8, 1.8, -1.8],
    transition: { duration: 4.5, repeat: Infinity, ease: loopEase },
  },
};

type AnimatedLogoProps = Pick<
  Project,
  "animation" | "foreground" | "logo" | "logoAlt" | "logoKind" | "logoSize" | "logoScale"
> & {
  priority?: boolean;
};

export function AnimatedLogo({
  animation,
  foreground,
  logo,
  logoAlt,
  logoKind,
  logoSize,
  logoScale = 1,
  priority = false,
}: AnimatedLogoProps) {
  const reduceMotion = useReducedMotion();
  const isVideo =
    logoKind === "video" || logo.endsWith(".webm") || logo.endsWith(".mp4");
  const logoMotion = reduceMotion ? undefined : logoMotions[animation];

  return (
    <motion.div
      className="relative flex items-center justify-center"
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      style={{ color: foreground }}
    >
      {animation === "orbit" ? (
        <motion.span
          aria-hidden="true"
          className="absolute h-28 w-28 rounded-full bg-current opacity-15 blur-2xl md:h-40 md:w-40"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      ) : null}

      {animation === "sweep" ? (
        <motion.span
          aria-hidden="true"
          className="absolute h-20 w-44 -skew-x-12 bg-white/20 blur-2xl"
          animate={reduceMotion ? undefined : { x: [-120, 120] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <motion.div
        animate={logoMotion}
        className={cn("relative", sizes[logoSize])}
        style={{ scale: logoScale }}
      >
        {isVideo ? (
          <video
            src={logo}
            autoPlay
            loop
            muted
            playsInline
            aria-label={logoAlt}
            className="h-auto w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
          />
        ) : (
          <Image
            src={logo}
            alt={logoAlt}
            width={260}
            height={180}
            priority={priority}
            className="h-auto w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
          />
        )}
      </motion.div>    </motion.div>
  );
}
