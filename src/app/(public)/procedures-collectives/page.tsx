import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ProceduresCollectivesWidget } from '@/components/procedures/ProceduresCollectivesWidget'
import { fetchProceduresCollectives } from '@/lib/procedures/procedures-service'
import { FALLBACK_DEPARTEMENTS } from '@/lib/geo/referentiel-data'
import {
  ShieldAlert,
  Scale,
  Calendar,
  Building2,
  HelpCircle,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Liquidations et Redressements Judiciaires — Annonces BODACC en direct',
  description:
    'Consultez la liste complète des liquidations judiciaires, redressements et procédures collectives publiées au BODACC en France. Alertes légales, filtrage par date et par département.',
  alternates: {
    canonical: '/procedures-collectives',
  },
  openGraph: {
    title: 'Liquidations et Redressements Judiciaires — Annonces BODACC en direct',
    description:
      'Suivez les défaillances d\'entreprises en temps réel : liquidations, redressements judiciaires et sauvegardes classés par département et par date.',
    url: '/procedures-collectives',
    type: 'website',
  },
}

export default async function ProceduresCollectivesPage({
  searchParams,
}: {
  searchParams: Promise<{ departement?: string; nature?: string }>
}) {
  const params = await searchParams
  const departement = params.departement || 'all'
  const nature = (params.nature as any) || 'all'

  // Pré-chargement côté serveur pour un référencement SEO 100% optimisé
  const initialData = await fetchProceduresCollectives({
    departement,
    nature,
    limit: 24,
  })

  // Balisage structuré Schema.org ItemList pour Google
  const schemaItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Dernières liquidations et redressements judiciaires publiés au BODACC',
    description: 'Liste chronologique des annonces légales de procédures collectives en France.',
    numberOfItems: initialData.results.length,
    itemListElement: initialData.results.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'NewsArticle',
        headline: `${item.natureLibelle} : ${item.denomination}`,
        datePublished: item.datePublication,
        articleSection: 'Procédures collectives',
        publisher: {
          '@type': 'Organization',
          name: 'Annuairehexa',
        },
        about: {
          '@type': 'Organization',
          name: item.denomination,
          taxID: item.siren || undefined,
          address: {
            '@type': 'PostalAddress',
            addressLocality: item.ville || undefined,
            postalCode: item.codePostal || undefined,
            addressCountry: 'FR',
          },
        },
      },
    })),
  }

  // Balisage Schema.org FAQPage pour capturer les rich snippets
  const schemaFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Qu\'est-ce qu\'une liquidation judiciaire ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La liquidation judiciaire est une procédure collective destinée à mettre fin à l\'activité d\'une entreprise en cessation des paiements dont le redressement est manifestement impossible. Ses biens sont alors vendus et ses actifs réalisés pour désintéresser les créanciers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quelle est la différence entre un redressement et une liquidation judiciaire ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Le redressement judiciaire intervient lorsqu\'une entreprise en cessation des paiements a des perspectives de poursuite d\'activité et de maintien de l\'emploi grâce à un plan de continuation. La liquidation judiciaire, en revanche, prononce la cessation définitive de l\'activité et la dissolution de la structure.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quel est le délai légal pour déclarer une créance ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Conformément aux articles L. 622-24 et R. 622-21 du Code de commerce, les créanciers disposent d\'un délai légal de deux mois à compter de la publication de la décision d\'ouverture au BODACC pour déclarer leurs créances auprès du mandataire judiciaire ou liquidateur désigné.',
        },
      },
      {
        '@type': 'Question',
        name: 'Où sont publiées les annonces officielles de procédures collectives ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Toutes les décisions de justice relatives aux procédures collectives sont obligatoirement publiées au BODACC (Bulletin Officiel des Annonces Civiles et Commerciales), édité par la Direction de l\'Information Légale et Administrative (DILA).',
        },
      },
    ],
  }

  return (
    <PublicLayout>
      {/* Balisages Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Fil d'Ariane */}
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Procédures collectives (Liquidations & Redressements)' },
          ]}
        />

        {/* En-tête de la page */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Flux légal DILA / BODACC actualisé
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            Liquidations et Redressements Judiciaires en France
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-4xl leading-relaxed">
            Consultez le registre exhaustif des annonces légales de défaillances d'entreprises : jugements d'ouverture de liquidation judiciaire, redressements judiciaires, procédures de sauvegarde et jugements de clôture prononcés par les Tribunaux de Commerce et Judiciaires.
          </p>
        </header>

        {/* L'Encart interactif principal */}
        <ProceduresCollectivesWidget
          initialData={initialData}
          defaultDepartement={departement}
          defaultNature={nature}
          title="Observatoire des Défaillances d'Entreprises"
          subtitle="Données publiques issues du BODACC, actualisées quotidiennement et classées par date de publication et par département."
          showViewAllLink={false}
          limit={24}
        />

        {/* Navigation rapide par département */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              Accès rapide aux défaillances par département
            </h2>
            <span className="text-xs text-gray-500">101 départements français</span>
          </div>
          <p className="text-sm text-gray-600">
            Sélectionnez un département pour filtrer instantanément les jugements de liquidation et de redressement de votre zone géographique :
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pt-2 text-xs">
            {FALLBACK_DEPARTEMENTS.map((dep) => (
              <Link
                key={dep.code}
                href={`/procedures-collectives?departement=${dep.code}`}
                className={`p-2 rounded-lg border text-center transition-all hover:border-red-400 hover:bg-red-50/50 hover:text-red-900 ${
                  departement === dep.code
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <div className="font-bold">{dep.code}</div>
                <div className="truncate text-[11px] opacity-90">{dep.nom}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Guide Juridique et Informations Clés SEO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Liquidation Judiciaire</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Procédure collective ouverte à l'encontre d'un débiteur en état de cessation des paiements et dont le redressement financier est manifestement impossible. Elle entraîne l'arrêt des poursuites individuelles et le dessaisissement du dirigeant au profit du liquidateur judiciaire.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Redressement Judiciaire</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Procédure collective destinée à permettre la poursuite de l'activité économique de l'entreprise, le maintien de l'emploi et l'apurement du passif. Elle débute par une période d'observation pouvant aboutir à un plan de continuation ou de cession.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Délai de déclaration : 2 mois</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Les créanciers d'une entreprise faisant l'objet d'une procédure collective disposent d'un délai strict de <strong>deux mois</strong> à compter de la publication de l'avis au BODACC pour faire parvenir leur déclaration de créance au mandataire ou liquidateur judiciaire.
            </p>
          </div>
        </section>

        {/* Section FAQ SEO pour Rich Snippets */}
        <section className="bg-slate-50 border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Questions Fréquentes sur les Procédures Collectives</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 text-sm">Comment savoir si une entreprise est en redressement ou liquidation ?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Recherchez l'entreprise sur notre annuaire par son numéro SIREN ou son nom. Chaque fiche entreprise intègre un diagnostic en direct des publications du BODACC signalant immédiatement tout jugement de liquidation, redressement ou sauvegarde.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 text-sm">Que devient une entreprise en liquidation judiciaire ?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le tribunal nomme un liquidateur judiciaire qui prend la direction des opérations pour vendre les actifs (stocks, matériel, créances) et rembourser les dettes dans l'ordre légal des privilèges. À l'issue, un jugement de clôture pour extinction du passif ou pour insuffisance d'actif est prononcé.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 text-sm">Comment faire une déclaration de créances ?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                La déclaration doit être adressée par lettre recommandée avec avis de réception ou déposée sur le portail numérique officiel des mandataires judiciaires (Creditors Services). Elle doit comporter le montant détaillé des sommes dues, la date d'exigibilité et les pièces justificatives (factures, bons de commande).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 text-sm">Les décisions publiées au BODACC font-elles foi ?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Oui, le Bulletin Officiel des Annonces Civiles et Commerciales (BODACC) est le support légal authentique de la DILA pour rendre opposables aux tiers les jugements d'ouverture, de conversion et de clôture de procédures collectives.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
