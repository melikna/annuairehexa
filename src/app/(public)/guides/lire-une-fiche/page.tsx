import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FileText, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Comment lire et analyser une fiche entreprise — Guide Annuairehexa',
  description:
    'Guide complet pour décrypter les informations légales d\'une entreprise : état administratif, SIREN, code APE, procédures collectives BODACC, TVA et dirigeants.',
  alternates: { canonical: '/guides/lire-une-fiche' },
  openGraph: {
    title: 'Comment lire et analyser une fiche entreprise — Annuairehexa',
    description: 'Comprendre toutes les données légales, judiciaires et financières publiées sur une fiche entreprise.',
    type: 'article',
  },
}

export default function LireUneFichePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${siteUrl}/guides/lire-une-fiche#article`,
        headline: 'Comment lire et analyser une fiche entreprise sur Annuairehexa',
        description: 'Guide pratique pour interpréter les informations légales et juridiques issues de l\'INSEE et du BODACC.',
        url: `${siteUrl}/guides/lire-une-fiche`,
        publisher: {
          '@type': 'Organization',
          name: 'Annuairehexa',
          url: siteUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/guides/lire-une-fiche#breadcrumb`,
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
            name: 'Comment lire une fiche ?',
            item: `${siteUrl}/guides/lire-une-fiche`,
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
            { label: 'Comment lire une fiche ?' },
          ]}
        />

        <article className="mt-6 prose prose-blue max-w-none">
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
              <FileText className="w-3.5 h-3.5" />
              Guide pratique
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Comment lire et vérifier une fiche entreprise ?
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Toutes les clés pour décrypter les données issues des répertoires officiels (INSEE Sirene, RNE, BODACC) et vous prémunir contre les risques commerciaux.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              1. L'état administratif de l'entreprise
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              L'état administratif indique si l'unité légale est toujours en exercice ou si elle a cessé son activité :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Active (A) :</strong> L'entreprise est juridiquement vivante et peut contracter, émettre des factures et employer des salariés.
              </li>
              <li>
                <strong>Cessée (C) :</strong> L'entreprise a été radiée ou a fait l'objet d'une cessation totale d'activité. Elle ne doit plus émettre de nouvelles factures.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              2. La veille défaillance et les procédures collectives (BODACC)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Bulletin Officiel des Annonces Civiles et Commerciales (BODACC) publie l'ensemble des jugements rendus par les tribunaux de commerce :
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-gray-800 space-y-3">
              <p>
                <strong>Procédure de sauvegarde :</strong> L'entreprise rencontre des difficultés qu'elle n'est pas en mesure de surmonter seule, mais n'est pas encore en cessation de paiements.
              </p>
              <p>
                <strong>Redressement judiciaire :</strong> L'entreprise est en cessation de paiements mais la poursuite de l'activité est jugée envisageable avec un plan d'apurement du passif.
              </p>
              <p>
                <strong>Liquidation judiciaire :</strong> La situation est irrémédiablement compromise. L'activité s'arrête et les actifs sont vendus pour désintéresser les créanciers.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              3. Le numéro de TVA intracommunautaire
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              En France, le numéro de TVA intracommunautaire commence par <strong>FR</strong>, suivi d'une clé de 2 chiffres ou lettres, puis des 9 chiffres du SIREN.
              Il est indispensable pour valider une relation commerciale B2B dans l'Union Européenne et éviter les fraudes à la facturation.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              4. Code NAF / APE et Convention Collective
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Attribué par l'INSEE lors de l'immatriculation, le code APE (Activité Principale Exercée) détermine la branche professionnelle de l'entreprise ainsi que la convention collective applicable (IDCC) pour ses salariés.
            </p>
          </section>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Besoin de vérifier une entreprise dès maintenant ?</h3>
              <p className="text-sm text-gray-600">Recherchez par nom, SIREN ou dirigeant dans notre moteur intelligent.</p>
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
