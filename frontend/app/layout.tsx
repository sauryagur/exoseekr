import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { AppTour } from "@/components/simple-tour"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "ExoSeekr - AI Exoplanet Detection Platform",
    template: "%s | ExoSeekr"
  },
  description: "Professional AI-driven platform for detecting exoplanet transits in TESS/Kepler light curves. Built for astronomical research with machine learning techniques.",
  keywords: [
    "exoplanet detection",
    "artificial intelligence",
    "machine learning",
    "astronomy",
    "astrophysics",
    "TESS",
    "Kepler",
    "transit photometry",
    "research platform",
    "NASA data analysis"
  ],
  authors: [
    { name: "Aaarat Chadda" },
    { name: "Muhir Kapoor" },
    { name: "Saurya Gur" }
  ],
  creator: "ExoSeekr Research Team",
  publisher: "ExoSeekr",
  applicationName: "ExoSeekr",
  classification: "Research Software",
  category: "Scientific Research",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    nosnippet: true,
    noimageindex: true,
  },
  openGraph: {
    title: "ExoSeekr - AI Exoplanet Detection Platform",
    description: "Professional AI-driven platform for detecting exoplanet transits in TESS/Kepler light curves",
    type: "website",
    locale: "en_US",
    siteName: "ExoSeekr",
  },
  twitter: {
    card: "summary",
    title: "ExoSeekr - AI Exoplanet Detection Platform",
    description: "Professional AI-driven platform for detecting exoplanet transits in TESS/Kepler light curves",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
                <Suspense fallback={null}>{children}</Suspense>\n        <AppTour />"
      </body>
    </html>
  )
}
