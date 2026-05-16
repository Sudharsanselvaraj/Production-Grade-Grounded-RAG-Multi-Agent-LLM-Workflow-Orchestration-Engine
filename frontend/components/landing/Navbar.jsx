'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';

const Navbar = () => {
  return (
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
          <button className="px-6 py-2.5 bg-[#111111] text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-all">
            Book Demo
          </button>
          <Link href="/dashboard" className="px-6 py-2.5 bg-[#C7F36B] text-[#111111] text-[14px] font-semibold rounded-full hover:opacity-90 transition-all shadow-sm">
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
