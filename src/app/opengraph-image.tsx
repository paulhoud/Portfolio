import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
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
 * `twitter-image`.
 */
export const alt = `${profile.name} — ${profile.jobTitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const portrait = await readFile(
    path.join(process.cwd(), "public", profile.photo.replace(/^\//, "")),
  );
  const portraitSrc = `data:image/jpeg;base64,${portrait.toString("base64")}`;

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
          background: "linear-gradient(120deg, #191820 0%, #14131a 100%)",
          color: "#f5f2f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#46ebb5",
            }}
          >
            {profile.jobTitle}
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, marginTop: 18, lineHeight: 1.05 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 30, color: "rgba(245,242,244,0.66)", marginTop: 26 }}>
            Interfaces, design system et identité digitale
          </div>
          <div style={{ fontSize: 24, color: "rgba(245,242,244,0.42)", marginTop: 40 }}>
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
    size,
  );
}
