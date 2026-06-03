import path from 'path'

const nsqRoot = path.join(process.cwd(), 'projects/nsq')

export default {
  'projects/nsq/**/*.{ts,tsx}': (files) => {
    const rel = files.map((f) => `"${path.relative(nsqRoot, f)}"`).join(' ')
    return [`cd projects/nsq && npx eslint --fix --max-warnings=0 ${rel}`]
  },
}
