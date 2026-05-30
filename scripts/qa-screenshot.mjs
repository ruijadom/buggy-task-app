/**
 * QA Screenshot script — starts the dev server, captures the app state,
 * then kills the server. Saves screenshots to qa-evidence/.
 *
 * Usage: node scripts/qa-screenshot.mjs
 * Output: qa-evidence/screenshot-{timestamp}.png + qa-evidence/metadata-{timestamp}.json
 */

import { chromium } from '@playwright/test'
import { execSync, spawn } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUTPUT_DIR = resolve(ROOT, 'qa-evidence')
const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

function isServerRunning() {
  try {
    execSync(`lsof -ti:${PORT}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const { default: http } = await import('http')
        const req = http.get(url, (res) => {
          if (res.statusCode < 500) {
            clearInterval(interval)
            resolve()
          }
        })
        req.on('error', () => {})
        req.end()
      } catch {}
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error('Server did not start in time'))
      }
    }, 300)
  })
}

async function captureScreenshots(devServerProcess) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim()
  const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const screenshots = []

  // 1. Main view — default state
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const mainPath = `qa-evidence/screenshot-${timestamp}-main.png`
  await page.screenshot({ path: resolve(ROOT, mainPath), fullPage: true })
  screenshots.push({ label: 'Main view', file: mainPath })

  // 2. Open "New Task" modal
  await page.click('button:has-text("New Task")')
  await page.waitForTimeout(300)
  const modalPath = `qa-evidence/screenshot-${timestamp}-modal.png`
  await page.screenshot({ path: resolve(ROOT, modalPath), fullPage: false })
  screenshots.push({ label: 'Add Task modal', file: modalPath })

  await browser.close()

  const metadata = {
    timestamp: new Date().toISOString(),
    branch,
    commit,
    url: BASE_URL,
    screenshots,
  }

  const metaPath = resolve(OUTPUT_DIR, `metadata-${timestamp}.json`)
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2))

  console.log(`\n✓ Screenshots saved:`)
  screenshots.forEach(s => console.log(`  ${s.label}: ${s.file}`))
  console.log(`  Metadata: qa-evidence/metadata-${timestamp}.json`)

  return { screenshots, metadata, timestamp }
}

async function main() {
  let devProcess = null
  let ownedServer = false

  if (!isServerRunning()) {
    console.log('Starting dev server...')
    devProcess = spawn('npx', ['vite', '--port', String(PORT)], {
      cwd: ROOT,
      stdio: 'pipe',
      detached: false,
    })
    ownedServer = true
    await waitForServer(BASE_URL)
    console.log('Dev server ready.')
  } else {
    console.log(`Dev server already running on port ${PORT}.`)
  }

  try {
    const result = await captureScreenshots(devProcess)
    process.env.QA_SCREENSHOTS = JSON.stringify(result.screenshots)
    process.env.QA_TIMESTAMP = result.timestamp
    process.env.QA_METADATA = JSON.stringify(result.metadata)
  } finally {
    if (ownedServer && devProcess) {
      devProcess.kill()
    }
  }
}

main().catch(err => {
  console.error('Screenshot failed:', err.message)
  process.exit(1)
})
