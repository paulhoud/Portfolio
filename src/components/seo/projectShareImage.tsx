import { ImageResponse } from "next/og";
import {
  readPortrait,
  readShareFonts,
  shareImageTheme as theme,
} from "@/components/seo/shareImageTheme";
import { shareImage } from "@/components/seo/shareMetadata";
import { profile, siteUrl } from "@/content/profile";
import type { Project } from "@/content/projects";

const size = { width: shareImage.width, height: shareImage.height };

/**
 * Image de partage d'un projet : son eyebrow et son titre, signés du portrait,
 * dans la direction artistique de l'image du site. Commune aux pages
 * françaises et anglaises (chacune passe son projet traduit).
 */
export async function renderProjectShareImage(project: Pick<Project, "eyebrow" | "title">) {
  const [portraitSrc, fonts] = await Promise.all([readPortrait(), readShareFonts()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px 90px",
          background: theme.background,
          color: theme.text,
          fontFamily: theme.fontFamily,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            maxWidth: 1000,
          }}
        >
          {/* Même casse et même approche que l'eyebrow des pages projet. */}
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              lineHeight: 1.4,
              textTransform: "uppercase",
              color: theme.accent,
            }}
          >
            {project.eyebrow}
          </div>
          <div style={{ fontSize: 104, fontWeight: 700, marginTop: 20, lineHeight: 1.05 }}>
            {project.title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {/* `next/image` n'est pas utilisable ici : le rendu est effectué par
              Satori, qui n'interprète que des éléments HTML natifs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portraitSrc}
            alt=""
            width={76}
            height={76}
            style={{ borderRadius: 999, objectFit: "cover" }}
          />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 24 }}>
            <div style={{ fontSize: 28 }}>{profile.name}</div>
            <div style={{ fontSize: 22, color: theme.subtle, marginTop: 6 }}>
              {`${profile.jobTitle} - ${new URL(siteUrl).host}`}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
