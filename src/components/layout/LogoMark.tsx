"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  variant?: "white" | "gradient";
  className?: string;
};

const logoFillEase = "cubic-bezier(0.22, 1, 0.36, 1)";

export function LogoMark({ variant = "white", className }: LogoMarkProps) {
  if (variant === "gradient") {
    return (
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className={cn("inline-flex w-fit items-center", className)}
      >
        {/* Pas de `priority` : il générerait un préchargement pour chacune des
            deux instances du logo (barre latérale et en-tête mobile), alors
            qu'une seule est affichée selon la largeur d'écran. Le préchargement
            inutilisé provoquait un avertissement du navigateur. `eager` suffit :
            le logo est au-dessus de la ligne de flottaison. */}
        <Image src="/assets/Logo-0-2.svg" alt="PH" width={61} height={70} loading="eager" />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Retour à l'accueil"
      className={cn("group relative inline-flex h-[70px] w-[61px] items-center", className)}
    >
      <Image
        src="/assets/Logo-0-1.svg"
        alt="PH"
        width={61}
        height={70}
        loading="eager"
        className="transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0"
        style={{ transitionTimingFunction: logoFillEase }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          transitionTimingFunction: logoFillEase,
          WebkitMaskImage: "url(/assets/Logo-0-1.svg)",
          maskImage: "url(/assets/Logo-0-1.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          background:
            "radial-gradient(circle at 35% 68%, #FF9A00 0%, #FF4D00 42%, #E20E0E 78%, #C40000 100%)",
        }}
      />
    </Link>
  );
}
