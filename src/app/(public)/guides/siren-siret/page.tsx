import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Hash, CheckCircle, HelpCircle, Building2, MapPin, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Différence entre SIREN et SIRET : Définition, Calcul et Rôles — Annuairehexa',
  description:
    'Comprendre la différence entre numéro SIREN (9 chiffres) et numéro SIRET (14 chiffres). Attribution INSEE, code NIC, calcul de validité et rôle juridique.',
  alternates: { canonical: '/guides/siren-siret' },
  openGraph: {
    title: 'Différence entre SIREN et SIRET — Guide Annuairehexa',
    description: 'Tout savoir sur le SIREN et le SIRET : structure, différences et vérification légale.',
    type: 'article',
  },
}

export default function SirenSiretPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${siteUrl}/guides/siren-siret#article`,
        headline: 'Différence entre numéro SIREN et numéro SIRET',
        description: 'Guide complet sur l\'attribution, la structure et la signification des identifiants d\'entreprises en France.',
        url: `${siteUrl}/guides/siren-siret`,
        publisher: {
          '@type': 'Organization',
          name: 'Annuairehexa',
          url: siteUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/guides/siren-siret#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Guides',
            item: `${siteUrl}/methodologie`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'SIREN / SIRET',
            item: `${siteUrl}/guides/siren-siret`,
          },
        ],
      },
    ],
  }

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Guides' },
            { label: 'SIREN / SIRET : comprendre' },
          ]}
        />

        <article className="mt-6 prose prose-blue max-w-none">
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
              <Hash className="w-3.5 h-3.5" />
              Décryptage réglementaire
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              SIREN et SIRET : quelles différences et comment les utiliser ?
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Délivrés par l'INSEE lors de l'immatriculation d'une structure, ces deux identifiants uniques sont indispensables pour toute démarche commerciale ou administrative.
            </p>
          </div>

          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Le Numéro SIREN</h2>
                </div>
                <div className="text-3xl font-mono font-bold text-blue-700 mb-2 tracking-wider">
                  9 chiffres
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Identifie l'<strong>unité légale</strong> dans son ensemble (société, micro-entreprise, association). Il reste invariable durant toute la vie juridique de l'entreprise.
                </p>
              </div>

              <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Le Numéro SIRET</h2>
                </div>
                <div className="text-3xl font-mono font-bold text-indigo-700 mb-2 tracking-wider">
                  14 chiffres
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Identifie un <strong>établissement géographique précis</strong>. Composé des 9 chiffres du SIREN + 5 chiffres du Numéro Interne de Classement (NIC).
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              Comment est découpé un numéro SIRET ?
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-800 space-y-4">
              <div className="flex flex-wrap gap-2 items-center font-mono text-lg">
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md font-bold">123 456 789</span>
                <span className="text-gray-400 font-bold">+</span>
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-md font-bold">00012</span>
                <span className="text-gray-400 font-bold">=</span>
                <span className="bg-gray-800 text-white px-3 py-1.5 rounded-md font-bold">123 456 789 00012</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-200">
                <div>
                  <span className="font-bold text-blue-700">SIREN (9 chiffres) :</span> Identification de l'entreprise
                </div>
                <div>
                  <span className="font-bold text-indigo-700">NIC (5 chiffres) :</span> Numéro d'établissement (ex: 00014 pour le siège)
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              La règle de validation : Algorithme de Luhn
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tous les numéros SIREN et SIRET officiels attribués par l'INSEE répondent à la formule de la somme de contrôle dite <strong>clé de Luhn</strong>.
              Cette formule mathématique permet de vérifier instantanément la conformité syntaxique d'un numéro pour détecter les erreurs de frappe.
            </p>
          </section>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vérifier un numéro SIREN ou SIRET</h3>
              <p className="text-sm text-gray-600">Accédez instantanément à la fiche légale d'une entreprise immatriculée.</p>
            </div>
            <Link
              href="/recherche"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0"
            >
              Rechercher <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </div>
    </PublicLayout>
  )
}
