import { cn } from '@/lib/cn';

export const Tabs = ({ children, className }) => (
  <div className={cn('', className)}>
    {children}
  </div>
);

export const TabsList = ({ children, className }) => (
  <div className={cn('flex border-b border-slate-200 gap-0', className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ children, active, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-3 text-sm font-medium relative',
      'border-b-2 transition-all duration-200',
      active
        ? 'border-accent-primary text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    )}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, active, className }) => (
  <div className={cn(active ? 'block' : 'hidden', className)}>
    {children}
  </div>
);
