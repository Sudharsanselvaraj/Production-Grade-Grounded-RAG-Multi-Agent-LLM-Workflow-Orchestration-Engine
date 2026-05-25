'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { backendGet, backendPost } from '@/lib/backend';

const HumanReview = () => {
  const [reviewTickets, setReviewTickets] = useState([]);
  const [approvedToday, setApprovedToday] = useState(0);
  const [error, setError] = useState('');

  async function loadQueue() {
    setError('');
    try {
      const data = await backendGet('/api/reviews/queue');
      setReviewTickets(data.tickets || []);
      setApprovedToday(data.approvedToday || 0);
    } catch (err) {
      setError(err.message || 'Failed to load review queue');
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function quickApprove(ticketId) {
    setError('');
    try {
      await backendPost(`/api/reviews/${ticketId}/approve`, { note: 'Quick approval from workspace' });
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Quick approve failed');
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Human Review Workspace</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Live review queue for low-confidence and high-risk AI resolutions.</p>
        </div>
        <div className="flex gap-4 p-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 border-r border-[#E5E7EB]">
            <span className="text-[12px] font-black text-[#111111]">{reviewTickets.length}</span>
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pending</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-[12px] font-black text-emerald-600">{approvedToday}</span>
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Approved Today</span>
          </div>
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {reviewTickets.map((ticket) => (
          <div key={ticket.id} className="group bg-white rounded-[32px] border border-[#E5E7EB] overflow-hidden hover:shadow-2xl transition-all">
            <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-black text-[#111111] font-mono">{ticket.id}</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-100">
                  <Icons.AlertTriangle size={10} className="text-rose-600" />
                  <span className="text-[9px] font-black uppercase text-rose-600 tracking-widest">Review</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] text-[#111111] flex items-center justify-center font-bold">{ticket.customer?.[0] || 'U'}</div>
                <div>
                  <p className="text-[15px] font-bold text-[#111111]">{ticket.customer}</p>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#6B7280]">{ticket.intent}</p>
                </div>
              </div>

              <p className="text-[14px] text-[#111111] font-medium leading-relaxed mb-6 line-clamp-2">"{ticket.subject}"</p>

              <div className="space-y-4 p-5 bg-[#F7F8F5] rounded-2xl border border-[#E5E7EB] mb-8">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-[#6B7280] font-bold uppercase tracking-tighter">AI Confidence</span>
                  <span className="text-[#111111] font-black">{Math.round((ticket.aiConfidence || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((ticket.aiConfidence || 0) * 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href={`/dashboard/tickets/${ticket.id}`} className="py-3.5 bg-[#C7F36B] text-[#111111] rounded-xl text-[13px] font-bold text-center">
                  Open Review
                </Link>
                <button onClick={() => quickApprove(ticket.id)} className="py-3.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-xl text-[13px] font-bold">
                  Quick Approve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HumanReview;
