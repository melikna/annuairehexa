import { describe, test, expect } from '@jest/globals'
import {
  calculateFrenchVAT,
  formatFrenchVAT,
  verifyLuhn,
  calculateSeniority,
  generateEnterpriseEditorial,
} from '@/lib/seo/enterprise-content'
import type { UniteLegalePubliable, EtablissementPubliable } from '@/types/domain'

describe('SEO & Financial calculation tests', () => {
  test('calculateFrenchVAT calcule fidèlement la clé officielle modulo 97', () => {
    // SIREN 443061841 -> 443061841 % 97 = 82 -> (12 + 3 * 82) % 97 = 258 % 97 = 64 -> FR64443061841
    expect(calculateFrenchVAT('443061841')).toBe('FR64443061841')
    // SIREN 552032534 -> 552032534 % 97 = 5 -> (12 + 3 * 5) % 97 = 27 -> FR27552032534
    expect(calculateFrenchVAT('552032534')).toBe('FR27552032534')
  })

  test('formatFrenchVAT aère le numéro de TVA', () => {
    expect(formatFrenchVAT('FR64443061841')).toBe('FR 64 443 061 841')
  })

  test('verifyLuhn valide les vrais numéros SIREN', () => {
    // 443 061 841 -> Valide Luhn
    expect(verifyLuhn('443061841')).toBe(true)
    // 552 032 534 -> Valide Luhn
    expect(verifyLuhn('552032534')).toBe(true)
    // Numéro bidon
    expect(verifyLuhn('123456789')).toBe(false)
  })

  test('calculateSeniority retourne les années et mois écoulés', () => {
    const res = calculateSeniority('2020-01-01')
    expect(res).not.toBeNull()
    expect(res!.annees).toBeGreaterThanOrEqual(4)
    expect(res!.texte).toContain('an')
  })

  test('generateEnterpriseEditorial produit du contenu unique et des FAQ adaptées', () => {
    const ul: UniteLegalePubliable = {
      siren: '443061841',
      diffusionPartielle: false,
      etatAdministratif: 'A',
      dateCreation: '2002-08-01',
      dateFermeture: null,
      denominationAffichable: 'GOOGLE FRANCE',
      activitePrincipale: '73.11Z',
      libelleActivite: 'Activités des agences de publicité',
      nomenclatureActive: 'NAFRev2',
      categorieJuridique: '5499',
      libelleFormeJuridique: 'SARL unipersonnelle',
      trancheEffectifs: '31',
      anneeEffectifs: '2023',
      categorieEntreprise: 'GE',
      anneeCategorieEntreprise: '2023',
      siretSiege: '44306184100047',
      dateMiseAJour: '2026-09-01',
      nombreEtablissements: 2,
      nombreEtablissementsActifs: 2,
    }

    const siege: EtablissementPubliable = {
      siret: '44306184100047',
      siren: '443061841',
      nic: '00047',
      diffusionPartielle: false,
      etatAdministratif: 'A',
      etablissementSiege: true,
      dateCreation: '2011-01-01',
      dateFermeture: null,
      dateMiseAJour: '2026-09-01',
      enseigneAffichable: 'GOOGLE FRANCE',
      adresseComplete: '8 RUE DE LONDRES, 75009 PARIS',
      adresseLigne1: '8 RUE DE LONDRES',
      adresseLigne2: '75009 PARIS',
      codePostal: '75009',
      libelleCommune: 'PARIS 9',
      codeCommune: '75109',
      codeDepartement: '75',
      codeRegion: '11',
      coordonnees: { latitude: 48.877, longitude: 2.330 },
      activitePrincipale: '73.11Z',
      libelleActivite: 'Activités des agences de publicité',
      nomenclatureActive: 'NAFRev2',
      trancheEffectifs: '31',
      anneeEffectifs: '2023',
    }

    const editorial = generateEnterpriseEditorial(ul, siege, 2)
    expect(editorial.introText).toContain('GOOGLE FRANCE')
    expect(editorial.introText).toContain('443 061 841')
    expect(editorial.activityText).toContain('Activités des agences de publicité')
    expect(editorial.activityText).toContain('PARIS 9')
    expect(editorial.legalText).toContain('FR 64 443 061 841')
    expect(editorial.faq.length).toBe(5)
    expect(editorial.faq[0]!.question).toContain('GOOGLE FRANCE')
  })
})
