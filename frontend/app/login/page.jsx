'use client';

import * as Icons from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl p-10 lg:p-12"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-12 h-12 bg-[#111111] rounded-2xl flex items-center justify-center mb-6">
            <Icons.Zap size={24} className="text-[#C7F36B] fill-[#C7F36B]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#111111]">Welcome to Lumen</h1>
          <p className="text-[14px] text-[#6B7280] mt-2 font-medium">Log in to your enterprise AI operations account.</p>
        </div>

        <div className="space-y-4 mb-8">
           <button className="w-full py-3.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-3">
              <Icons.Github size={20} /> Continue with GitHub
           </button>
           <button className="w-full py-3.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] font-bold text-[#111111] hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-3">
              <Icons.Cloud size={20} className="text-blue-600" /> Continue with Google
           </button>
        </div>

        <div className="relative mb-8">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F3F4F6]" /></div>
           <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]"><span className="bg-white px-4">Or continue with email</span></div>
        </div>

        <form className="space-y-4">
           <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block ml-1">Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                className="w-full px-5 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-[#C7F36B]/10 focus:border-[#C7F36B] transition-all"
              />
           </div>
           <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block ml-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-5 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:ring-4 focus:ring-[#C7F36B]/10 focus:border-[#C7F36B] transition-all"
              />
           </div>
           <Link href="/dashboard" className="w-full py-4 bg-[#111111] text-white rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-xl shadow-[#111111]/10 mt-6 block text-center">
              Sign In
           </Link>
        </form>

        <div className="mt-10 pt-8 border-t border-[#F3F4F6] text-center">
           <p className="text-[13px] text-[#6B7280]">Don't have an account? <Link href="#" className="font-bold text-[#111111] underline">Contact Sales</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
