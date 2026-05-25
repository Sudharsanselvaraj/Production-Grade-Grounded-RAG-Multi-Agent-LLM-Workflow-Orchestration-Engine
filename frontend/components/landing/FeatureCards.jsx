'use client';

import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { FEATURE_CARDS } from '@/lib/constants';

const FeatureCards = () => {
  return (
    <section id="product" className="py-24 px-6 bg-[#F7F8F5]">
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-3xl">
          <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#111111]">Platform capabilities</p>
          <h2 className="mt-4 text-[34px] lg:text-[48px] font-bold tracking-tight text-[#111111] leading-[1.05] max-w-[760px]">
            Proper cards for every part of the AI operations stack.
          </h2>
          <p className="mt-5 text-[17px] text-[#6B7280] leading-relaxed max-w-2xl">
            The homepage should explain the product fast. These cards give each capability a clear visual surface while staying aligned with the project.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FEATURE_CARDS.map((card, index) => {
            const Icon = Icons[card.icon] || Icons.Sparkles;
            const isFeatured = index === 0 || index === 3 || index === 6;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.05 }}
                className={`group rounded-[30px] border bg-white p-7 shadow-[0_16px_48px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] ${isFeatured ? 'border-[#C7F36B]' : 'border-[#E5E7EB]'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isFeatured ? 'bg-[#C7F36B]/20 text-[#111111]' : 'bg-[#F7F8F5] text-[#111111]'}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full bg-[#F7F8F5] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-6 text-[22px] font-bold tracking-tight text-[#111111]">{card.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">{card.description}</p>

                <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-5">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9CA3AF]">Included</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#111111]">Enterprise-ready surface</p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${isFeatured ? 'border-[#C7F36B] bg-[#F7F8F5]' : 'border-[#E5E7EB] bg-white'}`}>
                    <Icons.ArrowUpRight size={16} className="text-[#111111]" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;