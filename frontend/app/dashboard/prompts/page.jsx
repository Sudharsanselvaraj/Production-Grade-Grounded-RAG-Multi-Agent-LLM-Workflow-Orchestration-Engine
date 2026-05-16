'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_PROMPTS = [
  { id: 'v2.4', name: 'Support Agent Core', status: 'Production', updated: '2h ago', author: 'Sudharsan', score: '98.2%' },
  { id: 'v2.3', name: 'Support Agent Core', status: 'Rolled Back', updated: '1d ago', author: 'Sudharsan', score: '94.1%' },
  { id: 'v2.5-beta', name: 'Support Agent Core', status: 'A/B Testing', updated: '4h ago', author: 'Selva', score: '96.8%' }
];

const PromptManager = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(MOCK_PROMPTS[0]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Prompt Management</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Version control and lifecycle management for LLM instructions.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all">
              A/B Test Comparison
           </button>
           <button className="px-5 py-2.5 bg-[#111111] text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all flex items-center gap-2">
              <Icons.Plus size={16} /> New Draft
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-280px)] overflow-hidden">
        {/* Version List */}
        <div className="lg:col-span-4 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB]/50 flex justify-between items-center">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-[#111111]">Version History</h3>
              <Icons.History size={16} className="text-[#9CA3AF]" />
           </div>
           <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] custom-scrollbar">
              {MOCK_PROMPTS.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPrompt(p)}
                  className={`p-6 cursor-pointer transition-all ${selectedPrompt.id === p.id ? 'bg-[#F7F8F5] border-l-4 border-l-[#111111]' : 'hover:bg-[#F9FAFB]'}`}
                >
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[14px] font-black text-[#111111]">{p.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${p.status === 'Production' ? 'bg-[#C7F36B]/20 text-[#111111]' : 'bg-slate-100 text-[#6B7280]'}`}>
                        {p.status}
                      </span>
                   </div>
                   <p className="text-[13px] font-bold text-[#111111] mb-1">{p.name}</p>
                   <div className="flex justify-between items-center mt-4">
                      <span className="text-[11px] text-[#9CA3AF] font-medium">By {p.author} • {p.updated}</span>
                      <span className="text-[11px] font-black text-emerald-600">Eval: {p.score}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Editor & Diff */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
           <div className="flex-1 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <h2 className="text-[18px] font-bold text-[#111111]">{selectedPrompt.name} <span className="text-[#9CA3AF] font-medium ml-2">{selectedPrompt.id}</span></h2>
                    <Icons.Lock size={16} className="text-[#9CA3AF]" />
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#111111] hover:bg-[#F3F4F6] transition-all">Diff View</button>
                    <button className="px-4 py-2 bg-[#111111] text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-all">Edit Prompt</button>
                 </div>
              </div>
              
              <div className="flex-1 p-0 overflow-hidden flex">
                 <div className="w-12 border-r border-[#F3F4F6] bg-[#F9FAFB] flex flex-col items-center py-4 gap-4 text-[#9CA3AF] text-[10px] font-mono">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <div key={i}>{i}</div>)}
                 </div>
                 <pre className="flex-1 p-8 text-[14px] text-[#111111] font-mono leading-relaxed overflow-y-auto custom-scrollbar">
{`system_prompt: |
  You are an expert customer service AI agent for Lumen. 
  Your goal is to resolve ticket #{{ticket_id}} for {{customer_name}}.
  
  CONTEXT:
  - Issue: {{issue_description}}
  - Sentiment: {{sentiment}}
  - History: {{history}}

  GUIDELINES:
  1. Be professional but empathetic.
  2. Always ground your responses in provided citations.
  3. If refund is required, check {{eligibility_rules}}.
  
  OUTPUT_SCHEMA:
  - reasoning: string
  - action: string (resolve|escalate|info)
  - message: string
  - citations: array[string]`}
                 </pre>
              </div>
           </div>

           <div className="bg-[#111111] rounded-[32px] p-8 text-white flex justify-between items-center">
              <div>
                 <p className="text-[12px] font-black uppercase tracking-widest text-[#C7F36B] mb-1">Production Rollout</p>
                 <p className="text-[14px] text-slate-300 font-medium">This version is currently serving 100% of production traffic.</p>
              </div>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[13px] font-bold transition-all border border-white/10">
                 Rollback to v2.3
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PromptManager;
