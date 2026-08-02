import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Solicate OS", template: "%s · Solicate OS" },
  description: "Internal agency operating system for Solicate.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
