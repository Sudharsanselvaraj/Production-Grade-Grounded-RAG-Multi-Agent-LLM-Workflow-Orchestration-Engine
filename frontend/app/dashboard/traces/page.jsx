'use client';

import { useState } from 'react';
import { TRACES } from '@/lib/mockData';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TracesPage = () => {
  const [selectedTrace, setSelectedTrace] = useState(TRACES[0]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Workflow Traces</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Deep-dive into every step of AI orchestration and execution.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all flex items-center gap-2">
              <Icons.Filter size={16} /> Filter Traces
           </button>
           <button className="px-4 py-2 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-bold shadow-lg shadow-[#C7F36B]/20 flex items-center gap-2">
              <Icons.PlayCircle size={16} /> Live Feed
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* Trace List */}
        <div className="col-span-4 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB]/50">
              <div className="relative">
                 <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                 <input 
                   type="text" 
                   placeholder="Filter by Trace ID or Model..." 
                   className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#C7F36B] transition-all"
                 />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] custom-scrollbar">
              {TRACES.map((trace) => (
                <div 
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`p-6 cursor-pointer transition-all ${selectedTrace.id === trace.id ? 'bg-[#F7F8F5] border-l-4 border-l-[#111111]' : 'hover:bg-[#F9FAFB]'}`}
                >
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-black text-[#111111] font-mono">{trace.id}</span>
                      <span className="text-[10px] font-bold text-[#6B7280]">{trace.timestamp}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex-1">
                         <p className="text-[13px] font-bold text-[#111111] mb-1">Customer Support Agent</p>
                         <div className="flex gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-[#6B7280]">{trace.model}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600">{trace.duration}ms</span>
                         </div>
                      </div>
                      <Icons.ChevronRight size={14} className="text-[#9CA3AF]" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Trace Detail View */}
        <div className="col-span-8 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
           <div className="p-8 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                 <h2 className="text-[20px] font-bold text-[#111111]">Trace: {selectedTrace.id}</h2>
                 <p className="text-[12px] text-[#6B7280] font-medium mt-1">Status: <span className="text-emerald-600 font-bold">SUCCESS</span> • Trigger: Ticket #8271</p>
              </div>
              <div className="flex gap-2">
                 <button className="p-2.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F7F8F5] rounded-xl transition-all"><Icons.Share size={18} /></button>
                 <button className="p-2.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F7F8F5] rounded-xl transition-all"><Icons.Trash size={18} /></button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-12">
                 {/* Timeline Visualization */}
                 <div className="space-y-8 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#F3F4F6]" />
                    
                    {selectedTrace.spans.map((span, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-12"
                      >
                         <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-[#E5E7EB] rounded-full flex items-center justify-center z-10">
                            <Icons.Zap size={14} className="text-[#111111]" />
                         </div>
                         
                         <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h4 className="text-[15px] font-bold text-[#111111]">{span.name}</h4>
                                  <span className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">{span.model}</span>
                               </div>
                               <div className="text-right">
                                  <p className="text-[12px] font-black text-[#111111]">{span.duration}ms</p>
                                  <p className="text-[10px] text-[#6B7280] font-medium">920 tokens</p>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">Input</p>
                                  <pre className="text-[12px] text-[#111111] font-mono leading-relaxed truncate">"What is the refund policy for..."</pre>
                               </div>
                               <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">Output</p>
                                  <pre className="text-[12px] text-[#111111] font-mono leading-relaxed truncate">"The refund policy states that..."</pre>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TracesPage;
