"use client";

import { AnimatePresence } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { ProjectMedia } from "@/content/projects";
import { MediaViewer } from "./MediaViewer";

// Détection « côté client » sans setState-dans-effet ni décalage d'hydratation :
// renvoie false au rendu serveur, true côté client (pour activer le portail).
const noopSubscribe = () => () => {};

type MediaViewerContextValue = {
  /** Ouvre la visionneuse sur un média donné (par sa référence). */
  openMedia: (media: ProjectMedia) => void;
  /** Ouvre la visionneuse à un index donné. */
  openIndex: (index: number) => void;
};

const MediaViewerContext = createContext<MediaViewerContextValue | null>(null);

/** Accès à la visionneuse ; `null` hors provider. */
export function useMediaViewer() {
  return useContext(MediaViewerContext);
}

/**
 * Fournit une visionneuse média unique (images et vidéos) partagée par toute la
 * page projet. Conserve la liste ordonnée des médias pour la navigation
 * précédent/suivant.
 *
 * L'overlay est rendu via un portail dans `document.body` : il échappe ainsi au
 * contexte d'empilement du calque de transition (qui porte un `transform`), et
 * son `z-index` s'applique au niveau racine — au-dessus de toute la navigation
 * (sidebar, nav mobile, bouton retour-en-haut). C'est une vraie modale.
 */
export function MediaViewerProvider({
  media,
  children,
}: {
  media: ProjectMedia[];
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const openIndex = useCallback(
    (next: number) => {
      if (next >= 0 && next < media.length) setIndex(next);
    },
    [media.length],
  );

  const openMedia = useCallback(
    (item: ProjectMedia) => {
      // Repli sur le titre : les captures du récit sont converties en médias au
      // moment de la collecte, l'objet transmis n'est donc pas celui de la
      // liste. Les titres, eux, sont uniques au sein d'un projet.
      const found = media.indexOf(item);
      const index = found >= 0 ? found : media.findIndex((m) => m.title === item.title);
      if (index >= 0) setIndex(index);
    },
    [media],
  );

  const value = useMemo<MediaViewerContextValue>(
    () => ({ openMedia, openIndex }),
    [openMedia, openIndex],
  );

  const overlay = (
    <AnimatePresence>
      {index !== null ? (
        <MediaViewer
          media={media}
          index={index}
          onNavigate={setIndex}
          onClose={() => setIndex(null)}
        />
      ) : null}
    </AnimatePresence>
  );

  return (
    <MediaViewerContext.Provider value={value}>
      {children}
      {mounted ? createPortal(overlay, document.body) : null}
    </MediaViewerContext.Provider>
  );
}
