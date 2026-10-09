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

// Aucun aujourd’hui : le shiba (CC BY 4.0, zixisun02) a été remplacé par
// un chiot sous licence « Sketchfab Standard ».
export const MODEL_CREDITS: ModelCredit[] = [];
