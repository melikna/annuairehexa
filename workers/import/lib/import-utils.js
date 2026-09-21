/**
 * Utilitaires d'import partagés entre les workers
 */

/**
 * Crée un enregistrement d'import dans la base de données.
 * @returns L'ID UUID de l'import créé
 */
export async function createImportRecord(db, { type, sourceId, sourceUrl, sourceVersion, notes }) {
  const result = await db`
    INSERT INTO imports (type, status, source_id, source_url, source_version, started_at)
    VALUES (
      ${type},
      'running',
      ${sourceId ?? null},
      ${sourceUrl ?? null},
      ${sourceVersion ?? null},
      NOW()
    )
    RETURNING id
  `
  const id = result[0]?.id
  if (!id) throw new Error('Impossible de créer l\'enregistrement d\'import')
  
  if (notes) {
    console.log(`[Import] ${notes}`)
  }
  
  return id
}

/**
 * Met à jour un enregistrement d'import.
 */
export async function updateImportRecord(db, importId, {
  status,
  processedCount,
  createdCount,
  updatedCount,
  rejectedCount,
  errorMessage,
  watermarkEnd,
}) {
  await db`
    UPDATE imports SET
      status = ${status},
      processed_count = ${processedCount ?? 0},
      created_count = ${createdCount ?? 0},
      updated_count = ${updatedCount ?? 0},
      rejected_count = ${rejectedCount ?? 0},
      error_message = ${errorMessage ?? null},
      watermark_end = ${watermarkEnd ?? null},
      completed_at = ${status !== 'running' ? new Date().toISOString() : null},
      updated_at = NOW()
    WHERE id = ${importId}
  `
}
