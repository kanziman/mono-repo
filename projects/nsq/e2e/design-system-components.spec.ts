import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  'docs',
  'visual-evidence',
  'design-system-tailwind-base'
)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? '/'

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
})

test('home import button uses non-compressed small button dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1370, height: 768 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })

  const button = page.getByRole('button', { name: '임포트' })
  await expect(button).toBeVisible()

  const box = await button.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(32)
  expect(box?.width).toBeGreaterThanOrEqual(72)

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'home-desktop.png'),
    fullPage: false,
  })
})

test('home import row remains aligned on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })

  const button = page.getByRole('button', { name: '임포트' })
  const input = page.getByPlaceholder('YouTube URL 입력...')
  await expect(button).toBeVisible()
  await expect(input).toBeVisible()

  const buttonBox = await button.boundingBox()
  const inputBox = await input.boundingBox()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(32)
  expect(inputBox?.height).toBeGreaterThanOrEqual(32)

  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'home-mobile.png'),
    fullPage: false,
  })
})
