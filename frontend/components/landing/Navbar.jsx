'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { backendPost } from '@/lib/backend';

const Navbar = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', company: '' });
  const [loading, setLoading] = useState(false);

  async function submitDemo() {
    setLoading(true);
    try {
      await backendPost('/api/landing/demo', lead);
      setShowDemo(false);
      setLead({ name: '', email: '', company: '' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <nav className="sticky top-0 z-50 bg-[#F7F8F5]/80 backdrop-blur-xl border-b border-[#E5E7EB]">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#C7F36B] rounded-xl flex items-center justify-center">
            <Icons.Zap size={22} className="text-[#111111] fill-[#111111]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#111111]">Lumen AI Ops</span>
        </div>

        {/* Center Links */}
        <div className="hidden lg:flex items-center gap-8">
          {['Product', 'Solutions', 'Workflow', 'Evaluation', 'Observability', 'Integrations', 'Pricing', 'Resources'].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-[14px] font-medium text-[#6B7280] hover:text-[#111111] transition-colors">
              {item}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[14px] font-semibold text-[#111111] px-4 py-2 hover:bg-white rounded-full transition-all">
            Login
          </Link>
          <button onClick={() => setShowDemo(true)} className="px-6 py-2.5 bg-white border border-[#E5E7EB] text-[#111111] text-[14px] font-semibold rounded-full hover:bg-[#F9FAFB] transition-all">
            Book Demo
          </button>
          <Link href="/dashboard" className="px-6 py-2.5 bg-[#C7F36B] text-[#111111] text-[14px] font-semibold rounded-full hover:opacity-90 transition-all shadow-sm">
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
    {showDemo ? (
      <div className="fixed inset-0 z-[60] bg-[#F7F8F5]/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-[28px] shadow-2xl p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] font-bold text-[#111111]">Book Demo</h3>
            <button onClick={() => setShowDemo(false)} className="p-2 rounded-lg hover:bg-[#F3F4F6]"><Icons.X size={18} /></button>
          </div>
          <input value={lead.name} onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
          <input value={lead.email} onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))} placeholder="Work email" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
          <input value={lead.company} onChange={(e) => setLead((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl" />
          <button onClick={submitDemo} disabled={loading || !lead.email} className="w-full py-3 rounded-xl bg-[#C7F36B] text-[#111111] font-bold disabled:opacity-50">
            {loading ? 'Submitting...' : 'Schedule Demo'}
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default Navbar;
