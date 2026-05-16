'use client';

import * as Icons from 'lucide-react';

const Topbar = () => {
  return (
    <div className="h-20 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Icons.Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#111111] transition-colors" />
          <input
            type="text"
            placeholder="Search operations, traces, or tickets... (⌘K)"
            className="w-full pl-12 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#C7F36B]/10 focus:border-[#C7F36B] transition-all"
          />
        </div>
      </div>

      {/* Right Section: Status & Notifications */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 pr-6 border-r border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[12px] font-bold text-[#111111]">System Healthy</span>
          </div>
          <div className="text-[12px] font-medium text-[#6B7280]">
            Latency: <span className="text-[#111111] font-bold">124ms</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] rounded-xl transition-all relative">
            <Icons.Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <button className="p-2.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] rounded-xl transition-all">
            <Icons.Layers size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
