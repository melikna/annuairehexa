import { describe, test, expect } from '@jest/globals'
import {
  formatSiren,
  formatSiret,
  isValidSirenFormat,
  isValidSiretFormat,
  formatTrancheEffectif,
  buildDenominationAffichable,
  buildUniteLegalePubliable,
  buildEtablissementPubliable,
  isPublishable,
} from '@/lib/publication/service'
import type { UniteLegale, Etablissement } from '@/types/domain'

describe('Formatters & Validators', () => {
  test('formatSiren espace correctement un numéro à 9 chiffres', () => {
    expect(formatSiren('123456789')).toBe('123 456 789')
    expect(formatSiren('invalid')).toBe('invalid')
  })

  test('formatSiret espace un numéro à 14 chiffres', () => {
    expect(formatSiret('12345678900012')).toBe('123 456 789 00012')
    expect(formatSiret('123')).toBe('123')
  })

  test('isValidSirenFormat valide strictement 9 chiffres', () => {
    expect(isValidSirenFormat('123456789')).toBe(true)
    expect(isValidSirenFormat('12345678')).toBe(false)
    expect(isValidSirenFormat('12345678A')).toBe(false)
    expect(isValidSirenFormat(' 123456789 ')).toBe(false)
  })

  test('isValidSiretFormat valide strictement 14 chiffres', () => {
    expect(isValidSiretFormat('12345678900014')).toBe(true)
    expect(isValidSiretFormat('1234567890001')).toBe(false)
  })

  test('formatTrancheEffectif retourne le libellé officiel correspondant', () => {
    expect(formatTrancheEffectif('00')).toBe('0 salarié')
    expect(formatTrancheEffectif('11', '2023')).toBe('10 à 19 salariés (données 2023)')
    expect(formatTrancheEffectif('NN')).toBe('Non employeur')
    expect(formatTrancheEffectif(null)).toBe('Non renseigné')
  })
})

describe('Publication Service - Règles de diffusion & RGPD', () => {
  test('isPublishable accepte uniquement O et P', () => {
    expect(isPublishable('O')).toBe(true)
    expect(isPublishable('P')).toBe(true)
    expect(isPublishable('N')).toBe(false)
    expect(isPublishable('?')).toBe(false)
  })

  test('buildDenominationAffichable gère les personnes morales', () => {
    const ul = {
      siren: '123456789',
      statutDiffusion: 'O',
      denominationUniteLegale: 'ACME SARL',
      categorieJuridiqueUniteLegale: '5499', // Société commerciale
    } as unknown as UniteLegale
    expect(buildDenominationAffichable(ul)).toBe('ACME SARL')
  })

  test('buildDenominationAffichable masque le nom si statut P pour personne physique', () => {
    const ul = {
      siren: '987654321',
      statutDiffusion: 'P',
      nomUniteLegale: 'DUPONT',
      prenom1UniteLegale: 'Jean',
      categorieJuridiqueUniteLegale: '1000', // Entrepreneur individuel
    } as unknown as UniteLegale
    expect(buildDenominationAffichable(ul)).toBeNull()
  })

  test('buildUniteLegalePubliable active le flag diffusionPartielle pour statut P', () => {
    const ul = {
      siren: '987654321',
      statutDiffusion: 'P',
      etatAdministratif: 'A',
      dateCreation: '2020-01-01',
      dateFermeture: null,
      denominationUniteLegale: null,
      nomUniteLegale: 'SECRET',
      prenom1UniteLegale: 'Marc',
      categorieJuridiqueUniteLegale: '1000',
      activitePrincipaleUniteLegale: '62.01Z',
      activitePrincipaleNAF25UniteLegale: null,
      nomenclatureActivitePrincipaleUniteLegale: 'NAFRev2',
      trancheEffectifsUniteLegale: 'NN',
      anneeEffectifsUniteLegale: null,
      categorieEntreprise: null,
      anneeCategorieEntreprise: null,
      caractereEmployeurUniteLegale: null,
      siretSiege: null,
      dateDernierTraitementUniteLegale: null,
    } as unknown as UniteLegale

    const publiable = buildUniteLegalePubliable(ul)
    expect(publiable).not.toBeNull()
    expect(publiable?.diffusionPartielle).toBe(true)
    expect(publiable?.denominationAffichable).toBeNull()
    expect(publiable?.activitePrincipale).toBe('62.01Z')
  })

  test('buildEtablissementPubliable masque adresse et géolocalisation pour statut P', () => {
    const etab = {
      siret: '12345678900012',
      siren: '123456789',
      nic: '00012',
      statutDiffusionEtablissement: 'P',
      etatAdministratifEtablissement: 'A',
      etablissementSiege: true,
      codePostalEtablissement: '75001',
      codeCommuneEtablissement: '75056',
      numeroVoieEtablissement: '10',
      typeVoieEtablissement: 'RUE',
      libelleVoieEtablissement: 'DE RIVOLI',
      latitude: '48.8566',
      longitude: '2.3522',
      activitePrincipaleEtablissement: '62.01Z',
      activitePrincipaleNAF25Etablissement: null,
      nomenclatureActivitePrincipaleEtablissement: 'NAFRev2',
      trancheEffectifsEtablissement: 'NN',
      anneeEffectifsEtablissement: null,
      enseigne1Etablissement: 'Mon Agence',
      dateCreationEtablissement: '2021-01-01',
      dateFermetureEtablissement: null,
    } as unknown as Etablissement

    const publiable = buildEtablissementPubliable(etab)
    expect(publiable).not.toBeNull()
    expect(publiable?.diffusionPartielle).toBe(true)
    // Adresse détaillée et géoloc masquées
    expect(publiable?.adresseComplete).toBeNull()
    expect(publiable?.coordonnees).toBeNull()
  })
})
