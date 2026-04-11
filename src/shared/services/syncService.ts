// === FILE: src/shared/services/syncService.ts ===
/**
 * syncService - manejador simple de "outbox" y sincronización
 *
 * - Provee:
 *    - enqueueAction(action)  -> guarda una acción en outbox (IndexedDB)
 *    - processQueue()         -> revisa outbox y reintenta enviar las acciones al endpoint /api/sync
 *    - getOutboxCount()       -> devuelve el número de items en la cola
 *
 * NOTAS:
 * - Implementación ligera con IndexedDB nativo para no forzar dependencias (Dexie).
 * - Reemplaza la URL '/api/sync' por tu endpoint real (o usa un adapter en apiClient).
 * - En producción conviene usar Dexie (más ergonomía) y lógica avanzada de backoff/retry.
 */

export type OutboxEntry = {
  id?: number
  type: string
  payload: any
  createdAt: number
  attempts?: number
}

/* ---------- Util: abrir DB y asegurar objectStores (cached) ---------- */
let cachedDB: IDBDatabase | null = null

function openOutboxDB(): Promise<IDBDatabase> {
  if (cachedDB?.objectStoreNames.length) {
    return Promise.resolve(cachedDB)
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open('AmautaDB', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('downloadedLessons')) {
        db.createObjectStore('downloadedLessons', { keyPath: 'lessonId' })
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => {
      cachedDB = req.result
      resolve(req.result)
    }
    req.onerror = () => reject(req.error)
  })
}

/* ---------- enqueueAction: guarda en outbox ---------- */
export async function enqueueAction(action: { type: string; payload: any }) {
  const db = await openOutboxDB()
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite')
    const store = tx.objectStore('outbox')
    const entry: OutboxEntry = { ...action, createdAt: Date.now(), attempts: 0 }
    const rq = store.add(entry)
    rq.onsuccess = () => {
      resolve(Number(rq.result))
    }
    rq.onerror = () => reject(rq.error)
  })
}

/* ---------- getAllOutbox: helper ---------- */
async function getAllOutbox(): Promise<OutboxEntry[]> {
  const db = await openOutboxDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readonly')
    const store = tx.objectStore('outbox')
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as OutboxEntry[])
    req.onerror = () => reject(req.error)
  })
}

/* ---------- deleteOutboxEntry: helper ---------- */
async function deleteOutboxEntry(id: number) {
  const db = await openOutboxDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite')
    const store = tx.objectStore('outbox')
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/* ---------- processQueue: Attempt to send actions to server in parallel ---------- */
export async function processQueue(): Promise<{ success: number; failed: number }> {
  const entries = await getAllOutbox()

  if (entries.length === 0) {
    return { success: 0, failed: 0 }
  }

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: entry.type, payload: entry.payload, createdAt: entry.createdAt })
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      await deleteOutboxEntry(entry.id!)
      return entry.id
    })
  )

  let success = 0
  let failed = 0

  for (const result of results) {
    if (result.status === 'fulfilled') {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}

/* ---------- getOutboxCount ---------- */
export async function getOutboxCount(): Promise<number> {
  const entries = await getAllOutbox()
  return entries.length
}

/* ---------- Export por defecto opcional ---------- */
export default {
  enqueueAction,
  processQueue,
  getOutboxCount
}
/* === END FILE === */