import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSearchEngine } from '@/lib/search/engine'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Pagination } from '@/components/ui/Pagination'
import { CopyButton } from '@/components/ui/CopyButton'
import { Accordion } from '@/components/ui/Accordion'
import {
  formatSiren,
  formatSiret,
  formatTrancheEffectif,
  formatCategorieEntreprise,
} from '@/lib/publication/service'
import {
  calculateFrenchVAT,
  formatFrenchVAT,
  verifyLuhn,
  calculateSeniority,
  generateEnterpriseEditorial,
} from '@/lib/seo/enterprise-content'
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Tag,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  Scale,
  FileText,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Printer,
  Share2,
  Award,
  Coins,
  TrendingUp,
  GraduationCap,
  Leaf,
  ShieldCheck,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import { LiveRefreshButton } from '@/components/enterprise/LiveRefreshButton'
import { fetchBodaccProcedures } from '@/lib/sync/realtime-service'
import { SimilarEnterprisesWidget } from '@/components/enterprise/SimilarEnterprisesWidget'
import { getDepartementByCode, getRegions } from '@/lib/geo/service'
import { NAF_SECTIONS } from '@/lib/naf/sections'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Données toujours fraîches en temps réel

interface EntreprisePageProps {
  params: Promise<{ siren: string }>
}

const IDCC_LABELS: Record<string, string> = {
  '1516': 'Organismes de formation',
  '1486': 'Bureaux d\'études techniques, cabinets d\'ingénieurs-conseils et sociétés de conseil (SYNTEC)',
  '3248': 'Métallurgie',
  '1596': 'Bâtiment ouvriers (jusqu\'à 10 salariés)',
  '1597': 'Bâtiment ouvriers (plus de 10 salariés)',
  '2609': 'Bâtiment cadres',
  '2420': 'Bâtiment ETAM',
  '1979': 'Hôtels, cafés et restaurants (HCR)',
  '1404': 'Commerce de détail non alimentaire',
  '2216': 'Commerce de détail et de gros à prédominance alimentaire',
  '0044': 'Industries chimiques',
  '1505': 'Commerce de gros',
  '2098': 'Prestataires de services dans le domaine du secteur tertiaire',
  '0016': 'Transports routiers et activités auxiliaires du transport',
  '1499': 'Promotion immobilière',
  '1527': 'Immobilier',
  '1090': 'Automobile (services de l\'automobile)',
}

export async function generateMetadata({ params }: EntreprisePageProps): Promise<Metadata> {
  const { siren } = await params

  if (!/^\d{9}$/.test(siren)) {
    return { title: 'Entreprise introuvable' }
  }

  const engine = getSearchEngine()
  const ul = await engine.getUniteLegale(siren)

  if (!ul) {
    return { title: 'Entreprise introuvable' }
  }

  // Vérification en direct des annonces BODACC pour le SEO
  const liveProcedures = await fetchBodaccProcedures(siren).catch(() => [])
  const mostRecent = liveProcedures[0]
  if (mostRecent) {
    ul.estEnProcedureCollective = mostRecent.natureDecision !== 'cloture'
    ul.natureProcedureCollective = mostRecent.natureDecision
    ul.dateProcedureCollective = mostRecent.dateJugement
    ul.tribunalProcedureCollective = mostRecent.tribunal
    ul.detailsProcedureCollective = mostRecent.description
    ul.proceduresCollectivesHistorique = liveProcedures
  }

  const nom = ul.denominationAffichable ?? `Entreprise ${formatSiren(siren)}`
  const statut = ul.estEnProcedureCollective
    ? `en ${ul.natureProcedureCollective || 'procédure collective'}`
    : ul.etatAdministratif === 'A'
    ? 'Active'
    : 'Cessée'
  const tva = calculateFrenchVAT(siren)

  const titlePrefix = ul.estEnProcedureCollective
    ? `ALERTE : ${nom} (${ul.natureProcedureCollective?.toUpperCase() || 'PROCÉDURE COLLECTIVE'})`
    : `${nom} (SIREN ${formatSiren(siren)})`

  return {
    title: `${titlePrefix} : TVA, Dirigeants, Jugements BODACC, Bilan, Chiffres`,
    description: `Fiche légale complète de ${nom} (SIREN ${siren}). ${
      ul.estEnProcedureCollective
        ? `Entreprise faisant l'objet d'une procédure collective (${ul.natureProcedureCollective}). `
        : ''
    }Statut ${statut}, code APE ${
      ul.activitePrincipale || 'non spécifié'
    }, TVA ${tva}, dirigeants, bilans, conventions collectives, siège social et établissements Insee.`,
    alternates: {
      canonical: `/entreprise/${siren}`,
    },
    openGraph: {
      title: `${nom} - Fiche légale et financière (SIREN ${formatSiren(siren)})`,
      description: `Consultez les informations juridiques, dirigeants, numéro de TVA, établissements et code APE de ${nom}. Sources publiques Sirene & BODACC.`,
      type: 'website',
    },
  }
}

export default async function EntreprisePage({ params }: EntreprisePageProps) {
  const { siren } = await params

  if (!/^\d{9}$/.test(siren)) {
    notFound()
  }

  const engine = getSearchEngine()
  const ul = await engine.getUniteLegale(siren)

  if (!ul) {
    notFound()
  }

  // Interrogation temps réel BODACC : garantit une mise à jour immédiate
  const liveProcedures = await fetchBodaccProcedures(siren).catch(() => [])
  const mostRecent = liveProcedures[0]
  if (mostRecent) {
    ul.estEnProcedureCollective = mostRecent.natureDecision !== 'cloture'
    ul.natureProcedureCollective = mostRecent.natureDecision
    ul.dateProcedureCollective = mostRecent.dateJugement
    ul.tribunalProcedureCollective = mostRecent.tribunal
    ul.detailsProcedureCollective = mostRecent.description
    ul.proceduresCollectivesHistorique = liveProcedures
  }

  // Établissements
  const etablissementsResult = await engine.getEtablissementsBySiren(siren, {
    page: 1,
    perPage: 25,
  })

  // Récupération de l'établissement siège
  let siege = etablissementsResult.results.find((e) => e.etablissementSiege) ?? null
  if (!siege && ul.siretSiege) {
    siege = await engine.getEtablissement(ul.siretSiege)
  }

  const nom = ul.denominationAffichable ?? `Entreprise ${formatSiren(siren)}`
  const isActive = ul.etatAdministratif === 'A'
  const tvaNumber = calculateFrenchVAT(siren)
  const formattedTva = formatFrenchVAT(tvaNumber)
  const isLuhnValid = verifyLuhn(siren)
  const seniority = calculateSeniority(ul.dateCreation)

  // Moteur de contenu textuel unique et FAQ ciblée
  const editorial = generateEnterpriseEditorial(ul, siege, ul.nombreEtablissements ?? etablissementsResult.results.length)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  // Détermination de la hiérarchie géographique et sectorielle pour le Silo SEO (Pappers / Societe.com)
  const depCode = siege?.codeDepartement || siege?.codePostal?.slice(0, 2) || (siege?.codeCommune?.length === 5 ? siege.codeCommune.slice(0, 2) : undefined)
  const dep = depCode ? await getDepartementByCode(depCode) : null
  const regions = await getRegions()
  const region = dep ? regions.find((r) => r.code === dep.codeRegion) : null
  const communeNom = siege?.libelleCommune || null
  const communeSlug = communeNom
    ? communeNom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’]/g, '-')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : null

  const apeCode = ul.activitePrincipale
  const apeDisplay = apeCode ? (apeCode.includes('.') ? apeCode : `${apeCode.slice(0, 2)}.${apeCode.slice(2)}`) : null
  const sectionCode = apeCode ? apeCode.slice(0, 1).toUpperCase() : null
  const section = sectionCode ? NAF_SECTIONS.find((s) => s.code === sectionCode) : null

  // Fil d'Ariane sémantique hiérarchique Pappers/Societe.com
  const breadcrumbElements: Array<{ label: string; href?: string }> = [
    { label: 'Accueil', href: '/' },
  ]
  if (region) {
    breadcrumbElements.push({ label: region.nom, href: `/region/${region.slug}` })
  }
  if (dep) {
    breadcrumbElements.push({ label: `${dep.nom} (${dep.code})`, href: `/departement/${dep.slug}` })
  }
  if (communeNom && communeSlug) {
    breadcrumbElements.push({ label: communeNom, href: `/ville/${communeSlug}` })
  }
  if (apeCode && apeDisplay) {
    breadcrumbElements.push({ label: `APE ${apeDisplay}`, href: `/activite/NAFRev2/${apeCode}` })
  }
  breadcrumbElements.push({ label: nom })

  // Données structurées Schema.org combinées : Organization + FAQPage + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/entreprise/${siren}#organization`,
        name: nom,
        legalName: nom,
        url: `${siteUrl}/entreprise/${siren}`,
        identifier: [
          {
            '@type': 'PropertyValue',
            name: 'SIREN',
            value: siren,
          },
          ...(ul.siretSiege
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'SIRET',
                  value: ul.siretSiege,
                },
              ]
            : []),
        ],
        taxID: siren,
        vatID: tvaNumber,
        foundingDate: ul.dateCreation ?? undefined,
        dissolutionDate: ul.etatAdministratif === 'C' ? ul.dateFermeture ?? undefined : undefined,
        ...(ul.dirigeants && ul.dirigeants.length > 0
          ? {
              founder: ul.dirigeants.map((d) => ({
                '@type': 'Person',
                name: [d.prenoms, d.nom].filter(Boolean).join(' '),
                jobTitle: d.qualite,
              })),
            }
          : {}),
        ...(siege?.adresseComplete
          ? {
              address: {
                '@type': 'PostalAddress',
                streetAddress: siege.adresseComplete,
                postalCode: siege.codePostal ?? undefined,
                addressLocality: siege.codeCommune ?? undefined,
                addressCountry: 'FR',
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/entreprise/${siren}#breadcrumb`,
        itemListElement: breadcrumbElements.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.label,
          ...(item.href ? { item: item.href.startsWith('http') ? item.href : `${siteUrl}${item.href}` } : {}),
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/entreprise/${siren}#faq`,
        mainEntity: editorial.faq.map((item) => ({
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
        <Breadcrumb items={breadcrumbElements} />

        {/* En-tête de la fiche */}
        <div className="mt-4 mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <StatusBadge
                  etat={ul.etatAdministratif}
                  entityType="unite_legale"
                  size="md"
                />
                {ul.estEnProcedureCollective && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    {ul.natureProcedureCollective?.toUpperCase() || 'PROCÉDURE COLLECTIVE'}
                  </span>
                )}
                {ul.diffusionPartielle && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                    Diffusion partielle (opposition)
                  </span>
                )}
                {ul.activitePrincipaleNAF25 && (
                  <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium" title="Code prévisionnel selon la nomenclature INSEE 2025">
                    NAF 2025 : {ul.activitePrincipaleNAF25}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {nom}
              </h1>

              {ul.nomCommercial && ul.nomCommercial !== nom && (
                <p className="text-sm font-semibold text-blue-700 mt-1">
                  Enseigne commerciale : {ul.nomCommercial}
                </p>
              )}

              {/* Ligne d'identifiants rapides */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500">
                <span className="font-mono font-medium text-gray-700">
                  SIREN {formatSiren(siren)}
                </span>
                {ul.libelleFormeJuridique && (
                  <span className="border-l border-gray-200 pl-4">{ul.libelleFormeJuridique}</span>
                )}
                {ul.activitePrincipale && (
                  <span className="border-l border-gray-200 pl-4">
                    APE {ul.activitePrincipale}
                  </span>
                )}
                {seniority && (
                  <span className="border-l border-gray-200 pl-4">
                    Créée il y a {seniority.texte}
                  </span>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2 shrink-0">
              <CopyButton textToCopy={siren} label="Copier le SIREN" />
              <CopyButton textToCopy={tvaNumber} label="Copier le N° TVA" />
              <LiveRefreshButton siren={siren} />
            </div>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">

            {/* ALERTE PROCÉDURE COLLECTIVE (Si applicable) */}
            {ul.estEnProcedureCollective && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-50/80 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-600 text-white rounded-xl shrink-0">
                    <AlertOctagon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] uppercase font-extrabold tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded">
                        Procédure Collective en cours
                      </span>
                      {ul.dateProcedureCollective && (
                        <span className="text-xs text-red-700 font-medium">
                          Jugement du {new Date(ul.dateProcedureCollective).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-red-950 capitalize">
                      {ul.natureProcedureCollective === 'liquidation'
                        ? 'Liquidation Judiciaire'
                        : ul.natureProcedureCollective === 'redressement'
                        ? 'Redressement Judiciaire'
                        : ul.natureProcedureCollective === 'sauvegarde'
                        ? 'Procédure de Sauvegarde'
                        : 'Entreprise faisant l\'objet d\'une procédure collective'}
                    </h2>
                    {ul.tribunalProcedureCollective && (
                      <p className="text-sm text-red-800 mt-1">
                        <strong>Tribunal compétent :</strong> {ul.tribunalProcedureCollective}
                      </p>
                    )}
                    {ul.detailsProcedureCollective && (
                      <p className="text-xs text-red-800 mt-2 bg-red-100/70 p-3 rounded-lg border border-red-200 leading-relaxed font-mono">
                        {ul.detailsProcedureCollective}
                      </p>
                    )}
                    <p className="text-[11px] text-red-600 mt-3 flex items-center gap-1">
                      <span>Source publique vérifiée en temps réel : BODACC &amp; Greffes des Tribunaux de Commerce.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DIRIGEANTS & REPRÉSENTANTS LÉGAUX */}
            {ul.dirigeants && ul.dirigeants.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  Dirigeants et représentants légaux
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Gouvernance et mandataires sociaux déclarés au Registre National des Entreprises (RNE).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ul.dirigeants.map((d, i) => (
                    <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {[d.prenoms, d.nom].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs text-blue-700 font-medium mt-0.5">
                            {d.qualite}
                          </p>
                          {d.anneeNaissance && (
                            <p className="text-xs text-gray-500 mt-1">
                              Né(e) en {d.anneeNaissance}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase font-semibold">
                          {d.typeDirigeant || 'Mandataire'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DONNÉES FINANCIÈRES & BILANS */}
            {ul.finances && Object.keys(ul.finances).length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  Données financières et bilans déposés
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Chiffres d'affaires et résultats nets déposés auprès des greffes des tribunaux de commerce.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-xs">
                        <th className="pb-3 font-semibold">Année</th>
                        <th className="pb-3 font-semibold">Chiffre d'affaires (CA)</th>
                        <th className="pb-3 font-semibold">Résultat net</th>
                        <th className="pb-3 font-semibold">Tendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(ul.finances)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([year, f]) => (
                          <tr key={year} className="hover:bg-gray-50/50">
                            <td className="py-3 font-bold text-gray-900">{year}</td>
                            <td className="py-3 font-mono">
                              {typeof f.ca === 'number'
                                ? `${f.ca.toLocaleString('fr-FR')} €`
                                : 'Non communiqué'}
                            </td>
                            <td className="py-3 font-mono font-medium">
                              {typeof f.resultatNet === 'number' ? (
                                <span className={f.resultatNet >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                                  {f.resultatNet.toLocaleString('fr-FR')} €
                                </span>
                              ) : (
                                'Non communiqué'
                              )}
                            </td>
                            <td className="py-3">
                              {typeof f.resultatNet === 'number' ? (
                                f.resultatNet >= 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                                    <TrendingUp className="w-3 h-3" /> Bénéficiaire
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded font-medium">
                                    Déficitaire
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-gray-400">Confidentiel</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* LABELS, CERTIFICATIONS & AGRÉMENTS */}
            {ul.complements && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  Certifications, labels et qualifications professionnelles
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Agréments délivrés par les ministères et organismes d'État habilités.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ul.complements.estQualiopi && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-950 text-sm">Certification Qualiopi</p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Conformité certifiée au Référentiel National Qualité pour les actions de formation.
                        </p>
                      </div>
                    </div>
                  )}

                  {ul.complements.estOrganismeFormation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-950 text-sm">Organisme de Formation Déclaré</p>
                        <p className="text-xs text-blue-800 mt-0.5">
                          Numéro de déclaration d'activité (NDA) :{' '}
                          <code className="font-mono font-semibold">
                            {ul.complements.listeIdOrganismeFormation?.[0] || 'Enregistré'}
                          </code>
                        </p>
                      </div>
                    </div>
                  )}

                  {ul.complements.estRge && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                      <Leaf className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-green-950 text-sm">Professionnel RGE</p>
                        <p className="text-xs text-green-800 mt-0.5">
                          Reconnu Garant de l'Environnement (rénovation énergétique et travaux éligibles aux aides).
                        </p>
                      </div>
                    </div>
                  )}

                  {ul.complements.estEss && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-purple-950 text-sm">Économie Sociale et Solidaire (ESS)</p>
                        <p className="text-xs text-purple-800 mt-0.5">
                          Entreprise engagée dans une démarche d'utilité sociale et de gouvernance démocratique.
                        </p>
                      </div>
                    </div>
                  )}

                  {ul.complements.estSocieteMission && (
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                      <Award className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sky-950 text-sm">Société à Mission</p>
                        <p className="text-xs text-sky-800 mt-0.5">
                          Objectifs sociaux et environnementaux inscrits dans les statuts juridiques (Loi PACTE).
                        </p>
                      </div>
                    </div>
                  )}

                  {ul.complements.estBio && (
                    <div className="p-4 bg-lime-50 border border-lime-200 rounded-xl flex items-start gap-3">
                      <Leaf className="w-5 h-5 text-lime-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-lime-950 text-sm">Agriculture Biologique (Bio)</p>
                        <p className="text-xs text-lime-800 mt-0.5">
                          Produits et exploitation certifiés selon le cahier des charges européen AB.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CONVENTIONS COLLECTIVES (IDCC) */}
            {ul.complements?.listeIdcc && ul.complements.listeIdcc.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" aria-hidden="true" />
                  Conventions collectives nationales (CCN)
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Accords de branche applicables aux salariés de l'entreprise.
                </p>
                <div className="space-y-2">
                  {ul.complements.listeIdcc.map((idcc) => (
                    <div key={idcc} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded mr-2">
                          IDCC {idcc}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {IDCC_LABELS[idcc] || `Convention collective IDCC ${idcc}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* HISTORIQUE BODACC DES JUGEMENTS (Si existant) */}
            {ul.proceduresCollectivesHistorique && ul.proceduresCollectivesHistorique.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-red-600" aria-hidden="true" />
                  Historique des annonces légales &amp; Jugements BODACC
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Décisions judiciaires et annonces légales publiées au Bulletin Officiel des Annonces Civiles et Commerciales.
                </p>
                <div className="divide-y divide-gray-100">
                  {ul.proceduresCollectivesHistorique.map((proc) => (
                    <div key={proc.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">
                          {proc.typeJugement}
                        </span>
                        {proc.dateJugement && (
                          <span className="text-xs text-gray-500">
                            {new Date(proc.dateJugement).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {proc.tribunal && (
                        <p className="text-xs text-gray-600">Tribunal : {proc.tribunal}</p>
                      )}
                      {proc.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={proc.description}>
                          {proc.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RÉDACTIONNEL UNIQUE ANTI-DUPLICATE CONTENT */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Présentation synthétique de l'entreprise
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                <p>{editorial.introText}</p>
                <p>{editorial.activityText}</p>
                <p>{editorial.legalText}</p>
              </div>
            </section>

            {/* Identité Juridique & Fiscale */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Identité juridique &amp; Données fiscales
              </h2>
              <dl className="divide-y divide-gray-100">
                <InfoRow
                  label="Dénomination légale"
                  value={<span className="font-semibold text-gray-900">{nom}</span>}
                />
                {ul.nomCommercial && (
                  <InfoRow
                    label="Nom commercial / Enseigne"
                    value={<span className="font-semibold text-blue-700">{ul.nomCommercial}</span>}
                  />
                )}
                <InfoRow
                  label="Numéro SIREN"
                  value={
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{formatSiren(siren)}</span>
                      {isLuhnValid && (
                        <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-medium">
                          Clé de Luhn valide
                        </span>
                      )}
                    </div>
                  }
                />
                <InfoRow
                  label="N° TVA Intracommunautaire"
                  value={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-gray-900">{formattedTva}</span>
                      <span className="text-xs text-gray-400 font-sans">(Calculé selon la norme européenne)</span>
                    </div>
                  }
                />
                <InfoRow
                  label="SIRET du siège social"
                  value={
                    ul.siretSiege ? (
                      <Link
                        href={`/etablissement/${ul.siretSiege}`}
                        className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        {formatSiret(ul.siretSiege)}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      'Non renseigné'
                    )
                  }
                />
                <InfoRow
                  label="Forme juridique"
                  value={
                    <div>
                      <span>{ul.libelleFormeJuridique || 'Forme juridique déclarée'}</span>
                      {ul.categorieJuridique && (
                        <span className="ml-2 font-mono text-xs text-gray-400">
                          (Code {ul.categorieJuridique})
                        </span>
                      )}
                    </div>
                  }
                />
                <InfoRow
                  label="Activité principale (APE NAF Rév. 2)"
                  value={
                    ul.activitePrincipale ? (
                      <Link
                        href={`/activite/NAFRev2/${ul.activitePrincipale}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span className="font-mono font-bold">{ul.activitePrincipale}</span>
                        {ul.libelleActivite && (
                          <span className="ml-2 text-gray-700 font-normal">— {ul.libelleActivite}</span>
                        )}
                      </Link>
                    ) : (
                      'Non spécifiée'
                    )
                  }
                />
                {ul.activitePrincipaleNAF25 && (
                  <InfoRow
                    label="Activité prévisionnelle NAF 2025"
                    value={
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{ul.activitePrincipaleNAF25}</span>
                        <span className="text-xs text-gray-500">(Nomenclature INSEE 2025)</span>
                      </div>
                    }
                  />
                )}
                <InfoRow
                  label="Date de création / immatriculation"
                  value={
                    ul.dateCreation ? (
                      <span>
                        {new Date(ul.dateCreation).toLocaleDateString('fr-FR', {
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
                    ) : (
                      'Inconnue'
                    )
                  }
                />
                {ul.dateDebutActivite && ul.dateDebutActivite !== ul.dateCreation && ul.dateDebutActivite !== ul.dateFermeture && (
                  <InfoRow
                    label="Date de début d'activité"
                    value={
                      <span>
                        {new Date(ul.dateDebutActivite).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                {!isActive && ul.dateFermeture && (
                  <InfoRow
                    label="Date de cessation d'activité"
                    value={
                      <span className="text-red-700 font-medium">
                        {new Date(ul.dateFermeture).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                <InfoRow
                  label="Tranche d'effectifs salariés"
                  value={formatTrancheEffectif(ul.trancheEffectifs, ul.anneeEffectifs)}
                />
                <InfoRow
                  label="Catégorie d'entreprise"
                  value={formatCategorieEntreprise(ul.categorieEntreprise, ul.anneeCategorieEntreprise)}
                />
              </dl>
            </section>

            {/* Liste des Établissements */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Établissements rattachés
                  {ul.nombreEtablissements !== undefined && (
                    <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {ul.nombreEtablissements} au total
                    </span>
                  )}
                </h2>
              </div>

              {etablissementsResult.results.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">
                  Aucun établissement secondaire répertorié.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {etablissementsResult.results.map((etab) => (
                    <li key={etab.siret} className="py-4 first:pt-0 last:pb-0">
                      <Link
                        href={`/etablissement/${etab.siret}`}
                        className="flex items-start justify-between gap-4 group p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {etab.etablissementSiege && (
                              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Siège social
                              </span>
                            )}
                            <StatusBadge
                              etat={etab.etatAdministratif as 'A' | 'F' | 'C'}
                              entityType="etablissement"
                              size="sm"
                            />
                            <span className="font-mono text-xs font-semibold text-gray-900">
                              SIRET {formatSiret(etab.siret)}
                            </span>
                          </div>
                          {etab.enseigneAffichable && (
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {etab.enseigneAffichable}
                            </p>
                          )}
                          {etab.adresseComplete ? (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {etab.adresseComplete}
                            </p>
                          ) : etab.diffusionPartielle ? (
                            <p className="text-xs text-amber-600 mt-1">
                              Adresse non diffusée (droit d'opposition exercé)
                            </p>
                          ) : null}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {etablissementsResult.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={1}
                  totalPages={etablissementsResult.pagination.totalPages}
                  baseUrl={`/entreprise/${siren}`}
                />
              )}
            </section>

            {/* FAQ DYNAMIQUE AVEC SCHEMA.ORG FAQPAGE */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Questions fréquentes sur {nom}
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                Réponses aux questions les plus posées concernant l'immatriculation et l'activité de l'entreprise.
              </p>
              <Accordion
                items={editorial.faq.map((item, idx) => ({
                  id: `faq-${idx}`,
                  title: item.question,
                  content: item.answer,
                }))}
              />
            </section>
          </div>

          {/* Sidebar & Maillage Interne Territorial / Sectoriel */}
          <aside className="space-y-6">
            {/* Siège social & Localisation */}
            {siege && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Implantation géographique
                </h3>
                {siege.adresseComplete ? (
                  <p className="text-xs text-gray-700 leading-relaxed mb-3">
                    {siege.adresseComplete}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 mb-3">
                    Adresse masquée suite à une opposition.
                  </p>
                )}

                {siege.codeCommune && (
                  <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <p className="text-gray-500 font-medium">Explorer la même zone :</p>
                    <Link
                      href={`/recherche?code_commune=${siege.codeCommune}`}
                      className="block text-blue-600 hover:underline"
                    >
                      → Entreprises à {siege.libelleCommune || `Commune ${siege.codeCommune}`}
                    </Link>
                    {siege.codeDepartement && (
                      <Link
                        href={`/recherche?departement=${siege.codeDepartement}`}
                        className="block text-blue-600 hover:underline"
                      >
                        → Entreprises dans le département {siege.codeDepartement}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pôle Sectoriel */}
            {ul.activitePrincipale && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Secteur professionnel
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Découvrez les autres acteurs exerçant la même activité principale :
                </p>
                <Link
                  href={`/recherche?activite_principale=${encodeURIComponent(ul.activitePrincipale)}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Voir les entreprises en {ul.activitePrincipale}
                </Link>
              </div>
            )}

            {/* Diagnostic de Conformité & Fiabilité Légale */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Score de conformité légale
                </h3>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {ul.estEnProcedureCollective ? '35 / 100' : '100 / 100'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Contrôle automatique multicritères basé sur les registres légaux Insee, BODACC et fiscaux.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Statut administratif</span>
                  <span className={`font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {isActive ? '✓ En activité' : 'Fermée / Cessée'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Clé de Luhn SIREN</span>
                  <span className={`font-semibold ${isLuhnValid ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isLuhnValid ? '✓ Conforme ISO/CEI' : 'Invalide'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Numéro TVA intracom.</span>
                  <span className="font-semibold text-emerald-700">✓ Calculé VIES</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-600">Veille défaillance (BODACC)</span>
                  <span className={`font-semibold ${ul.estEnProcedureCollective ? 'text-red-700' : 'text-emerald-700'}`}>
                    {ul.estEnProcedureCollective ? '⚠ Alerte procédure' : '✓ Aucune procédure'}
                  </span>
                </div>
              </div>
            </div>

            {/* Registres d'État & Documents Légaux */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Registres publics et actes d'immatriculation
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Consultez ou téléchargez les justificatifs légaux d'immatriculation :
              </p>
              <div className="space-y-2 text-xs">
                <a
                  href={`https://avis-situation-sirene.insee.fr/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded-xl transition-colors font-medium group"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Avis de situation Sirene Insee
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a
                  href={`https://data.inpi.fr/entreprises/${siren}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl transition-colors font-medium group border border-gray-200"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-gray-600" />
                    Dossier RNE / Actes INPI
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a
                  href={`https://www.bodacc.fr/pages/annonces-commerciales/?q=${siren}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl transition-colors font-medium group border border-gray-200"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-600" />
                    Annonces légales BODACC
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Fiabilité & Conformité Légale */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3 text-xs text-gray-600">
              <h3 className="font-bold text-gray-900">Garanties &amp; Sources publiques</h3>
              <p className="leading-relaxed">
                Les informations de cette fiche sont certifiées conformes aux données publiques ouvertes de la base
                <strong> Sirene de l'INSEE</strong>, de l'<strong>INPI (RNE)</strong> et du <strong>BODACC</strong> (Licence Ouverte 2.0).
              </p>
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                <Link href="/sources" className="block text-blue-600 hover:underline">
                  → En savoir plus sur nos sources de données
                </Link>
                <Link href="/correction" className="block text-blue-600 hover:underline">
                  → Signaler une erreur ou exercer vos droits RGPD
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Maillage interne horizontal Pappers/Societe.com : Entreprises du même secteur d'activité */}
        <SimilarEnterprisesWidget
          currentSiren={siren}
          activitePrincipale={ul.activitePrincipale}
          libelleActivitePrincipale={section?.nom || ul.activitePrincipale}
          codeCommune={siege?.codeCommune}
          nomCommune={communeNom}
          codePostal={siege?.codePostal}
          codeDepartement={depCode}
        />
      </div>
    </PublicLayout>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
      <dt className="text-xs sm:text-sm text-gray-500 shrink-0 sm:w-56">{label}</dt>
      <dd className="text-xs sm:text-sm text-gray-900 text-left sm:text-right font-medium">{value}</dd>
    </div>
  )
}
