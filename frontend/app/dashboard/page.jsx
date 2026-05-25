'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { backendGet } from '@/lib/backend';

const WINDOWS = ['24h', '7d', '30d', '90d'];

const DashboardHome = () => {
  const [window, setWindow] = useState('7d');
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState({ accuracy: [], hallucinationRate: [], costPerTicket: [] });
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [m, c, f] = await Promise.all([
          backendGet(`/api/dashboard/metrics?window=${window}`),
          backendGet(`/api/dashboard/charts?window=${window}`),
          backendGet('/api/dashboard/feed?limit=20'),
        ]);
        if (!active) return;
        setMetrics(m);
        setCharts(c);
        setFeed(f.items || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [window]);

  const kpis = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Active Tickets', value: String(metrics.activeTickets), trend: 'Live', icon: 'Inbox' },
      { label: 'AI Resolution Rate', value: `${(metrics.aiResolutionRate * 100).toFixed(1)}%`, trend: 'Computed', icon: 'Zap' },
      { label: 'Human Override', value: `${(metrics.humanOverrideRate * 100).toFixed(1)}%`, trend: 'Computed', icon: 'UserCheck' },
      { label: 'Groundedness', value: `${(metrics.groundedness * 100).toFixed(1)}%`, trend: 'Computed', icon: 'ShieldCheck' },
      { label: 'Avg. Latency', value: `${Math.round(metrics.avgLatencyMs)}ms`, trend: 'Computed', icon: 'Clock' },
      { label: 'Retrieval Precision', value: `${metrics.retrievalPrecision.toFixed(2)}`, trend: 'Computed', icon: 'Database' },
    ];
  }, [metrics]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Dashboard Overview</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Live operational intelligence sourced from database-backed workflows.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-xl flex gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${window === w ? 'bg-[#C7F36B] text-[#111111]' : 'text-[#6B7280]'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {(loading ? Array.from({ length: 6 }) : kpis).map((kpi, i) => (
          <motion.div
            key={loading ? i : kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white p-6 rounded-[24px] border border-[#E5E7EB] shadow-sm"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="h-5 w-5 rounded bg-[#F3F4F6]" />
                <div className="h-3 w-20 rounded bg-[#F3F4F6]" />
                <div className="h-6 w-16 rounded bg-[#F3F4F6]" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-[#F7F8F5]">
                    {(() => {
                      const Icon = Icons[kpi.icon];
                      return Icon ? <Icon size={20} className="text-[#111111]" /> : null;
                    })()}
                  </div>
                  <span className="text-[12px] font-bold text-[#6B7280]">{kpi.trend}</span>
                </div>
                <p className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className="text-[24px] font-black text-[#111111]">{kpi.value}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
          <h3 className="text-[18px] font-bold text-[#111111] mb-6">Groundedness Trend</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.accuracy || []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7F36B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C7F36B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#111111" strokeWidth={3} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
          <h3 className="text-[18px] font-bold mb-6 text-[#111111]">Operational Feed</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {(feed || []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F9FAFB]">
                <div className="flex justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">{item.type}</span>
                  <span className="text-[10px] text-[#9CA3AF]">{new Date(item.time).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[13px] font-bold text-[#111111]">{item.title}</p>
              </div>
            ))}
            {!feed.length && !loading ? <p className="text-[13px] text-[#6B7280]">No audit events yet.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
          <h3 className="text-[18px] font-bold mb-6 text-[#111111]">Hallucination Trend</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.hallucinationRate || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#111111" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
          <h3 className="text-[18px] font-bold mb-6 text-[#111111]">Cost Per Resolution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.costPerTicket || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#C7F36B" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
