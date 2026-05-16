import fs from 'fs'
import path from 'path'

function evalReportsDir() {
  return path.join(process.cwd(), '..', 'eval_reports')
}

export function getLatestEvalReport() {
  const dir = evalReportsDir()
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'))
  if (!files.length) return null
  const sorted = files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs)
  const latest = path.join(dir, sorted[0])
  const raw = fs.readFileSync(latest, 'utf8')
  const parsed = JSON.parse(raw)
  return {
    filePath: latest,
    fileName: sorted[0],
    report: parsed,
  }
}
