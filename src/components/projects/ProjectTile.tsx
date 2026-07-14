"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { AnimatedLogo } from "./AnimatedLogo";

type ProjectTileProps = {
  project: Project;
  index: number;
};

const GRID_COLUMNS = 3;

function getCheckerboardDelay(index: number) {
  const row = Math.floor(index / GRID_COLUMNS);
  const col = index % GRID_COLUMNS;
  return (row + col) * 0.1;
}

export function ProjectTile({ project, index }: ProjectTileProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.68,
        delay: getCheckerboardDelay(index),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="aspect-square min-h-[260px]"
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group relative flex h-full w-full overflow-hidden"
        style={{ backgroundColor: project.background, color: project.foreground }}
        aria-label={`Voir le projet ${project.title}`}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.22),transparent_42%)] opacity-0 transition duration-500 group-hover:opacity-100" />
        <span className="absolute inset-x-8 bottom-7 z-10 translate-y-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            className="block text-sm font-bold uppercase tracking-[0.18em]"
            style={project.titleColor ? { color: project.titleColor } : undefined}
          >
            {project.title}
          </span>
        </span>
        <span className="relative z-0 flex h-full w-full items-center justify-center p-10 transition duration-500 group-hover:-translate-y-4">
          <AnimatedLogo
            animation={project.animation}
            foreground={project.foreground}
            logo={project.logo}
            logoAlt={project.logoAlt}
            logoKind={project.logoKind}
            logoSize={project.logoSize}
            logoScale={project.logoScale}
            priority={index < 3}
          />
        </span>
      </Link>
    </motion.article>
  );
}
