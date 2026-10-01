import React from 'react'
import Link from 'next/link'
import { getSearchEngine } from '@/lib/search/engine'
import { formatSiren } from '@/lib/publication/service'
import { isEntitySuppressed } from '@/lib/search/suppression-registry'
import { Building2, MapPin, ChevronRight, ArrowRight, Briefcase } from 'lucide-react'

interface SimilarEnterprisesWidgetProps {
  currentSiren: string
  activitePrincipale?: string | null
  libelleActivitePrincipale?: string | null
  codeCommune?: string | null
  nomCommune?: string | null
  codePostal?: string | null
  codeDepartement?: string | null
}

export async function SimilarEnterprisesWidget({
  currentSiren,
  activitePrincipale,
  libelleActivitePrincipale,
  codeCommune,
  nomCommune,
  codePostal,
  codeDepartement,
}: SimilarEnterprisesWidgetProps) {
  if (!activitePrincipale) {
    return null
  }

  const engine = getSearchEngine()
  let similarCompanies: any[] = []
  let locationLabel = nomCommune || (codeDepartement ? `Département ${codeDepartement}` : 'France')

  try {
    // 1. Recherche prioritaire dans la même commune
    if (codeCommune) {
      const res = await engine.searchUnitesLegales({
        activitePrincipale,
        codeCommune,
        etatAdministratif: 'A',
        page: 1,
        perPage: 8,
      })
      similarCompanies = (res.results || []).filter(
        (e) => e.siren !== currentSiren && !e.diffusionPartielle && !isEntitySuppressed(e.siren)
      )
    }

    // 2. Si pas assez de résultats, élargissement au département
    if (similarCompanies.length < 4 && codeDepartement) {
      const resDep = await engine.searchUnitesLegales({
        activitePrincipale,
        departement: codeDepartement,
        etatAdministratif: 'A',
        page: 1,
        perPage: 8,
      })
      const extra = (resDep.results || []).filter(
        (e) =>
          e.siren !== currentSiren &&
          !e.diffusionPartielle &&
          !isEntitySuppressed(e.siren) &&
          !similarCompanies.some((sc) => sc.siren === e.siren)
      )
      similarCompanies = [...similarCompanies, ...extra]
      if (similarCompanies.length > 0 && !nomCommune) {
        locationLabel = `Département ${codeDepartement}`
      }
    }
  } catch (err) {
    console.warn('[SimilarEnterprisesWidget] Erreur lors de la recherche des entreprises similaires:', err)
  }

  const displayedCompanies = similarCompanies.slice(0, 6)

  if (displayedCompanies.length === 0) {
    return null
  }

  const apeDisplay = activitePrincipale.includes('.')
    ? activitePrincipale
    : `${activitePrincipale.slice(0, 2)}.${activitePrincipale.slice(2)}`

  return (
    <section className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5 border border-blue-100">
            <Briefcase className="w-3.5 h-3.5" />
            Même secteur d'activité
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Autres entreprises du secteur {apeDisplay} à {locationLabel}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {libelleActivitePrincipale || 'Entreprises en activité exerçant la même activité économique'}
          </p>
        </div>

        <Link
          href={`/activite/NAFRev2/${activitePrincipale}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors shrink-0"
        >
          Tout le secteur {apeDisplay}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCompanies.map((ent) => {
          const nom = ent.denominationAffichable ?? `Entreprise ${formatSiren(ent.siren)}`
          const commune = ent.siege?.libelleCommune || ent.siege?.codePostal || locationLabel

          return (
            <Link
              key={ent.siren}
              href={`/entreprise/${ent.siren}`}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-gray-500">
                    SIREN {formatSiren(ent.siren)}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Actif
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
                  {nom}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{commune}</span>
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:text-blue-700">
                <span>Consulter la fiche</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
