/**
 * Ce qui, du thème (cf. `theme.ts`), doit aussi servir côté serveur : la clé de
 * stockage et le script posé dans <head>. Ce fichier n'est pas un module client :
 * une constante exportée d'un module « use client » n'arrive pas telle quelle
 * dans un composant serveur comme le layout.
 */

export const THEME_STORAGE_KEY = "portfolio-theme";

/**
 * Exécuté dans <head>, avant tout affichage : une page claire ne s'affiche
 * jamais d'abord en sombre. Même règle que `applyTheme`, sans attendre React.
 */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
