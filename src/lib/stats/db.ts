import "server-only";
import postgres from "postgres";

/**
 * Base des statistiques : Postgres (Neon, relié au projet dans Vercel, qui
 * fournit DATABASE_URL). Sans cette variable, rien n'est enregistré et la
 * page des statistiques le dit : le site marche à l'identique.
 *
 * Une seule connexion par instance (fonctions sans état de Vercel), sans
 * requêtes préparées : l'adresse « pooled » de Neon passe par PgBouncer.
 */

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;
let ready: Promise<void> | null = null;

export function statsDatabase(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) {
    client = postgres(url, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      // Neon exige le chiffrement ; une base locale de test s'en passe.
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
      onnotice: () => {},
    });
  }
  return client;
}

/** Crée la table au premier besoin (une fois par instance) : rien à lancer à la main. */
export function ensureSchema(sql: Sql): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        create table if not exists portfolio_events (
          id bigint generated always as identity primary key,
          at timestamptz not null,
          session text not null,
          name text not null,
          path text not null,
          target text,
          value real,
          device text,
          country text,
          referrer text,
          locale text,
          theme text
        )
      `;
      await sql`create index if not exists portfolio_events_at on portfolio_events (at)`;
      await sql`create index if not exists portfolio_events_session on portfolio_events (session, at)`;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}
