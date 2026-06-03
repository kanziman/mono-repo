import path from 'path'
import { readFileSync, existsSync } from 'fs'

const rootPkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const workspaces = rootPkg.workspaces ?? []

const config = {}

for (const ws of workspaces) {
  const hasEslint = ['eslint.config.mjs', 'eslint.config.js', 'eslint.config.cjs'].some((f) =>
    existsSync(path.join(ws, f))
  )

  if (hasEslint) {
    config[`${ws}/**/*.{ts,tsx}`] = (files) => {
      const rel = files.map((f) => `"${path.relative(ws, f)}"`).join(' ')
      return [`cd ${ws} && npx eslint --fix --max-warnings=0 ${rel}`]
    }
  }
}

export default config
