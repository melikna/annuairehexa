import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getDbReadonly } from '@/lib/db/client'
import { Database, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export const revalidate = 3600 // 1h

export const metadata: Metadata = {
  title: 'Rapport de couverture des données',
  description: 'État d\'avancement des imports Sirene dans notre base de données : volumes, territoires couverts et calendrier de synchronisation.',
  alternates: { canonical: '/couverture' },
}

async function getCoverageStats() {
  try {
    const db = getDbReadonly()
    const [counts] = await db`
      SELECT 
        (SELECT COUNT(*) FROM legal_units) AS total_unites_legales,
        (SELECT COUNT(*) FROM legal_units WHERE etat_administratif = 'A') AS unites_legales_actives,
        (SELECT COUNT(*) FROM establishments) AS total_etablissements,
        (SELECT COUNT(*) FROM establishments WHERE etat_administratif = 'A') AS etablissements_actifs,
        (SELECT COUNT(*) FROM regions) AS total_regions,
        (SELECT COUNT(*) FROM departements) AS total_departements,
        (SELECT COUNT(*) FROM communes) AS total_communes
    `

    const lastImport = await db`
      SELECT id, type, status, started_at, completed_at, processed_count, created_count, notes
      FROM imports
      ORDER BY started_at DESC
      LIMIT 5
    `

    return { counts, lastImport }
  } catch (error) {
    return null
  }
}

export default async function CouverturePage() {
  const data = await getCoverageStats()

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Couverture des données' }]} />

        <header className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rapport de couverture et fraîcheur
          </h1>
          <p className="text-gray-600">
            Nous documentons ici de manière transparente les volumes indexés dans notre base locale,
            les zones géographiques disponibles et les derniers imports effectués.
          </p>
        </header>

        {/* Chiffres actuels */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-700" />
            Entités indexées dans la base locale
          </h2>

          {data?.counts ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Entreprises actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(data.counts.unites_legales_actives || 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  sur {Number(data.counts.total_unites_legales || 0).toLocaleString('fr-FR')} au total
                </p>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Établissements ouverts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(data.counts.etablissements_actifs || 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  sur {Number(data.counts.total_etablissements || 0).toLocaleString('fr-FR')} au total
                </p>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Départements référencés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(data.counts.total_departements || 0)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">sur 101 départements</p>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Communes chargées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(data.counts.total_communes || 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">sur ~35 000 communes</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <p className="font-semibold mb-1">Base de données non initialisée ou déconnectée</p>
              <p>
                Les statistiques de couverture s'afficheront ici automatiquement dès que PostgreSQL sera connecté
                et que les scripts d'import auront été exécutés.
              </p>
            </div>
          )}
        </section>

        {/* Historique des imports */}
        {data?.lastImport && data.lastImport.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-700" />
              Derniers traitements d'import
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Éléments traités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.lastImport.map((imp: any) => (
                    <tr key={imp.id}>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(imp.started_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono">{imp.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            imp.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : imp.status === 'running'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {imp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {(imp.processed_count || 0).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Limites documentées */}
        <section className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <h2 className="text-base font-bold text-gray-900 mb-2">
            Limites connues du périmètre
          </h2>
          <ul className="text-xs text-gray-600 space-y-2 list-disc pl-5">
            <li>
              <strong>Entités non-diffusibles :</strong> Les entreprises et entrepreneurs ayant fait valoir leur opposition (statut P)
              ont leurs coordonnées et identités masquées, ou sont exclues de l'indexation publique si non-diffusibles.
            </li>
            <li>
              <strong>Périmètre pilote :</strong> En phase initiale (Jalon A/B), la base de données est peuplée prioritairement
              sur un ou plusieurs départements témoins (ex: 75 Paris) via l'API Recherche Entreprises.
            </li>
            <li>
              <strong>Passage à l'échelle :</strong> La couverture nationale intégrale (~15 millions d'établissements)
              fait l'objet de l'étape Jalon C avec le chargement en streaming des fichiers stocks Parquet de l'INSEE.
            </li>
          </ul>
        </section>
      </div>
    </PublicLayout>
  )
}
