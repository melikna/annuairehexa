import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Building2, Mail, MapPin, ShieldCheck, Scale, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mentions légales — Annuairehexa',
  description: 'Mentions légales obligatoires du site Annuairehexa : éditeur Mélik Nakhla, hébergement, crédits et conditions de réutilisation.',
  alternates: { canonical: '/mentions-legales' },
}

export default function MentionsLegalesPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Mentions légales' }]} />

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5" />
            Conformité Loi LCEN n° 2004-575 du 21 juin 2004
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mentions Légales</h1>
          <p className="text-gray-600 text-sm mt-1">
            En vigueur au 20 septembre 2026. Informations légales régissant l'accès et l'utilisation du site.
          </p>
        </header>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          {/* 1. Éditeur */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              1. Éditeur du site
            </h2>
            <p className="mb-4">
              Le site internet accessible à l'adresse <strong>{siteUrl}</strong> (dénommé ci-après « le Site » ou « {siteName} »)
              est édité et publié par :
            </p>

            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <p>
                <strong>Éditeur :</strong> Mélik Nakhla
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>Adresse de domiciliation :</strong> 60 rue François 1er, 75008 Paris, France
              </p>
              <p className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>Numéro SIRET :</strong> 753 719 996 00054 (SIREN : 753 719 996)
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>Courrier électronique :</strong>{' '}
                <a href="mailto:contact@annuairehexa.fr" className="text-blue-600 font-semibold hover:underline">
                  contact@annuairehexa.fr
                </a>
              </p>
              <p>
                <strong>Directeur de la publication :</strong> Mélik Nakhla
              </p>
            </div>
          </section>

          {/* 2. Hébergement */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              2. Hébergement &amp; Infrastructure technique
            </h2>
            <p className="mb-3">
              Le site {siteName} est propulsé par une infrastructure distribuée haute performance répondant aux exigences strictes
              européennes de sécurité et de résilience (centres de données localisés dans l'Union Européenne) :
            </p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p><strong>Fournisseur d'hébergement :</strong> Cloudflare, Inc. / Vercel Inc. (Data Centers EU)</p>
              <p><strong>Localisation des données :</strong> Union Européenne (France, Allemagne)</p>
              <p><strong>Sécurité :</strong> Chiffrement des transferts via protocole TLS 1.3 / certificat SSL Let's Encrypt</p>
            </div>
          </section>

          {/* 3. Indépendance */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              3. Nature du service &amp; Indépendance vis-à-vis de l'administration
            </h2>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs mb-4">
              <strong>Avertissement légal :</strong> {siteName} est une plateforme privée d'information économique indépendante.
              Elle n'est affiliée, mandatée ou associée à aucun organisme étatique, ni à l'INSEE, ni au Ministère de l'Économie,
              ni aux greffes des tribunaux de commerce, ni à l'INPI.
            </div>
            <p className="mb-2">
              Le site propose un service d'annuaire et de consultation de données ouvertes publiques issues du répertoire national
              des entreprises (Base Sirene INSEE, Registre National des Entreprises de l'INPI, et BODACC de la DILA).
            </p>
            <p>
              Ce service <strong>ne délivre aucun extrait Kbis officiel</strong>. Pour obtenir un extrait Kbis officiel ou effectuer
              une formalité modificative d'immatriculation, les professionnels et particuliers doivent impérativement s'adresser
              au greffe du tribunal de commerce compétent ou au portail officiel des formalités d'entreprises (guichet-unique de l'INPI).
            </p>
          </section>

          {/* 4. Licence des données */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              4. Licence et réutilisation des informations publiques
            </h2>
            <p className="mb-3">
              Les données brutes relatives aux entreprises, établissements et annonces légales diffusées sur le Site sont issues
              de la réutilisation de données publiques ouvertes mises à disposition selon les termes de la{' '}
              <a
                href="https://www.etalab.gouv.fr/licence-ouverte-open-licence"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-medium"
              >
                Licence Ouverte 2.0 (Etalab)
              </a> :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
              <li>
                <strong>Répertoire Sirene :</strong> Institut National de la Statistique et des Études Économiques (INSEE).
              </li>
              <li>
                <strong>Annonces commerciales &amp; Procédures :</strong> Bulletin Officiel des Annonces Civiles et Commerciales (BODACC / DILA).
              </li>
              <li>
                <strong>Données géographiques et administratives :</strong> Référentiel IGN et API Découpage Administratif (Etalab).
              </li>
            </ul>
          </section>

          {/* 5. Données personnelles et RGPD */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              5. Protection des données personnelles &amp; RGPD
            </h2>
            <p className="mb-3">
              Le traitement des données à caractère personnel réalisé par {siteName} respecte scrupuleusement les dispositions
              du Règlement Général sur la Protection des Données (RGPD 2016/679) et de la loi Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>
            <p className="mb-3">
              Les personnes physiques (notamment entrepreneurs individuels) disposent d'un droit d'opposition gratuit et sans justification
              conformément à l'article 21 du RGPD et aux recommandations de la CNIL pour les annuaires en ligne.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/confidentialite"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Consulter notre politique de confidentialité
              </Link>
              <Link
                href="/correction"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-xs transition-colors border border-gray-200"
              >
                Exercer un droit d'opposition ou rectification
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
