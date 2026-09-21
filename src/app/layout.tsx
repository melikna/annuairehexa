import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  'Annuairehexa — Annuaire national des entreprises et établissements français (Insee Sirene & BODACC)'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Préchargement de la police Marianne si disponible */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* ads.txt géré via le fichier public/ads.txt */}
      </head>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
        {/* Le script CMP est injecté conditionnellement par le composant CmpLoader */}
        {/* Le script AdSense est injecté uniquement si NEXT_PUBLIC_ADSENSE_ENABLED=true */}
        {/* Ces deux chargements sont gérés côté client pour respecter le consentement */}
      </body>
    </html>
  )
}
