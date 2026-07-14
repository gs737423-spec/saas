/**
 * Captura telas reais da plataforma para o site institucional.
 *
 * Uso:
 *   1. Suba o dev server:  npm run dev  (ou aponte BASE_URL abaixo)
 *   2. Rode:               node scripts/capture-screenshots.mjs
 *
 * Autentica semeando o localStorage (mesmo formato usado pelo AuthContext),
 * sem precisar de senha e sem alterar o código da aplicação. Emula
 * prefers-reduced-motion para congelar animações e gerar imagens limpas.
 * Salva WebP em public/site/.
 */
import puppeteer from 'puppeteer'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/site')
const BASE = process.env.BASE_URL || 'http://localhost:5199'

const AUTH = JSON.stringify({ email: 'demo@acelera.com', name: 'Acelera Demo' })

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 }
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }

/** @type {{file:string, path:string, viewport:object, clip?:object, waitExtra?:number}[]} */
const shots = [
  { file: 'dashboard-overview', path: '/app', viewport: DESKTOP },
  { file: 'dashboard-kpis', path: '/app', viewport: DESKTOP, clip: { x: 0, y: 0, width: 1440, height: 470 } },
  { file: 'marketplace-comparison', path: '/app/marketplaces', viewport: DESKTOP },
  { file: 'products-overview', path: '/app/produtos', viewport: DESKTOP },
  { file: 'product-360', path: '/app/produto/SKN-PRM-005', viewport: DESKTOP },
  { file: 'inventory', path: '/app/estoque', viewport: DESKTOP },
  { file: 'imports', path: '/app/importacoes', viewport: DESKTOP },
  { file: 'og-cover', path: '/app', viewport: { width: 1200, height: 630, deviceScaleFactor: 2 } },
  { file: 'mobile-overview', path: '/app', viewport: MOBILE },
  { file: 'mobile-products', path: '/app/produtos', viewport: MOBILE },
]

async function run() {
  await mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })

  for (const shot of shots) {
    const page = await browser.newPage()
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.evaluateOnNewDocument((auth) => {
      localStorage.setItem('acelera_auth', auth)
    }, AUTH)
    await page.setViewport(shot.viewport)

    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle0', timeout: 45000 }).catch(() => {})
    // Garante que gráficos/recharts terminem de montar
    await new Promise((r) => setTimeout(r, 1600))

    const out = resolve(OUT, `${shot.file}.webp`)
    await page.screenshot({
      path: out,
      type: 'webp',
      quality: 88,
      clip: shot.clip,
    })
    console.log(`✓ ${shot.file}.webp  (${shot.path})`)
    await page.close()
  }

  await browser.close()
  console.log('\nConcluído. Imagens em public/site/')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
