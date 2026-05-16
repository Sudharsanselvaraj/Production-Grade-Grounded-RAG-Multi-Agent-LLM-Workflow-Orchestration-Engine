'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="pt-24 pb-32 px-6 overflow-hidden">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div className="max-w-[640px]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-[56px] lg:text-[72px] font-bold leading-[1.05] tracking-tight text-[#111111] mb-8">
              AI-Powered Customer Operations Built for Modern Support Teams
            </h1>
            <p className="text-[20px] text-[#6B7280] leading-relaxed mb-10 max-w-[540px]">
              Automate triage, grounded retrieval, intelligent routing, and human-reviewed AI workflows with full observability and evaluation.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/dashboard" className="px-8 py-4 bg-[#C7F36B] text-[#111111] text-[16px] font-bold rounded-full hover:opacity-90 transition-all shadow-xl shadow-[#C7F36B]/20">
                Start Free Trial
              </Link>
              <button className="px-8 py-4 bg-white border border-[#E5E7EB] text-[#111111] text-[16px] font-bold rounded-full hover:bg-[#F9FAFB] transition-all">
                View Demo
              </button>
            </div>

            <div className="flex items-center gap-3 text-[#6B7280] text-[14px] font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#E5E7EB]" />
                ))}
              </div>
              <span>Trusted by AI-first support organizations</span>
            </div>
          </motion.div>
        </div>

        {/* Right Illustration: AI Orchestration */}
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl p-8 min-h-[500px] flex flex-col justify-center gap-6"
          >
            {/* Orchestration Node 1 */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xl flex items-center gap-4 z-10"
            >
              <div className="w-10 h-10 bg-[#C7F36B]/20 rounded-xl flex items-center justify-center">
                <Icons.Brain size={20} className="text-[#111111]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#111111]">AI Intent Detection</p>
                <p className="text-[10px] text-[#6B7280]">Billing Query • 98% Conf.</p>
              </div>
            </motion.div>

            {/* Main Workflow Visualization */}
            <div className="space-y-4">
              {[
                { label: 'Retrieve Context', icon: 'Search', status: 'success', delay: 0.1 },
                { label: 'Evaluate Grounding', icon: 'CheckCircle', status: 'success', delay: 0.3 },
                { label: 'Generate Resolution', icon: 'Cpu', status: 'processing', delay: 0.5 },
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + step.delay }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.status === 'success' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#C7F36B]/20 text-[#111111]'}`}>
                    {Icons[step.icon] && <Icons[step.icon] size={16} />}
                  </div>
                  <span className="text-[14px] font-bold text-[#111111]">{step.label}</span>
                  {step.status === 'success' && <Icons.Check size={14} className="ml-auto text-[#22C55E]" />}
                  {step.status === 'processing' && <div className="ml-auto w-4 h-4 rounded-full border-2 border-[#C7F36B] border-t-transparent animate-spin" />}
                </motion.div>
              ))}
            </div>

            {/* AI Reasoning Bubble */}
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 bg-[#111111] text-white rounded-2xl p-5 shadow-2xl max-w-[280px]"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#C7F36B] mb-2">AI Reasoning</p>
              <p className="text-[13px] leading-relaxed text-[#D1D5DB]">
                "Detected refund request for Invoice #492. Cross-referencing eligibility... Grounding verified in Knowledge Base."
              </p>
            </motion.div>

            {/* Connection Lines (Simulated) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
               <path d="M100,100 Q200,150 300,100" stroke="#111111" strokeWidth="2" fill="none" strokeDasharray="4 4" />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
