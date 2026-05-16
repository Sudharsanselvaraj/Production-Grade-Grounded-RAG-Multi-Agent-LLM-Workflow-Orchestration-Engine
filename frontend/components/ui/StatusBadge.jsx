import { cn } from '@/lib/cn';

const StatusBadge = ({ status, className }) => {
  const getStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'success':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'needs_review':
      case 'pending':
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
      case 'error':
      case 'critical':
      case 'negative':
      case 'frustrated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'in_progress':
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'open':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit',
      getStyles(status),
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', 
        status === 'resolved' || status === 'success' ? 'bg-emerald-500' :
        status === 'needs_review' ? 'bg-amber-500' :
        status === 'failed' || status === 'critical' ? 'bg-rose-500' :
        'bg-slate-400'
      )} />
      {status?.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
