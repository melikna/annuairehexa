import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getDepartements } from '@/lib/geo/service'
import { MapPin, ChevronRight } from 'lucide-react'

export const revalidate = 86400 // Cache 24h

export const metadata: Metadata = {
  title: 'Départements de France — Entreprises et établissements',
  description: 'Parcourez les entreprises dans les 101 départements français de métropole et d\'outre-mer.',
  alternates: { canonical: '/departements' },
}

export default async function DepartementsPage() {
  const departements = await getDepartements()

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Départements' }]} />

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Départements de France
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Accédez aux données économiques et aux entreprises répertoriées dans chaque département.
          </p>
        </div>

        {departements.length === 0 ? (
          <div className="p-8 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Référentiel en cours d'initialisation</p>
            <p className="text-sm text-gray-500 mt-1">
              Exécutez <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">node workers/import/referentiels.js</code> pour importer les 101 départements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {departements.map((dep) => (
              <Link
                key={dep.code}
                href={`/departement/${dep.slug}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-8 rounded bg-gray-100 text-gray-800 font-mono font-semibold text-xs flex items-center justify-center">
                    {dep.code}
                  </span>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {dep.nom}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
