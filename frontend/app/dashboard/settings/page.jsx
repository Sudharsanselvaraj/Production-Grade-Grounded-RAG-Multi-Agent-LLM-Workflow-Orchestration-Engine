'use client';

import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const SettingsPage = () => {
  const [workspace, setWorkspace] = useState({
    organization_name: 'Lumen AI Ops',
    timezone: 'UTC',
    language: 'en',
    email_alerts: true,
    slack_alerts: false,
    teams_alerts: false,
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/settings`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !active) return;
        setWorkspace((prev) => ({ ...prev, ...data }));
      } catch {
        // Keep defaults when settings are not available for current role.
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaved(false);
    setError('');
    try {
      const payload = {
        pii_masking: true,
        human_review_threshold: Number(workspace.human_review_threshold || 0.8),
        hallucination_prevention: true,
        token_spending_limit: Number(workspace.token_spending_limit || 500),
      };
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save settings');
      }
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Settings</h1>
        <p className="text-[#6B7280] text-[16px] mt-1">Workspace profile, notifications, and usage controls.</p>
      </div>

      {error ? <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-[14px]">{error}</div> : null}
      {saved ? <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[14px]">Settings saved.</div> : null}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm space-y-4">
          <h3 className="text-[18px] font-bold text-[#111111]">Workspace Settings</h3>
          <input value={workspace.organization_name || ''} onChange={(e) => setWorkspace((p) => ({ ...p, organization_name: e.target.value }))} placeholder="Organization Name" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
          <input value={workspace.timezone || ''} onChange={(e) => setWorkspace((p) => ({ ...p, timezone: e.target.value }))} placeholder="Timezone" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
          <input value={workspace.language || ''} onChange={(e) => setWorkspace((p) => ({ ...p, language: e.target.value }))} placeholder="Language" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm space-y-4">
          <h3 className="text-[18px] font-bold text-[#111111]">Notification Settings</h3>
          <Toggle label="Email alerts" checked={!!workspace.email_alerts} onChange={(v) => setWorkspace((p) => ({ ...p, email_alerts: v }))} />
          <Toggle label="Slack alerts" checked={!!workspace.slack_alerts} onChange={(v) => setWorkspace((p) => ({ ...p, slack_alerts: v }))} />
          <Toggle label="Teams alerts" checked={!!workspace.teams_alerts} onChange={(v) => setWorkspace((p) => ({ ...p, teams_alerts: v }))} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm space-y-4">
        <h3 className="text-[18px] font-bold text-[#111111]">Usage Limits</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input value={workspace.human_review_threshold || 0.8} onChange={(e) => setWorkspace((p) => ({ ...p, human_review_threshold: e.target.value }))} placeholder="Human review threshold" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
          <input value={workspace.token_spending_limit || 500} onChange={(e) => setWorkspace((p) => ({ ...p, token_spending_limit: e.target.value }))} placeholder="Daily token spending limit" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
        </div>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-[#C7F36B] text-[#111111] text-[14px] font-bold">Save Settings</button>
      </div>
    </div>
  );
};

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB]">
      <span className="text-[14px] font-bold text-[#111111]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default SettingsPage;
