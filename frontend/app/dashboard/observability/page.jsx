import Link from 'next/link';

const cards = [
	{ title: 'Workflow Traces', href: '/dashboard/traces', detail: 'Inspect span timing and failures.' },
	{ title: 'Evaluations', href: '/dashboard/evaluations', detail: 'Review groundedness and judge metrics.' },
	{ title: 'Analytics', href: '/dashboard/analytics', detail: 'Track quality, latency, and cost.' },
];

const ObservabilityPage = () => {
	return (
		<div className="space-y-10">
			<div>
				<h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Observability</h1>
				<p className="text-[#6B7280] text-[16px] mt-1">A compact hub for traces, evaluations, and operational health.</p>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				{cards.map((card) => (
					<Link key={card.title} href={card.href} className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
						<p className="text-[12px] font-black uppercase tracking-widest text-[#9CA3AF]">Navigate</p>
						<h3 className="mt-3 text-[18px] font-bold text-[#111111]">{card.title}</h3>
						<p className="mt-2 text-[14px] text-[#6B7280]">{card.detail}</p>
					</Link>
				))}
			</div>
		</div>
	);
};

export default ObservabilityPage;
