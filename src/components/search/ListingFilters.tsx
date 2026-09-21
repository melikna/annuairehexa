'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  Building,
  Users,
  Award,
  Scale,
} from 'lucide-react'

interface ListingFiltersProps {
  baseUrl?: string
  totalResults?: number
}

const CATEGORIES_ENTREPRISE = [
  { value: 'PME', label: 'PME (< 250 salariés)' },
  { value: 'ETI', label: 'ETI (250 à 4 999 salariés)' },
  { value: 'GE', label: 'Grande Entreprise (5 000+ salariés)' },
]

const TRANCHES_EFFECTIFS = [
  { value: '00', label: '0 salarié' },
  { value: '01', label: '1 ou 2 salariés' },
  { value: '02', label: '3 à 5 salariés' },
  { value: '03', label: '6 à 9 salariés' },
  { value: '11', label: '10 à 19 salariés' },
  { value: '12', label: '20 à 49 salariés' },
  { value: '21', label: '50 à 99 salariés' },
  { value: '22', label: '100 à 199 salariés' },
  { value: '31', label: '200 à 249 salariés' },
  { value: '32', label: '250 à 499 salariés' },
  { value: '41', label: '500 à 999 salariés' },
  { value: '42', label: '1 000 à 1 999 salariés' },
  { value: '51', label: '2 000 à 4 999 salariés' },
  { value: '52', label: '5 000 à 9 999 salariés' },
  { value: '53', label: '10 000 salariés et plus' },
]

const FORMES_JURIDIQUES = [
  { value: '5710', label: 'SAS (Société par actions simplifiée)' },
  { value: '5720', label: 'SASU (SAS à associé unique)' },
  { value: '5499', label: 'SARL (Société à responsabilité limitée)' },
  { value: '5498', label: 'EURL (SARL unipersonnelle)' },
  { value: '1000', label: 'Entrepreneur individuel (EI / Micro-entreprise)' },
  { value: '5599', label: 'SA (Société anonyme)' },
  { value: '6540', label: 'SCI (Société civile immobilière)' },
  { value: '9220', label: 'Association déclarée' },
]

export function ListingFilters({ baseUrl, totalResults }: ListingFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPath = baseUrl || pathname

  // Valeurs actuelles extraites de l'URL
  const currentCategorie = searchParams.get('categorie_entreprise') || ''
  const currentTranche = searchParams.get('tranche_effectifs') || ''
  const currentEtat = searchParams.get('etat_administratif') || ''
  const currentNature = searchParams.get('nature_juridique') || ''
  const currentEss = searchParams.get('est_ess') === 'true'
  const currentRge = searchParams.get('est_rge') === 'true'
  const currentFormation = searchParams.get('est_organisme_formation') === 'true'
  const currentMission = searchParams.get('est_societe_mission') === 'true'
  const currentBio = searchParams.get('est_bio') === 'true'

  // État local du formulaire de filtres
  const [isOpen, setIsOpen] = useState(false)
  const [categorie, setCategorie] = useState(currentCategorie)
  const [tranche, setTranche] = useState(currentTranche)
  const [etat, setEtat] = useState(currentEtat)
  const [nature, setNature] = useState(currentNature)
  const [estEss, setEstEss] = useState(currentEss)
  const [estRge, setEstRge] = useState(currentRge)
  const [estFormation, setEstFormation] = useState(currentFormation)
  const [estMission, setEstMission] = useState(currentMission)
  const [estBio, setEstBio] = useState(currentBio)

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = [
    Boolean(currentCategorie),
    Boolean(currentTranche),
    Boolean(currentEtat),
    Boolean(currentNature),
    currentEss,
    currentRge,
    currentFormation,
    currentMission,
    currentBio,
  ].filter(Boolean).length

  // Fonction pour mettre à jour l'URL avec un ensemble de paramètres
  const updateParams = (newParams: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString())

    // Réinitialiser la pagination lors d'un filtrage
    next.delete('page')

    for (const [key, val] of Object.entries(newParams)) {
      if (val === null || val === undefined || val === '') {
        next.delete(key)
      } else {
        next.set(key, val)
      }
    }

    const query = next.toString()
    router.push(query ? `${currentPath}?${query}` : currentPath, { scroll: false })
  }

  // Application des filtres du panneau complet
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({
      categorie_entreprise: categorie || null,
      tranche_effectifs: tranche || null,
      etat_administratif: etat || null,
      nature_juridique: nature || null,
      est_ess: estEss ? 'true' : null,
      est_rge: estRge ? 'true' : null,
      est_organisme_formation: estFormation ? 'true' : null,
      est_societe_mission: estMission ? 'true' : null,
      est_bio: estBio ? 'true' : null,
    })
    setIsOpen(false)
  }

  // Réinitialisation complète des filtres
  const handleReset = () => {
    setCategorie('')
    setTranche('')
    setEtat('')
    setNature('')
    setEstEss(false)
    setEstRge(false)
    setEstFormation(false)
    setEstMission(false)
    setEstBio(false)

    updateParams({
      categorie_entreprise: null,
      tranche_effectifs: null,
      etat_administratif: null,
      nature_juridique: null,
      est_ess: null,
      est_rge: null,
      est_organisme_formation: null,
      est_societe_mission: null,
      est_bio: null,
    })
  }

  // Raccourci : clic sur un pill rapide
  const toggleQuickFilter = (key: string, value: string) => {
    const currentVal = searchParams.get(key)
    if (currentVal === value) {
      updateParams({ [key]: null })
    } else {
      updateParams({ [key]: value })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
      {/* Barre supérieure : Raccourcis rapides & bouton panneau */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Raccourcis rapides par taille et statut */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Taille :
          </span>

          <button
            type="button"
            onClick={() => updateParams({ categorie_entreprise: null, tranche_effectifs: null })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !currentCategorie && !currentTranche
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes tailles
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter('categorie_entreprise', 'PME')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              currentCategorie === 'PME'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            PME (&lt; 250)
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter('categorie_entreprise', 'ETI')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              currentCategorie === 'ETI'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            ETI (250-4999)
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter('categorie_entreprise', 'GE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              currentCategorie === 'GE'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Grandes Entreprises (5000+)
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter('etat_administratif', 'A')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              currentEtat === 'A'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Actives uniquement
          </button>
        </div>

        {/* Bouton pour déployer le panneau complet */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
            isOpen || activeFiltersCount > 0
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtres avancés</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-blue-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Badges des filtres actuellement appliqués */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Filtres actifs :</span>

          {currentCategorie && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
              Taille : {CATEGORIES_ENTREPRISE.find(c => c.value === currentCategorie)?.label || currentCategorie}
              <button
                type="button"
                onClick={() => updateParams({ categorie_entreprise: null })}
                className="hover:text-blue-900"
                aria-label="Supprimer le filtre taille"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentTranche && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
              Effectif : {TRANCHES_EFFECTIFS.find(t => t.value === currentTranche)?.label || currentTranche}
              <button
                type="button"
                onClick={() => updateParams({ tranche_effectifs: null })}
                className="hover:text-blue-900"
                aria-label="Supprimer le filtre effectif"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentEtat && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              Statut : {currentEtat === 'A' ? 'En activité' : 'Cessée'}
              <button
                type="button"
                onClick={() => updateParams({ etat_administratif: null })}
                className="hover:text-emerald-900"
                aria-label="Supprimer le filtre statut"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentNature && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
              Forme : {FORMES_JURIDIQUES.find(f => f.value === currentNature)?.label || currentNature}
              <button
                type="button"
                onClick={() => updateParams({ nature_juridique: null })}
                className="hover:text-purple-900"
                aria-label="Supprimer le filtre forme juridique"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentRge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Certifié RGE
              <button
                type="button"
                onClick={() => updateParams({ est_rge: null })}
                className="hover:text-amber-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentFormation && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">
              Organisme de formation
              <button
                type="button"
                onClick={() => updateParams({ est_organisme_formation: null })}
                className="hover:text-cyan-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentEss && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
              ESS
              <button
                type="button"
                onClick={() => updateParams({ est_ess: null })}
                className="hover:text-teal-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentMission && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
              Société à mission
              <button
                type="button"
                onClick={() => updateParams({ est_societe_mission: null })}
                className="hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentBio && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-800 border border-green-200">
              Certifié Bio
              <button
                type="button"
                onClick={() => updateParams({ est_bio: null })}
                className="hover:text-green-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-800 underline font-medium ml-1 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Tout effacer
          </button>
        </div>
      )}

      {/* Panneau déroulant de configuration détaillée */}
      {isOpen && (
        <form onSubmit={handleApply} className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* 1. Catégorie d'entreprise */}
            <div>
              <label htmlFor="filter-cat" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Taille d'entreprise (Insee)
              </label>
              <select
                id="filter-cat"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Toutes les catégories</option>
                {CATEGORIES_ENTREPRISE.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tranches d'effectifs */}
            <div>
              <label htmlFor="filter-tranche" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Tranche exacte d'effectifs
              </label>
              <select
                id="filter-tranche"
                value={tranche}
                onChange={(e) => setTranche(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Toutes les tranches</option>
                {TRANCHES_EFFECTIFS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Forme Juridique */}
            <div>
              <label htmlFor="filter-nature" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Forme Juridique
              </label>
              <select
                id="filter-nature"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Toutes les formes</option>
                {FORMES_JURIDIQUES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Statut d'activité */}
            <div>
              <label htmlFor="filter-etat" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                Statut administratif
              </label>
              <select
                id="filter-etat"
                value={etat}
                onChange={(e) => setEtat(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Tous statuts</option>
                <option value="A">En activité uniquement</option>
                <option value="C">Cessée / Fermée</option>
              </select>
            </div>
          </div>

          {/* Labels & Agréments d'État */}
          <div className="mb-5">
            <span className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Agréments &amp; Certifications reconnues
            </span>
            <div className="flex flex-wrap gap-2">
              <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                estRge ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={estRge}
                  onChange={(e) => setEstRge(e.target.checked)}
                  className="sr-only"
                />
                Certifié RGE
              </label>

              <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                estFormation ? 'bg-cyan-100 border-cyan-400 text-cyan-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={estFormation}
                  onChange={(e) => setEstFormation(e.target.checked)}
                  className="sr-only"
                />
                Organisme de formation (Qualiopi)
              </label>

              <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                estEss ? 'bg-teal-100 border-teal-400 text-teal-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={estEss}
                  onChange={(e) => setEstEss(e.target.checked)}
                  className="sr-only"
                />
                Économie Sociale et Solidaire (ESS)
              </label>

              <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                estMission ? 'bg-indigo-100 border-indigo-400 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={estMission}
                  onChange={(e) => setEstMission(e.target.checked)}
                  className="sr-only"
                />
                Société à mission
              </label>

              <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                estBio ? 'bg-green-100 border-green-400 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  checked={estBio}
                  onChange={(e) => setEstBio(e.target.checked)}
                  className="sr-only"
                />
                Agriculture Biologique (Bio)
              </label>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Appliquer les filtres
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
