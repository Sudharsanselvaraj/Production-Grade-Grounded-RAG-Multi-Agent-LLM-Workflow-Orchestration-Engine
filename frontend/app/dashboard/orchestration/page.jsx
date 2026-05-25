import Link from 'next/link';

const steps = [
	{ name: 'Ingress', status: 'Done', detail: 'Ticket lands in queue' },
	{ name: 'Classify', status: 'Done', detail: 'Intent and sentiment inferred' },
	{ name: 'Retrieve', status: 'Done', detail: 'Knowledge chunks selected' },
	{ name: 'Draft', status: 'Done', detail: 'Grounded response assembled' },
	{ name: 'Review', status: 'Manual', detail: 'Human approval when needed' },
];

const OrchestrationPage = () => {
	return (
		<div className="space-y-10">
			<div>
				<h1 className="text-[32px] font-bold tracking-tight text-[#111111]">Orchestration</h1>
				<p className="text-[#6B7280] text-[16px] mt-1">View the end-to-end workflow that powers each support decision.</p>
			</div>

			<div className="bg-white p-8 rounded-[32px] border border-[#E5E7EB] shadow-sm">
				<div className="grid md:grid-cols-5 gap-4">
					{steps.map((step) => (
						<div key={step.name} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
							<p className="text-[12px] font-black uppercase tracking-widest text-[#9CA3AF]">{step.status}</p>
							<h3 className="mt-2 text-[16px] font-bold text-[#111111]">{step.name}</h3>
							<p className="mt-1 text-[13px] text-[#6B7280]">{step.detail}</p>
						</div>
					))}
				</div>
				<div className="mt-8 flex gap-3">
					<Link href="/dashboard/tickets" className="px-4 py-2 rounded-xl bg-[#C7F36B] text-[#111111] text-[14px] font-bold">Open Queue</Link>
					<Link href="/dashboard/traces" className="px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111111] text-[14px] font-bold">Inspect Traces</Link>
				</div>
			</div>
		</div>
	);
};

export default OrchestrationPage;
