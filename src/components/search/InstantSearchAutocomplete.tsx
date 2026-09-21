'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, Building2, ChevronRight, AlertTriangle } from 'lucide-react'

interface Suggestion {
  siren: string
  nom: string
  nomCommercial?: string | null
  formeJuridique?: string | null
  activite?: string | null
  libelleActivite?: string | null
  etatAdministratif: 'A' | 'C' | 'F'
  estEnProcedureCollective?: boolean
  natureProcedureCollective?: string | null
  siretSiege?: string | null
}

interface InstantSearchAutocompleteProps {
  placeholder?: string
  defaultValue?: string
  variant?: 'hero' | 'header'
  autoFocus?: boolean
  className?: string
  id?: string
}

export function InstantSearchAutocomplete({
  placeholder = 'Nom d\'entreprise, SIREN, SIRET, ville, activité…',
  defaultValue = '',
  variant = 'hero',
  autoFocus = false,
  className = '',
  id = 'instant-search',
}: InstantSearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fermeture lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recherche en direct debouncée
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    setIsLoading(true)

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions || [])
          setIsOpen((data.suggestions || []).length > 0)
          setSelectedIndex(-1)
        }
      } catch (err) {
        console.warn('Erreur autocomplétion:', err)
      } finally {
        setIsLoading(false)
      }
    }, 180)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      router.push(`/entreprise/${suggestions[selectedIndex].siren}`)
      return
    }
    if (query.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const isHeader = variant === 'header'

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} role="search" aria-label="Recherche intelligente d'entreprises">
        <div className="relative flex items-center w-full">
          <label htmlFor={id} className="sr-only">
            {placeholder}
          </label>

          <input
            id={id}
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            autoFocus={autoFocus}
            className={
              isHeader
                ? 'w-full pl-3.5 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400'
                : 'w-full pl-5 pr-14 py-4 text-base text-gray-900 bg-white rounded-xl shadow-lg focus:outline-none focus:ring-3 focus:ring-yellow-400 border border-gray-200 placeholder:text-gray-400'
            }
          />

          <div className="absolute right-2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-1" aria-hidden="true" />
            )}
            <button
              type="submit"
              className={
                isHeader
                  ? 'p-1.5 text-gray-500 hover:text-blue-700 rounded-md transition-colors'
                  : 'px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs'
              }
              aria-label="Lancer la recherche"
            >
              <Search className={isHeader ? 'w-4 h-4' : 'w-5 h-5'} aria-hidden="true" />
              {!isHeader && <span className="hidden sm:inline">Rechercher</span>}
            </button>
          </div>
        </div>
      </form>

      {/* Menu déroulant de suggestions en temps réel */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Suggestions instantanées</span>
            <span className="hidden sm:inline">Utilisez ↑ ↓ pour naviguer, Entrée pour valider</span>
          </div>

          <ul className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto" role="listbox">
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx
              const isActive = item.etatAdministratif === 'A'

              return (
                <li key={item.siren} role="option" aria-selected={isSelected}>
                  <Link
                    href={`/entreprise/${item.siren}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-3.5 transition-colors group ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50/80 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                            {item.nom}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {isActive ? 'Active' : 'Cessée'}
                          </span>

                          {item.estEnProcedureCollective && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              {item.natureProcedureCollective || 'Procédure en cours'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="font-mono font-medium text-gray-700">SIREN {item.siren}</span>
                          {item.formeJuridique && (
                            <span className="truncate max-w-[200px]">{item.formeJuridique}</span>
                          )}
                          {item.activite && (
                            <span className="text-gray-400">APE {item.activite}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              href={`/recherche?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              Afficher tous les résultats pour « {query} » →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
