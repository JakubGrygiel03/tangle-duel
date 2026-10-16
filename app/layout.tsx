import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Tangle Duel",
  title: "Tangle Duel",
  description:
    "Rozplącz świetliste struny. Minimalistyczna łamigłówka dotykowa w pionie.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tangle Duel",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${outfit.variable} h-full antialiased`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
