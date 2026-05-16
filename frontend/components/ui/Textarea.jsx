import { cn } from '@/lib/cn';

const Textarea = ({ className, error, label, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-offset-0',
          'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          error && 'border-accent-danger focus:ring-accent-danger focus:border-accent-danger',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-accent-danger">{error}</p>}
    </div>
  );
};

export default Textarea;
