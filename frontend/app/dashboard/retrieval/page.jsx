'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_CHUNKS = [
  { id: 'chunk_1', source: 'billing_policy_v2.pdf', score: 0.984, content: 'Customers are eligible for a full refund within 14 days of purchase if the usage is below 10% of the allocated quota...', tokens: 124 },
  { id: 'chunk_2', source: 'pro_rata_rules.docx', score: 0.921, content: 'Pro-rated charges apply during mid-cycle upgrades. The system calculates the remaining days and credits accordingly...', tokens: 98 },
  { id: 'chunk_3', source: 'enterprise_terms.pdf', score: 0.845, content: 'Enterprise customers with Custom SLAs have a 30-day grace period for billing disputes regardless of usage...', tokens: 210 },
  { id: 'chunk_4', source: 'help_center_general.txt', score: 0.712, content: 'General help regarding billing can be found in the billing section of the dashboard under settings...', tokens: 45 }
];

const RetrievalExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('billing refund eligibility');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Retrieval Explorer</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Inspect and optimize your RAG system's knowledge retrieval.</p>
        </div>
        <div className="flex gap-4 p-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
           <div className="flex items-center gap-2 px-4 py-2 border-r border-[#E5E7EB]">
              <span className="text-[12px] font-black text-[#111111]">1.2ms</span>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">P95 Latency</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-[12px] font-black text-emerald-600">0.94</span>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Mean Reciprocal Rank</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-280px)] overflow-hidden">
        {/* Search & Parameters */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
           <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#111111] mb-6 flex items-center gap-2">
                 <Icons.Search size={18} className="text-[#C7F36B]" />
                 Query Simulation
              </h3>
              <textarea 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-32 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-[#C7F36B]/10 focus:border-[#C7F36B] transition-all resize-none font-medium"
                 placeholder="Enter query to test retrieval..."
              />
              <div className="mt-8 space-y-6">
                 <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-3 block">Top K Results</label>
                    <input type="range" className="w-full accent-[#111111]" min="1" max="20" defaultValue="5" />
                 </div>
                 <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-3 block">Score Threshold</label>
                    <input type="range" className="w-full accent-[#111111]" min="0" max="1" step="0.1" defaultValue="0.7" />
                 </div>
                 <button className="w-full py-4 bg-[#111111] text-white rounded-2xl font-bold text-[14px] hover:opacity-90 transition-all">
                    Test Retrieval
                 </button>
              </div>
           </div>

           <div className="bg-[#111111] text-white rounded-[32px] p-8">
              <h4 className="text-[12px] font-black uppercase tracking-widest text-[#C7F36B] mb-4">Embedding Model</h4>
              <p className="text-[14px] font-bold mb-1">text-embedding-3-large</p>
              <p className="text-[11px] text-slate-400">Dimensions: 3072 • Multi-lingual</p>
           </div>
        </div>

        {/* Retrieved Results */}
        <div className="lg:col-span-8 overflow-y-auto px-2 custom-scrollbar">
           <div className="space-y-6">
              {MOCK_CHUNKS.map((chunk, i) => (
                <motion.div 
                  key={chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden group hover:border-[#C7F36B] transition-all"
                >
                   <div className="p-6 border-b border-[#F3F4F6] bg-[#F9FAFB]/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <span className="text-[12px] font-black text-[#111111] font-mono">{chunk.id}</span>
                         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB]">
                            <Icons.FileText size={12} className="text-[#6B7280]" />
                            <span className="text-[11px] font-bold text-[#111111]">{chunk.source}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-[#9CA3AF] uppercase">Similarity</p>
                            <p className="text-[14px] font-black text-[#111111]">{Math.round(chunk.score * 100)}%</p>
                         </div>
                         <div className="w-1.5 h-10 rounded-full bg-[#C7F36B]" style={{ opacity: chunk.score }} />
                      </div>
                   </div>
                   <div className="p-8">
                      <p className="text-[15px] text-[#111111] leading-relaxed font-medium">
                         {chunk.content}
                      </p>
                      <div className="mt-8 pt-6 border-t border-[#F3F4F6] flex justify-between items-center">
                         <div className="flex gap-4">
                            <span className="text-[11px] font-bold text-[#6B7280]">{chunk.tokens} tokens</span>
                            <span className="text-[11px] font-bold text-[#6B7280]">UTF-8</span>
                         </div>
                         <button className="text-[12px] font-black uppercase tracking-widest text-[#111111] hover:text-[#C7F36B] transition-colors">
                            Inspect Metadata
                         </button>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default RetrievalExplorer;
