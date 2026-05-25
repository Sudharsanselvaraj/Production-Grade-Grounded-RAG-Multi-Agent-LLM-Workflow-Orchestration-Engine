'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { backendGet, backendPost } from '@/lib/backend';

const TicketQueue = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ open: 0, needsReview: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ customer: '', email: '', subject: '', message: '' });

  const pageSize = 8;

  async function loadQueue() {
    setLoading(true);
    setError('');
    try {
      const statusMap = {
        All: 'all',
        Open: 'open',
        Resolved: 'resolved',
        'Needs Review': 'needs_review',
      };
      const skip = (page - 1) * pageSize;
      const params = new URLSearchParams({
        q: searchQuery,
        status: statusMap[selectedFilter] || 'all',
        sort_by: sortBy,
        sort_order: 'desc',
        skip: String(skip),
        limit: String(pageSize),
      });
      const data = await backendGet(`/api/tickets/queue?${params.toString()}`);
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      setSummary(data.summary || { open: 0, needsReview: 0, resolved: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, [searchQuery, selectedFilter, sortBy, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function createTicket() {
    setCreating(true);
    setError('');
    try {
      const res = await backendPost('/api/tickets', form);
      setShowCreate(false);
      setForm({ customer: '', email: '', subject: '', message: '' });
      await loadQueue();
      router.push(`/dashboard/tickets/${res.ticket.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Ticket Queue</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Real ticket management with database-backed search, filters, and actions.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="hidden lg:flex items-center gap-3 mr-2">
            {[
              { label: 'Open', value: summary.open },
              { label: 'Review', value: summary.needsReview },
              { label: 'Resolved', value: summary.resolved },
            ].map((chip) => (
              <div key={chip.label} className="rounded-2xl bg-white border border-[#E5E7EB] px-4 py-2 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">{chip.label}</p>
                <p className="text-[14px] font-black text-[#111111]">{chip.value}</p>
              </div>
            ))}
          </div>
          <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 shadow-sm">
              {['All', 'Open', 'Resolved', 'Needs Review'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setSelectedFilter(f);
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${selectedFilter === f ? 'bg-[#C7F36B] text-[#111111] shadow-md' : 'text-[#6B7280] hover:text-[#111111]'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-bold shadow-lg shadow-[#C7F36B]/20"
          >
            Create Ticket
          </button>
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between gap-6 bg-[#F9FAFB]/50">
          <div className="relative flex-1 max-w-md">
            <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search tickets, customers, or intents..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-[#C7F36B]/10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Sort</span>
            {[
              ['date', 'date'],
              ['priority', 'priority'],
              ['confidence', 'confidence'],
              ['customer', 'customer'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${sortBy === value ? 'bg-[#C7F36B] text-[#111111]' : 'bg-white border border-[#E5E7EB] text-[#6B7280]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]/30">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Ticket ID</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Customer</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Subject & Intent</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Priority</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">AI Confidence</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6" colSpan={6}>
                      <div className="h-8 rounded-xl bg-[#F3F4F6]" />
                    </td>
                  </tr>
                ))
              ) : (
                tickets.map((ticket, i) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                    className="group hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-6 font-mono text-[13px] font-bold text-[#111111]">{ticket.id}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center font-bold text-[11px] text-[#6B7280]">
                          {ticket.customer?.[0] || 'U'}
                        </div>
                        <span className="text-[14px] font-bold text-[#111111]">{ticket.customer}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-xs">
                        <p className="text-[14px] font-bold text-[#111111] truncate mb-1">{ticket.subject}</p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{ticket.intent}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F7F8F5] border border-[#E5E7EB] text-[#111111]">{ticket.priority}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-16 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div
                            className={`${ticket.aiConfidence > 0.9 ? 'bg-[#22C55E]' : ticket.aiConfidence > 0.8 ? 'bg-[#C7F36B]' : 'bg-amber-500'} h-full rounded-full`}
                            style={{ width: `${Math.round((ticket.aiConfidence || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-black text-[#111111]">{Math.round((ticket.aiConfidence || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={ticket.status} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]/20">
          <p className="text-[13px] text-[#6B7280]">
            Showing <span className="font-bold text-[#111111]">{Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)}</span> of {total} tickets
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#6B7280] disabled:opacity-50"
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#6B7280] disabled:opacity-50"
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 bg-[#F7F8F5]/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-[28px] shadow-2xl p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-bold text-[#111111]">Create Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-[#F3F4F6]">
                <Icons.X size={18} />
              </button>
            </div>
            <input value={form.customer} onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))} placeholder="Customer name" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Customer email" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Message" rows={5} className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            <button
              onClick={createTicket}
              disabled={creating || !form.customer || !form.email || !form.subject || !form.message}
              className="w-full py-3 rounded-xl bg-[#C7F36B] text-[#111111] font-bold disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create and Classify'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    resolved: 'bg-emerald-100 text-emerald-800',
    needs_review: 'bg-amber-100 text-amber-800',
    review: 'bg-amber-100 text-amber-800',
    open: 'bg-[#F7F8F5] text-[#111111] border border-[#E5E7EB]',
    in_progress: 'bg-blue-100 text-blue-800',
  };
  const key = (status || 'open').toLowerCase();
  return <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${colors[key] || colors.open}`}>{key.replace('_', ' ')}</span>;
};

export default TicketQueue;
