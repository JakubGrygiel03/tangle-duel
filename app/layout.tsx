import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { PwaRegister } from "@/components/game/PwaRegister";
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
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
