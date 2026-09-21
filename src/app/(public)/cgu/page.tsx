import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FileCheck, Shield, AlertCircle, Scale, Building2, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU) — Annuairehexa',
  description: 'Conditions régissant l\'accès, la consultation et l\'utilisation des données publiques ouvertes sur le site Annuairehexa.',
  alternates: { canonical: '/cgu' },
}

export default function CguPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Conditions Générales d\'Utilisation' }]} />

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <FileCheck className="w-3.5 h-3.5" />
            Cadre contractuel et légal
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Conditions Générales d'Utilisation (CGU)
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            En vigueur au 20 septembre 2026. Toute navigation sur le site implique l'acceptation pleine et entière des présentes conditions.
          </p>
        </header>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          {/* Article 1 - Objet */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Article 1 — Objet et Champ d'Application</h2>
            <p className="mb-2">
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités
              et conditions dans lesquelles l'éditeur met à la disposition des internautes (ci-après « l'Utilisateur »)
              le service d'annuaire et d'information économique accessible sur le site <strong>{siteName}</strong> ({siteUrl}).
            </p>
            <p>
              L'accès au site {siteName} et son utilisation sont gratuits et ouverts à tout utilisateur disposant d'un accès internet.
            </p>
          </section>

          {/* Article 2 - Éditeur */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Article 2 — Informations Légales sur l'Éditeur</h2>
            <p className="mb-3">
              Le site {siteName} est édité par :
            </p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p><strong>Éditeur :</strong> Mélik Nakhla</p>
              <p><strong>Domiciliation :</strong> 60 rue François 1er, 75008 Paris, France</p>
              <p><strong>Numéro SIRET :</strong> 753 719 996 00054 (SIREN 753 719 996)</p>
              <p><strong>Courriel de contact :</strong> <a href="mailto:contact@annuairehexa.fr" className="text-blue-600 font-semibold underline">contact@annuairehexa.fr</a></p>
            </div>
          </section>

          {/* Article 3 - Nature du service */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Article 3 — Nature du Service &amp; Indépendance
            </h2>
            <p className="mb-3">
              <strong>{siteName}</strong> est un annuaire d'information économique généraliste permettant de consulter,
              rechercher et analyser les informations légales, administratives et financières publiques des entreprises,
              établissements secondaires, artisans et professions libérales enregistrés en France.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mb-3">
              <strong>Avertissement important :</strong> Le site {siteName} est un portail strictement privé et indépendant.
              Il n'est pas un service officiel de l'État, n'est pas géré par l'INSEE, ni par le Ministère de l'Économie,
              ni par Infogreffe ou les greffes des tribunaux de commerce.
            </div>
            <p className="text-xs text-gray-600">
              Le site <strong>ne délivre aucun extrait Kbis officiel</strong>. Les données synthétiques affichées ne constituent
              pas un document probant opposable aux tiers au sens du Code de commerce.
            </p>
          </section>

          {/* Article 4 - Sources des données */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Article 4 — Origine et Licence des Données Diffusées</h2>
            <p className="mb-3">
              Toutes les données relatives aux entreprises sont issues des jeux de données publics mis à disposition
              selon les principes de l'Open Data sous Licence Ouverte 2.0 (Etalab) par les administrations publiques :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li><strong>Base Sirene :</strong> Institut National de la Statistique et des Études Économiques (INSEE) ;</li>
              <li><strong>Registre National des Entreprises (RNE) :</strong> Institut National de la Propriété Industrielle (INPI) ;</li>
              <li><strong>Procédures collectives et annonces commerciales :</strong> Bulletin Officiel des Annonces Civiles et Commerciales (BODACC / DILA).</li>
            </ul>
          </section>

          {/* Article 5 - Limitation de responsabilité */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Article 5 — Limitation de Responsabilité
            </h2>
            <p className="mb-3">
              L'éditeur s'efforce d'assurer au mieux de ses moyens l'exactitude et la mise à jour des informations diffusées
              sur le site. Toutefois, s'agissant de la réutilisation de données produites par des tiers (administrations publiques),
              l'éditeur ne saurait être tenu responsable des erreurs, omissions, inexactitudes ou retards de synchronisation
              présents dans les bases sources.
            </p>
            <p className="text-xs text-gray-600 mb-2">
              L'Utilisateur est seul responsable de l'usage qu'il fait des informations consultées. En aucun cas {siteName} ne pourra
              être tenu responsable de tout préjudice direct ou indirect résultant d'une décision commerciale, juridique
              ou financière prise sur la base des informations figurant sur le site.
            </p>
          </section>

          {/* Article 6 - Engagements de l'utilisateur */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Article 6 — Obligations de l'Utilisateur</h2>
            <p className="mb-2">L'Utilisateur s'interdit formellement :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 mb-3">
              <li>De collecter de façon massive ou automatisée (web scraping abusif) des données à caractère personnel dans le but de constituer des fichiers de prospection commerciale illicite (infraction aux articles 226-16 et suivants du Code pénal) ;</li>
              <li>De perturber le fonctionnement des serveurs ou des API par des requêtes excessives visant à saturer la bande passante ;</li>
              <li>De contourner les mesures techniques mises en place pour protéger la vie privée des entrepreneurs individuels opposants (statut P Insee).</li>
            </ul>
          </section>

          {/* Article 7 - Données personnelles et RGPD */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Article 7 — Données Personnelles et Droit d'Opposition
            </h2>
            <p className="mb-3">
              Le traitement des données personnelles est régi par notre{' '}
              <Link href="/confidentialite" className="text-blue-600 underline font-semibold">
                Politique de Confidentialité
              </Link>.
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Conformément à l'article 21 du RGPD et à la délibération CNIL relative aux annuaires en ligne, les personnes physiques
              (entrepreneurs individuels) bénéficient d'un <strong>droit d'opposition immédiat et gratuit</strong>.
              Pour exercer ce droit ou demander la rectification de vos coordonnées professionnelles, un formulaire dédié est à votre disposition :
            </p>
            <Link
              href="/correction"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Accéder au formulaire d'opposition et rectification
            </Link>
          </section>

          {/* Article 8 - Droit applicable */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Article 8 — Droit Applicable et Juridiction Compétente
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Les présentes CGU sont régies par la législation française. En cas de litige relatif à l'interprétation,
              la validité ou l'exécution des présentes conditions, et à défaut de résolution amiable préalable,
              les tribunaux du ressort de la <strong>Cour d'appel de Paris</strong> seront seuls territorialement compétents.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
