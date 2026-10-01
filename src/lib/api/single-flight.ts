/** Coalesce identical expensive loads and reject excess work without queuing. */
export function singleFlight<T>(maxActive = 4) {
  const pending = new Map<string, Promise<T>>()
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const existing = pending.get(key)
    if (existing) return existing
    if (pending.size >= maxActive) return Promise.reject(new Error('Service capacity reached'))
    const promise = Promise.resolve().then(load).finally(() => pending.delete(key))
    pending.set(key, promise)
    return promise
  }
}
