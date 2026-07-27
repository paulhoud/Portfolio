"use client";

import type { Project } from "@/content/projects";
import { useTranslation } from "@/i18n/context";
import { PassiveAnimationProvider } from "./PassiveAnimationProvider";
import { ProjectTile } from "./ProjectTile";

type ProjectGridProps = {
  projects: Project[];
};

export function ProjectGrid({ projects }: ProjectGridProps) {
  const { t } = useTranslation();

  return (
    <PassiveAnimationProvider>
      <section
        aria-label={t.site.common.projectGallery}
        className="grid min-h-screen grid-cols-1 bg-[#17161d] sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project, index) => (
          <ProjectTile key={project.slug} project={project} index={index} />
        ))}
      </section>
    </PassiveAnimationProvider>
  );
}
