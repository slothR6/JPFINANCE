import type { Metadata } from "next";
import { IBM_Plex_Sans, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "Controle Financeiro Doméstico",
  description: "Aplicação web de controle financeiro pessoal para um lar compartilhado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${manrope.variable} ${ibmPlexSans.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

