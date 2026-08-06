import type { Metadata, Viewport } from "next";
import "./globals.css";

// Google Fonts are loaded via a standard <link> tag below (runtime, in the
// browser) rather than next/font, so the project can build in fully
// offline / network-restricted environments. Swap for next/font/google if
// you prefer build-time font optimization and have network access.

export const metadata: Metadata = {
  title: "Lucky Claw Machine — Arcade Prize Grabber",
  description:
    "A neon arcade claw machine game. Insert a coin, steer the claw, and grab cute plushies, gems, and mystery prizes!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0518",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
