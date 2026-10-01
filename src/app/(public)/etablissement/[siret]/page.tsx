import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSearchEngine } from '@/lib/search/engine'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CopyButton } from '@/components/ui/CopyButton'
import { Accordion } from '@/components/ui/Accordion'
import { formatSiren, formatSiret, formatTrancheEffectif } from '@/lib/publication/service'
import { calculateFrenchVAT, formatFrenchVAT, calculateSeniority } from '@/lib/seo/enterprise-content'
import {
  Building2,
  MapPin,
  Tag,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Store,
  FileText,
} from 'lucide-react'

export const revalidate = 3600 // 1 heure

interface EtablissementPageProps {
  params: Promise<{ siret: string }>
}

export async function generateMetadata({ params }: EtablissementPageProps): Promise<Metadata> {
  const { siret } = await params

  if (!/^\d{14}$/.test(siret)) {
    return { title: 'Établissement introuvable' }
  }

  const engine = getSearchEngine()
  const etab = await engine.getEtablissement(siret)

  if (!etab) {
    return { title: 'Établissement introuvable' }
  }

  const siren = siret.slice(0, 9)
  const ul = await engine.getUniteLegale(siren)
  const nomEntreprise = ul?.denominationAffichable ?? `Entreprise ${formatSiren(siren)}`
  const nomEtab = etab.enseigneAffichable ?? nomEntreprise
  const statut = etab.etatAdministratif === 'A' ? 'Ouvert' : 'Fermé'
  const lieu = etab.libelleCommune ? ` à ${etab.libelleCommune} (${etab.codePostal || ''})` : ''

  return {
    title: `${nomEtab}${lieu} (SIRET ${formatSiret(siret)}) : Adresse, Activité, Statut`,
    description: `Fiche légale de l'établissement ${nomEtab}${lieu}. SIRET ${siret} (${statut}). Activité ${
      etab.activitePrincipale || 'déclarée'
    }, adresse, entreprise de rattachement ${nomEntreprise} et données du répertoire Sirene INSEE.`,
    alternates: {
      canonical: `/etablissement/${siret}`,
    },
    openGraph: {
      title: `${nomEtab} - Établissement (SIRET ${formatSiret(siret)})`,
      description: `Consultez l'adresse, l'activité et le statut de l'établissement ${nomEtab} (${statut}). Données du répertoire Sirene.`,
      type: 'website',
    },
  }
}

export default async function EtablissementPage({ params }: EtablissementPageProps) {
  const { siret } = await params

  if (!/^\d{14}$/.test(siret)) {
    notFound()
  }

  const engine = getSearchEngine()
  const etab = await engine.getEtablissement(siret)

  if (!etab) {
    notFound()
  }

  const siren = etab.siren
  const ul = await engine.getUniteLegale(siren)
  const nomEntreprise = ul?.denominationAffichable ?? `Entreprise ${formatSiren(siren)}`
  const titre = etab.enseigneAffichable ?? nomEntreprise
  const isOpen = etab.etatAdministratif === 'A'
  const tva = calculateFrenchVAT(siren)
  const formattedTva = formatFrenchVAT(tva)
  const seniority = calculateSeniority(etab.dateCreation)

  // FAQ spécifique à l'établissement pour Google Rich Snippets
  const faq = [
    {
      question: `Quel est le numéro SIRET exact de cet établissement ?`,
      answer: `Le numéro SIRET de cet établissement est le ${siret} (${formatSiret(siret)}), rattaché au numéro SIREN ${siren} de l'entreprise ${nomEntreprise}.`,
    },
    {
      question: `Quelle est l'adresse déclarée de l'établissement ?`,
      answer: etab.adresseComplete
        ? `L'établissement est situé au : ${etab.adresseComplete}.`
        : etab.diffusionPartielle
        ? `L'adresse précise de cet établissement ne peut être communiquée publiquement suite à une demande d'opposition (statut P au répertoire Sirene).`
        : `L'adresse déclarée est consultable via le répertoire national Sirene de l'INSEE.`,
    },
    {
      question: `Cet établissement est-il le siège social de l'entreprise ?`,
      answer: etab.etablissementSiege
        ? `Oui, cet établissement constitue le siège social principal de l'entreprise ${nomEntreprise}.`
        : `Non, il s'agit d'un établissement secondaire de l'entreprise ${nomEntreprise}.`,
    },
    {
      question: `Quel est le code APE et l'activité exercée dans cet établissement ?`,
      answer: etab.activitePrincipale
        ? `L'activité principale exercée (code APE/NAF) au sein de cet établissement est ${etab.activitePrincipale}${
            etab.libelleActivite ? ` (${etab.libelleActivite})` : ''
          }.`
        : `Le code APE n'est pas précisé pour cet établissement.`,
    },
    {
      question: `Cet établissement est-il toujours en activité ?`,
      answer: isOpen
        ? `Oui, cet établissement est actuellement actif et ouvert.`
        : `Non, cet établissement a été déclaré fermé au sein du répertoire Sirene de l'INSEE.`,
    },
  ]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  // JSON-LD Schema.org LocalBusiness / Organization + BreadcrumbList + FAQPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}/etablissement/${siret}#business`,
        name: titre,
        url: `${siteUrl}/etablissement/${siret}`,
        parentOrganization: {
          '@type': 'Organization',
          name: nomEntreprise,
          identifier: siren,
          url: `${siteUrl}/entreprise/${siren}`,
        },
        identifier: [
          {
            '@type': 'PropertyValue',
            name: 'SIRET',
            value: siret,
          },
          {
            '@type': 'PropertyValue',
            name: 'SIREN',
            value: siren,
          },
        ],
        vatID: tva,
        ...(etab.adresseComplete
          ? {
              address: {
                '@type': 'PostalAddress',
                streetAddress: etab.adresseComplete,
                postalCode: etab.codePostal ?? undefined,
                addressLocality: etab.libelleCommune ?? etab.codeCommune ?? undefined,
                addressCountry: 'FR',
              },
            }
          : {}),
        ...(etab.coordonnees
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: etab.coordonnees.latitude,
                longitude: etab.coordonnees.longitude,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/etablissement/${siret}#breadcrumb`,
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
            name: nomEntreprise,
            item: `${siteUrl}/entreprise/${siren}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `Établissement ${siret}`,
            item: `${siteUrl}/etablissement/${siret}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/etablissement/${siret}#faq`,
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: nomEntreprise, href: `/entreprise/${siren}` },
            ...(etab.codeDepartement
              ? [{ label: `Département ${etab.codeDepartement}`, href: `/recherche?departement=${etab.codeDepartement}` }]
              : []),
            { label: `Établissement ${formatSiret(siret)}` },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Établissement */}
            <header className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-blue-700 shrink-0">
                  <Store className="w-8 h-8" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {etab.etablissementSiege && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                        Siège social
                      </span>
                    )}
                    <StatusBadge
                      etat={etab.etatAdministratif as 'A' | 'F' | 'C'}
                      entityType="etablissement"
                      size="sm"
                    />
                    {etab.diffusionPartielle && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        Adresse non diffusée (statut P)
                      </span>
                    )}
                    {seniority && isOpen && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
                        {seniority.isFuture ? `Création ${seniority.texte}` : `Créé il y a ${seniority.texte}`}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {titre}
                  </h1>
                  {etab.enseigneAffichable && (
                    <p className="text-sm text-gray-600 mt-1">
                      Entreprise parente :{' '}
                      <Link
                        href={`/entreprise/${siren}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {nomEntreprise}
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Raccourcis Copier */}
              <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Numéro SIRET</p>
                    <p className="font-mono font-bold text-gray-900 text-sm">{formatSiret(siret)}</p>
                  </div>
                  <CopyButton textToCopy={siret} label="Copier" />
                </div>

                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">SIREN de l'entreprise</p>
                    <p className="font-mono font-bold text-gray-900 text-sm">{formatSiren(siren)}</p>
                  </div>
                  <CopyButton textToCopy={siren} label="Copier" />
                </div>

                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Code APE Établissement</p>
                    <p className="font-mono font-bold text-gray-900 text-sm">{etab.activitePrincipale || '—'}</p>
                  </div>
                  {etab.activitePrincipale && (
                    <Link
                      href={`/activite/NAFRev2/${etab.activitePrincipale}`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Détails →
                    </Link>
                  )}
                </div>
              </div>

              {etab.adresseComplete && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="font-medium">{etab.adresseComplete}</span>
                </div>
              )}
            </header>

            {/* Fiche Technique Administrative */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Informations administratives de l'établissement
              </h2>
              <dl className="divide-y divide-gray-100">
                <InfoRow label="Numéro SIRET" value={<span className="font-mono font-bold text-gray-900">{formatSiret(siret)}</span>} />
                <InfoRow
                  label="Entreprise de rattachement"
                  value={
                    <Link
                      href={`/entreprise/${siren}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                    >
                      {nomEntreprise} (SIREN {formatSiren(siren)})
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  }
                />
                <InfoRow
                  label="Type d'établissement"
                  value={
                    <span className="font-medium">
                      {etab.etablissementSiege ? 'Siège social de l\'entreprise' : 'Établissement secondaire'}
                    </span>
                  }
                />
                <InfoRow
                  label="Statut d'activité"
                  value={
                    <span className={`font-semibold ${isOpen ? 'text-green-700' : 'text-gray-600'}`}>
                      {isOpen ? 'Actif / Ouvert' : 'Fermé'}
                    </span>
                  }
                />
                {etab.dateCreation && (
                  <InfoRow
                    label="Date d'ouverture déclarée"
                    value={
                      <span>
                        {new Date(etab.dateCreation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {seniority && (
                          <span className="ml-2 text-xs text-gray-500">
                            (il y a {seniority.texte})
                          </span>
                        )}
                      </span>
                    }
                  />
                )}
                {!isOpen && etab.dateFermeture && (
                  <InfoRow
                    label="Date de fermeture"
                    value={
                      <span className="text-red-700 font-medium">
                        {new Date(etab.dateFermeture).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                {etab.activitePrincipale && (
                  <InfoRow
                    label="Activité principale (APE)"
                    value={
                      <Link
                        href={`/activite/NAFRev2/${etab.activitePrincipale}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span className="font-mono font-bold">{etab.activitePrincipale}</span>
                        {etab.libelleActivite && (
                          <span className="ml-2 text-gray-700 font-normal">— {etab.libelleActivite}</span>
                        )}
                      </Link>
                    }
                  />
                )}
                <InfoRow
                  label="TVA Intracommunautaire"
                  value={<span className="font-mono font-bold text-gray-900">{formattedTva}</span>}
                />
                <InfoRow
                  label="Tranche d'effectifs salariés"
                  value={formatTrancheEffectif(etab.trancheEffectifs, etab.anneeEffectifs)}
                />
              </dl>
            </section>

            {/* FAQ Établissement */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Questions fréquentes sur cet établissement
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                Tout ce qu'il faut savoir sur la situation légale et géographique de cet établissement.
              </p>
              <Accordion
                items={faq.map((item, idx) => ({
                  id: `faq-etab-${idx}`,
                  title: item.question,
                  content: item.answer,
                }))}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Unité légale parente</h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Consultez la fiche complète de l'entreprise pour voir l'ensemble des établissements rattachés.
              </p>
              <Link
                href={`/entreprise/${siren}`}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Voir l'entreprise ({formatSiren(siren)}) →
              </Link>
            </div>

            {/* Maillage territorial */}
            {etab.codeCommune && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Zone d'implantation
                </h3>
                <div className="space-y-2 text-xs">
                  <Link
                    href={`/recherche?code_commune=${etab.codeCommune}`}
                    className="block text-blue-600 hover:underline"
                  >
                    → Autres établissements à {etab.libelleCommune || `Commune ${etab.codeCommune}`}
                  </Link>
                  {etab.codeDepartement && (
                    <Link
                      href={`/recherche?departement=${etab.codeDepartement}`}
                      className="block text-blue-600 hover:underline"
                    >
                      → Établissements dans le département {etab.codeDepartement}
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-xs text-gray-600 space-y-2">
              <h3 className="font-bold text-gray-900">Source publique</h3>
              <p className="text-sm text-gray-600 mt-1">
                Données publiques issues du répertoire national Insee Sirene (Licence Ouverte 2.0).
              </p>
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <Link href="/sources" className="block text-blue-600 hover:underline">
                  → Référentiels et licences
                </Link>
                <Link href="/correction" className="block text-blue-600 hover:underline">
                  → Signaler une anomalie
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
      <dt className="text-xs sm:text-sm text-gray-500 shrink-0 sm:w-52">{label}</dt>
      <dd className="text-xs sm:text-sm text-gray-900 text-left sm:text-right font-medium">{value}</dd>
    </div>
  )
}
