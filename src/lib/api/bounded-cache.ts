/** LRU cache bounded by both serialized bytes and entry count. */
export class BoundedCache<T extends { expiresAt: number }> {
  private entries = new Map<string, { value: T; bytes: number }>()
  private bytes = 0
  constructor(private maxEntries = 64, private maxBytes = 4 * 1024 * 1024) {}
  get size() { return this.entries.size }
  get byteSize() { return this.bytes }
  private remove(key: string) {
    const entry = this.entries.get(key)
    if (entry) this.bytes -= entry.bytes
    this.entries.delete(key)
  }
  get(key: string): T | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.value.expiresAt <= Date.now()) {
      this.remove(key)
      return undefined
    }
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.value
  }
  set(key: string, value: T) {
    for (const [k, entry] of this.entries) {
      if (entry.value.expiresAt <= Date.now()) this.remove(k)
    }
    this.remove(key)
    const bytes = Buffer.byteLength(key) + Buffer.byteLength(JSON.stringify(value))
    if (bytes > this.maxBytes || value.expiresAt <= Date.now()) return
    while (this.entries.size >= this.maxEntries || this.bytes + bytes > this.maxBytes) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.remove(oldest)
    }
    this.entries.set(key, { value, bytes })
    this.bytes += bytes
  }
}
