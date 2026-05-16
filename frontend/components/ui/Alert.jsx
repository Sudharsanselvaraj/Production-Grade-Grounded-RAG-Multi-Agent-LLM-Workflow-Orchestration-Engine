import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const alertVariants = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-800',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-800',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    Icon: Info,
  },
};

const Alert = ({ variant = 'info', title, description, onClose, className }) => {
  const config = alertVariants[variant];
  const Icon = config.Icon;

  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', config.bg, config.border, className)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.icon)} />
      <div className="flex-1">
        {title && <p className={cn('font-medium', config.text)}>{title}</p>}
        {description && <p className={cn('text-sm mt-1', config.text)}>{description}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className={cn('text-slate-400 hover:text-slate-600')}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alert;
