'use client';

import { useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { backendPost } from '@/lib/backend';

export default function RetrievalPage() {
  const [query, setQuery] = useState('refund policy for annual plan upgrade');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.2);
  const [results, setResults] = useState([]);
  const [latencyMs, setLatencyMs] = useState(0);
  const [error, setError] = useState('');

  async function runRetrieval() {
    setError('');
    const started = performance.now();
    try {
      const data = await backendPost('/api/retrieval/search', {
        query,
        top_k: topK,
        min_score: threshold,
      });
      setResults(data.results || []);
      setLatencyMs(Math.round(performance.now() - started));
    } catch (err) {
      setError(err.message || 'Retrieval test failed');
    }
  }

  const p95 = useMemo(() => {
    if (!results.length) return 0;
    const scores = results.map((r) => r.score).sort((a, b) => a - b);
    const idx = Math.min(scores.length - 1, Math.floor(scores.length * 0.95));
    return Number(scores[idx].toFixed(4));
  }, [results]);

  const mrr = useMemo(() => {
    if (!results.length) return 0;
    let reciprocal = 0;
    for (let i = 0; i < results.length; i += 1) {
      if ((results[i].score || 0) >= threshold) {
        reciprocal = 1 / (i + 1);
        break;
      }
    }
    return Number(reciprocal.toFixed(4));
  }, [results, threshold]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Retrieval Explorer</h1>
        <p className="text-[#6B7280] text-[16px] mt-1">Run real embedding search and inspect chunk metadata, citations, and relevance scores.</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6 space-y-5">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">Search Query</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">Top-K: {topK}</label>
            <input type="range" min={1} max={20} value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">Score Threshold: {threshold.toFixed(2)}</label>
            <input type="range" min={0} max={1} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
          </div>
        </div>

        <button onClick={runRetrieval} className="px-5 py-2.5 rounded-xl bg-[#C7F36B] text-[#111111] font-bold flex items-center gap-2">
          <Icons.Play size={16} /> Test Retrieval
        </button>

        {error ? <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">{error}</div> : null}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <MetricCard label="P95 Latency" value={`${latencyMs}ms`} />
        <MetricCard label="Mean Reciprocal Rank" value={mrr.toString()} />
        <MetricCard label="P95 Score" value={p95.toString()} />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-6">
        <h2 className="text-[16px] font-bold text-[#111111] mb-4">Retrieved Chunks</h2>
        <div className="space-y-4">
          {results.map((chunk, i) => (
            <div key={`${chunk.id}-${i}`} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <p className="text-[13px] font-bold text-[#111111]">{chunk.document || chunk.source || 'Unknown document'}</p>
                  <p className="text-[11px] text-[#6B7280]">Source: {chunk.source || 'n/a'} • Page: {chunk.page || 'n/a'} • Date: {chunk.date || 'n/a'}</p>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{(chunk.score || 0).toFixed(4)}</span>
              </div>
              <p className="text-[13px] text-[#111827] leading-relaxed">{chunk.chunk || 'No chunk text available.'}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-2">Embedding model: {chunk.embedding_model || 'default'}</p>
            </div>
          ))}
          {!results.length ? <p className="text-[13px] text-[#6B7280]">No retrieval results yet. Run a test query.</p> : null}
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
