'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const pathname = usePathname();

  const NAV_GROUPS = [
    {
      title: 'Operations',
      items: [
        { id: 'overview', label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard' },
        { id: 'tickets', label: 'Ticket Queue', href: '/dashboard/tickets', icon: 'Inbox' },
        { id: 'human-review', label: 'Human Review', href: '/dashboard/human-review', icon: 'UserCheck' },
      ]
    },
    {
      title: 'Observability',
      items: [
        { id: 'traces', label: 'Workflow Traces', href: '/dashboard/traces', icon: 'GitBranch' },
        { id: 'evaluations', label: 'Evaluations', href: '/dashboard/evaluations', icon: 'BarChart3' },
        { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics', icon: 'Activity' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'prompts', label: 'Prompt Manager', href: '/dashboard/prompts', icon: 'Terminal' },
        { id: 'retrieval', label: 'Retrieval Explorer', href: '/dashboard/retrieval', icon: 'Database' },
        { id: 'orchestration', label: 'Orchestration', href: '/dashboard/orchestration', icon: 'Zap' },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'admin', label: 'Admin Ops', href: '/dashboard/admin', icon: 'Shield' },
        { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
      ]
    }
  ];

  return (
    <div className="w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C7F36B] rounded-xl flex items-center justify-center">
            <Icons.Zap size={18} className="text-[#111111]" />
          </div>
          <div>
            <p className="font-bold text-[#111111] text-[16px] tracking-tight leading-none">Lumen</p>
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mt-1">AI Ops Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-hide pb-10">
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-4 text-[11px] font-black text-[#9CA3AF] uppercase tracking-widest mb-3">{group.title}</h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = Icons[item.icon];
                const isActive = pathname === item.href;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all group relative',
                        isActive
                          ? 'bg-[#F7F8F5] text-[#111111]'
                          : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]'
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="sidebar-active"
                          className="absolute left-0 w-1 h-5 bg-[#C7F36B] rounded-r-full"
                        />
                      )}
                      <Icon size={18} className={cn(isActive ? 'text-[#111111]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]')} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="px-6 py-6 border-t border-[#E5E7EB] bg-[#F9FAFB]/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-[#C7F36B] text-[#111111] flex items-center justify-center font-bold text-[14px]">
            SU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#111111] truncate">Sudharsan</p>
            <p className="text-[11px] text-[#6B7280] font-medium truncate">Principal Operator</p>
          </div>
          <Icons.ChevronRight size={14} className="text-[#9CA3AF]" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
