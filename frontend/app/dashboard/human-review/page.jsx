'use client';

import { TICKETS } from '@/lib/mockData';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const HumanReview = () => {
  const reviewTickets = TICKETS.filter(t => t.status === 'Needs Review' || t.aiConfidence < 0.9);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Human Review Workspace</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Review AI-proposed actions for high-risk or low-confidence tickets.</p>
        </div>
        <div className="flex gap-4 p-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
           <div className="flex items-center gap-2 px-4 py-2 border-r border-[#E5E7EB]">
              <span className="text-[12px] font-black text-[#111111]">{reviewTickets.length}</span>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pending</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-[12px] font-black text-emerald-600">842</span>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Approved Today</span>
           </div>
        </div>
      </div>

      {/* Grid of Review Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {reviewTickets.map((ticket, i) => (
          <motion.div 
            key={ticket.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white rounded-[32px] border border-[#E5E7EB] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Card Header */}
            <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
               <div className="flex items-center gap-3">
                  <span className="text-[12px] font-black text-[#111111] font-mono">{ticket.id}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-100">
                     <Icons.AlertTriangle size={10} className="text-rose-600" />
                     <span className="text-[9px] font-black uppercase text-rose-600 tracking-widest">High Risk</span>
                  </div>
               </div>
               <Icons.MoreHorizontal size={16} className="text-[#9CA3AF]" />
            </div>

            {/* Card Content */}
            <div className="p-8">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold">
                     {ticket.customer[0]}
                  </div>
                  <div>
                     <p className="text-[15px] font-bold text-[#111111]">{ticket.customer}</p>
                     <p className="text-[11px] font-black uppercase tracking-widest text-[#6B7280]">{ticket.intent}</p>
                  </div>
               </div>
               
               <p className="text-[14px] text-[#111111] font-medium leading-relaxed mb-6 line-clamp-2">
                  "{ticket.subject}"
               </p>

               <div className="space-y-4 p-5 bg-[#F7F8F5] rounded-2xl border border-[#E5E7EB] mb-8">
                  <div className="flex justify-between items-center text-[12px]">
                     <span className="text-[#6B7280] font-bold uppercase tracking-tighter">AI Confidence</span>
                     <span className="text-[#111111] font-black">{Math.round(ticket.aiConfidence * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ticket.aiConfidence * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-amber-700 font-bold italic">
                     <Icons.ShieldAlert size={14} />
                     "Requires confirmation for refund."
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Link 
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="py-3.5 bg-[#111111] text-white rounded-xl text-[13px] font-bold text-center hover:opacity-90 transition-all"
                  >
                    Open Review
                  </Link>
                  <button className="py-3.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-xl text-[13px] font-bold hover:bg-[#F9FAFB] transition-all">
                    Quick Approve
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HumanReview;
