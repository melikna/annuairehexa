/**
 * Utilitaires pour le formatage et la clarification des résultats de recherche
 * et le respect des plafonds de pagination de l'API Recherche d'Entreprises.
 */

export interface FormattedResultCount {
  displayCount: string
  isCapped: boolean
  notice: string | null
}

/**
 * Formate le nombre total de résultats en distinguant les comptages exacts
 * du plafond technique de 10 000 résultats imposé par l'API officielle d'État.
 */
export function formatResultCount(total: number, isExact: boolean = false): FormattedResultCount {
  if (total >= 10000 && !isExact) {
    return {
      displayCount: '10 000+ résultats consultables',
      isCapped: true,
      notice:
        'Plafond technique de consultation : l’API publique limite l’affichage aux 10 000 premiers résultats pour cette sélection. Le nombre total réel d’entreprises immatriculées dans ce périmètre est supérieur.',
    }
  }

  return {
    displayCount: `${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''}`,
    isCapped: false,
    notice: null,
  }
}
