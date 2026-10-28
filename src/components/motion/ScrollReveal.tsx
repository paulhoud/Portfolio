"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const revealEase = [0.22, 1, 0.36, 1] as const;

/**
 * Déplacement au pixel entier. Amorti, un glissement de 18 px passe sa
 * dernière demi-seconde à moins d'un pixel de l'arrivée : le texte, déplacé
 * d'une fraction de pixel à chaque image, scintillait. Arrivé, plus aucune
 * transformation ne reste (le texte retrouve son lissage normal).
 */
export const wholePixels: NonNullable<HTMLMotionProps<"div">["transformTemplate"]> = ({ x, y }) => {
  const dx = Math.round(Number.parseFloat(String(x ?? 0)) || 0);
  const dy = Math.round(Number.parseFloat(String(y ?? 0)) || 0);
  return dx || dy ? `translate(${dx}px, ${dy}px)` : "none";
};

type ScrollRevealProps = Omit<HTMLMotionProps<"div">, "children"> & {
  delay?: number;
  children?: ReactNode;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  ...props
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transformTemplate={wholePixels}
      viewport={{ once: true, amount: 0.2, margin: "-6% 0px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: revealEase,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealGroupProps = Omit<HTMLMotionProps<"div">, "children"> & {
  stagger?: number;
  children?: ReactNode;
};

export function ScrollRevealGroup({
  children,
  className,
  stagger = 0.1,
  ...props
}: ScrollRevealGroupProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "-6% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      transformTemplate={wholePixels}
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.7,
            ease: revealEase,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
