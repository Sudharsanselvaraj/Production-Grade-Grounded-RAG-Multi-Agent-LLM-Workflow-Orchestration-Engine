'use client';

import { useState } from 'react';
import { TICKETS } from '@/lib/mockData';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TicketQueue = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredTickets = TICKETS.filter(t => 
    (t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.customer.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedFilter === 'All' || t.status.toLowerCase() === selectedFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Ticket Queue</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Manage AI-automated and human-reviewed customer operations.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 shadow-sm">
              {['All', 'Open', 'Resolved', 'Needs Review'].map(f => (
                <button 
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${selectedFilter === f ? 'bg-[#111111] text-white shadow-md' : 'text-[#6B7280] hover:text-[#111111]'}`}
                >
                  {f}
                </button>
              ))}
           </div>
           <button className="px-5 py-2.5 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-bold shadow-lg shadow-[#C7F36B]/20 hover:scale-105 transition-all">
              Create Ticket
           </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between gap-6 bg-[#F9FAFB]/50">
           <div className="relative flex-1 max-w-md">
              <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search tickets, customers, or intents..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-[#C7F36B]/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2.5 text-[#6B7280] hover:text-[#111111] bg-white border border-[#E5E7EB] rounded-xl transition-all">
                 <Icons.Filter size={18} />
              </button>
              <button className="p-2.5 text-[#6B7280] hover:text-[#111111] bg-white border border-[#E5E7EB] rounded-xl transition-all">
                 <Icons.Download size={18} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]/30">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Ticket ID</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Customer</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Subject & Intent</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Sentiment</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">AI Confidence</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredTickets.map((ticket, i) => (
                <motion.tr 
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <td className="px-8 py-6 font-mono text-[13px] font-bold text-[#111111]">{ticket.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center font-bold text-[11px] text-[#6B7280]">
                          {ticket.customer[0]}
                       </div>
                       <span className="text-[14px] font-bold text-[#111111]">{ticket.customer}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-xs">
                       <p className="text-[14px] font-bold text-[#111111] truncate mb-1">{ticket.subject}</p>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {ticket.intent}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <SentimentBadge sentiment={ticket.sentiment} />
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-16 bg-[#F3F4F6] rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all ${ticket.aiConfidence > 0.9 ? 'bg-[#22C55E]' : ticket.aiConfidence > 0.8 ? 'bg-[#C7F36B]' : 'bg-amber-500'}`}
                              style={{ width: `${ticket.aiConfidence * 100}%` }}
                           />
                        </div>
                        <span className="text-[13px] font-black text-[#111111]">{Math.round(ticket.aiConfidence * 100)}%</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <StatusBadge status={ticket.status} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]/20">
           <p className="text-[13px] text-[#6B7280]">Showing <span className="font-bold text-[#111111]">1 to {filteredTickets.length}</span> of 1,284 tickets</p>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#6B7280] hover:text-[#111111] transition-all disabled:opacity-50">Previous</button>
              <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#6B7280] hover:text-[#111111] transition-all">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const SentimentBadge = ({ sentiment }) => {
   const colors = {
      positive: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      neutral: 'bg-slate-50 text-slate-600 border-slate-100',
      negative: 'bg-rose-50 text-rose-700 border-rose-100',
      frustrated: 'bg-[#111111] text-[#C7F36B] border-[#111111]'
   };
   return (
     <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${colors[sentiment.toLowerCase()] || colors.neutral}`}>
       {sentiment}
     </span>
   );
};

const StatusBadge = ({ status }) => {
   const colors = {
      resolved: 'bg-emerald-100 text-emerald-800',
      needs_review: 'bg-amber-100 text-amber-800',
      open: 'bg-[#F7F8F5] text-[#111111] border border-[#E5E7EB]',
      in_progress: 'bg-blue-100 text-blue-800'
   };
   return (
     <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${colors[status.toLowerCase()] || colors.open}`}>
       {status.replace('_', ' ')}
     </span>
   );
};

export default TicketQueue;
