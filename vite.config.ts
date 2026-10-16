import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Mode présentation (laptop only): serves data-private/app/*.json at /presentation/*.json in dev and preview.
// Nothing here runs at build time, so dist/ never contains these files (scripts/check_private.mjs verifies).
function presentationLocale(): Plugin {
  const dossier = join(process.cwd(), 'data-private', 'app')
  const servir = (server: { middlewares: { use(fn: (req: { url?: string }, res: { statusCode: number; setHeader(k: string, v: string): void; end(b: string): void }, next: () => void) => void): void } }) => {
    server.middlewares.use((req, res, next) => {
      const m = /^\/presentation\/([a-z-]+\.json)(\?.*)?$/.exec(req.url ?? '')
      if (!m) return next()
      const fichier = join(dossier, m[1])
      if (!existsSync(fichier)) { res.statusCode = 404; return res.end('') }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(readFileSync(fichier, 'utf8'))
    })
  }
  return { name: 'presentation-locale', configureServer: servir, configurePreviewServer: servir }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), presentationLocale()],
})
