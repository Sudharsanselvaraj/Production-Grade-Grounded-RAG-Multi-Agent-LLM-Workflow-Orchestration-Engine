'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { backendGet } from '@/lib/backend';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function AdminOps() {
  const [settings, setSettings] = useState({
    pii_masking: true,
    human_review_threshold: 0.8,
    hallucination_prevention: true,
    token_spending_limit: 500,
  });
  const [logs, setLogs] = useState([]);
  const [apiKeyName, setApiKeyName] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [error, setError] = useState('');

  async function loadAdmin() {
    setError('');
    try {
      const [s, l] = await Promise.all([backendGet('/api/admin/settings'), backendGet('/api/admin/audit-logs?limit=50')]);
      setSettings(s);
      setLogs(l.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin settings');
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function saveSettings(next) {
    setError('');
    try {
      await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setSettings(next);
      await loadAdmin();
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    }
  }

  async function createApiKey() {
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/api-keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: apiKeyName || 'default' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Create API key failed');
      setLatestKey(data.key || '');
      setApiKeyName('');
      await loadAdmin();
    } catch (err) {
      setError(err.message || 'Create API key failed');
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Admin Operations</h1>
        <p className="text-[#6B7280] text-[16px] mt-1">PII masking, review thresholds, API keys, and audit logs powered by backend controls.</p>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm space-y-6">
            <h3 className="text-[18px] font-bold text-[#111111]">AI Governance Controls</h3>
            <ToggleRow
              label="Automatic PII Masking"
              desc="Identify and redact sensitive customer data in traces."
              value={settings.pii_masking}
              onChange={(value) => saveSettings({ ...settings, pii_masking: value })}
            />
            <ToggleRow
              label="Hallucination Prevention"
              desc="Enable strict grounding validator before release."
              value={settings.hallucination_prevention}
              onChange={(value) => saveSettings({ ...settings, hallucination_prevention: value })}
            />
              <div className="rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] p-6">
              <p className="text-[15px] font-bold text-[#111111]">Human Review Threshold</p>
              <p className="text-[12px] text-[#6B7280] mb-3">Tickets below this confidence automatically enter review queue.</p>
              <input
                type="range"
                min={0.5}
                max={0.99}
                step={0.01}
                value={settings.human_review_threshold}
                onChange={(e) => saveSettings({ ...settings, human_review_threshold: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-2 text-[12px] font-bold text-[#111111]">{Math.round((settings.human_review_threshold || 0) * 100)}%</p>
            </div>
            <div className="rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] p-6">
              <p className="text-[15px] font-bold text-[#111111]">Token Spending Limit (daily)</p>
              <input
                type="number"
                value={settings.token_spending_limit}
                onChange={(e) => setSettings((s) => ({ ...s, token_spending_limit: Number(e.target.value) }))}
                className="mt-3 w-full px-4 py-3 rounded-xl border border-[#E5E7EB]"
              />
              <button onClick={() => saveSettings(settings)} className="mt-3 px-4 py-2 rounded-xl bg-[#C7F36B] text-[#111111] text-[13px] font-bold">Save Limit</button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm space-y-4">
            <h3 className="text-[18px] font-bold text-[#111111]">API Keys</h3>
            <div className="flex gap-3">
              <input value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} placeholder="Key name" className="flex-1 px-4 py-3 rounded-xl border border-[#E5E7EB]" />
              <button onClick={createApiKey} className="px-5 py-3 rounded-xl bg-[#C7F36B] text-[#111111] font-bold">Create</button>
            </div>
            {latestKey ? <p className="text-[12px] text-[#111111] break-all">New Key: {latestKey}</p> : null}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
            <Icons.ShieldCheck size={28} className="text-[#C7F36B] mb-4" />
            <h3 className="text-[18px] font-bold text-[#111111]">Security Panel</h3>
            <p className="text-[13px] text-[#6B7280] mt-2">Encryption status, API key health, and governance actions are persisted in audit logs.</p>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Recent Audit Logs</h3>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="text-[12px]">
                  <p className="font-bold text-[#111111]">{log.action}</p>
                  <p className="text-[#6B7280]">{log.actor} • {log.entity}</p>
                  <p className="text-[#9CA3AF]">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB]">
      <div>
        <p className="text-[15px] font-bold text-[#111111]">{label}</p>
        <p className="text-[12px] text-[#6B7280]">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-[#C7F36B]' : 'bg-[#E5E7EB]'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
