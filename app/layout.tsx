import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colegas de Kike — Clasificación",
  description: "Clasificación de puntos de los torneos de Colegas de Kike en Lichess.",
  openGraph: {
    title: "Colegas de Kike — Clasificación",
    description: "Los jugadores que más suman, esta semana y de siempre.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
