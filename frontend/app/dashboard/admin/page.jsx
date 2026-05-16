'use client';

import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

const AdminOps = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Admin Operations</h1>
          <p className="text-[#6B7280] text-[16px] mt-1">Governance, security, and global system configuration.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* System Configuration */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm">
               <h3 className="text-[18px] font-bold text-[#111111] mb-8">AI Governance Controls</h3>
               <div className="space-y-6">
                  {[
                    { label: 'Automatic PII Masking', desc: 'Identify and redact sensitive customer data in traces.', status: true },
                    { label: 'Human Review Threshold', desc: 'Require review for tickets below 90% confidence.', status: true },
                    { label: 'Hallucination Prevention', desc: 'Strict grounding check against knowledge base.', status: true },
                    { label: 'Token Spending Limit', desc: 'Cap daily LLM expenditure at $500.', status: false },
                  ].map((control, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB]">
                       <div>
                          <p className="text-[15px] font-bold text-[#111111]">{control.label}</p>
                          <p className="text-[12px] text-[#6B7280]">{control.desc}</p>
                       </div>
                       <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${control.status ? 'bg-[#111111]' : 'bg-[#E5E7EB]'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${control.status ? 'left-7' : 'left-1'}`} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-10 shadow-sm">
               <h3 className="text-[18px] font-bold text-[#111111] mb-8">Role Based Access Control (RBAC)</h3>
               <div className="space-y-4">
                  {[
                    { user: 'Sudharsan', role: 'System Admin', status: 'Active' },
                    { user: 'Selva', role: 'Operator', status: 'Active' },
                    { user: 'Raj', role: 'Viewer', status: 'Inactive' },
                  ].map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-[#F3F4F6] last:border-0">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center font-bold text-[#111111]">{user.user[0]}</div>
                          <span className="text-[14px] font-bold text-[#111111]">{user.user}</span>
                       </div>
                       <div className="flex items-center gap-6">
                          <span className="text-[12px] font-medium text-[#6B7280]">{user.role}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{user.status}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar: Security & Audits */}
         <div className="space-y-8">
            <div className="bg-[#111111] text-white rounded-[40px] p-10 shadow-2xl">
               <Icons.ShieldCheck size={32} className="text-[#C7F36B] mb-6" />
               <h3 className="text-[20px] font-bold mb-4 text-white">Security Health</h3>
               <p className="text-slate-400 text-[14px] leading-relaxed mb-8">
                  Your system is compliant with SOC2 and GDPR. 24/24 monitoring active.
               </p>
               <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-[12px] font-bold">
                     <Icons.Check size={16} className="text-[#C7F36B]" /> Encryption at rest
                  </li>
                  <li className="flex items-center gap-3 text-[12px] font-bold">
                     <Icons.Check size={16} className="text-[#C7F36B]" /> Audit logging enabled
                  </li>
               </ul>
            </div>

            <div className="bg-white rounded-[32px] border border-[#E5E7EB] p-8 shadow-sm">
               <h3 className="text-[12px] font-black uppercase tracking-widest text-[#9CA3AF] mb-6">Recent Audit Logs</h3>
               <div className="space-y-6">
                  {[
                    { event: 'Prompt Rollback', user: 'Sudharsan', time: '10m ago' },
                    { event: 'API Key Rotated', user: 'System', time: '1h ago' },
                    { event: 'Login: Selva', user: 'Selva', time: '2h ago' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center text-[12px]">
                       <div>
                          <p className="font-bold text-[#111111]">{log.event}</p>
                          <p className="text-[10px] text-[#6B7280]">{log.user}</p>
                       </div>
                       <span className="text-[#9CA3AF]">{log.time}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminOps;
