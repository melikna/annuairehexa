'use client'

import React from 'react'
import Link from 'next/link'
import { HexaLogo } from '@/components/layout/HexaLogo'
import { Cookie, Mail, MapPin, Building, ShieldCheck } from 'lucide-react'

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgu', label: 'Conditions Générales d\'Utilisation' },
  { href: '/confidentialite', label: 'Politique de confidentialité (RGPD)' },
  { href: '/contact', label: 'Contact & Support' },
  { href: '/correction', label: 'Opposition & Rectification (RGPD)' },
]

const INFO_LINKS = [
  { href: '/methodologie', label: 'Méthodologie' },
  { href: '/sources', label: 'Sources des données' },
  { href: '/couverture', label: 'Couverture du territoire' },
  { href: '/guides/lire-une-fiche', label: 'Comment lire une fiche ?' },
  { href: '/guides/siren-siret', label: 'SIREN / SIRET : comprendre' },
]

const EXPLORE_LINKS = [
  { href: '/procedures-collectives', label: 'Liquidations & Redressements' },
  { href: '/regions', label: 'Régions de France' },
  { href: '/departements', label: 'Départements' },
  { href: '/villes', label: 'Grandes Villes' },
  { href: '/secteurs', label: 'Secteurs d\'activité NAF' },
]

export function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'
  const currentYear = new Date().getFullYear()

  const handleOpenCookiePreferences = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_cookie_preferences'))
    }
  }

  return (
    <footer className="bg-gray-950 text-gray-300 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Informations éditeur */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-3">
              <span className="flex items-baseline tracking-tight">
                <span className="text-xl font-extrabold text-white tracking-tight">Annuaire</span>
                <span className="text-xl font-black text-blue-400 ml-0.5">hexa</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5 self-center inline-block" />
              </span>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Portail indépendant d'information économique et répertoire national des entreprises françaises,
              alimenté par les bases de données publiques ouvertes (Insee Sirene, RNE, BODACC).
            </p>

            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-gray-200">Informations Éditeur :</p>
              <p>Édité par : <strong>Mélik Nakhla</strong></p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                60 rue François 1er, 75008 Paris
              </p>
              <p className="flex items-center gap-1">
                <Building className="w-3 h-3 text-gray-500 shrink-0" />
                SIRET : 753 719 996 00054
              </p>
              <p className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                <a href="mailto:contact@annuairehexa.fr" className="text-blue-400 hover:underline">
                  contact@annuairehexa.fr
                </a>
              </p>
            </div>
          </div>

          {/* Explorer */}
          <div>
            <h2 className="text-white text-sm font-semibold mb-3">Explorer l'annuaire</h2>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h2 className="text-white text-sm font-semibold mb-3">Guides &amp; Référentiels</h2>
            <ul className="space-y-2">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal et RGPD */}
          <div>
            <h2 className="text-white text-sm font-semibold mb-3">Légal &amp; Données personnelles</h2>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Gestion des cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre inférieure */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-xs text-gray-500">
              © {currentYear} {siteName}. Réutilisation d'informations publiques ouvertes sous{' '}
              <a
                href="https://www.etalab.gouv.fr/licence-ouverte-open-licence"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-300"
              >
                Licence Ouverte 2.0 (Etalab)
              </a>
              . Base Sirene Insee &amp; BODACC. Non affilié à l'INSEE ni à l'administration publique.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <Link
                href="/cgu"
                className="text-gray-400 hover:text-white transition-colors"
              >
                CGU
              </Link>
              <Link
                href="/correction"
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Exercer mes droits RGPD
              </Link>
            </div>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
            <a
              href="https://www.sitetoclient.com/"
              title="Création de site internet"
              className="hover:text-white hover:underline transition-colors"
            >
              Création de site internet
            </a>
            <a
              href="https://wmn-digital.fr"
              title="Formation IA"
              className="hover:text-white hover:underline transition-colors"
            >
              Formation IA
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
