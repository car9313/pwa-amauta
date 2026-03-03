# 🎮 Kids PWA - Frontend Base

Base inicial para una **Progressive Web App (PWA)** desarrollada con:

* ⚛️ React
* ⚡ Vite
* 🟦 TypeScript
* 🎨 Tailwind CSS v4.2
* 🧩 shadcn/ui
* 📱 Soporte PWA

Proyecto enfocado en una arquitectura escalable, mantenible y alineada con buenas prácticas modernas de desarrollo frontend.

---

## 🚀 Stack Tecnológico

| Tecnología      | Propósito                       |
| --------------- | ------------------------------- |
| React 18+       | UI basada en componentes        |
| Vite            | Bundler rápido y optimizado     |
| TypeScript      | Tipado estático                 |
| Tailwind 4.2    | Sistema de diseño utility-first |
| shadcn/ui       | Componentes reutilizables       |
| vite-plugin-pwa | Configuración PWA               |

---

## 📦 Instalación del Proyecto

### 1️⃣ Crear proyecto con Vite

```bash
npm create vite@latest kids-pwa
cd kids-pwa
npm install
```

Seleccionar:

* Framework: React
* Variant: TypeScript

---

### 2️⃣ Instalar Tailwind CSS v4.2

```bash
npm install tailwindcss @tailwindcss/vite
```

Configurar `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Agregar en `src/index.css`:

```css
@import "tailwindcss";
```

---

### 3️⃣ Instalar shadcn/ui

```bash
npx shadcn@latest init
```

Opciones recomendadas:

* TypeScript: Yes
* Tailwind CSS: Yes
* App directory: No (porque usamos Vite)
* Components path: `src/components`
* Utils path: `src/lib/utils.ts`

Instalar primer componente de prueba:

```bash
npx shadcn@latest add button
```

---

### 4️⃣ Instalar soporte PWA

```bash
npm install vite-plugin-pwa
```

Configurar en `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kids PWA',
        short_name: 'KidsApp',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

---

## 🧠 Arquitectura Base Recomendada

```
src/
│
├── app/              # Configuración global
├── components/       # Componentes UI reutilizables
├── features/         # Módulos por dominio
├── hooks/            # Custom hooks
├── lib/              # Utilities y helpers
├── services/         # Lógica de acceso a datos
├── types/            # Tipos globales
└── main.tsx
```

Enfoque:

* Separación por dominio (feature-based)
* Principio de responsabilidad única
* Componentes desacoplados
* Tipado fuerte
* Preparado para escalabilidad

---

## 🧪 Scripts Disponibles

```bash
npm run dev       # Entorno de desarrollo
npm run build     # Build producción
npm run preview   # Preview producción
```

---

## 📱 Características PWA

* Instalación en dispositivos
* Modo standalone
* Soporte offline (configurable)
* Auto actualización del service worker

---

## 🎯 Objetivo del Proyecto

Desarrollar una interfaz moderna, animada y optimizada para niños, siguiendo:

* Buenas prácticas de arquitectura frontend
* Principios SOLID aplicados a componentes
* Escalabilidad futura
* Optimización de rendimiento
* Experiencia offline

---

## 🛠 Próximos Pasos

* Configurar layout base
* Definir sistema de diseño
* Crear componentes UI base
* Implementar navegación
* Optimizar estrategia de caching PWA
* Añadir animaciones

---

## 📄 Licencia

Proyecto frontend base para desarrollo de aplicación PWA educativa.

---
