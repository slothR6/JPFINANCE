import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "JPFINANCE | Seu controle financeiro pessoal",
    template: "%s | JPFINANCE",
  },
  description:
    "Organize receitas, despesas, contas e dívidas em um espaço pessoal, claro e tranquilo.",
  applicationName: "JPFINANCE",
  icons: {
    icon: [{ url: "/branding/jpfinance-mark.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/branding/jpfinance-mark.png", type: "image/png", sizes: "512x512" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
