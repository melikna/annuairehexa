import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Méthodologie et traçabilité des données',
  description:
    'Fonctionnement de l\'annuaire, présentation exhaustive des sources publiques (Sirene, BODACC, RNE, Géo), règles de diffusion et gestion des droits.',
  alternates: { canonical: '/methodologie' },
}

export default function MethodologiePage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Méthodologie' }]} />

        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Méthodologie &amp; Traçabilité des Données</h1>
        <p className="text-gray-600 mb-8">
          Principes de fonctionnement, inventaire des sources officielles mobilisées et engagements de transparence.
        </p>

        <div className="prose prose-sm max-w-none space-y-8">
          <Section title="1. Sources des données publiques">
            <p>
              AnnuaireHexa consolide et restitue des données publiques issues exclusivement des répertoires légaux officiels
              de l'État français, réutilisées sous <strong>Licence Ouverte 2.0 (Etalab)</strong> :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Répertoire Sirene (INSEE)</strong> : état civil des entreprises et établissements, statut administratif (actif / cessé),
                code d'activité principale (APE / NAF), forme juridique et tranches d'effectifs.
              </li>
              <li>
                <strong>BODACC (DILA / Journaux Officiels)</strong> : avis d'immatriculation, modifications générales, ventes et cessions,
                et procédures collectives (sauvegardes, redressements et liquidations judiciaires).
              </li>
              <li>
                <strong>Registre National des Entreprises (RNE / INPI)</strong> : gouvernance, mandataires sociaux, dirigeants et formalités
                d'immatriculation centralisées par l'Institut National de la Propriété Industrielle.
              </li>
              <li>
                <strong>Référentiel géographique (API Géo / DINUM)</strong> : découpage officiel des communes, départements et régions
                (Code Officiel Géographique de l'INSEE).
              </li>
              <li>
                <strong>Nomenclature NAF Rév. 2 (INSEE)</strong> : table officielle des 732 sous-classes d'activités économiques françaises.
              </li>
            </ul>
            <p>
              <Link href="/sources" className="text-blue-600 hover:underline">→ Consulter le détail exhaustif des sources, fréquences et licences</Link>
            </p>
          </Section>

          <Section title="2. Fréquence d'actualisation et fraîcheur des données">
            <p>
              Plutôt que des allégations de « temps réel » absolu, AnnuaireHexa documente précisément les cycles de synchronisation :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Données administratives Sirene &amp; RNE :</strong> synchronisées quotidiennement via l'API publique de l'État (recherche-entreprises.api.gouv.fr).
              </li>
              <li>
                <strong>Annonces légales BODACC :</strong> interrogées en direct auprès de la plateforme OpenDataSoft de la DILA lors de la consultation d'une fiche ou du flux de créations.
              </li>
              <li>
                <strong>Date de consultation :</strong> chaque fiche indique la date de consultation et les dates de publication ou jugement figurant dans les annonces sources.
              </li>
            </ul>
            <p>
              Un décalage temporel peut exister entre l'accomplissement d'une formalité auprès d'un greffe ou du guichet unique et sa répercussion
              dans les fichiers ouverts de l'INSEE ou de la DILA. Seuls les extraits officiels (Kbis, avis Sirene, certificats de non-faillite)
              délivrés par les greffes ou l'INSEE font foi juridiquement.
            </p>
          </Section>

          <Section title="3. Protection de la vie privée et statut de diffusion (statut P)">
            <p>
              En application de l'article <strong>A123-96 du Code de commerce</strong> et des articles 17 et 21 du <strong>RGPD</strong>,
              AnnuaireHexa applique une règle de protection stricte et centralisée sur toutes ses surfaces d'affichage :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Personnes physiques en opposition (statut P Insee) :</strong> leur identité nominative (nom, prénom), leur adresse personnelle,
                leur géolocalisation et leurs coordonnées précises sont intégralement masquées. La dénomination est neutralisée en
                « Entrepreneur individuel (diffusion restreinte) » et leurs fiches sont associées à une directive <code>noindex</code>.
              </li>
              <li>
                <strong>Absence de fuite dans les flux publics :</strong> les entités non diffusibles sont exclues des widgets de l'accueil (nouvelles créations),
                des suggestions d'entreprises similaires et des sitemaps publics.
              </li>
            </ul>
          </Section>

          <Section title="4. Exercice des droits (Opposition, Rectification, Effacement)">
            <p>
              Tout entrepreneur individuel ou représentant légal d'entreprise peut faire valoir ses droits :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Sur AnnuaireHexa :</strong> via notre{' '}
                <Link href="/correction" className="text-blue-600 hover:underline font-semibold">guichet gratuit d'exercice des droits</Link>.
                Votre demande est prise en compte immédiatement dans notre registre local d'opposition.
              </li>
              <li>
                <strong>À la source Insee :</strong> pour que votre opposition s'applique à tous les réutilisateurs de la base Sirene,
                activez gratuitement votre statut de non-diffusion sur le portail officiel Insee :{' '}
                <a href="https://statut-diffusion-sirene.insee.fr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  statut-diffusion-sirene.insee.fr
                </a>.
              </li>
            </ul>
          </Section>

          <Section title="5. Ce que cet annuaire ne fait pas">
            <ul className="list-disc pl-5 space-y-2">
              <li>Nous n'émettons aucun « score de solvabilité » ni « label de conformité » infondé.</li>
              <li>Nous ne publions jamais les identités des personnes physiques ayant exercé leur droit d'opposition.</li>
              <li>Nous n'affichons pas d'avis, de notes d'utilisateurs ou d'appréciations subjectives.</li>
              <li>Un code APE constitue une nomenclature statistique et n'est pas une preuve de qualification professionnelle ou d'agrément.</li>
              <li>Ce site est un annuaire d'information économique indépendant, non affilié à l'INSEE, aux tribunaux ou à l'administration.</li>
            </ul>
          </Section>

          <Section title="6. Plafonds techniques de consultation">
            <p>
              L'API publique Recherche d'Entreprises de l'État plafonne la consultation paginée à 10 000 résultats par filtre
              (ex. départements ou secteurs très denses). Lorsqu'un résultat affiche « 10 000+ résultats », il s'agit du plafond
              technique de recherche et non d'une statistique économique exhaustive de la totalité des entreprises existantes.
            </p>
          </Section>
        </div>
      </div>
    </PublicLayout>
  )
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined}>
      <h2
        id={id ? `${id}-heading` : undefined}
        className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200"
      >
        {title}
      </h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
