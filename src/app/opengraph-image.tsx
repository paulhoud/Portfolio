import { ImageResponse } from "next/og";
import {
  readPortrait,
  readShareFonts,
  shareImageTheme as theme,
} from "@/components/seo/shareImageTheme";
import { shareImage } from "@/components/seo/shareMetadata";
import { profile } from "@/content/profile";

/**
 * Image de partage social (Open Graph / Twitter Card), générée au build.
 *
 * C'est l'aperçu qui s'affiche quand le lien du site est partagé sur LinkedIn,
 * Slack, WhatsApp, iMessage, etc. Elle est composée automatiquement à partir de
 * `profile.ts` et du portrait : aucun fichier à maintenir à la main, et le
 * visuel reste cohérent avec l'identité du portfolio.
 *
 * Next réutilise cette image pour la Twitter Card en l'absence de
 * `twitter-image`. Il ne l'injecte toutefois que sur les pages sans `openGraph`
 * propre : les autres la redéclarent via `shareMetadata`, d'où les dimensions
 * et le texte alternatif partagés avec `shareImage`. Les pages projet ont leur
 * propre image, dans la même direction artistique (`shareImageTheme`).
 */
export const alt = shareImage.alt;
export const size = { width: shareImage.width, height: shareImage.height };
export const contentType = shareImage.type;

export default async function OpengraphImage() {
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
            {`${profile.localities.join(" · ")} — paulhoudebine.com`}
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
