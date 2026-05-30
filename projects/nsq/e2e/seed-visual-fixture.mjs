/**
 * Seed script for visual parity tests.
 * Creates a deterministic fixture episode at ~/.shadowing/episodes/visualdemo1
 * so the dev server has test data to display.
 *
 * Usage: node e2e/seed-visual-fixture.mjs
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

const VIDEO_ID = 'visualdemo1'
const EPISODES_BASE = path.join(os.homedir(), '.shadowing', 'episodes')
const EPISODE_DIR = path.join(EPISODES_BASE, VIDEO_ID)

// Ensure the episode directory exists
fs.mkdirSync(EPISODE_DIR, { recursive: true })

// --- meta.json ---
const meta = {
  videoId: VIDEO_ID,
  title: 'NSQ Visual Demo — Hard Worker',
  importedAt: '2024-01-15T09:00:00.000Z',
}
fs.writeFileSync(path.join(EPISODE_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
console.log('✓ meta.json written')

// --- segments.json ---
const segments = [
  { index: 0, start: 0.0,   text: '안녕하세요, 저는 열심히 일하는 사람입니다.',            translation: "Hello, I am a hard-working person." },
  { index: 1, start: 3.5,   text: '매일 아침 일찍 일어나서 하루를 시작합니다.',             translation: "Every morning I wake up early and start my day." },
  { index: 2, start: 7.2,   text: '일이 힘들어도 포기하지 않습니다.',                      translation: "Even when work is hard, I don't give up." },
  { index: 3, start: 11.0,  text: '목표를 향해 꾸준히 나아가는 것이 중요합니다.',           translation: "It is important to steadily move toward your goals." },
  { index: 4, start: 15.4,  text: '팀원들과 협력하여 좋은 결과를 만들어냅니다.',            translation: "I collaborate with team members to produce good results." },
  { index: 5, start: 19.8,  text: '어려운 문제도 차분히 생각하면 해결할 수 있습니다.',      translation: "Even difficult problems can be solved if you think calmly." },
  { index: 6, start: 24.1,  text: '성공은 하루아침에 오지 않습니다.',                      translation: "Success does not come overnight." },
  { index: 7, start: 27.6,  text: '꾸준한 노력이 결국 큰 차이를 만듭니다.',               translation: "Consistent effort ultimately makes a big difference." },
  { index: 8, start: 31.3,  text: '실패에서 배우고 더 강해지는 것이 진정한 성장입니다.',   translation: "Learning from failure and becoming stronger is true growth." },
  { index: 9, start: 36.0,  text: '오늘도 최선을 다하겠습니다.',                           translation: "I will do my best today as well." },
  { index: 10, start: 39.5, text: '감사합니다, 함께 해주셔서 고맙습니다.',                  translation: "Thank you for being with me." },
  { index: 11, start: 43.2, text: '내일도 열심히 하겠습니다!',                             translation: "I will work hard tomorrow too!" },
]
fs.writeFileSync(path.join(EPISODE_DIR, 'segments.json'), JSON.stringify(segments, null, 2))
console.log('✓ segments.json written')

// --- thumbnail.jpg ---
// A minimal valid 1x1 PNG encoded as base64 (named .jpg — browsers render it fine)
const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)
fs.writeFileSync(path.join(EPISODE_DIR, 'thumbnail.jpg'), pngBytes)
console.log('✓ thumbnail.jpg written')

console.log(`\nFixture seeded at: ${EPISODE_DIR}`)
console.log(`Video ID: ${VIDEO_ID}`)
