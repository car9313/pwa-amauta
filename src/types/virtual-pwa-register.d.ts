// src/types/virtual-pwa-register.d.ts
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    immediate?: boolean
  }

  /**
   * registerSW(options) => returns an update function (that attempts update / skipWaiting)
   * The returned function may be undefined in some runtimes; type it as (() => Promise<void>) | undefined
   */
  export function registerSW(options?: RegisterSWOptions): (() => Promise<void>) | undefined
  export default registerSW
}