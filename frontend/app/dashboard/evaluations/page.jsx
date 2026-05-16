'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

const EVAL_METRICS = [
  { label: 'Avg Groundedness', value: '98.2%', trend: '+0.4%', status: 'Pass' },
  { label: 'Hallucination Rate', value: '0.8%', trend: '-0.2%', status: 'Pass' },
  { label: 'Judge Score (GPT-4o)', value: '9.4/10', trend: '+0.1', status: 'Pass' },
  { label: 'Human Override Rate', value: '12.4%', trend: '-1.5%', status: 'Warning' },
];

const CATEGORY_DATA = [
  { name: 'Billing', value: 400 },
  { name: 'Technical', value: 300 },
  { name: 'Account', value: 200 },
  { name: 'General', value: 100 },
];

const COLORS = ['#111111', '#C7F36B', '#E5E7EB', '#9CA3AF'];

const EvaluationDashboard = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Evaluation Harness</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Systematic benchmarks and model quality tracking.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all">
              Run Benchmarks
           </button>
           <button className="px-5 py-2.5 bg-[#111111] text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all">
              Export Eval Report
           </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {EVAL_METRICS.map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${metric.status === 'Pass' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {metric.status}
               </span>
               <span className={`text-[12px] font-bold ${metric.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metric.trend}
               </span>
            </div>
            <p className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">{metric.label}</p>
            <p className="text-[28px] font-black text-[#111111]">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Hallucination Heatmap Simulation */}
         <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm">
            <h3 className="text-[20px] font-bold text-[#111111] mb-8">Grounding Distribution (by Category)</h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { cat: 'Billing', grounded: 98, halluc: 2 },
                    { cat: 'Tech', grounded: 94, halluc: 6 },
                    { cat: 'Refunds', grounded: 99, halluc: 1 },
                    { cat: 'Accounts', grounded: 97, halluc: 3 },
                  ]}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                     <XAxis dataKey="cat" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                     <Tooltip />
                     <Bar dataKey="grounded" fill="#C7F36B" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
                     <Bar dataKey="halluc" fill="#111111" stackId="a" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution */}
         <div className="bg-white p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm">
            <h3 className="text-[20px] font-bold text-[#111111] mb-8">Resolution Split</h3>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={CATEGORY_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {CATEGORY_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-3">
               {CATEGORY_DATA.map((item, i) => (
                 <div key={i} className="flex justify-between items-center text-[13px]">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <span className="font-bold text-[#111111]">{item.name}</span>
                    </div>
                    <span className="text-[#6B7280] font-medium">{item.value} evals</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default EvaluationDashboard;
