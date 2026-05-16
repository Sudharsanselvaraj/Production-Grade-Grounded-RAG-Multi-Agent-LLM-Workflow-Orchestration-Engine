import { cn } from '@/lib/cn';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent-primary text-slate-900 hover:bg-[#98E75F] active:bg-[#8FDC50]',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400',
    outline: 'border border-slate-200 text-slate-900 hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-accent-danger text-white hover:bg-[#E94335] active:bg-[#D93A2F]',
    warning: 'bg-accent-warning text-white hover:bg-[#F59D0C] active:bg-[#D97706]',
    success: 'bg-accent-success text-white hover:bg-[#20C752] active:bg-[#1EA744]',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
