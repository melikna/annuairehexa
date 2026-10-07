export function SearchUnavailable() {
  return (
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <h2 className="font-semibold">Recherche temporairement indisponible</h2>
      <p className="mt-2 text-sm">
        Le service de données ne répond pas pour le moment. Réessayez dans quelques instants en actualisant la page.
      </p>
    </div>
  )
}
