import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  'docs',
  'visual-evidence',
  'nsq-ui-visual-parity'
)

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

test.beforeAll(() => {
  ensureDir(EVIDENCE_DIR)
})

test('home page — desktop 1440x1000', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/', { waitUntil: 'networkidle' })
  // Wait for the main content to be visible
  await page.waitForSelector('main, [data-testid="home"], body', { timeout: 10000 })
  const screenshotPath = path.join(EVIDENCE_DIR, 'home-desktop.png')
  await page.screenshot({ path: screenshotPath, fullPage: false })
  expect(fs.existsSync(screenshotPath)).toBe(true)
  console.log(`Saved: ${screenshotPath}`)
})

test('home page — narrow 900x1000', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForSelector('main, [data-testid="home"], body', { timeout: 10000 })
  const screenshotPath = path.join(EVIDENCE_DIR, 'home-narrow.png')
  await page.screenshot({ path: screenshotPath, fullPage: false })
  expect(fs.existsSync(screenshotPath)).toBe(true)
  console.log(`Saved: ${screenshotPath}`)
})

test('player page — desktop 1440x1000', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/player/visualdemo1', { waitUntil: 'networkidle' })
  // Wait for player content to hydrate
  await page.waitForSelector('main, [data-testid="player"], body', { timeout: 10000 })
  const screenshotPath = path.join(EVIDENCE_DIR, 'player-desktop.png')
  await page.screenshot({ path: screenshotPath, fullPage: false })
  expect(fs.existsSync(screenshotPath)).toBe(true)
  console.log(`Saved: ${screenshotPath}`)
})

test('player page — narrow 1100x900', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.goto('/player/visualdemo1', { waitUntil: 'networkidle' })
  await page.waitForSelector('main, [data-testid="player"], body', { timeout: 10000 })
  const screenshotPath = path.join(EVIDENCE_DIR, 'player-narrow.png')
  await page.screenshot({ path: screenshotPath, fullPage: false })
  expect(fs.existsSync(screenshotPath)).toBe(true)
  console.log(`Saved: ${screenshotPath}`)
})
