'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const WORKFLOW_ITEMS = [
  {
    id: 'routing',
    title: 'Intelligent Ticket Routing',
    description: 'Automatically categorize and route tickets to the most qualified agent or AI responder based on intent and sentiment.',
    icon: 'GitPullRequest',
    details: ['99% classification accuracy', 'Sub-second routing latency', 'Dynamic priority scoring']
  },
  {
    id: 'retrieval',
    title: 'Grounded Retrieval',
    description: 'Provide AI agents with verified, real-time context from your internal knowledge bases using high-precision RAG.',
    icon: 'Database',
    details: ['Semantic search matching', 'Citation-based grounding', 'Knowledge drift detection']
  },
  {
    id: 'decisioning',
    title: 'Multi-Agent Decisioning',
    description: 'Complex multi-step reasoning chains allow AI to handle complicated billing, technical, and account issues autonomously.',
    icon: 'Cpu',
    details: ['Chain-of-thought logic', 'Tool execution safety', 'Stateful conversations']
  },
  {
    id: 'review',
    title: 'Human-in-the-Loop Review',
    description: 'Enable human operators to review, modify, and approve AI actions before they reach the customer.',
    icon: 'UserCheck',
    details: ['Accept/Reject workflows', 'Confidence thresholding', 'Full audit history']
  }
];

const WorkflowSection = () => {
  const [activeTab, setActiveTab] = useState(WORKFLOW_ITEMS[0]);

  return (
    <section className="py-32 px-6 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-[40px] lg:text-[56px] font-bold tracking-tight text-[#111111] mb-4">
            The Complete AI-Powered Workflow
          </h2>
          <p className="text-[18px] text-[#6B7280]">From ingestion to evaluation, with full observability at every step.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: Accordion */}
          <div className="space-y-4">
            {WORKFLOW_ITEMS.map((item) => (
              <div 
                key={item.id}
                onClick={() => setActiveTab(item)}
                className={`p-8 rounded-[24px] cursor-pointer transition-all border-2 ${activeTab.id === item.id ? 'bg-[#F7F8F5] border-[#C7F36B]' : 'bg-white border-transparent hover:bg-[#F9FAFB]'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab.id === item.id ? 'bg-[#C7F36B] text-[#111111]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {Icons[item.icon] && <Icons[item.icon] size={20} />}
                  </div>
                  <h3 className="text-[20px] font-bold text-[#111111]">{item.title}</h3>
                </div>
                
                <AnimatePresence mode='wait'>
                  {activeTab.id === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[#6B7280] text-[16px] leading-relaxed mb-6">
                        {item.description}
                      </p>
                      <ul className="space-y-2">
                        {item.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-[14px] font-semibold text-[#111111]">
                            <Icons.CheckCircle size={14} className="text-[#22C55E]" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right: Interactive Illustration */}
          <div className="relative bg-[#F7F8F5] rounded-[40px] border border-[#E5E7EB] p-12 min-h-[600px] flex items-center justify-center overflow-hidden">
             <AnimatePresence mode='wait'>
                <motion.div 
                  key={activeTab.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                   {/* Mock UI visualization based on tab */}
                   {activeTab.id === 'routing' && (
                     <div className="relative w-full max-w-md space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl flex items-center gap-4">
                           <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                              <Icons.Mail size={20} />
                           </div>
                           <div className="flex-1">
                              <p className="text-[12px] font-bold">New Ticket Ingested</p>
                              <p className="text-[10px] text-slate-500">"I can't access my April invoice..."</p>
                           </div>
                        </div>
                        <div className="flex justify-center py-4">
                           <Icons.ArrowDown className="text-slate-300" />
                        </div>
                        <div className="p-6 bg-[#111111] text-white rounded-3xl shadow-2xl relative">
                           <div className="absolute -top-3 -right-3 bg-[#C7F36B] text-[#111111] text-[10px] font-black px-2 py-1 rounded-md uppercase">AI ROUTING</div>
                           <p className="text-[14px] font-bold mb-2">Intent Detected: Billing</p>
                           <div className="flex gap-2">
                              <span className="text-[10px] bg-white/10 px-2 py-1 rounded">Priority: High</span>
                              <span className="text-[10px] bg-[#C7F36B]/20 text-[#C7F36B] px-2 py-1 rounded">Confidence: 99%</span>
                           </div>
                        </div>
                     </div>
                   )}

                   {activeTab.id === 'retrieval' && (
                      <div className="grid grid-cols-2 gap-4 w-full">
                         <div className="p-6 bg-white border border-[#E5E7EB] rounded-3xl shadow-xl">
                            <Icons.Search className="text-[#C7F36B] mb-4" />
                            <p className="text-[14px] font-bold mb-2">Retrieving Knowledge</p>
                            <div className="space-y-2">
                               <div className="h-2 w-full bg-[#F3F4F6] rounded" />
                               <div className="h-2 w-3/4 bg-[#F3F4F6] rounded" />
                            </div>
                         </div>
                         <div className="p-6 bg-white border border-[#E5E7EB] rounded-3xl shadow-xl border-l-4 border-l-[#22C55E]">
                            <Icons.FileText className="text-[#22C55E] mb-4" />
                            <p className="text-[14px] font-bold mb-2">Grounding Verified</p>
                            <p className="text-[10px] text-[#6B7280]">Source: Refund Policy v2.4</p>
                         </div>
                      </div>
                   )}

                   {activeTab.id === 'review' && (
                     <div className="w-full bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                           <span className="text-[12px] font-bold">Human-in-the-Loop</span>
                           <StatusBadge status="Pending Review" />
                        </div>
                        <div className="p-6 bg-slate-50">
                           <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl text-[12px] italic text-slate-600 mb-6">
                              "Hi Sarah, I've verified your billing discrepancy and applied a credit..."
                           </div>
                           <div className="flex gap-3">
                              <button className="flex-1 py-3 bg-[#C7F36B] text-[#111111] rounded-xl font-bold text-[12px]">Approve Action</button>
                              <button className="flex-1 py-3 bg-white border border-[#E5E7EB] rounded-xl font-bold text-[12px]">Modify</button>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Add more as needed */}
                   {!['routing', 'retrieval', 'review'].includes(activeTab.id) && (
                     <div className="text-[#6B7280] font-medium text-[16px]">
                        Visualizing {activeTab.title}...
                     </div>
                   )}
                </motion.div>
             </AnimatePresence>

             {/* Background Grid */}
             <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#11111110 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

const StatusBadge = ({ status }) => (
  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
    {status}
  </span>
);

export default WorkflowSection;
