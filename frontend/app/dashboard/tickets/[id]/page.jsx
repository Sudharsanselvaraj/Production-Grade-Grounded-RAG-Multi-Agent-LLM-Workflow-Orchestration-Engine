'use client';

import { useParams } from 'next/navigation';
import { TICKETS, TRACES } from '@/lib/mockData';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

const TicketDetail = () => {
  const { id } = useParams();
  const ticket = TICKETS.find(t => t.id === id) || TICKETS[0];
  const trace = TRACES.find(t => t.id === id) || TRACES[0];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#E5E7EB]">
               <Icons.ArrowLeft size={20} className="text-[#6B7280]" />
            </button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-black text-[#111111]">{ticket.id}</h1>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">Needs Review</span>
               </div>
               <p className="text-[14px] text-[#6B7280] font-medium">{ticket.subject}</p>
            </div>
         </div>
         <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all flex items-center gap-2">
               <Icons.Share2 size={16} /> Share Trace
            </button>
            <button className="px-4 py-2 bg-[#111111] text-white rounded-xl text-[14px] font-bold hover:opacity-90 transition-all flex items-center gap-2">
               <Icons.ExternalLink size={16} /> Open in Zendesk
            </button>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* LEFT PANEL: Customer Context */}
        <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
           <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Customer Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[#111111] text-[#C7F36B] flex items-center justify-center font-black text-[18px]">
                    {ticket.customer[0]}
                 </div>
                 <div>
                    <p className="text-[16px] font-bold text-[#111111]">{ticket.customer}</p>
                    <p className="text-[12px] text-[#6B7280]">Enterprise Plan • ID: #9283</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280] font-medium">Email</span>
                    <span className="text-[#111111] font-bold">s.selva@example.com</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280] font-medium">Sentiment</span>
                    <span className="text-rose-600 font-black uppercase text-[10px] tracking-widest bg-rose-50 px-2 py-0.5 rounded">Frustrated</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280] font-medium">LTV</span>
                    <span className="text-[#111111] font-bold">$12,400</span>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-4">Customer History</h3>
              <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="pb-4 border-b border-[#F3F4F6] last:border-0 last:pb-0">
                      <p className="text-[13px] font-bold text-[#111111] mb-1">Previous Issue #{8273 - i}</p>
                      <p className="text-[11px] text-[#6B7280]">Resolved via AI • 2 weeks ago</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* CENTER PANEL: AI Intelligence */}
        <div className="col-span-6 space-y-6 overflow-y-auto px-2 custom-scrollbar">
           {/* Reasoning Card */}
           <div className="bg-[#111111] text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C7F36B]/10 blur-[60px]" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-[#C7F36B] rounded-lg flex items-center justify-center">
                       <Icons.Brain size={18} className="text-[#111111]" />
                    </div>
                    <h3 className="text-[18px] font-bold">AI Decision Reasoning</h3>
                 </div>
                 <p className="text-[15px] leading-relaxed text-slate-300 font-medium">
                    "The customer is expressing frustration regarding an unexpected charge on invoice #9283. Upon retrieval of subscription history, I identified a pro-rated charge during the tier upgrade on April 12th. I recommend issuing a one-time credit of $14.50 to resolve the conflict as per the 'Customer Delight' policy v4.2."
                 </p>
                 <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                       <Icons.Target size={14} className="text-[#C7F36B]" />
                       <span className="text-[11px] font-black uppercase tracking-widest">Intent: Billing Discrepancy</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                       <Icons.ShieldAlert size={14} className="text-amber-400" />
                       <span className="text-[11px] font-black uppercase tracking-widest">Risk: High Churn</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Retrieval Evidence */}
           <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Grounded Retrieval Evidence</h3>
              <div className="space-y-4">
                 {[
                   { source: 'Knowledge Base: Refund Policy', text: '...one-time credits up to $20 can be issued for pro-rated billing confusion without management approval...', score: 0.98 },
                   { source: 'Subscription API: GET /billing', text: 'Invoice #9283: Pro-rated upgrade fee $14.50 applied 2026-04-12.', score: 0.92 }
                 ].map((evidence, i) => (
                   <div key={i} className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] group hover:border-[#C7F36B] transition-all">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[12px] font-black text-[#111111]">{evidence.source}</span>
                         <span className="text-[10px] font-bold text-[#22C55E]">Similarity: {Math.round(evidence.score * 100)}%</span>
                      </div>
                      <p className="text-[13px] text-[#6B7280] italic leading-relaxed">"{evidence.text}"</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Generated Draft */}
           <div className="bg-white rounded-[32px] border-2 border-[#C7F36B] p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[18px] font-bold text-[#111111]">AI Proposed Resolution</h3>
                 <div className="flex gap-2">
                    <button className="p-2 hover:bg-[#F7F8F5] rounded-lg transition-all text-[#6B7280]"><Icons.Copy size={16} /></button>
                    <button className="p-2 hover:bg-[#F7F8F5] rounded-lg transition-all text-[#6B7280]"><Icons.RotateCw size={16} /></button>
                 </div>
              </div>
              <div className="p-6 bg-[#F9FAFB] rounded-2xl text-[15px] text-[#111111] leading-relaxed font-medium min-h-[160px]">
                 Hi {ticket.customer},<br/><br/>
                 I've looked into your concern regarding the charge on invoice #9283. It appears this was a pro-rated fee from your tier upgrade on April 12th. <br/><br/>
                 To ensure you have the best experience, I've gone ahead and applied a <span className="bg-[#C7F36B] px-1 font-black">one-time credit of $14.50</span> to your account. This will be reflected in your next billing cycle.
              </div>
           </div>
        </div>

        {/* RIGHT PANEL: Operational Telemetry */}
        <div className="col-span-3 space-y-6 overflow-y-auto pl-2 custom-scrollbar">
           <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Workflow Execution</h3>
              <div className="space-y-6 relative">
                 <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-[#E5E7EB]" />
                 {trace.spans.map((span, i) => (
                   <div key={i} className="flex gap-4 relative z-10">
                      <div className={`w-4 h-4 rounded-full mt-1 border-4 border-white shadow-sm ${span.status === 'success' ? 'bg-[#22C55E]' : 'bg-[#C7F36B]'}`} />
                      <div>
                         <p className="text-[13px] font-bold text-[#111111]">{span.name}</p>
                         <p className="text-[11px] text-[#6B7280]">{span.duration}ms • {span.model}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#F7F8F5] rounded-[24px] border border-[#E5E7EB] p-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Operational Metrics</h3>
              <div className="space-y-5">
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase">Total Latency</span>
                    <span className="text-[16px] font-black text-[#111111]">1.24s</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase">Token Usage</span>
                    <span className="text-[16px] font-black text-[#111111]">2,410</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase">Estimated Cost</span>
                    <span className="text-[16px] font-black text-[#111111]">$0.042</span>
                 </div>
                 <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-[#6B7280] uppercase">Reranker Score</span>
                       <span className="text-[12px] font-bold text-[#22C55E]">0.982</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                       <div className="h-full bg-[#22C55E] rounded-full" style={{ width: '98%' }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="h-24 bg-[#111111] rounded-[32px] px-8 flex items-center justify-between shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white">
               <Icons.UserCheck size={20} className="text-[#C7F36B]" />
               <span className="text-[14px] font-bold">Awaiting Human Review</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <p className="text-[12px] text-slate-400 max-w-[200px] leading-tight font-medium">
               This resolution will resolve the ticket and credit the customer account.
            </p>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-[14px] font-bold hover:bg-white/20 transition-all">Reject & Escalate</button>
            <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-[14px] font-bold hover:bg-white/20 transition-all flex items-center gap-2">
               <Icons.Edit3 size={16} /> Edit Response
            </button>
            <button className="px-10 py-3 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-black hover:scale-105 transition-all shadow-xl shadow-[#C7F36B]/20">
               Approve Resolution
            </button>
         </div>
      </div>
    </div>
  );
};

export default TicketDetail;
