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
  title: "SahelX Admin Dashboard — Fast Moves, Northern Routes",
  description: "Delivery management system for SahelX — powering logistics across Northern Nigeria.",
  icons: {
    icon: [
      { url: "/images/white1.png", sizes: "any" },
      { url: "/images/white1.png", sizes: "16x16", type: "image/png" },
      { url: "/images/white1.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "android-chrome-192x192", url: "/images/white1.png" },
      { rel: "android-chrome-512x512", url: "/images/white1.png" },
    ],
  },
  manifest: "/site.webmanifest",
  generator: "SahelX",
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
        <link rel="icon" href="/images/white1.png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
