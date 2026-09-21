'use client'

import React, { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Scale,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import type { ProcedureItem, ProceduresResponse } from '@/lib/procedures/procedures-service'
import { FALLBACK_DEPARTEMENTS } from '@/lib/geo/referentiel-data'

interface ProceduresWidgetProps {
  initialData?: ProceduresResponse
  defaultDepartement?: string
  defaultNature?: 'all' | 'liquidation' | 'redressement'
  title?: string
  subtitle?: string
  showViewAllLink?: boolean
  limit?: number
}

export function ProceduresCollectivesWidget({
  initialData,
  defaultDepartement = 'all',
  defaultNature = 'all',
  title = 'Observatoire des Défaillances : Liquidations & Redressements en direct',
  subtitle = 'Annonces légales du BODACC actualisées en temps réel, classées par date et par département.',
  showViewAllLink = true,
  limit = 8,
}: ProceduresWidgetProps) {
  const [data, setData] = useState<ProceduresResponse | undefined>(initialData)
  const [selectedDept, setSelectedDept] = useState<string>(defaultDepartement)
  const [selectedNature, setSelectedNature] = useState<'all' | 'liquidation' | 'redressement'>(defaultNature)
  const [deptSearchQuery, setDeptSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  // Tri alphabétique et recherche des départements
  const filteredDepartments = useMemo(() => {
    return FALLBACK_DEPARTEMENTS.filter(d => {
      if (!deptSearchQuery) return true
      const q = deptSearchQuery.toLowerCase()
      return d.code.toLowerCase().includes(q) || d.nom.toLowerCase().includes(q)
    })
  }, [deptSearchQuery])

  // Chargement des données lors d'un changement de filtre
  const handleFilterChange = (newDept: string, newNature: 'all' | 'liquidation' | 'redressement') => {
    setSelectedDept(newDept)
    setSelectedNature(newNature)

    startTransition(async () => {
      setIsLoading(true)
      try {
        const url = new URL('/api/procedures-collectives', window.location.origin)
        if (newDept && newDept !== 'all') url.searchParams.set('departement', newDept)
        if (newNature && newNature !== 'all') url.searchParams.set('nature', newNature)
        url.searchParams.set('limit', String(limit))

        const res = await fetch(url.toString())
        if (res.ok) {
          const json: ProceduresResponse = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Erreur de filtrage des procédures:', err)
      } finally {
        setIsLoading(false)
      }
    })
  }

  const items = data?.results ?? []

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date non renseignée'
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden" aria-label="Annonces BODACC des procédures collectives">
      {/* Header de l'encart */}
      <div className="bg-gradient-to-r from-red-950 via-gray-900 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Veille Légale BODACC & DILA
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
              {title}
            </h2>
            <p className="text-sm text-gray-300 max-w-2xl">
              {subtitle}
            </p>
          </div>

          {showViewAllLink && (
            <div className="shrink-0">
              <Link
                href="/procedures-collectives"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Explorer tout l'annuaire des procédures
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Barre de filtrage interactive */}
        <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Boutons Type de procédure */}
          <div className="sm:col-span-8 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleFilterChange(selectedDept, 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedNature === 'all'
                  ? 'bg-white text-gray-950 shadow-sm font-semibold'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Toutes les alertes (Liquidations &amp; Redressements)
            </button>
            <button
              onClick={() => handleFilterChange(selectedDept, 'liquidation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                selectedNature === 'liquidation'
                  ? 'bg-red-600 text-white shadow-sm font-semibold ring-2 ring-red-400/50'
                  : 'bg-gray-800/80 text-red-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Liquidations Judiciaires
            </button>
            <button
              onClick={() => handleFilterChange(selectedDept, 'redressement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                selectedNature === 'redressement'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold ring-2 ring-amber-400/50'
                  : 'bg-gray-800/80 text-amber-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Redressements Judiciaires
            </button>
          </div>

          {/* Sélecteur de Département */}
          <div className="sm:col-span-4 relative">
            <select
              value={selectedDept}
              onChange={(e) => handleFilterChange(e.target.value, selectedNature)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              aria-label="Filtrer par département"
            >
              <option value="all">📍 France entière (101 départements)</option>
              {FALLBACK_DEPARTEMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.nom}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Corps des Annonces classées par Date */}
      <div className="p-5 sm:p-6 bg-slate-50/50">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            <p className="text-sm font-medium">Actualisation des annonces BODACC en direct...</p>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Scale className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-gray-800">Aucune procédure collective récente trouvée</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Aucune annonce légale ne correspond aux critères sélectionnés (Département : {selectedDept === 'all' ? 'France entière' : selectedDept}).
            </p>
            <button
              onClick={() => handleFilterChange('all', 'all')}
              className="mt-4 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-2">
              <span className="font-medium text-gray-700">
                {items.length} décisions et jugements récents
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Trié par date de publication décroissante
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {items.map((item) => {
                const isLiquidation = item.nature === 'liquidation'

                return (
                  <article
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200/90 p-4 hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Ligne 1 : Badge Procédure & Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isLiquidation
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLiquidation
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                            }`}
                          />
                          {item.natureLibelle}
                        </span>

                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(item.datePublication)}
                        </span>
                      </div>

                      {/* Ligne 2 : Dénomination & Forme */}
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-950 text-base leading-snug hover:text-red-700 transition-colors">
                          {item.siren ? (
                            <Link href={`/entreprise/${item.siren}`} className="hover:underline">
                              {item.denomination}
                            </Link>
                          ) : (
                            <span>{item.denomination}</span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          {item.siren && (
                            <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                              SIREN {item.siren}
                            </span>
                          )}
                          {item.formeJuridique && <span>• {item.formeJuridique}</span>}
                        </div>
                      </div>

                      {/* Ligne 3 : Localisation */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800">
                          {item.ville ? `${item.ville} (${item.departementCode})` : `${item.departementNom} (${item.departementCode})`}
                        </span>
                        {item.departementNom && item.ville && (
                          <span className="text-gray-400 text-[11px]">
                            • {item.departementNom}
                          </span>
                        )}
                      </div>

                      {/* Ligne 4 : Tribunal & Détails */}
                      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 space-y-1 mb-3">
                        <div className="flex items-start gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-gray-800">{item.tribunal}</span>
                        </div>
                        {item.dateJugement && (
                          <p className="text-[11px] text-gray-500 pl-5">
                            Jugement prononcé le {formatDate(item.dateJugement)}
                          </p>
                        )}
                        {item.liquidateurMandataire && (
                          <p className="text-[11px] text-gray-700 pl-5 line-clamp-2">
                            <strong className="font-medium text-gray-900">Mandataire / Liquidateur :</strong> {item.liquidateurMandataire}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions au bas de la carte */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      {item.siren ? (
                        <Link
                          href={`/entreprise/${item.siren}`}
                          className="font-semibold text-red-700 hover:text-red-900 hover:underline inline-flex items-center gap-1"
                        >
                          Consulter la fiche complète
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Fiche administrative</span>
                      )}

                      {item.urlBodacc && (
                        <a
                          href={item.urlBodacc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 text-[11px]"
                          title="Consulter l'annonce originale sur le portail BODACC"
                        >
                          BODACC <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer de l'encart avec informations légales et lien d'approfondissement */}
      <div className="bg-white p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p className="leading-relaxed">
          <strong className="text-gray-700">Source :</strong> Bulletin Officiel des Annonces Civiles et Commerciales (BODACC / DILA). Les déclarations de créances doivent être adressées au mandataire ou liquidateur désigné dans un délai de 2 mois à compter de la publication.
        </p>

        {showViewAllLink && (
          <Link
            href="/procedures-collectives"
            className="shrink-0 font-bold text-red-700 hover:text-red-900 hover:underline inline-flex items-center gap-1"
          >
            Voir toutes les annonces de France
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  )
}
