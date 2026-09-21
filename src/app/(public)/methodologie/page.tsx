import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Méthodologie',
  description:
    'Comment fonctionne cet annuaire, quelles sont ses sources, ses limites et la façon dont nous appliquons les règles de diffusion.',
  alternates: { canonical: '/methodologie' },
}

export default function MethodologiePage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Méthodologie' }]} />

        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Méthodologie</h1>
        <p className="text-gray-600 mb-8">Comment cet annuaire fonctionne, d'où viennent les données et quelles sont ses limites.</p>

        <div className="prose prose-sm max-w-none space-y-8">
          <Section title="1. Source des données">
            <p>
              Toutes les informations sur les entreprises et établissements proviennent du{' '}
              <strong>répertoire Sirene</strong> de l'<a href="https://www.insee.fr" target="_blank" rel="noopener noreferrer">INSEE</a>{' '}
              (Institut national de la statistique et des études économiques).
              Ces données sont diffusées sous{' '}
              <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" target="_blank" rel="noopener noreferrer">Licence Ouverte 2.0</a>.
            </p>
            <p>
              Nous n'inventons, ne déduisons, ni ne croisons des données provenant d'autres sources pour en inférer des informations que Sirene ne contient pas.
              Chaque champ affiché correspond directement à une variable Sirene, à sa valeur normalisée, ou indique clairement son absence.
            </p>
            <p>
              <Link href="/sources" className="text-blue-600 hover:underline">→ Détail des sources et licences</Link>
            </p>
          </Section>

          <Section title="2. Mise à jour des données">
            <p>
              Les fichiers stocks Sirene sont mis à jour mensuellement par l'INSEE.
              Notre base est synchronisée régulièrement. La date de fraîcheur des données est affichée sur chaque fiche.
            </p>
            <p>
              Il peut exister un décalage entre la réalité et les données affichées, notamment pour les créations,
              cessations ou modifications récentes. Pour toute démarche formelle ou délivrance d'actes certifiés, consultez les organismes compétents.
            </p>
          </Section>

          <Section title="3. Statut de diffusion" id="diffusion-partielle">
            <p>
              Chaque entreprise ou établissement dispose d'un <strong>statut de diffusion</strong> dans Sirene&nbsp;:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Diffusion intégrale (O)</strong> : toutes les informations disponibles sont affichées.
              </li>
              <li>
                <strong>Diffusion partielle (P)</strong> : l'entreprise ou son représentant légal a exercé son droit d'opposition.
                Pour les personnes physiques : l'identité (nom, prénom), l'adresse précise et la géolocalisation sont masquées.
                Pour les personnes morales : l'adresse précise et la géolocalisation de l'établissement sont masquées.
              </li>
            </ul>
            <p>
              En cas de valeur inconnue ou contradictoire du statut de diffusion, nous appliquons une règle conservatrice&nbsp;:
              l'entité n'est pas publiée.
            </p>
            <p>
              Les entités non diffusibles n'apparaissent pas dans les résultats de recherche ni sur aucune page publique de ce site.
            </p>
          </Section>

          <Section title="4. Exercer ses droits">
            <p>
              Toute personne physique immatriculée en tant qu'entrepreneur individuel, ou représentant légal d'une personne morale,
              peut exercer son droit d'opposition à la diffusion directement auprès de l'INSEE.
            </p>
            <p>
              Si vous constatez une inexactitude sur ce site, utilisez notre{' '}
              <Link href="/correction" className="text-blue-600 hover:underline">formulaire de correction</Link>.
              Ce formulaire est gratuit.
            </p>
            <p>
              Pour exercer vos droits RGPD (accès, rectification, opposition, effacement), consultez notre{' '}
              <Link href="/confidentialite" className="text-blue-600 hover:underline">politique de confidentialité</Link>.
            </p>
          </Section>

          <Section title="5. Ce que cet annuaire ne fait pas">
            <ul className="list-disc pl-5 space-y-2">
              <li>Nous ne publions pas les identités masquées par Sirene.</li>
              <li>Nous ne déduisons pas d'informations à partir de croisements avec d'autres bases.</li>
              <li>Nous n'affichons pas d'avis, de notes ou d'étoiles sur les entreprises.</li>
              <li>Nous ne garantissons pas l'exactitude ou l'exhaustivité des données (voir couverture).</li>
              <li>Un code APE ne constitue pas une preuve de qualification, certification ou agrément.</li>
              <li>Ce site n'est pas affilié à l'INSEE, au gouvernement, ni à aucune administration.</li>
            </ul>
          </Section>

          <Section title="6. Couverture">
            <p>
              La couverture de notre base dépend des imports réalisés.
              Nous maintenons un{' '}
              <Link href="/couverture" className="text-blue-600 hover:underline">rapport de couverture</Link>{' '}
              indiquant les territoires importés, le nombre d'entités indexées et les limites connues.
            </p>
          </Section>

          <Section title="7. Référencement et publicité">
            <p>
              Ce site peut afficher des publicités via Google AdSense, uniquement sur les pages éditoriales
              après consentement valide de l'utilisateur. Aucune publicité n'est affichée sur les formulaires
              de droits, les pages légales ou les pages de recherche.
            </p>
            <p>
              Les politiques d'indexation (SEO) sont documentées dans les métadonnées de chaque page.
              Certaines pages (résultats de recherche, fiches avec diffusion partielle) ne sont pas indexées.
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
