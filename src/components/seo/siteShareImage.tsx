import { ImageResponse } from "next/og";
import {
  readPortrait,
  readShareFonts,
  shareImageTheme as theme,
} from "@/components/seo/shareImageTheme";
import { shareImage } from "@/components/seo/shareMetadata";
import { profile } from "@/content/profile";

const size = { width: shareImage.width, height: shareImage.height };

/**
 * Image de partage du site (nom, intitulé, villes, portrait) : sans texte
 * propre à une langue, la même pour l'accueil français et anglais.
 */
export async function renderSiteShareImage() {
  const [portraitSrc, fonts] = await Promise.all([readPortrait(), readShareFonts()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 90px",
          background: theme.background,
          color: theme.text,
          fontFamily: theme.fontFamily,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: theme.accent,
            }}
          >
            {profile.jobTitle}
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, marginTop: 18, lineHeight: 1.05 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 30, color: theme.muted, marginTop: 26 }}>
            De la vision produit au front-end
          </div>
          <div style={{ fontSize: 24, color: theme.subtle, marginTop: 40 }}>
            {`${profile.localities.join(" · ")} - paulhoudebine.com`}
          </div>
        </div>

        {/* `next/image` n'est pas utilisable ici : le rendu est effectué par
            Satori, qui n'interprète que des éléments HTML natifs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portraitSrc}
          alt=""
          width={340}
          height={340}
          style={{ borderRadius: 999, objectFit: "cover" }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
