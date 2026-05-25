'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { backendGet } from '@/lib/backend';

const WINDOWS = ['7d', '30d', '90d'];

export default function AnalyticsPage() {
  const [window, setWindow] = useState('30d');
  const [data, setData] = useState({
    accuracyTrend: [],
    hallucinationTrend: [],
    latencyTrend: [],
    groundednessTrend: [],
    agentSuccessRate: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setError('');
      try {
        const res = await backendGet(`/api/analytics/trends?window=${window}`);
        if (!active) return;
        setData(res);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load analytics');
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [window]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Analytics</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Historical accuracy, hallucination, latency, groundedness, and agent success trends.</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-1 flex gap-1">
          {WINDOWS.map((w) => (
            <button key={w} onClick={() => setWindow(w)} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${window === w ? 'bg-[#C7F36B] text-[#111111]' : 'text-[#6B7280]'}`}>
              {w}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid lg:grid-cols-2 gap-8">
        <ChartCard title="Accuracy Trend" data={data.accuracyTrend} color="#111111" />
        <ChartCard title="Hallucination Rate" data={data.hallucinationTrend} color="#DC2626" />
        <ChartCard title="Latency Trend (ms)" data={data.latencyTrend} color="#2563EB" />
        <ChartCard title="Groundedness Trend" data={data.groundednessTrend} color="#16A34A" />
        <ChartCard title="Agent Success Rate" data={data.agentSuccessRate} color="#C7F36B" area />
      </div>
    </div>
  );
}

function ChartCard({ title, data, color, area = false }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
      <h3 className="text-[18px] font-bold mb-6 text-[#111111]">{title}</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {area ? (
            <AreaChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2.5} />
            </AreaChart>
          ) : (
            <LineChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
