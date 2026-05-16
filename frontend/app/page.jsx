'use client';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import WorkflowSection from '@/components/landing/WorkflowSection';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      <Navbar />
      
      {/* Hero */}
      <Hero />

      {/* Trust Logotypes */}
      <section className="py-20 border-t border-[#E5E7EB]">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-center text-[14px] font-bold uppercase tracking-widest text-[#6B7280] mb-12">Powering AI Operations for</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 grayscale">
             {['Zendesk', 'Intercom', 'Linear', 'Vercel', 'Datadog', 'Notion'].map(name => (
               <span key={name} className="text-2xl font-black text-[#111111]">{name}</span>
             ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Section */}
      <WorkflowSection />

      {/* AI Agents & Copilot Section (Unified for landing speed) */}
      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <div>
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#C7F36B] bg-[#111111] px-3 py-1.5 rounded-md inline-block mb-6">AI Agent Orchestration</span>
                <h2 className="text-[48px] lg:text-[64px] font-bold leading-tight text-[#111111] mb-8">
                  Adaptive AI agents for complex operations.
                </h2>
                <p className="text-[18px] text-[#6B7280] leading-relaxed mb-10">
                  Lumen's adaptive agents don't just follow scripts—they reason through complex scenarios, retrieve grounded context, and execute tools within your enterprise stack.
                </p>
                <div className="flex gap-4">
                   <button className="btn-secondary">Explore AI Agents</button>
                   <button className="btn-outline">Calculate ROI</button>
                </div>
             </div>
             
             <div className="card-premium p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C7F36B]/10 blur-[100px] -z-0" />
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center gap-4 p-4 bg-[#F7F8F5] rounded-2xl border border-[#E5E7EB]">
                      <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold">L</div>
                      <div className="flex-1">
                         <p className="text-[13px] font-bold">Lumen Agent Chain-of-Thought</p>
                         <div className="flex gap-1 mt-1">
                            {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-[#22C55E]" />)}
                         </div>
                      </div>
                   </div>
                   
                   <div className="space-y-3 pl-14">
                      {[
                        { text: 'Analyze customer intent...', status: 'complete' },
                        { text: 'Search knowledge base for billing policy...', status: 'complete' },
                        { text: 'Verify subscription status via API...', status: 'processing' },
                        { text: 'Draft empathetic resolution...', status: 'pending' },
                      ].map((step, i) => (
                        <div key={i} className={`flex items-center gap-3 text-[14px] ${step.status === 'pending' ? 'text-[#9CA3AF]' : 'text-[#111111] font-medium'}`}>
                           {step.status === 'complete' ? <Icons.CheckCircle2 size={16} className="text-[#22C55E]" /> : step.status === 'processing' ? <Icons.Loader2 size={16} className="animate-spin text-amber-500" /> : <Icons.Circle size={16} />}
                           {step.text}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
         <div className="max-w-[1200px] mx-auto bg-[#111111] rounded-[48px] p-12 lg:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(#C7F36B 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10">
               <h2 className="text-[40px] lg:text-[64px] font-bold text-white mb-8">Ready to modernize AI customer operations?</h2>
               <div className="flex flex-wrap justify-center gap-6">
                  <Link href="/dashboard" className="px-10 py-5 bg-[#C7F36B] text-[#111111] font-bold rounded-full text-[18px] hover:scale-105 transition-all shadow-2xl shadow-[#C7F36B]/20">
                    Start Free Trial
                  </Link>
                  <button className="px-10 py-5 bg-white/10 text-white font-bold rounded-full text-[18px] hover:bg-white/20 transition-all border border-white/20">
                    Schedule Demo
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-[#E5E7EB] bg-white">
         <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 lg:grid-cols-6 gap-12">
            <div className="lg:col-span-2">
               <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 bg-[#C7F36B] rounded-lg flex items-center justify-center">
                    <Icons.Zap size={18} className="text-[#111111] fill-[#111111]" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">Lumen AI Ops</span>
               </div>
               <p className="text-[#6B7280] text-[14px] max-w-[240px]">
                 Building the next generation of AI-powered enterprise customer operations.
               </p>
            </div>
            
            {['Product', 'Workflow', 'Docs', 'Security'].map(group => (
               <div key={group}>
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-[#111111] mb-6">{group}</h4>
                  <ul className="space-y-4">
                     {[1,2,3,4].map(i => (
                        <li key={i}><Link href="#" className="text-[14px] text-[#6B7280] hover:text-[#111111] transition-colors">{group} Link {i}</Link></li>
                     ))}
                  </ul>
               </div>
            ))}
         </div>
         <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-[#E5E7EB] flex flex-wrap justify-between gap-6 text-[#6B7280] text-[13px]">
            <p>© 2026 Lumen AI. All rights reserved.</p>
            <div className="flex gap-8">
               <Link href="#">Terms</Link>
               <Link href="#">Privacy</Link>
               <Link href="#">Cookie Policy</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
