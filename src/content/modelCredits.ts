/**
 * Modèles 3D de la galerie dont la licence demande de citer l'auteur
 * (fichiers de public/models, trouvés par Paul sur Sketchfab). Les autres
 * modèles sont sous licence « Sketchfab Standard », sans mention obligatoire.
 */
export type ModelCredit = {
  title: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
};

export const MODEL_CREDITS: ModelCredit[] = [
  {
    title: "Shiba",
    author: "zixisun02",
    source: "https://sketchfab.com/3d-models/shiba-faef9fe5ace445e7b2989d1c1ece361c",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
];
