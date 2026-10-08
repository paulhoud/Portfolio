"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMotionEnd, getMotionStart, getProjectMedia } from "@/content/projectMedia";
import { requestIdle } from "@/lib/idle";
import { cn } from "@/lib/utils";
import { usePassiveAnimation } from "./PassiveAnimationProvider";

type ProjectThumbnailProps = {
  /** Identifiant unique de la carte (slug) pour le contrôleur passif. */
  id: string;
  /** Clé média de la carte (cf. media-manifest). */
  mediaKey?: string;
  /** Texte alternatif de l'image placeholder. */
  alt: string;
  /** Couleur de fond de la carte (visible derrière les zones transparentes). */
  background: string;
  /** Charge l'image en priorité (cartes au-dessus de la ligne de flottaison). */
  priority?: boolean;
};

const IMAGE_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Vitesse de lecture des animations de tuiles : un peu plus vive que l'export,
 * sans dénaturer le mouvement.
 */
const PLAYBACK_RATE = 1.2;

type Mode = "idle" | "hover" | "passive";

/**
 * Rendu d'une carte : image fixe par défaut, remplacée par l'animation .webm
 * au survol (lecture unique, dernière frame figée) et en mode passif (lecture
 * unique puis retour au placeholder). L'image reste sous la vidéo pour une
 * transition sans clignotement, et la vidéo n'est chargée qu'à la demande.
 */
export function ProjectThumbnail({
  id,
  mediaKey,
  alt,
  background,
  priority = false,
}: ProjectThumbnailProps) {
  const media = getProjectMedia(mediaKey);
  const motionStart = getMotionStart(mediaKey);
  const motionEnd = getMotionEnd(mediaKey);
  const passive = usePassiveAnimation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modeRef = useRef<Mode>("idle");
  const preloadedRef = useRef(false);
  const preloadScheduledRef = useRef(false);
  const passiveEndRef = useRef<(() => void) | null>(null);

  // Pilote l'opacité de la vidéo (visible = au-dessus de l'image placeholder).
  const [videoVisible, setVideoVisible] = useState(false);

  const ensurePreloaded = useCallback(() => {
    const video = videoRef.current;
    if (!video || preloadedRef.current) return;
    preloadedRef.current = true;
    if (video.preload !== "auto") video.preload = "auto";
    try {
      video.load();
    } catch {
      /* ignore */
    }
  }, []);

  const startVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    ensurePreloaded();
    // Le reset se fait au démarrage (et non à l'arrêt) pour éviter d'afficher
    // la frame 0 pendant le fondu de sortie.
    // On démarre juste avant le premier mouvement : le plan fixe du début est
    // identique au placeholder (cf. getMotionStart).
    try {
      video.currentTime = motionStart;
    } catch {
      /* ignore */
    }
    // `load()` remet la vitesse à sa valeur par défaut : on règle les deux.
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    setVideoVisible(true);
    const played = video.play();
    if (played && typeof played.catch === "function") played.catch(() => {});
  }, [ensurePreloaded, motionStart]);

  const stopVideo = useCallback(() => {
    setVideoVisible(false);
    videoRef.current?.pause();
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!media) return;
    modeRef.current = "hover";
    startVideo();
    passive?.setHovered(id, true);
  }, [media, startVideo, passive, id]);

  const handleMouseLeave = useCallback(() => {
    if (!media) return;
    if (modeRef.current === "hover") {
      modeRef.current = "idle";
      stopVideo(); // retour instantané au placeholder
    }
    passive?.setHovered(id, false);
  }, [media, stopVideo, passive, id]);

  const handleEnded = useCallback(() => {
    // Mode hover : ne rien faire → la dernière frame reste figée (pas de loop).
    // Mode passif : revenir au placeholder et signaler la fin au contrôleur.
    if (modeRef.current === "passive") {
      modeRef.current = "idle";
      stopVideo();
      const onEnded = passiveEndRef.current;
      passiveEndRef.current = null;
      onEnded?.();
    }
  }, [stopVideo]);

  // Fin anticipée : certaines animations s'effacent avant la fin de leur
  // fichier (cf. getMotionEnd). On s'arrête au dernier instant où le logo est
  // entier, et l'arrêt compte comme une fin de lecture. Le suivi image par
  // image est précis ; `timeupdate` sert de filet là où il n'existe pas.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || motionEnd === null) return;

    let frameHandle = 0;
    const check = () => {
      if (!video.paused && video.currentTime >= motionEnd) {
        video.pause();
        handleEnded();
      }
    };
    const watchFrames = "requestVideoFrameCallback" in video;
    const onFrame = () => {
      check();
      if (!video.paused) frameHandle = video.requestVideoFrameCallback(onFrame);
    };
    const onPlay = () => {
      if (watchFrames) frameHandle = video.requestVideoFrameCallback(onFrame);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("timeupdate", check);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("timeupdate", check);
      if (watchFrames && frameHandle) video.cancelVideoFrameCallback(frameHandle);
    };
  }, [motionEnd, handleEnded]);

  // Enregistrement auprès du contrôleur passif + observation de la visibilité.
  useEffect(() => {
    const element = containerRef.current;
    if (!media || !passive || !element) return;

    const playPassive = (onEnded: () => void) => {
      // Ne pas écraser un survol en cours.
      if (modeRef.current === "hover") {
        onEnded();
        return;
      }
      modeRef.current = "passive";
      passiveEndRef.current = onEnded;
      startVideo();
    };

    const stopPassive = () => {
      if (modeRef.current === "passive") {
        modeRef.current = "idle";
        passiveEndRef.current = null;
        stopVideo();
      }
    };

    const unregister = passive.registerTile(id, { element, playPassive, stopPassive });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible = entry.isIntersecting;
          passive.setVisible(id, visible);
          // Précharge la vidéo des cartes visibles pendant les temps morts.
          if (visible && !preloadScheduledRef.current) {
            preloadScheduledRef.current = true;
            requestIdle(ensurePreloaded, 2500);
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      unregister();
    };
  }, [media, passive, id, startVideo, stopVideo, ensurePreloaded]);

  if (!media) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: background }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ backgroundColor: background }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={media.placeholder}
        alt={alt}
        fill
        sizes={IMAGE_SIZES}
        priority={priority}
        className="object-cover"
      />
      <video
        ref={videoRef}
        src={media.video}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        onEnded={handleEnded}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ease-out",
          videoVisible ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
