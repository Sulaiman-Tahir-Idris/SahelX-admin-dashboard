import type React from "react"
import { Inter, Sora } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

export const metadata = {
  metadataBase: new URL("https://x-circle.com"),
  title: "X Circle Playground",
  description: "X Circle Playground",
  openGraph: {
    title: "X Circle Playground",
    description: "X Circle Playground",
    url: "https://x-circle.com",
    siteName: "X Circle Playground",
    images: [
      {
        url: "/icons/SahelX%20Icons/web/icon-512.png",
        width: 512,
        height: 512,
        alt: "X Circle Playground Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/SahelX%20Icons/web/favicon.ico", sizes: "any" },
      { url: "/icons/SahelX%20Icons/web/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/SahelX%20Icons/web/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/SahelX%20Icons/web/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  generator: "X Circle",
}

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable}`}
    >
      <head>
        <link rel="icon" href="/icons/SahelX%20Icons/web/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/SahelX%20Icons/web/apple-touch-icon.png" />
        <meta name="theme-color" content="#D93C3C" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
