import fs from 'fs'
import path from 'path'

export interface SuppressionEntry {
  entityId: string
  entityType: 'unite_legale' | 'etablissement'
  requestType: string
  description: string
  requesterName?: string
  requesterEmail?: string
  createdAt: string
  permanentBlock: boolean
}

const REGISTRY_FILE = path.join(process.cwd(), 'data', 'suppressions.json')

// Cache en mémoire pour vérifications instantanées O(1)
const inMemoryBlockedEntities = new Set<string>()
let isInitialized = false

function initRegistry() {
  if (isInitialized) return
  isInitialized = true

  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const content = fs.readFileSync(REGISTRY_FILE, 'utf-8')
      const entries: SuppressionEntry[] = JSON.parse(content)
      for (const entry of entries) {
        if (entry.permanentBlock) {
          inMemoryBlockedEntities.add(entry.entityId)
        }
      }
    }
  } catch (err) {
    console.warn('[SuppressionRegistry] Erreur lecture registre suppressions:', err)
  }
}

/**
 * Vérifie si un SIREN ou SIRET fait l'objet d'une demande de blocage / déréférencement validée
 */
export function isEntitySuppressed(sirenOrSiret: string): boolean {
  initRegistry()
  return inMemoryBlockedEntities.has(sirenOrSiret)
}

/**
 * Enregistre une nouvelle demande d'opposition ou de suppression
 */
export async function recordSuppression(entry: {
  entityId: string
  requestType: string
  description: string
  requesterName?: string
  requesterEmail?: string
}): Promise<void> {
  initRegistry()

  const isPermanent = entry.requestType === 'opposition' || entry.requestType === 'suppression'
  if (isPermanent) {
    inMemoryBlockedEntities.add(entry.entityId)
  }

  const record: SuppressionEntry = {
    entityId: entry.entityId,
    entityType: entry.entityId.length === 9 ? 'unite_legale' : 'etablissement',
    requestType: entry.requestType,
    description: entry.description,
    requesterName: entry.requesterName,
    requesterEmail: entry.requesterEmail,
    createdAt: new Date().toISOString(),
    permanentBlock: isPermanent,
  }

  try {
    const dir = path.dirname(REGISTRY_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let entries: SuppressionEntry[] = []
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8')
        entries = JSON.parse(raw)
      } catch {
        entries = []
      }
    }

    entries.push(record)
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(entries, null, 2), 'utf-8')
  } catch (err) {
    console.error('[SuppressionRegistry] Erreur écriture registre suppressions:', err)
  }
}
