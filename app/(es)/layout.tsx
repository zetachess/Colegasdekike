import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://colegasdekike.vercel.app"),
  title: "🏆 Colegas de Kike",
  description: "Clasificación de puntos de los torneos de Colegas de Kike en Lichess.",
  alternates: { canonical: "/es", languages: { es: "/es", en: "/", fr: "/fr" } },
  openGraph: {
    title: "🏆 Colegas de Kike",
    description: "Los jugadores que más suman, esta semana y de siempre.",
    type: "website",
  },
};

export default function SpanishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
