'use client';

import * as Icons from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { backendPost } from '@/lib/backend';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('teamlead');
  const [password, setPassword] = useState('lead-demo');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const username = email.trim();
      await backendPost('/api/auth/login', { username, password });
      if (rememberMe) {
        localStorage.setItem('lumen_last_user', username);
      }
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid credentials or session issue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[440px] bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl p-10 lg:p-12">
        <div className="flex flex-col items-center text-center mb-10">
            <div className="w-12 h-12 bg-[#C7F36B] rounded-2xl flex items-center justify-center mb-6">
              <Icons.Zap size={24} className="text-[#111111]" />
            </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#111111]">Welcome to Lumen</h1>
          <p className="text-[14px] text-[#6B7280] mt-2 font-medium">Log in to your enterprise AI operations account.</p>
        </div>

        <div className="space-y-4 mb-8">
          <button type="button" className="w-full py-3.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] font-bold text-[#9CA3AF] flex items-center justify-center gap-3 cursor-not-allowed" title="OAuth setup pending">
            <Icons.Github size={20} /> Continue with GitHub (configure OAuth)
          </button>
          <button type="button" className="w-full py-3.5 bg-white border border-[#E5E7EB] rounded-2xl text-[14px] font-bold text-[#9CA3AF] flex items-center justify-center gap-3 cursor-not-allowed" title="OAuth setup pending">
            <Icons.Cloud size={20} className="text-blue-600" /> Continue with Google (configure OAuth)
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F3F4F6]" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]"><span className="bg-white px-4">Or continue with email/username</span></div>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block ml-1">Email or Username</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="teamlead" className="w-full px-5 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px]" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block ml-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px]" />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>

          {error ? <p className="text-[13px] text-rose-700">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full py-4 bg-[#C7F36B] text-[#111111] rounded-2xl font-bold text-[15px] disabled:opacity-50">
            {loading ? 'Signing in...' : 'Continue to dashboard'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#F3F4F6] text-center">
          <p className="text-[13px] text-[#6B7280]">Need enterprise onboarding? <Link href="/" className="font-bold text-[#111111] underline">Start free trial</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
