import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://colegasdekike.vercel.app"),
  title: "🏆 Colegas de Kike",
  description: "Classement des points des tournois de Colegas de Kike sur Lichess.",
  alternates: { canonical: "/fr", languages: { es: "/es", en: "/", fr: "/fr" } },
  openGraph: {
    title: "🏆 Colegas de Kike",
    description: "Les joueurs qui marquent le plus de points cette semaine et depuis le début.",
    type: "website",
  },
};

export default function FrenchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}<Analytics /></body></html>;
}
