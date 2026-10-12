import { Lato } from "next/font/google";

export const lato = Lato({
  subsets: ["latin"],
  // Seules les graisses réellement employées sont chargées. Les 300 et 900
  // n'apparaissent nulle part dans les styles : préchargées puis inutilisées,
  // elles déclenchaient un avertissement du navigateur à chaque page.
  // Lato n'existe ni en 500 ni en 600 : `font-medium` et `font-semibold`
  // retombent sur 400 et 700 par la règle de correspondance CSS.
  weight: ["400", "700"],
  variable: "--font-lato",
});
