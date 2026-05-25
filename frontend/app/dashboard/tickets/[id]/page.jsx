'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { backendGet, backendPost } from '@/lib/backend';

const TicketDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [traces, setTraces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [editDraft, setEditDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const data = await backendGet(`/api/tickets/${id}/detail`);
      setTicket(data.ticket);
      setTraces(data.traces || []);
      setReviews(data.reviews || []);
      setEditDraft(data.ticket?.reasoning || '');
    } catch (err) {
      setError(err.message || 'Failed to load ticket detail');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  async function act(action) {
    setError('');
    try {
      const payload = action === 'edit' ? { edited_response: editDraft, note: 'Edited in review workspace' } : { note: `Action: ${action}` };
      await backendPost(`/api/reviews/${id}/${action}`, payload);
      await loadDetail();
    } catch (err) {
      setError(err.message || 'Review action failed');
    }
  }

  if (loading) {
    return <div className="p-8 text-[#6B7280]">Loading ticket...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-rose-700">Ticket not found.</div>;
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-[#E5E7EB]">
            <Icons.ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-black text-[#111111]">{ticket.id}</h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">{ticket.status.replace('_', ' ')}</span>
            </div>
            <p className="text-[14px] text-[#6B7280] font-medium">{ticket.subject}</p>
          </div>
        </div>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <div className="col-span-4 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Customer Context</h3>
            <p className="text-[15px] font-bold text-[#111111]">{ticket.customer}</p>
            <p className="text-[12px] text-[#6B7280]">{ticket.email}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F8F5] border border-[#E5E7EB] p-3">
                <p className="text-[10px] text-[#6B7280] uppercase font-black">Intent</p>
                <p className="text-[12px] font-bold text-[#111111]">{ticket.intent}</p>
              </div>
              <div className="rounded-xl bg-[#F7F8F5] border border-[#E5E7EB] p-3">
                <p className="text-[10px] text-[#6B7280] uppercase font-black">Confidence</p>
                <p className="text-[12px] font-bold text-[#111111]">{Math.round((ticket.aiConfidence || 0) * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-4">Approval History</h3>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-[#F7F8F5] border border-[#E5E7EB] p-3">
                  <p className="text-[12px] font-bold text-[#111111]">{review.decision.toUpperCase()} by {review.reviewer}</p>
                  <p className="text-[11px] text-[#6B7280]">{review.createdAt ? new Date(review.createdAt).toLocaleString() : '-'}</p>
                </div>
              ))}
              {!reviews.length ? <p className="text-[12px] text-[#6B7280]">No review actions yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-6 overflow-y-auto px-2">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E5E7EB]">
            <h3 className="text-[18px] font-bold text-[#111111] mb-4">Ticket Message</h3>
            <p className="text-[14px] leading-relaxed text-[#111827]">{ticket.message}</p>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-[18px] font-bold text-[#111111] mb-4">AI Draft / Reasoning</h3>
              <div className="flex items-center gap-3">
                <button onClick={async () => {
                  setRegenerating(true);
                  setError('');
                  try {
                    const out = await backendPost(`/api/tickets/${ticket.ticket_id}/draft`, {});
                    // backend returns { draft, citations, note }
                    if (out && out.draft) {
                      setEditDraft(out.draft);
                      // update ticket locally to reflect new citations
                      setTicket((t) => ({ ...t, reasoning: out.draft, citations: out.citations || [] }));
                    }
                  } catch (e) {
                    setError(e.message || 'Failed to regenerate draft');
                  } finally {
                    setRegenerating(false);
                  }
                }} className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-[#111111] text-[13px] font-bold">{regenerating ? 'Regenerating...' : 'Regenerate Draft'}</button>
                <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(editDraft || ticket.reasoning || ''); }} className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-[#111111] text-[13px] font-bold">Copy</button>
              </div>
            </div>

            <div className="w-full">
              <div className="rounded-2xl bg-[#F9FAFB] p-4 min-h-[160px]">
                <p className="whitespace-pre-wrap text-[14px] text-[#111111]">{editDraft || ticket.reasoning || 'No draft available.'}</p>
              </div>

              {/** Model notes / metadata (if present) */}
              {ticket.note ? (
                <div className="mt-4 text-[13px] text-[#6B7280]">Model note: {ticket.note}</div>
              ) : null}

              {/** Edit area (toggle using existing editDraft state) */}
              <div className="mt-4">
                <label className="block text-[13px] font-bold text-[#111111] mb-2">Edit draft (optional)</label>
                <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="w-full min-h-[120px] p-3 bg-white rounded-lg border border-[#E5E7EB] text-[14px] text-[#111111]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-4">Retrieved Evidence</h3>
            <div className="space-y-3">
              {(ticket.citations || []).map((citation, index) => (
                <div key={index} className="rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] p-4 text-[13px] text-[#111111]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{citation.source || 'Source'}</p>
                      <p className="text-[13px] text-[#6B7280] mt-1">{citation.snippet || ''}</p>
                    </div>
                    <div className="text-right">
                      {typeof citation.confidence !== 'undefined' ? <div className="text-[12px] font-bold text-[#111111]">{Math.round((citation.confidence || 0) * 100)}%</div> : null}
                      <a target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(citation.source || citation.snippet || '')}`} className="mt-2 inline-block text-[12px] font-bold text-[#C7F36B]">Open Source</a>
                    </div>
                  </div>
                </div>
              ))}
              {!(ticket.citations || []).length ? <p className="text-[13px] text-[#6B7280]">No citations stored for this ticket yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-6 overflow-y-auto pl-2">
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Trace Timeline</h3>
            <div className="space-y-4">
              {traces.flatMap((trace) => trace.spans || []).map((span) => (
                <div key={span.id} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <p className="text-[12px] font-bold text-[#111111]">{span.name}</p>
                  <p className="text-[11px] text-[#6B7280]">{span.timestamp ? new Date(span.timestamp).toLocaleString() : '-'}</p>
                </div>
              ))}
              {!traces.length ? <p className="text-[12px] text-[#6B7280]">No traces found.</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="h-24 bg-white rounded-[32px] px-8 flex items-center justify-between shadow-2xl border border-[#E5E7EB]">
        <p className="text-[14px] font-bold text-[#111111]">Execute review action for this ticket</p>
        <div className="flex gap-3">
          <button onClick={() => act('reject')} className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-xl text-[14px] font-bold">Reject</button>
          <button onClick={() => act('escalate')} className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-xl text-[14px] font-bold">Escalate</button>
          <button onClick={() => act('edit')} className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-xl text-[14px] font-bold">Save Edit</button>
          <button onClick={() => act('approve')} className="px-8 py-2.5 bg-[#C7F36B] text-[#111111] rounded-xl text-[14px] font-black">Approve</button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
