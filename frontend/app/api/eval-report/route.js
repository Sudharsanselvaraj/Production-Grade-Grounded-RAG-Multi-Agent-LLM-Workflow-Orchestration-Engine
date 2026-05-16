import { NextResponse } from 'next/server'
import { getLatestEvalReport } from '@/lib/reports'

export async function GET() {
  const latest = getLatestEvalReport()
  return NextResponse.json({ latest })
}
