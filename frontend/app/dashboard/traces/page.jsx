'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { backendGet, backendPost } from '@/lib/backend';

const TracesPage = () => {
  const [traces, setTraces] = useState([]);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadTraces() {
    setError('');
    try {
      const data = await backendGet('/api/traces');
      const rows = data.traces || [];
      setTraces(rows);
      if (!selectedTraceId && rows.length) setSelectedTraceId(rows[0].id);
    } catch (err) {
      setError(err.message || 'Failed to load traces');
    }
  }

  async function loadDetail(id) {
    if (!id) return;
    setError('');
    try {
      const data = await backendGet(`/api/traces/${id}/detail`);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to load trace detail');
    }
  }

  useEffect(() => {
    loadTraces();
  }, []);

  useEffect(() => {
    loadDetail(selectedTraceId);
  }, [selectedTraceId]);

  const filtered = traces.filter((t) => `${t.id} ${t.ticketId || ''} ${t.summary || ''}`.toLowerCase().includes(search.toLowerCase()));

  async function deleteTrace(id) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/traces/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await loadTraces();
      setDetail(null);
    } catch (err) {
      setError(err.message || 'Failed to delete trace');
    }
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-8">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Workflow Traces</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Database-backed trace steps, latency, and execution history.</p>
        </div>
        <button onClick={loadTraces} className="px-4 py-2 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-bold flex items-center gap-2">
          <Icons.RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        <div className="col-span-4 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB]/50">
            <div className="relative">
              <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter traces"
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[12px]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
            {filtered.map((trace) => (
              <button
                key={trace.id}
                onClick={() => setSelectedTraceId(trace.id)}
                className={`w-full text-left p-6 transition-all ${selectedTraceId === trace.id ? 'bg-[#F7F8F5] border-l-4 border-l-[#111111]' : 'hover:bg-[#F9FAFB]'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-black text-[#111111] font-mono">TR-{trace.id}</span>
                  <span className="text-[10px] font-bold text-[#6B7280]">{trace.status}</span>
                </div>
                <p className="text-[13px] font-bold text-[#111111] mb-1">{trace.ticketId || 'No ticket'}</p>
                <p className="text-[11px] text-[#6B7280]">{trace.latencyMs}ms • {trace.steps} steps</p>
              </button>
            ))}
            {!filtered.length ? <p className="p-6 text-[13px] text-[#6B7280]">No traces found.</p> : null}
          </div>
        </div>

        <div className="col-span-8 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
          {!detail ? (
            <div className="flex-1 flex items-center justify-center text-[#6B7280]">Select a trace to inspect details.</div>
          ) : (
            <>
              <div className="p-8 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[#111111]">Trace: TR-{detail.trace.id}</h2>
                  <p className="text-[12px] text-[#6B7280] font-medium mt-1">{detail.trace.status} • {detail.trace.ticketId || 'no ticket'} • {detail.trace.latencyMs}ms</p>
                </div>
                <button onClick={() => deleteTrace(detail.trace.id)} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-[13px] font-bold">
                  Delete Trace
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {detail.events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[14px] font-bold text-[#111111]">{event.step}</p>
                      <span className="text-[10px] text-[#9CA3AF]">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}</span>
                    </div>
                    <p className="text-[13px] text-[#6B7280] break-words">{event.output || 'No detail'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TracesPage;
