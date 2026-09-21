import type { Metadata } from 'next'
import { getDbReadonly } from '@/lib/db/client'
import { Database, ShieldAlert, CheckCircle2, Clock, AlertTriangle, ToggleLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getAdminData() {
  try {
    const db = getDbReadonly()

    const pendingRequests = await db`
      SELECT id, entity_type, entity_id, request_type, status, description, created_at
      FROM suppression_requests
      ORDER BY created_at DESC
      LIMIT 20
    `

    const recentImports = await db`
      SELECT id, type, status, started_at, completed_at, processed_count, created_count, notes
      FROM imports
      ORDER BY started_at DESC
      LIMIT 5
    `

    const adSettings = await db`
      SELECT placement_id, enabled, updated_at
      FROM ad_settings
      ORDER BY placement_id ASC
    `

    return {
      connected: true,
      pendingRequests,
      recentImports,
      adSettings,
    }
  } catch (error) {
    return {
      connected: false,
      pendingRequests: [],
      recentImports: [],
      adSettings: [],
    }
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord d'administration</h1>
          <p className="text-xs text-gray-500 mt-1">Supervision des imports, conformité RGPD et monétisation</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              data.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${data.connected ? 'bg-green-600' : 'bg-red-600'}`} />
            {data.connected ? 'Base PostgreSQL connectée' : 'Base déconnectée'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demandes RGPD & Oppositions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Demandes de correction &amp; oppositions</h2>
            </div>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {data.pendingRequests.length} demande(s)
            </span>
          </div>

          {data.pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              Aucune demande enregistrée pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Identifiant</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.pendingRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900">
                        {req.entity_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize font-medium text-gray-700">{req.request_type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            req.status === 'applied'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate" title={req.description}>
                        {req.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paramètres AdSense & Monétisation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ToggleLeft className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Monétisation AdSense</h2>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-semibold mb-0.5">Statut global</p>
            <p>
              AdSense :{' '}
              <strong>
                {process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true' ? 'Activé' : 'Désactivé par défaut'}
              </strong>
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-gray-700">Emplacements déclarés en base :</p>
            {data.adSettings.length === 0 ? (
              <p className="text-gray-400">Aucun réglage trouvé (base non initialisée).</p>
            ) : (
              <ul className="space-y-1.5 divide-y divide-gray-100">
                {data.adSettings.map((ad: any) => (
                  <li key={ad.placement_id} className="pt-1.5 flex items-center justify-between">
                    <span className="font-mono text-gray-700">{ad.placement_id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        ad.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ad.enabled ? 'ON' : 'OFF'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Historique des imports */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Dernières opérations d'importation</h2>
        </div>

        {data.recentImports.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">
            Aucun historique d'import disponible.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="py-2.5 px-3">Début</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3">Éléments traités</th>
                  <th className="py-2.5 px-3">Éléments créés</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentImports.map((imp: any) => (
                  <tr key={imp.id}>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                      {new Date(imp.started_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{imp.type}</td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      {(imp.processed_count || 0).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {(imp.created_count || 0).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-sm truncate" title={imp.notes}>
                      {imp.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
