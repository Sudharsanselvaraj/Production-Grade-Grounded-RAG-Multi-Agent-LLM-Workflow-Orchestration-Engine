'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { backendGet, backendPost } from '@/lib/backend';

const DATASETS = ['FAQ', 'Refund', 'Technical Support', 'Billing'];

export default function EvaluationsPage() {
  const [dataset, setDataset] = useState('FAQ');
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  async function loadRuns() {
    setError('');
    try {
      const [listRes, reportRes] = await Promise.all([
        backendGet('/api/evaluations/runs?limit=50'),
        backendGet('/api/evaluations/report'),
      ]);
      setRuns(listRes.runs || []);
      setSummary(reportRes.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to load evaluation runs');
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function runBenchmarks() {
    setRunning(true);
    setError('');
    try {
      await backendPost('/api/evaluations/run', { dataset, model_version: 'gpt-4o', prompt_version: 'active' });
      await loadRuns();
    } catch (err) {
      setError(err.message || 'Evaluation run failed');
    } finally {
      setRunning(false);
    }
  }

  const latest = useMemo(() => runs[0], [runs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Evaluation Harness</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Run benchmark datasets and persist groundedness, hallucination, and judge scoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dataset} onChange={(e) => setDataset(e.target.value)} className="px-4 py-2 border border-[#E5E7EB] rounded-xl bg-white text-[14px]">
            {DATASETS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <button onClick={runBenchmarks} disabled={running} className="px-5 py-2.5 rounded-xl bg-[#C7F36B] text-[#111111] font-bold disabled:opacity-50 flex items-center gap-2">
            <Icons.PlayCircle size={16} /> {running ? 'Running...' : 'Run Benchmarks'}
          </button>
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid md:grid-cols-4 gap-6">
        <MetricCard label="Groundedness" value={summary ? `${(summary.avgGroundedness * 100).toFixed(1)}%` : '-'} />
        <MetricCard label="Hallucination Rate" value={summary ? `${(summary.avgHallucination * 100).toFixed(1)}%` : '-'} />
        <MetricCard label="Judge Score" value={summary ? `${(summary.avgJudge * 100).toFixed(1)}%` : '-'} />
        <MetricCard label="Latest Dataset" value={latest?.dataset || '-'} />
      </div>

      <div className="bg-white rounded-[28px] border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[16px] font-bold text-[#111111]">Recent Evaluation Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Run</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Dataset</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Groundedness</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Hallucination</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Judge</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Latency</th>
                <th className="px-6 py-3 text-[11px] text-[#9CA3AF] uppercase font-black">Created</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="px-6 py-4 text-[13px] font-mono font-bold text-[#111111]">EV-{run.id}</td>
                  <td className="px-6 py-4 text-[13px] text-[#111111]">{run.dataset}</td>
                  <td className="px-6 py-4 text-[13px] text-[#111111]">{((run.groundedness || 0) * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-[13px] text-[#111111]">{((run.hallucinationRate || 0) * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-[13px] text-[#111111]">{((run.judgeScore || 0) * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-[13px] text-[#111111]">{Math.round(run.latencyMs || 0)}ms</td>
                  <td className="px-6 py-4 text-[12px] text-[#6B7280]">{run.createdAt ? new Date(run.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">{label}</p>
      <p className="mt-2 text-[24px] font-black text-[#111111]">{value}</p>
    </div>
  );
}
