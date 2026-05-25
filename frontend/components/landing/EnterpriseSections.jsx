'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { backendGet, backendPost } from '@/lib/backend';

const enterpriseBlocks = [
  {
    id: 'ops',
    eyebrow: 'Measurement and insights',
    title: 'Fuel faster, higher quality resolutions',
    description: 'Track performance across the AI stack with evaluation, latency, and groundedness panels that match how enterprise support teams work.',
    items: [
      { title: 'AI-powered analytics', copy: 'Operational dashboards with resolution, cost, and quality trends.', icon: 'BarChart3' },
      { title: 'Grounded evaluation', copy: 'Judge scoring and release gates for every prompt or model change.', icon: 'CheckCircle2' },
      { title: 'Hallucination detection', copy: 'Measure ungrounded outputs before they hit customers.', icon: 'ShieldAlert' },
      { title: 'Latency tracking', copy: 'Spot bottlenecks in retrieval, reasoning, or tool usage.', icon: 'TimerReset' },
    ],
  },
  {
    id: 'agents',
    eyebrow: 'AI agents',
    title: 'Automate customer operations with adaptive AI agents',
    description: 'Show a live orchestration chain from ticket ingestion through retrieval, reasoning, tool use, and review.',
    items: [
      { title: 'Ticket ingestion', copy: 'Structured intake from support, email, or chat sources.', icon: 'Inbox' },
      { title: 'Reasoning chain', copy: 'Agent steps with model labels and token usage.', icon: 'Workflow' },
      { title: 'Action execution', copy: 'Safe actions with citations and approval gates.', icon: 'SquareCheckBig' },
      { title: 'Escalation handoff', copy: 'Human review when confidence or risk crosses thresholds.', icon: 'UserRoundSearch' },
    ],
  },
  {
    id: 'copilot',
    eyebrow: 'Copilot',
    title: 'Let AI assist operators with context-rich recommendations',
    description: 'Merge suggested responses, contextual evidence, and action buttons into a single working surface.',
    items: [
      { title: 'Suggested response', copy: 'Drafts grounded in internal policy and ticket history.', icon: 'PenTool' },
      { title: 'Context awareness', copy: 'Surface the customer timeline, SLAs, and prior actions.', icon: 'MessagesSquare' },
      { title: 'Human escalation', copy: 'Route to review with one click when uncertainty is high.', icon: 'ArrowRightLeft' },
      { title: 'Smart recommendations', copy: 'Next-best actions for credits, routing, and follow-ups.', icon: 'Sparkles' },
    ],
  },
  {
    id: 'admin',
    eyebrow: 'Admin operations',
    title: 'Govern AI systems with enterprise controls',
    description: 'Operational controls for evaluation policy, workflow alerts, and system-wide governance.',
    items: [
      { title: 'Workflow optimization', copy: 'See bottlenecks across retrieval, drafting, and review.', icon: 'GitBranch' },
      { title: 'Evaluation governance', copy: 'Release gating and score thresholds for prompt versions.', icon: 'BadgeCheck' },
      { title: 'AI monitoring', copy: 'Track drift, failures, and latency spikes in one place.', icon: 'Radar' },
      { title: 'Security & compliance', copy: 'PII masking, audit logs, and access control indicators.', icon: 'ShieldCheck' },
    ],
  },
  {
    id: 'security',
    eyebrow: 'Security & governance',
    title: 'Enterprise-grade security built to scale',
    description: 'Audit logs, permissions, approval chains, and trace history make the AI system trustworthy enough for enterprise support.',
    items: [
      { title: 'Audit logs', copy: 'Every approval, rollback, and prompt revision is recorded.', icon: 'ScrollText' },
      { title: 'Role permissions', copy: 'Team lead, agent, and admin roles with cookie-backed auth.', icon: 'Users' },
      { title: 'Approval chains', copy: 'Require human sign-off for risky responses or refunds.', icon: 'Workflow' },
      { title: 'Compliance status', copy: 'SOC2-style controls, trace retention, and redaction.', icon: 'LockKeyhole' },
    ],
  },
];

const SectionPreview = ({ sectionId, activeIndex, feedItems, promptItem }) => {
  if (sectionId === 'ops') {
    return (
      <div className="grid gap-4">
        <div className="rounded-[28px] bg-white p-6 text-[#111111] shadow-2xl border border-[#E5E7EB]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Operational dashboard</p>
              <h4 className="mt-2 text-[18px] font-bold">Real-time analytics</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#6B7280] font-black uppercase">Latency</p>
              <p className="text-[26px] font-black">124ms</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ['Resolved', '84.2%'],
              ['Grounded', '98.8%'],
              ['Overrides', '12.1%'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] p-3">
                <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest">{label}</p>
                <p className="mt-2 text-[18px] font-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] bg-white border border-[#E5E7EB] p-5 shadow-xl">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Evaluation report</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {['A', 'B', 'C', 'D'].map((cell, index) => (
              <div key={cell} className={`h-14 rounded-2xl ${index === activeIndex % 4 ? 'bg-[#C7F36B]' : 'bg-[#F3F4F6]'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sectionId === 'agents') {
    return (
      <div className="space-y-4">
        {[
          { label: 'Ticket ingested', detail: 'Billing issue from Zendesk', tone: 'bg-white' },
          { label: 'Retrieve context', detail: 'Refund policy and billing history', tone: 'bg-[#F9FAFB]' },
          { label: 'Reason and draft', detail: 'Response grounded with citations', tone: 'bg-[#111111] text-white' },
        ].map((card, index) => (
          <div key={card.label} className={`rounded-[24px] border border-[#E5E7EB] p-5 shadow-lg ${card.tone} ${index === 2 ? 'border-[#111111]' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-widest ${index === 2 ? 'text-[#C7F36B]' : 'text-[#9CA3AF]'}`}>{card.label}</p>
                <p className={`mt-1 text-[14px] font-medium ${index === 2 ? 'text-slate-200' : 'text-[#6B7280]'}`}>{card.detail}</p>
              </div>
              <span className={`h-8 w-8 rounded-full flex items-center justify-center font-black ${index === 2 ? 'bg-[#C7F36B] text-[#111111]' : 'bg-[#F3F4F6] text-[#111111]'}`}>{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sectionId === 'copilot') {
    return (
      <div className="rounded-[32px] bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden">
        <div className="border-b border-[#E5E7EB] px-5 py-4 flex items-center justify-between bg-[#F9FAFB]/50">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Operator copilot</p>
            <p className="text-[15px] font-bold text-[#111111]">Suggested response for TKT-2847</p>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Ready</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-[#F7F8F5] border border-[#E5E7EB] p-4 text-[13px] text-[#111827] leading-relaxed">
            Hi Sarah, I reviewed the invoice and confirmed the pro-rated charge. I have a grounded resolution ready with references to the billing policy.
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12px] font-bold">
            <div className="rounded-2xl border border-[#E5E7EB] p-4">Evidence attached<br /><span className="text-[#6B7280] font-medium">2 citations</span></div>
            <div className="rounded-2xl border border-[#E5E7EB] p-4">Recommended action<br /><span className="text-[#6B7280] font-medium">Issue one-time credit</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (sectionId === 'admin') {
    return (
      <div className="space-y-4">
        <div className="rounded-[30px] bg-white p-6 text-[#111111] shadow-2xl border border-[#E5E7EB]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">AI governance alerts</p>
          <div className="mt-4 space-y-3">
            {['Prompt drift detected', 'Latency spike in retrieval', 'Human override above threshold'].map((alert, index) => (
              <div key={alert} className="flex items-center justify-between rounded-2xl bg-[#F7F8F5] px-4 py-3 border border-[#E5E7EB]">
                <span className="text-[13px] font-medium">{alert}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#111111]">{index === activeIndex ? 'Active' : 'Watch'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[30px] bg-white border border-[#E5E7EB] p-5 shadow-xl">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Workflow bottlenecks</p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl bg-[#F7F8F5] p-4"><p className="text-[22px] font-black">18</p><p className="text-[11px] text-[#6B7280]">queued reviews</p></div>
            <div className="flex-1 rounded-2xl bg-[#F7F8F5] p-4"><p className="text-[22px] font-black">4</p><p className="text-[11px] text-[#6B7280]">policy holds</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] bg-white border border-[#E5E7EB] p-6 shadow-xl">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#9CA3AF]">Audit trail</p>
        <div className="mt-4 space-y-3">
          {feedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[#F7F8F5] px-4 py-3 border border-[#E5E7EB]">
              <div>
                <p className="text-[13px] font-bold text-[#111111]">{item.title}</p>
                <p className="text-[11px] text-[#6B7280]">{item.description}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">{item.time || 'now'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[30px] bg-white p-6 text-[#111111] shadow-2xl border border-[#E5E7EB]">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Prompt release</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-bold text-[#111111]">{promptItem.name}</p>
            <p className="text-[11px] text-[#6B7280]">{promptItem.status} • {promptItem.id}</p>
          </div>
          <span className="rounded-full bg-[#C7F36B] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#111111]">{promptItem.author}</span>
        </div>
      </div>
    </div>
  );
};

function SplitSection({ eyebrow, title, description, items, sectionId, previewType, feedItems, promptItem, anchorId }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];
  return (
    <section id={anchorId} className="py-24 px-6 border-t border-[#E5E7EB] bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#111111]">{eyebrow}</p>
          <h2 className="mt-4 text-[40px] lg:text-[56px] font-bold tracking-tight text-[#111111] leading-[1.05]">{title}</h2>
          <p className="mt-5 text-[18px] text-[#6B7280] leading-relaxed">{description}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-4">
            {items.map((item, index) => {
              const Icon = Icons[item.icon];
              const isActive = index === activeIndex;
              return (
                <div
                  key={item.title}
                  onClick={() => setActiveIndex(index)}
                  className={`cursor-pointer rounded-[28px] border-2 px-8 py-7 transition-all ${isActive ? 'bg-[#F7F8F5] border-[#C7F36B]' : 'bg-white border-transparent hover:bg-[#F9FAFB]'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${isActive ? 'bg-[#111111] text-[#C7F36B]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                      {Icon ? <Icon size={20} /> : null}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-[#111111]">{item.title}</h3>
                      <p className="text-[14px] text-[#6B7280] mt-1">{item.copy}</p>
                    </div>
                    <Icons.ChevronDown size={16} className={isActive ? 'rotate-180 text-[#111111]' : 'text-[#9CA3AF]'} />
                  </div>
                  <AnimatePresence>
                    {isActive ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="grid sm:grid-cols-3 gap-3">
                          {['Operational clarity', 'Human trust', 'AI speed'].map((pill, pillIndex) => (
                            <div key={pill} className="rounded-2xl bg-white border border-[#E5E7EB] px-4 py-3 text-[12px] font-bold text-[#111111]">
                              {pillIndex === 0 ? item.title : pill}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="sticky top-24">
              <div className="rounded-[40px] bg-[#F7F8F5] border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(17,17,17,0.08)] min-h-[580px] overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#11111110 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9CA3AF]">Interactive preview</p>
                      <h3 className="text-[24px] font-bold text-[#111111] mt-2">{activeItem.title}</h3>
                    </div>
                    <span className="rounded-full bg-white border border-[#E5E7EB] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#111111]">Live</span>
                  </div>
                  <SectionPreview sectionId={sectionId} activeIndex={activeIndex} feedItems={feedItems} promptItem={promptItem} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EnterpriseSections() {
  const [feedItems, setFeedItems] = useState([
    { id: 1, title: 'Ticket resolved', description: 'AI resolution completed', time: 'now' },
    { id: 2, title: 'Evaluation passed', description: 'Groundedness gate approved', time: 'now' },
  ]);
  const [promptItem, setPromptItem] = useState({ id: 'draft', name: 'Support prompt', status: 'draft', author: 'system' });

  useEffect(() => {
    let mounted = true;
    async function loadPreviewData() {
      try {
        const [feedRes, promptRes] = await Promise.allSettled([
          backendGet('/api/dashboard/feed?limit=3'),
          backendGet('/api/prompts'),
        ]);

        if (!mounted) return;
        if (feedRes.status === 'fulfilled' && feedRes.value?.items?.length) {
          setFeedItems(feedRes.value.items.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            time: item.time ? new Date(item.time).toLocaleTimeString() : 'now',
          })));
        }
        if (promptRes.status === 'fulfilled' && promptRes.value?.prompts?.length) {
          const p = promptRes.value.prompts[0];
          setPromptItem({ id: `v${p.version}`, name: p.name, status: p.status, author: p.author });
        }
      } catch {
        // Keep fallback preview cards on public landing if API is not authenticated.
      }
    }
    loadPreviewData();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleBookDemo() {
    try {
      await backendPost('/api/landing/demo', { email: 'demo@interest.local', name: 'Website Lead', company: 'Unknown' });
    } catch {
      // Non-blocking for public CTA.
    }
  }

  return (
    <>
      {enterpriseBlocks.map((block) => (
        <SplitSection
          key={block.id}
          sectionId={block.id}
          anchorId={block.id === 'ops' ? 'evaluation' : block.id === 'admin' ? 'observability' : block.id === 'security' ? 'integrations' : undefined}
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
          items={block.items}
          previewType={block.id}
          feedItems={feedItems}
          promptItem={promptItem}
        />
      ))}

      <section id="pricing" className="py-24 px-6 bg-white text-[#111111] border-t border-[#E5E7EB]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 rounded-[36px] border border-[#E5E7EB] bg-[#F7F8F5] p-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#6B7280]">Ready to modernize AI customer operations?</p>
            <h2 className="mt-4 text-[40px] lg:text-[56px] font-bold tracking-tight leading-[1.05]">Built for internal support teams that need trust, speed, and operational control.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="px-6 py-3 rounded-full bg-[#C7F36B] text-[#111111] font-bold">Start Free Trial</Link>
            <button onClick={handleBookDemo} className="px-6 py-3 rounded-full border border-[#E5E7EB] bg-white font-bold">Schedule Demo</button>
          </div>
        </div>
      </section>

      <footer id="resources" className="bg-[#F7F8F5] border-t border-[#E5E7EB] px-6 py-16">
        <div className="max-w-[1400px] mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-[14px]">
          {[
            { title: 'Product', items: ['Overview', 'Queue', 'Review', 'Traces'] },
            { title: 'Workflow', items: ['Routing', 'Retrieval', 'Drafting', 'Evaluation'] },
            { title: 'Docs', items: ['API', 'Playbooks', 'Guides', 'Changelog'] },
            { title: 'Security', items: ['Permissions', 'Audit Logs', 'Compliance', 'Legal'] },
          ].map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9CA3AF] mb-4">{group.title}</p>
              <div className="space-y-3 text-[#6B7280] font-medium">
                {group.items.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </>
  );
}