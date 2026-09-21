'use client'

import React, { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Coins,
  TrendingUp,
} from 'lucide-react'
import type { CreationItem, CreationsResponse } from '@/lib/creations/creations-service'
import { FALLBACK_DEPARTEMENTS } from '@/lib/geo/referentiel-data'

interface NouvellesCreationsWidgetProps {
  initialData?: CreationsResponse
  defaultDepartement?: string
  title?: string
  subtitle?: string
  limit?: number
}

export function NouvellesCreationsWidget({
  initialData,
  defaultDepartement = 'all',
  title = 'Créations d’entreprises du jour en direct',
  subtitle = 'Nouvelles immatriculations et créations publiées au BODACC et RNE aujourd\'hui.',
  limit = 8,
}: NouvellesCreationsWidgetProps) {
  const [data, setData] = useState<CreationsResponse | undefined>(initialData)
  const [selectedDept, setSelectedDept] = useState<string>(defaultDepartement)
  const [deptSearchQuery, setDeptSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  // Filtrage des départements pour la sélection
  const filteredDepartments = useMemo(() => {
    return FALLBACK_DEPARTEMENTS.filter(d => {
      if (!deptSearchQuery) return true
      const q = deptSearchQuery.toLowerCase()
      return d.code.toLowerCase().includes(q) || d.nom.toLowerCase().includes(q)
    })
  }, [deptSearchQuery])

  const handleDepartmentChange = (newDept: string) => {
    setSelectedDept(newDept)

    startTransition(async () => {
      setIsLoading(true)
      try {
        const url = new URL('/api/nouvelles-creations', window.location.origin)
        if (newDept && newDept !== 'all') url.searchParams.set('departement', newDept)
        url.searchParams.set('limit', String(limit))

        const res = await fetch(url.toString())
        if (res.ok) {
          const json: CreationsResponse = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Erreur lors du filtrage des créations:', err)
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
      const now = new Date()
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()

      const formatted = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d)

      return isToday ? `Aujourd'hui (${formatted})` : formatted
    } catch {
      return dateStr
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden" aria-label="Nouvelles entreprises créées">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Direct BODACC &amp; Insee
            </div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
              {title}
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1.5 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {data?.dateDerniereParution && (
              <div className="text-xs bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 text-emerald-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>Dernière parution : <strong>{formatDate(data.dateDerniereParution)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Barre de filtres */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 flex flex-wrap items-center gap-3">
          {/* Sélecteur de département */}
          <div className="relative min-w-[200px] max-w-xs">
            <select
              value={selectedDept}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full appearance-none bg-emerald-950/60 border border-emerald-700/60 text-white text-xs rounded-xl px-3.5 py-2.5 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 transition-colors"
              aria-label="Filtrer les créations par département"
            >
              <option value="all">Tous départements (France entière)</option>
              {FALLBACK_DEPARTEMENTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-gray-900 text-white">
                  {d.code} — {d.nom}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-emerald-300">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bouton recharger */}
          <button
            onClick={() => handleDepartmentChange(selectedDept)}
            disabled={isLoading || isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800/60 hover:bg-emerald-700 text-xs font-medium text-emerald-100 rounded-xl transition-colors border border-emerald-700/50 disabled:opacity-50"
            title="Rafraîchir les annonces"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isPending ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {data?.totalCount !== undefined && (
            <span className="text-xs text-emerald-300/80 ml-auto hidden sm:inline">
              <strong>{data.totalCount.toLocaleString('fr-FR')}</strong> créations recensées
            </span>
          )}
        </div>
      </div>

      {/* Grille des annonces de créations */}
      <div className="p-6">
        {isLoading || isPending ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Actualisation des créations d'entreprises en direct...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-800">
              Aucune annonce de création enregistrée pour ce département
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Essayez de sélectionner « France entière » pour consulter toutes les parutions du jour.
            </p>
            <button
              onClick={() => handleDepartmentChange('all')}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Afficher toute la France
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const hasSiren = item.siren && /^\d{9}$/.test(item.siren)

              return (
                <article
                  key={item.id}
                  className="bg-white border border-gray-100 hover:border-emerald-300 rounded-xl p-4.5 flex flex-col justify-between transition-all hover:shadow-md relative group"
                >
                  <div>
                    {/* Header de carte */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Nouvelle création
                      </span>
                      <span className="text-[11px] text-gray-600 flex items-center gap-1 shrink-0 font-medium">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(item.dateParution)}
                      </span>
                    </div>

                    {/* Dénomination */}
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1.5">
                      {hasSiren ? (
                        <Link href={`/entreprise/${item.siren}`} className="hover:underline">
                          {item.denomination}
                        </Link>
                      ) : (
                        item.denomination
                      )}
                    </h3>

                    {/* Forme Juridique & Capital */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[11px]">
                      {item.formeJuridique && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-sm font-medium">
                          {item.formeJuridique}
                        </span>
                      )}
                      {item.capital && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-sm font-medium flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-600" />
                          {item.capital}
                        </span>
                      )}
                    </div>

                    {/* Activité */}
                    {item.activite && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                        {item.activite}
                      </p>
                    )}

                    {/* Localisation */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">
                        {item.ville ? `${item.ville} ` : ''}
                        <strong className="text-gray-700">({item.departementCode})</strong>
                      </span>
                    </div>
                  </div>

                  {/* Footer carte */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2 text-xs">
                    {hasSiren ? (
                      <Link
                        href={`/entreprise/${item.siren}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 group-hover:underline"
                      >
                        <span>SIREN {item.siren}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-gray-600 font-mono font-medium">
                        Immat. en cours
                      </span>
                    )}

                    {item.urlBodacc && (
                      <a
                        href={item.urlBodacc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gray-600 hover:text-emerald-700 inline-flex items-center gap-0.5 font-medium transition-colors"
                        title="Consulter l'avis officiel au BODACC"
                      >
                        BODACC
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
