import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://colegasdekike.vercel.app"),
  title: "🏆 Colegas de Kike",
  description: "Tournament points leaderboard for Colegas de Kike on Lichess.",
  alternates: { canonical: "/", languages: { es: "/es", en: "/", fr: "/fr" } },
  openGraph: {
    title: "🏆 Colegas de Kike",
    description: "The highest-scoring players this week and all time.",
    type: "website",
  },
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Analytics /></body></html>;
}
