import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getSearchEngine } from '@/lib/search/engine'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatSiren, formatTrancheEffectif } from '@/lib/publication/service'
import type { SearchParams, UniteLegalePubliable } from '@/types/domain'
import { Building2, MapPin, Search, X, AlertCircle } from 'lucide-react'
import { NAF_SECTIONS } from '@/lib/naf/sections'
import { ListingFilters } from '@/components/search/ListingFilters'

export const revalidate = 0  // Pas de cache pour la recherche

interface RecherchePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: RecherchePageProps): Promise<Metadata> {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : ''
  const codeCommune = typeof sp.code_commune === 'string' ? sp.code_commune : ''
  const departement = typeof sp.departement === 'string' ? sp.departement : ''
  const rawSection = typeof sp.section === 'string' ? sp.section.trim() : ''
  const rawActivite = typeof sp.activite_principale === 'string' ? sp.activite_principale.trim() : ''
  const isSingleLetterNaf = rawActivite && /^[A-Za-z]$/.test(rawActivite)
  const sectionCode = rawSection || (isSingleLetterNaf ? rawActivite.toUpperCase() : '')
  const secObj = sectionCode ? NAF_SECTIONS.find(s => s.code.toUpperCase() === sectionCode.toUpperCase()) : null

  let title = 'Recherche d\'entreprises'
  if (q) title = `Résultats pour "${q}"`
  else if (secObj) title = `Entreprises : Secteur ${secObj.code} — ${secObj.nom}`
  else if (sectionCode) title = `Entreprises du secteur ${sectionCode}`
  else if (rawActivite) title = `Entreprises avec le code APE ${rawActivite}`
  else if (codeCommune) title = `Entreprises de la commune ${codeCommune}`
  else if (departement) title = `Entreprises du département ${departement}`

  return {
    title,
    description: q
      ? `Résultats de recherche pour "${q}" dans l'annuaire des entreprises françaises.`
      : 'Recherchez des entreprises et établissements en France dans le répertoire Sirene de l\'INSEE.',
    robots: { index: false, follow: true },  // Les résultats de recherche ne sont pas indexés
  }
}

export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const departement = typeof sp.departement === 'string' ? sp.departement : undefined
  const region = typeof sp.region === 'string' ? sp.region : undefined
  const codeCommune = typeof sp.code_commune === 'string' ? sp.code_commune : undefined
  const codePostal = typeof sp.code_postal === 'string' ? sp.code_postal : undefined
  const etatAdministratif = typeof sp.etat_administratif === 'string' ? sp.etat_administratif as 'A' | 'C' | 'F' : undefined
  const rawSection = typeof sp.section === 'string' ? sp.section.trim() : undefined
  const rawActivite = typeof sp.activite_principale === 'string' ? sp.activite_principale.trim() : undefined

  // Si activite_principale est une seule lettre (A-U), c'est une section NAF !
  const isSingleLetterNaf = rawActivite && /^[A-Za-z]$/.test(rawActivite)
  const section = rawSection || (isSingleLetterNaf ? rawActivite.toUpperCase() : undefined)
  const activitePrincipale = !isSingleLetterNaf ? rawActivite : undefined

  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1') || 1)
  const perPage = 20

  // Filtres avancés (taille, effectifs, forme juridique, certifications)
  const categorieEntreprise = typeof sp.categorie_entreprise === 'string' ? sp.categorie_entreprise as any : undefined
  const trancheEffectifs = typeof sp.tranche_effectifs === 'string' ? sp.tranche_effectifs : undefined
  const natureJuridique = typeof sp.nature_juridique === 'string' ? sp.nature_juridique : undefined
  const estEss = sp.est_ess === 'true'
  const estRge = sp.est_rge === 'true'
  const estOrganismeFormation = sp.est_organisme_formation === 'true'
  const estSocieteMission = sp.est_societe_mission === 'true'
  const estBio = sp.est_bio === 'true'

  const params: SearchParams = {
    q: q || undefined,
    departement,
    region,
    codeCommune,
    codePostal,
    etatAdministratif,
    activitePrincipale,
    section,
    categorieEntreprise,
    trancheEffectifs,
    natureJuridique,
    estEss,
    estRge,
    estOrganismeFormation,
    estSocieteMission,
    estBio,
    page,
    perPage,
    sort: q ? 'pertinence' : 'nom',
  }

  // Build base URL for pagination (without page param)
  const baseUrlParams = new URLSearchParams()
  if (q) baseUrlParams.set('q', q)
  if (departement) baseUrlParams.set('departement', departement)
  if (region) baseUrlParams.set('region', region)
  if (codeCommune) baseUrlParams.set('code_commune', codeCommune)
  if (codePostal) baseUrlParams.set('code_postal', codePostal)
  if (etatAdministratif) baseUrlParams.set('etat_administratif', etatAdministratif)
  if (section) baseUrlParams.set('section', section)
  if (activitePrincipale) baseUrlParams.set('activite_principale', activitePrincipale)
  if (categorieEntreprise) baseUrlParams.set('categorie_entreprise', categorieEntreprise)
  if (trancheEffectifs) baseUrlParams.set('tranche_effectifs', trancheEffectifs)
  if (natureJuridique) baseUrlParams.set('nature_juridique', natureJuridique)
  if (estEss) baseUrlParams.set('est_ess', 'true')
  if (estRge) baseUrlParams.set('est_rge', 'true')
  if (estOrganismeFormation) baseUrlParams.set('est_organisme_formation', 'true')
  if (estSocieteMission) baseUrlParams.set('est_societe_mission', 'true')
  if (estBio) baseUrlParams.set('est_bio', 'true')
  const baseUrl = `/recherche?${baseUrlParams.toString()}`

  // Active filters for display
  const activeFilters: { label: string; removeUrl: string }[] = []
  if (codeCommune) {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('code_commune')
    activeFilters.push({ label: `Commune INSEE ${codeCommune}`, removeUrl: `/recherche?${removeParams}` })
  }
  if (codePostal) {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('code_postal')
    activeFilters.push({ label: `Code postal ${codePostal}`, removeUrl: `/recherche?${removeParams}` })
  }
  if (departement) {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('departement')
    activeFilters.push({ label: `Département ${departement}`, removeUrl: `/recherche?${removeParams}` })
  }
  if (etatAdministratif === 'A') {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('etat_administratif')
    activeFilters.push({ label: 'Actives uniquement', removeUrl: `/recherche?${removeParams}` })
  }
  if (section) {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('section')
    const secObj = NAF_SECTIONS.find(s => s.code.toUpperCase() === section.toUpperCase())
    activeFilters.push({
      label: secObj ? `Secteur ${section} (${secObj.nom})` : `Secteur ${section}`,
      removeUrl: `/recherche?${removeParams}`,
    })
  }
  if (activitePrincipale) {
    const removeParams = new URLSearchParams(baseUrlParams)
    removeParams.delete('activite_principale')
    activeFilters.push({ label: `Activité ${activitePrincipale}`, removeUrl: `/recherche?${removeParams}` })
  }

  const secObjForBreadcrumb = section ? NAF_SECTIONS.find(s => s.code.toUpperCase() === section.toUpperCase()) : null
  const breadcrumbLabel = q
    ? `Résultats pour "${q}"`
    : secObjForBreadcrumb
    ? `Secteur ${secObjForBreadcrumb.code}`
    : section
    ? `Secteur ${section}`
    : activitePrincipale
    ? `Activité ${activitePrincipale}`
    : codeCommune
    ? `Commune ${codeCommune}`
    : departement
    ? `Département ${departement}`
    : 'Recherche'

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: breadcrumbLabel },
          ]}
        />

        {/* Formulaire de recherche */}
        <div className="mt-4 mb-6">
          <form action="/recherche" method="get" role="search" aria-label="Recherche d'entreprise">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor="search-q" className="sr-only">Rechercher une entreprise</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="search-q"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Nom, SIREN, SIRET, ville, activité…"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors"
              >
                Rechercher
              </button>
            </div>
            {/* Préserver les autres filtres actifs dans le formulaire */}
            {departement && <input type="hidden" name="departement" value={departement} />}
            {region && <input type="hidden" name="region" value={region} />}
            {codeCommune && <input type="hidden" name="code_commune" value={codeCommune} />}
            {codePostal && <input type="hidden" name="code_postal" value={codePostal} />}
            {etatAdministratif && <input type="hidden" name="etat_administratif" value={etatAdministratif} />}
            {activitePrincipale && <input type="hidden" name="activite_principale" value={activitePrincipale} />}
          </form>
        </div>

        {/* Filtres actifs */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4" aria-label="Filtres actifs">
            {activeFilters.map((filter, i) => (
              <Link
                key={i}
                href={filter.removeUrl}
                className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full hover:bg-blue-100"
              >
                {filter.label}
                <X className="w-3 h-3" aria-label="Supprimer ce filtre" />
              </Link>
            ))}
          </div>
        )}

        {/* Système de filtres multi-critères : taille, effectifs, forme juridique, statuts, agréments */}
        <ListingFilters baseUrl="/recherche" />

        {/* Résultats */}
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults params={params} baseUrl={baseUrl} />
        </Suspense>
      </div>
    </PublicLayout>
  )
}

async function SearchResults({ params, baseUrl }: { params: SearchParams; baseUrl: string }) {
  try {
    const engine = getSearchEngine()
    const result = await engine.searchEntities(params)

    if (result.results.length === 0) {
      return (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {params.q
              ? `Aucune entreprise trouvée pour "${params.q}". Essayez avec d'autres mots ou le numéro SIREN.`
              : 'Utilisez le formulaire de recherche pour trouver des entreprises.'}
          </p>
          <div className="mt-6 text-sm text-gray-400">
            <p>Conseils : vérifiez l'orthographe, essayez un mot plus court, ou entrez directement le SIREN à 9 chiffres.</p>
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Comptage */}
        <p className="text-sm text-gray-600 mb-4" role="status" aria-live="polite">
          {result.totalIsExact
            ? `${result.pagination.total.toLocaleString('fr-FR')} résultat${result.pagination.total > 1 ? 's' : ''}`
            : `Plus de ${result.pagination.total.toLocaleString('fr-FR')} résultats`}
          {params.q && ` pour «\u00a0${params.q}\u00a0»`}
          {result.pagination.totalPages > 1 && ` — page ${result.pagination.page} sur ${result.pagination.totalPages}`}
        </p>

        {/* Liste des résultats */}
        <ul className="space-y-3" aria-label="Résultats de recherche">
          {result.results.map((entity) => (
            <li key={entity.siren}>
              <EntityCard entity={entity} />
            </li>
          ))}
        </ul>

        {/* Pagination */}
        {result.pagination.totalPages > 1 && (
          <Pagination
            currentPage={result.pagination.page}
            totalPages={result.pagination.totalPages}
            baseUrl={baseUrl}
          />
        )}

        {/* Note de couverture */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">
            Les résultats proviennent de notre base locale alimentée par le répertoire Sirene de l'INSEE.
            Certaines entités peuvent ne pas être disponibles (données en cours d'import, entités non diffusibles).{' '}
            <Link href="/couverture" className="underline hover:text-gray-700">En savoir plus sur la couverture</Link>.
          </p>
        </div>
      </div>
    )
  } catch (error) {
    // Base de données non connectée ou autre erreur
    console.error('[RecherchePage] Erreur:', error)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-amber-800 mb-1">Recherche temporairement indisponible</h2>
            <p className="text-sm text-amber-700">
              La base de données n'est pas encore configurée ou est momentanément inaccessible.
              Configurez <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code> dans votre fichier <code className="bg-amber-100 px-1 rounded">.env.local</code> et
              exécutez les migrations.
            </p>
            <Link
              href="/methodologie"
              className="mt-2 inline-block text-sm text-amber-800 underline hover:text-amber-900"
            >
              Documentation technique
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

function EntityCard({ entity }: { entity: UniteLegalePubliable }) {
  return (
    <Link
      href={`/entreprise/${entity.siren}`}
      className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="p-2 bg-blue-50 rounded-lg shrink-0 group-hover:bg-blue-100 transition-colors">
        <Building2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
            {entity.denominationAffichable ?? `Entreprise ${formatSiren(entity.siren)}`}
          </h2>
          <StatusBadge etat={entity.etatAdministratif} entityType="unite_legale" size="sm" />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="font-mono text-xs">SIREN {formatSiren(entity.siren)}</span>
          {entity.libelleActivite && (
            <span className="truncate">{entity.libelleActivite}</span>
          )}
          {entity.libelleFormeJuridique && (
            <span className="truncate">{entity.libelleFormeJuridique}</span>
          )}
        </div>
        {entity.trancheEffectifs && (
          <p className="text-xs text-gray-400 mt-1">
            {formatTrancheEffectif(entity.trancheEffectifs, entity.anneeEffectifs)}
          </p>
        )}
      </div>
    </Link>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Chargement des résultats">
      <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex gap-4">
            <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
