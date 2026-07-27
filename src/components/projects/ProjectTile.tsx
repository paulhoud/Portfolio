"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { ProjectThumbnail } from "./ProjectThumbnail";

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
        className="group relative block h-full w-full overflow-hidden"
        style={{ backgroundColor: project.background, color: project.foreground }}
        aria-label={`Voir le projet ${project.title}`}
      >
        <ProjectThumbnail
          id={project.slug}
          mediaKey={project.mediaKey}
          alt={project.logoAlt}
          background={project.background}
          priority={index < 3}
        />
        <span className="pointer-events-none absolute inset-x-8 bottom-7 z-10 translate-y-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            className="block text-sm font-bold uppercase tracking-[0.18em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
            style={project.titleColor ? { color: project.titleColor } : undefined}
          >
            {project.title}
          </span>
        </span>
      </Link>
    </motion.article>
  );
}
