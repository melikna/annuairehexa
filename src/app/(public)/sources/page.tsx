import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ExternalLink, Database, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sources des données et licences',
  description: 'Présentation exhaustive des sources de données publiques utilisées par l\'annuaire (Sirene INSEE, API geo.api.gouv.fr) et de leurs conditions de réutilisation.',
  alternates: { canonical: '/sources' },
}

export default function SourcesPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Sources' }]} />

        <header className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sources des données et licences</h1>
          <p className="text-gray-600">
            Notre annuaire s'engage à une transparence totale sur la provenance de chaque donnée affichée.
          </p>
        </header>

        <div className="space-y-8">
          {/* Base Sirene */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">1. Base Sirene des entreprises</h2>
                <p className="text-xs text-gray-500">Institut National de la Statistique et des Études Économiques (INSEE)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Le répertoire Sirene enregistre l'état civil de toutes les entreprises et de leurs établissements en France.
              Les données sont réutilisées sous <strong>Licence Ouverte 2.0 (Etalab)</strong>.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg mb-4">
              <div>
                <dt className="text-gray-500">Producteur :</dt>
                <dd className="font-semibold text-gray-800">INSEE</dd>
              </div>
              <div>
                <dt className="text-gray-500">Licence :</dt>
                <dd className="font-semibold text-gray-800">Licence Ouverte / Open Licence 2.0</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fréquence de mise à jour :</dt>
                <dd className="font-semibold text-gray-800">Mensuelle (stocks) et quotidienne (API)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Jeu de données de référence :</dt>
                <dd className="font-semibold text-blue-700">
                  <a
                    href="https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    data.gouv.fr/base-sirene <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            </dl>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-600">
              <p>
                <strong>Protection des données personnelles :</strong> Les personnes physiques ayant fait valoir leur
                droit d'opposition auprès de l'INSEE voient leurs données identifiantes et adresses masquées
                conformément aux règles de diffusion partielle.
              </p>
            </div>
          </section>

          {/* Découpage administratif */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-50 text-green-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">2. Référentiel géographique (API Géo)</h2>
                <p className="text-xs text-gray-500">Etalab / Direction Interministérielle du Numérique (DINUM)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Les régions, départements et communes sont issus de l'API Découpage Administratif (geo.api.gouv.fr),
              basée sur le Code Officiel Géographique (COG) de l'INSEE.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg">
              <div>
                <dt className="text-gray-500">Fournisseur :</dt>
                <dd className="font-semibold text-gray-800">geo.api.gouv.fr (DINUM)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Licence :</dt>
                <dd className="font-semibold text-gray-800">Licence Ouverte 2.0</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
