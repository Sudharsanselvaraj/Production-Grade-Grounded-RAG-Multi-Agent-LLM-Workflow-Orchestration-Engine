import { getLatestEvalReport } from '@/lib/reports'
import LiveEvalReport from '@/components/LiveEvalReport'

export default async function AdminPage() {
  const latest = getLatestEvalReport()
  return <LiveEvalReport initialLatest={latest} />
}
