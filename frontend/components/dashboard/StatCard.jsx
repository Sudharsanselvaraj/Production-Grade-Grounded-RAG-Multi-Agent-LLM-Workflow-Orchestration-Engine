import { cn } from '@/lib/cn';

const StatCard = ({ title, value, description, className }) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white p-4', className)}>
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
  </div>
);

export default StatCard;
