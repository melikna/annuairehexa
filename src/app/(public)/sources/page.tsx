import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ExternalLink, Database, ShieldCheck, FileText, Scale, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sources des données publiques et licences',
  description:
    'Documentation détaillée des sources officielles utilisées par AnnuaireHexa (Sirene INSEE, BODACC DILA, RNE INPI, API Géo DINUM, NAF Insee) et de leurs licences de réutilisation.',
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
            AnnuaireHexa s'engage à une transparence totale sur l'origine, la périodicité et les licences de réutilisation
            de chaque famille de données publiques affichée sur le site.
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
                <h2 className="text-xl font-bold text-gray-900">1. Répertoire National Sirene</h2>
                <p className="text-xs text-gray-500">Institut National de la Statistique et des Études Économiques (INSEE)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Le répertoire Sirene enregistre l'état civil de toutes les entreprises et établissements implantés en France.
              Les données sont réutilisées sous <strong>Licence Ouverte 2.0 (Etalab)</strong> via l'API publique de l'État.
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
                <dt className="text-gray-500">Fréquence de synchronisation :</dt>
                <dd className="font-semibold text-gray-800">Quotidienne (API Recherche d'Entreprises DINUM)</dd>
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
                <strong>Protection de la vie privée (statut P) :</strong> Les personnes physiques ayant exercé leur droit
                d'opposition auprès de l'INSEE bénéficient d'un masquage intégral de leur patronyme et de leur adresse
                conformément à l'art. A123-96 du Code de commerce.
              </p>
            </div>
          </section>

          {/* BODACC */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">2. BODACC (Annonces Civiles et Commerciales)</h2>
                <p className="text-xs text-gray-500">Direction de l'Information Légale et Administrative (DILA - Premier Ministre)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Le Bulletin Officiel des Annonces Civiles et Commerciales assure la publicité des actes enregistrés
              aux greffes des tribunaux de commerce : créations d'entreprises, modifications statutaires, ventes de fonds,
              et décisions de procédures collectives (sauvegardes, redressements, liquidations judiciaires).
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg mb-4">
              <div>
                <dt className="text-gray-500">Producteur :</dt>
                <dd className="font-semibold text-gray-800">DILA (Direction de l'information légale et administrative)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Licence :</dt>
                <dd className="font-semibold text-gray-800">Licence Ouverte 2.0</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fréquence de parution :</dt>
                <dd className="font-semibold text-gray-800">Du mardi au dimanche (consultation API en direct)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Jeu de données de référence :</dt>
                <dd className="font-semibold text-blue-700">
                  <a
                    href="https://bodacc-datadila.opendatasoft.com/explore/dataset/annonces-commerciales/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    bodacc-datadila.opendatasoft.com <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Registre National des Entreprises (RNE / INPI) */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">3. Registre National des Entreprises (RNE)</h2>
                <p className="text-xs text-gray-500">Institut National de la Propriété Industrielle (INPI)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Depuis le 1er janvier 2023, le RNE centralise l'ensemble des formalités d'immatriculation, de modification
              et de cessation d'activité, ainsi que les données relatives aux dirigeants sociaux et bénéficiaires effectifs.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg">
              <div>
                <dt className="text-gray-500">Producteur :</dt>
                <dd className="font-semibold text-gray-800">INPI</dd>
              </div>
              <div>
                <dt className="text-gray-500">Licence :</dt>
                <dd className="font-semibold text-gray-800">Licence Ouverte 2.0</dd>
              </div>
              <div>
                <dt className="text-gray-500">Accès :</dt>
                <dd className="font-semibold text-gray-800">Via l'API Recherche d'Entreprises (DINUM)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Portail officiel :</dt>
                <dd className="font-semibold text-blue-700">
                  <a
                    href="https://data.inpi.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    data.inpi.fr <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Découpage administratif */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-50 text-green-700 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">4. Référentiel géographique (API Géo)</h2>
                <p className="text-xs text-gray-500">Direction Interministérielle du Numérique (DINUM)</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Les régions, départements et communes sont issus de l'API Découpage Administratif (geo.api.gouv.fr),
              basée sur le Code Officiel Géographique (COG) tenu à jour par l'INSEE.
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

          {/* Nomenclature NAF */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">5. Nomenclature d'Activités Française (NAF Rév. 2)</h2>
                <p className="text-xs text-gray-500">INSEE</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              La table officielle complète des 732 sous-classes d'activités (codes APE) de l'INSEE est intégrée
              dans notre moteur pour assurer un libellé textuel exact et certifié pour chaque code d'activité économique.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg">
              <div>
                <dt className="text-gray-500">Producteur :</dt>
                <dd className="font-semibold text-gray-800">INSEE</dd>
              </div>
              <div>
                <dt className="text-gray-500">Périmètre :</dt>
                <dd className="font-semibold text-gray-800">732 sous-classes officielles NAF Rév. 2</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
