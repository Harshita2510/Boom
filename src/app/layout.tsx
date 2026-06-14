import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteConfig.url),
  icons: {
    apple: "/icons/icon.svg",
    icon: "/icons/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name
  },
  applicationName: siteConfig.name
};

export const viewport: Viewport = {
  themeColor: "#0f172a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers>
            <PWARegister />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
