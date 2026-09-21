import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Base URL sans paramètre de page, ex: /recherche?q=boulangerie&departement=75 */
  baseUrl: string
}

function buildPageUrl(baseUrl: string, page: number): string {
  const url = new URL(baseUrl, 'https://placeholder.example')
  if (page <= 1) {
    url.searchParams.delete('page')
  } else {
    url.searchParams.set('page', String(page))
  }
  // Retourner uniquement le chemin + paramètres, sans l'origine
  return url.pathname + (url.search !== '?' ? url.search : '')
}

function getPageRange(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  const showStart = currentPage <= 4
  const showEnd = currentPage >= totalPages - 3

  if (showStart) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages)
  } else if (showEnd) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
  }

  return pages
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pageRange = getPageRange(currentPage, totalPages)
  const prevUrl = currentPage > 1 ? buildPageUrl(baseUrl, currentPage - 1) : null
  const nextUrl = currentPage < totalPages ? buildPageUrl(baseUrl, currentPage + 1) : null

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-8"
    >
      {/* Précédent */}
      {prevUrl ? (
        <Link
          href={prevUrl}
          rel="prev"
          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
          aria-label={`Page précédente (page ${currentPage - 1})`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Précédent
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" aria-disabled="true">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Précédent
        </span>
      )}

      {/* Pages */}
      <ol className="flex items-center gap-1 list-none p-0 m-0">
        {pageRange.map((page, index) =>
          page === '...' ? (
            <li key={`ellipsis-${index}`}>
              <span className="px-2 py-2 text-sm text-gray-400" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={page}>
              <Link
                href={buildPageUrl(baseUrl, page)}
                aria-label={page === currentPage ? `Page ${page}, page actuelle` : `Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={clsx(
                  'flex items-center justify-center w-9 h-9 text-sm rounded-md font-medium',
                  page === currentPage
                    ? 'bg-blue-700 text-white cursor-default'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                {page}
              </Link>
            </li>
          )
        )}
      </ol>

      {/* Suivant */}
      {nextUrl ? (
        <Link
          href={nextUrl}
          rel="next"
          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
          aria-label={`Page suivante (page ${currentPage + 1})`}
        >
          Suivant
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" aria-disabled="true">
          Suivant
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}
