'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { EVALS } from '@/lib/mockData';

const DashboardHome = () => {
  const KPIS = [
    { label: 'Active Tickets', value: '1,284', trend: '+12%', icon: 'Inbox', color: 'text-blue-600' },
    { label: 'AI Resolution Rate', value: '84.2%', trend: '+5.4%', icon: 'Zap', color: 'text-[#C7F36B]' },
    { label: 'Human Override', value: '12.1%', trend: '-2.0%', icon: 'UserCheck', color: 'text-amber-600' },
    { label: 'Groundedness', value: '98.8%', trend: '+0.5%', icon: 'ShieldCheck', color: 'text-emerald-600' },
    { label: 'Avg. Latency', value: '124ms', trend: '-15ms', icon: 'Clock', color: 'text-indigo-600' },
    { label: 'Retrieval Precision', value: '0.94', trend: '+0.02', icon: 'Database', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Dashboard Overview</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Real-time operational intelligence and AI metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all flex items-center gap-2">
            <Icons.Calendar size={16} /> Last 7 Days
          </button>
          <button className="px-4 py-2 bg-[#111111] text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all">
            Download Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {KPIS.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-[24px] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-[#F7F8F5]`}>
                {Icons[kpi.icon] && <Icons[kpi.icon] size={20} className="text-[#111111]" />}
              </div>
              <span className={`text-[12px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-[24px] font-black text-[#111111]">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold text-[#111111]">Resolution & Accuracy Trends</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#111111]" />
                  <span className="text-[12px] font-bold text-[#6B7280]">AI Resolution</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C7F36B]" />
                  <span className="text-[12px] font-bold text-[#6B7280]">Accuracy</span>
               </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EVALS.accuracy}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7F36B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C7F36B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#111111" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111111] p-8 rounded-[32px] text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7F36B]/20 blur-[60px]" />
           <h3 className="text-[18px] font-bold mb-6">Real-time Operational Feed</h3>
           <div className="space-y-6">
              {[
                { type: 'Resolution', text: 'Ticket #2847 resolved with 99.4% confidence', time: '2m ago' },
                { type: 'Evaluation', text: 'Prompt v2.4 passed grounding bench (98.2%)', time: '12m ago' },
                { type: 'Warning', text: 'Latency spike detected in retrieval (420ms)', time: '45m ago', alert: true },
                { type: 'Escalation', text: 'Human override required for Ticket #2839', time: '1h ago' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                   <div className={`w-1 h-12 rounded-full ${item.alert ? 'bg-rose-500' : 'bg-[#C7F36B]/40 group-hover:bg-[#C7F36B]'} transition-colors`} />
                   <div>
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.type}</span>
                         <span className="text-[10px] text-slate-500">{item.time}</span>
                      </div>
                      <p className="text-[14px] text-slate-200 leading-snug">{item.text}</p>
                   </div>
                </div>
              ))}
           </div>
           <button className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[13px] font-bold transition-all">
              View All Operations
           </button>
        </div>
      </div>

      {/* Bottlenecks Row */}
      <div className="grid lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
            <h3 className="text-[18px] font-bold mb-6 text-[#111111]">Cost Per Resolution Histogram</h3>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EVALS.costPerTicket}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                     <Tooltip />
                     <Bar dataKey="cost" fill="#111111" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
            <h3 className="text-[18px] font-bold mb-6 text-[#111111]">AI Intelligence Insights</h3>
            <div className="space-y-4">
               {[
                 { topic: 'Pricing Ambiguity', volume: 142, impact: 'High', color: 'bg-rose-100 text-rose-700' },
                 { topic: 'API Documentation Gap', volume: 89, impact: 'Medium', color: 'bg-amber-100 text-amber-700' },
                 { topic: 'Account Recovery Flow', volume: 64, impact: 'Critical', color: 'bg-[#111111] text-[#C7F36B]' },
               ].map((insight, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] group hover:border-[#C7F36B] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-10 rounded-full bg-slate-300 group-hover:bg-[#C7F36B] transition-colors" />
                       <div>
                          <p className="text-[15px] font-bold text-[#111111]">{insight.topic}</p>
                          <p className="text-[12px] text-[#6B7280]">{insight.volume} detections this week</p>
                       </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${insight.color}`}>
                       {insight.impact}
                    </span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardHome;
