/**
 * Client PostgreSQL — pool de connexions partagé
 * 
 * Utilise la bibliothèque `postgres` (postgres.js) pour les requêtes paramétrées.
 * 
 * IMPORTANT : Ce module ne doit jamais être importé côté client (browser).
 * Il doit être utilisé uniquement dans les Route Handlers, Server Components,
 * et workers d'import.
 */

import postgres from 'postgres'

declare global {
  // Permet la réutilisation de la connexion en développement (HMR)
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof postgres> | undefined
  // eslint-disable-next-line no-var
  var __db_readonly: ReturnType<typeof postgres> | undefined
}

function createPool(connectionString: string, options: postgres.Options<{}> = {}) {
  return postgres(connectionString, {
    max: options.max ?? 10,
    idle_timeout: options.idle_timeout ?? 60,
    connect_timeout: 30,
    // Toutes les valeurs de paramètre sont passées de manière sécurisée
    // via la syntaxe sql`...${value}...` de postgres.js
    types: {
      // Assurer que les dates sont retournées comme string ISO, pas comme Date object
      // pour éviter les surprises avec les fuseaux horaires
    },
    // Log des requêtes uniquement en développement
    debug: process.env.NODE_ENV === 'development' 
      ? (connection, query, params) => {
          if (process.env.DEBUG_SQL === 'true') {
            console.debug('[SQL]', query.slice(0, 200), params)
          }
        }
      : undefined,
    ...options,
  })
}

/**
 * Pool de connexions principal (lecture/écriture).
 * Utilisé par les imports et les opérations d'écriture.
 */
export function getDb(): ReturnType<typeof postgres> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL non définie. Copiez .env.example en .env.local et configurez la connexion PostgreSQL.'
    )
  }

  global.__db ??= createPool(url, { max: 5 })
  return global.__db
}

/**
 * Pool de connexions en lecture seule.
 * Utilisé par les Route Handlers et Server Components pour les requêtes publiques.
 * Si DATABASE_URL_READONLY n'est pas défini, utilise DATABASE_URL.
 */
export function getDbReadonly(): ReturnType<typeof postgres> {
  const url = process.env.DATABASE_URL_READONLY ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL non définie.')
  }

  if (url === process.env.DATABASE_URL) return getDb()
  global.__db_readonly ??= createPool(url, { max: 5 })
  return global.__db_readonly
}

/**
 * Exécute une migration SQL.
 * Utilisé par le script scripts/migrate.js.
 */
export async function runMigration(sql: string): Promise<void> {
  const db = getDb()
  await db.unsafe(sql)
}

/**
 * Vérifie la connexion à la base de données.
 * Retourne true si la connexion est réussie.
 */
export async function checkDatabaseConnection(): Promise<{
  ok: boolean
  error?: string
  version?: string
}> {
  try {
    const db = getDbReadonly()
    const result = await db`SELECT version()`
    return { ok: true, version: result[0]?.version as string }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion inconnue',
    }
  }
}

/**
 * Type helper pour les résultats de requêtes postgres.js
 */
export type QueryResult<T> = T[]
