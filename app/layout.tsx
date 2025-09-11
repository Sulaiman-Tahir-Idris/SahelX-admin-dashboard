import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata = {
  title: "SahelX Admin Dashboard",
  description: "Admin dashboard for SahelX delivery service",
  icons: {
    icon: [
      {
        url: "/images/white1.png",
        sizes: "any",
      },
      {
        url: "/images/white1.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/images/white1.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/images/white1.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/images/white1.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  generator: 'CodeCrafter17'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/white1.png" sizes="any" />
        <link rel="icon" href="/images/white1.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
