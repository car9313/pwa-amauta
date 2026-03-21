import { useEffect, useState, useCallback } from 'react'
import { cacheUrlsViaSW } from '../serviceWorkerRegistration'

type Props = {
  lessonId: string
  getLessonAssets: (lessonId: string) => string[] // función que devuelve URLs necesarias
}

export function DownloadLesson({ lessonId, getLessonAssets }: Props) {
  const [status, setStatus] = useState<'idle'|'requesting'|'downloading'|'done'|'error'>('idle')
  const [results, setResults] = useState<{url: string; ok: boolean; reason?: string}[] | null>(null)

  const onCacheDone = useCallback((evt: Event) => {
    const detail = (evt as CustomEvent).detail
    // detail.results es el array que envía el SW
    setResults(detail)
    const allOk = Array.isArray(detail) && detail.every((r: any) => r.ok)
    setStatus(allOk ? 'done' : 'error')
  }, [])

  useEffect(() => {
    window.addEventListener('app:cache-done', onCacheDone as EventListener)
    return () => window.removeEventListener('app:cache-done', onCacheDone as EventListener)
  }, [onCacheDone])

  const startDownload = async () => {
    const urls = getLessonAssets(lessonId)
    if (!urls || urls.length === 0) return
    // Notificar UI
    setStatus('requesting')
    // Llamamos al SW (si no hay SW, alertamos y podemos fallback a fetch+cache local)
    try {
      cacheUrlsViaSW(urls)
      setStatus('downloading')
      // El resultado real llegará por el evento 'app:cache-done'
    } catch (err) {
      console.error('cacheUrlsViaSW failed', err)
      setStatus('error')
    }
  }

  return (
    <div className="p-3 border rounded">
      <h3 className="text-lg font-semibold mb-2">Descargar lección</h3>

      {status === 'idle' && (
        <button className="btn btn-primary" onClick={startDownload}>
          Descargar para usar offline
        </button>
      )}

      {status === 'requesting' && <p>Solicitando descarga…</p>}
      {status === 'downloading' && <p>Descargando recursos (esto puede tardar)…</p>}

      {status === 'done' && results && (
        <div>
          <p className="text-green-600">Descarga completada.</p>
          <ul className="list-disc ml-5">
            {results.map(r => (
              <li key={r.url}>{r.url} — {r.ok ? 'ok' : `error (${r.reason})`}</li>
            ))}
          </ul>
        </div>
      )}

      {status === 'error' && results && (
        <div>
          <p className="text-red-600">Algunos recursos fallaron:</p>
          <ul className="list-disc ml-5">
            {results.map(r => !r.ok && <li key={r.url}>{r.url} — {r.reason}</li>)}
          </ul>
          <button className="btn btn-secondary mt-2" onClick={startDownload}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}