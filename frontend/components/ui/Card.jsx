import { cn } from '@/lib/cn';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-6', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('border-b border-slate-200 pb-4 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-bold text-slate-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-slate-500 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('border-t border-slate-200 pt-4 mt-4 flex gap-3', className)} {...props}>
    {children}
  </div>
);
