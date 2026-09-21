'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X } from 'lucide-react'
import { InstantSearchAutocomplete } from '@/components/search/InstantSearchAutocomplete'
import { HexaLogo } from '@/components/layout/HexaLogo'

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/recherche', label: 'Recherche' },
  { href: '/procedures-collectives', label: 'Liquidations & Alertes' },
  { href: '/regions', label: 'Régions' },
  { href: '/departements', label: 'Départements' },
  { href: '/secteurs', label: 'Secteurs' },
  { href: '/methodologie', label: 'Méthodologie' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
      >
        Aller au contenu principal
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Annuairehexa */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label={`${siteName} — Retour à l'accueil`}
          >
            <HexaLogo />
          </Link>

          {/* Recherche rapide desktop avec autocomplétion intelligente */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <InstantSearchAutocomplete
              variant="header"
              placeholder="Recherche instantanée (nom, SIREN, ville…)"
              id="header-instant-search"
            />
          </div>

          {/* Navigation desktop */}
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bouton menu mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-blue-700 hover:bg-gray-100"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen
              ? <X className="w-5 h-5" aria-hidden="true" />
              : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden pb-4">
            {/* Recherche mobile intelligente */}
            <div className="mb-3">
              <InstantSearchAutocomplete
                variant="header"
                placeholder="Entreprise, SIREN, ville…"
                id="mobile-instant-search"
              />
            </div>

            {/* Liens de navigation mobile */}
            <nav aria-label="Navigation mobile">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
