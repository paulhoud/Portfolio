"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { ProjectStoryChapter, ProjectStoryShot } from "@/content/projects";
import { cn } from "@/lib/utils";

/**
 * Récit d'un projet raconté au fil du défilement.
 *
 * Mise en scène : sur grand écran, une colonne reste épinglée pendant que les
 * chapitres défilent à côté. Le produit y change d'état en même temps que
 * l'intitulé de poste — les deux évolutions se répondent à l'écran, sans qu'il
 * soit nécessaire de les commenter.
 *
 * Sur mobile, la colonne épinglée n'aurait pas de sens : chaque chapitre porte
 * alors ses propres captures, juste sous son texte.
 */
export function ProjectStorySection({ chapters }: { chapters: ProjectStoryChapter[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Le chapitre actif est celui dont le centre est le plus proche du milieu de
  // l'écran. Ce critère de proximité ne laisse aucune zone morte — contrairement
  // à un seuil de franchissement, il désigne toujours exactement un chapitre,
  // y compris au chargement et après un redimensionnement.
  useEffect(() => {
    const update = () => {
      // Les nœuds sont relus à chaque mesure plutôt que capturés une fois :
      // une liste figée deviendrait obsolète au moindre remontage, et des
      // éléments détachés mesurent zéro — l'index resterait bloqué au premier.
      const nodes = chapterRefs.current.filter(Boolean) as HTMLLIElement[];
      if (nodes.length === 0) return;

      const viewportCenter = window.innerHeight / 2;
      let closest = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closest = index;
        }
      });

      // React ignore une mise à jour de valeur identique : inutile de comparer.
      setActiveIndex(closest);
    };

    update();
    // Les navigateurs limitent déjà l'événement `scroll` à une fois par frame,
    // et quatre mesures par frame sont négligeables : pas d'étranglement requis.
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [chapters.length]);

  const active = chapters[activeIndex] ?? chapters[0];

  return (
    <section aria-label="Déroulé du projet" className="mt-4 md:mt-10">
      {/* Pas d'`items-start` ici : la colonne de droite doit s'étirer sur toute
          la hauteur des chapitres, faute de quoi l'élément épinglé n'aurait
          aucune course pour coulisser. */}
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-16">
        {/* Colonne des chapitres : c'est elle qui donne le rythme. */}
        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
          />

          {chapters.map((chapter, index) => (
            <li
              key={chapter.title}
              ref={(node) => {
                chapterRefs.current[index] = node;
              }}
              // Chaque chapitre occupe une large part de l'écran : c'est ce qui
              // donne au récit son rythme, et ce qui laisse à la colonne
              // épinglée la course nécessaire pour accompagner la lecture.
              className="relative flex flex-col justify-center pl-7 pb-20 last:pb-0 md:min-h-[76vh] md:pl-9 md:pb-0"
            >
              <ScrollReveal>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-2.5 h-2 w-2 -translate-x-1/2 rounded-full transition-colors duration-500",
                    index <= activeIndex ? "bg-white/70" : "bg-white/20",
                  )}
                />

                <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/30">
                  {String(index + 1).padStart(2, "0")} — {chapter.period}
                </span>

                {/* Le rôle apparaît ici sur mobile, où la colonne épinglée
                    n'existe pas ; sur desktop il vit dans le cadre produit. */}
                <span className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-white/70 md:hidden">
                  {chapter.role}
                </span>

                <h2 className="mt-3 text-xl font-medium text-white md:text-2xl">{chapter.title}</h2>
                <p className="copy mt-3 max-w-xl">{chapter.body}</p>

                {/* Captures en ligne, mobile uniquement. */}
                <div className="mt-6 space-y-4 md:hidden">
                  {chapter.shots.map((shot) => (
                    <StoryShotFrame key={shot.caption} shot={shot} />
                  ))}
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>

        {/* Colonne épinglée : l'état du produit et le rôle du moment. */}
        <div className="hidden md:block">
          <div className="sticky top-24">
            <StoryStage chapter={active} index={activeIndex} total={chapters.length} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryStage({
  chapter,
  index,
  total,
}: {
  chapter: ProjectStoryChapter;
  index: number;
  total: number;
}) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div>
      {/* Intitulé de poste : il se substitue au précédent à chaque chapitre.
          C'est le marqueur visible de la progression du rôle.
          Le changement de `key` remonte le bloc, qui rejoue son animation
          d'entrée. Pas d'animation de sortie ici : en défilement rapide, elle
          retarderait l'affichage du chapitre suivant. */}
      <div className="mb-5 min-h-[3.25rem]">
        <motion.div
          key={chapter.role}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/30">
            {chapter.period}
          </span>
          <span className="mt-2 block text-balance text-sm font-bold uppercase tracking-[0.1em] text-white">
            {chapter.role}
          </span>
        </motion.div>
      </div>

      {/* Jauge de progression du récit. */}
      <div aria-hidden="true" className="mb-7 h-px w-full bg-white/10">
        <motion.div
          className="h-px bg-white/45"
          initial={false}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={transition}
        />
      </div>

      <motion.div
        key={chapter.title}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
        className={cn("relative", chapter.shots.length > 1 && "pb-10 pr-8")}
      >
        <StoryShotFrame shot={chapter.shots[0]} />

        {/* Seconde capture en incrustation : donne de la profondeur sans
            transformer la colonne en galerie. */}
        {chapter.shots[1] ? (
          <div className="absolute -bottom-2 -right-2 w-[46%]">
            <StoryShotFrame shot={chapter.shots[1]} compact />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

/**
 * Cadre d'une capture. Tant que l'image n'est pas fournie, un emplacement
 * réservé est rendu : la mise en page est déjà définitive, il ne manque que le
 * visuel.
 */
function StoryShotFrame({ shot, compact = false }: { shot: ProjectStoryShot; compact?: boolean }) {
  if (shot.image) {
    return (
      <figure>
        <div className="overflow-hidden rounded-[0.6rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <Image
            src={shot.image}
            alt={shot.caption}
            sizes="(max-width: 768px) 92vw, 620px"
            className="h-auto w-full"
          />
        </div>
        <figcaption
          className={cn(
            "mt-3 text-center uppercase tracking-[0.18em] text-white/35",
            compact ? "text-[0.55rem]" : "text-[0.62rem]",
          )}
        >
          {shot.caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure>
      <div
        className={cn(
          "flex items-center justify-center rounded-[0.6rem] border border-dashed border-white/15 bg-white/[0.02]",
          compact ? "aspect-[4/3] p-4" : "aspect-[16/10] p-6",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn("text-white/20", compact ? "h-5 w-5" : "h-7 w-7")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
            <circle cx="8.5" cy="10" r="1.6" />
            <path d="M3.5 17l4.8-4.4a2 2 0 0 1 2.7 0l6.4 5.9M14 13.2l1.6-1.5a2 2 0 0 1 2.7 0l2.2 2" />
          </svg>
          <span
            className={cn(
              "uppercase tracking-[0.18em] text-white/35",
              compact ? "text-[0.55rem]" : "text-[0.62rem]",
            )}
          >
            {shot.caption}
          </span>
        </div>
      </div>
    </figure>
  );
}
