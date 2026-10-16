// Deploy guard: fails if a provided-data file could reach dist/ or git. Run by `npm run build` and before `vercel`.
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const problemes = []
const marche = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) marche(p, out)
    else out.push(p.replace(/\\/g, '/'))
  }
  return out
}
if (!/^data-private\/$/m.test(readFileSync('.gitignore', 'utf8'))) problemes.push('.gitignore ne contient pas data-private/')
if (existsSync('dist')) for (const f of marche('dist')) if (/-reels\.json$|\/presentation\//.test(f)) problemes.push(`dans dist/: ${f}`)
try {
  const suivis = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
  for (const f of suivis) if (/^data-private\/|-reels\.json$/.test(f)) problemes.push(`suivi par git: ${f}`)
} catch { /* pas de git: la vérification de dist/ suffit */ }
if (problemes.length) {
  console.error('check_private: ÉCHEC\n' + problemes.map((p) => ' - ' + p).join('\n'))
  process.exit(1)
}
console.log('check_private: OK (aucune donnée fournie dans dist/ ni dans git)')
