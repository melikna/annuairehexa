import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { NAF_SECTIONS } from '@/lib/naf/sections'
import { TrendingUp, ChevronRight } from 'lucide-react'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Secteurs d\'activité — Annuaire des entreprises',
  description: 'Explorez les entreprises françaises réparties dans les 21 grands secteurs d\'activité de la nomenclature NAF INSEE (commerce, bâtiment, industrie, informatique...).',
  alternates: { canonical: '/secteurs' },
}

export default function SecteursPage() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Secteurs' }]} />

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secteurs d'activité (Nomenclature NAF)
          </h1>
          <p className="text-gray-600 max-w-3xl">
            La nomenclature d'activités française (NAF de l'INSEE) classe les entreprises et leurs établissements
            en 21 grandes sections. Cliquez sur une section pour filtrer les entreprises correspondantes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAF_SECTIONS.map((sec) => (
            <Link
              key={sec.code}
              href={`/recherche?section=${sec.code}`}
              className="flex flex-col p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold font-mono text-sm flex items-center justify-center">
                  {sec.code}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h2 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors mb-1.5">
                {sec.nom}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mt-auto">
                {sec.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
