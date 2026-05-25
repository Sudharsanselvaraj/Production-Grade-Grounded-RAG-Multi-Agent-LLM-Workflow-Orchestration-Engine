'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { backendGet, backendPost } from '@/lib/backend';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({ name: 'Support Assistant', version: '1.0.0', prompt: '' });
  const [error, setError] = useState('');

  async function loadPrompts() {
    setError('');
    try {
      const data = await backendGet('/api/prompts');
      setPrompts(data.prompts || []);
      if (!selectedId && data.prompts?.length) setSelectedId(data.prompts[0].id);
    } catch (err) {
      setError(err.message || 'Failed to load prompts');
    }
  }

  useEffect(() => {
    loadPrompts();
  }, []);

  const selected = useMemo(() => prompts.find((p) => p.id === selectedId) || prompts[0], [prompts, selectedId]);

  async function createDraft() {
    setError('');
    try {
      await backendPost('/api/prompts', draft);
      await loadPrompts();
    } catch (err) {
      setError(err.message || 'Failed to create prompt');
    }
  }

  async function deployPrompt() {
    if (!selected) return;
    setError('');
    try {
      await backendPost('/api/prompts/deploy', { prompt_id: selected.id });
      await loadPrompts();
    } catch (err) {
      setError(err.message || 'Deploy failed');
    }
  }

  async function rollbackPrompt() {
    if (!selected) return;
    setError('');
    try {
      await backendPost(`/api/prompts/${selected.id}/rollback`, {});
      await loadPrompts();
    } catch (err) {
      setError(err.message || 'Rollback failed');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Prompt Manager</h1>
        <p className="text-[#6B7280] text-[16px] mt-1">Real prompt version history, deployment, and rollback with audit logging.</p>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[#111111]">Version History</h2>
            <button onClick={loadPrompts} className="p-2 rounded-lg hover:bg-[#F3F4F6]"><Icons.RefreshCw size={16} /></button>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {prompts.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full text-left rounded-2xl border p-4 ${selectedId === p.id ? 'border-[#C7F36B] bg-[#F7F8F5]' : 'border-[#E5E7EB] bg-white'}`}>
                <p className="text-[14px] font-bold text-[#111111]">{p.name}</p>
                <p className="text-[11px] text-[#6B7280]">v{p.version} • {p.status}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">{p.author}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[28px] border border-[#E5E7EB] p-6">
            <h2 className="text-[16px] font-bold text-[#111111] mb-4">New Draft</h2>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <input value={draft.name} onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value }))} placeholder="Prompt name" className="px-4 py-3 border border-[#E5E7EB] rounded-xl" />
              <input value={draft.version} onChange={(e) => setDraft((v) => ({ ...v, version: e.target.value }))} placeholder="Version" className="px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            </div>
            <textarea value={draft.prompt} onChange={(e) => setDraft((v) => ({ ...v, prompt: e.target.value }))} rows={8} placeholder="Write prompt content here..." className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
            <button onClick={createDraft} className="mt-4 px-5 py-2.5 rounded-xl bg-[#C7F36B] text-[#111111] text-[14px] font-bold">Create Draft</button>
          </div>

          <div className="bg-white rounded-[28px] border border-[#E5E7EB] p-6">
            <h2 className="text-[16px] font-bold text-[#111111] mb-4">Selected Prompt</h2>
            {selected ? (
              <>
                <p className="text-[14px] font-bold text-[#111111]">{selected.name} v{selected.version}</p>
                <p className="text-[12px] text-[#6B7280] mb-4">Status: {selected.status} • Author: {selected.author}</p>
                <pre className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[12px] text-[#111111] whitespace-pre-wrap max-h-[240px] overflow-y-auto">{selected.prompt}</pre>
                <div className="mt-4 flex gap-3">
                  <button onClick={deployPrompt} className="px-5 py-2.5 rounded-xl bg-[#C7F36B] text-[#111111] text-[14px] font-bold">Deploy to Production</button>
                  <button onClick={rollbackPrompt} className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111111] text-[14px] font-bold">Rollback</button>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[#6B7280]">No prompt selected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
