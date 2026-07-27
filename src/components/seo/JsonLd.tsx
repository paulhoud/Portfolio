/**
 * Injecte un bloc de données structurées JSON-LD.
 *
 * Rendu côté serveur dans un `<script type="application/ld+json">`, format
 * recommandé par Google. Le composant est volontairement minimal : les schémas
 * eux-mêmes vivent dans `schemas.ts`.
 */
export function JsonLd({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      // Contenu maîtrisé (construit à partir de profile.ts / projects.ts).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
