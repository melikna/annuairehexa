import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getRegions } from '@/lib/geo/service'
import { MapPin, ChevronRight } from 'lucide-react'

export const revalidate = 86400 // Cache 24h

export const metadata: Metadata = {
  title: 'Régions de France — Entreprises et établissements',
  description: 'Consultez les entreprises et établissements implantés dans les 18 régions de France métropolitaine et d\'outre-mer.',
  alternates: { canonical: '/regions' },
}

export default async function RegionsPage() {
  const regions = await getRegions()

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Régions' }]} />

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Régions de France
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Sélectionnez une région pour explorer son tissu économique local, ses départements
            et les entreprises répertoriées dans la base Sirene.
          </p>
        </div>

        {regions.length === 0 ? (
          <div className="p-8 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Référentiel en cours d'initialisation</p>
            <p className="text-sm text-gray-500 mt-1">
              Les référentiels géographiques peuvent être synchronisés via le script d'import des référentiels.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((reg) => (
              <Link
                key={reg.code}
                href={`/region/${reg.slug}`}
                className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center justify-center text-sm">
                    {reg.code}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {reg.nom}
                    </h2>
                    <span className="text-xs text-gray-400">Code INSEE {reg.code}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
