import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demande de modification ou suppression de données — Droit d\'opposition RGPD',
  description:
    'Exercez vos droits RGPD (rectification, effacement, opposition statut de diffusion) concernant les données d\'entreprises publiées sur Annuairehexa.',
  alternates: {
    canonical: '/correction',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CorrectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
