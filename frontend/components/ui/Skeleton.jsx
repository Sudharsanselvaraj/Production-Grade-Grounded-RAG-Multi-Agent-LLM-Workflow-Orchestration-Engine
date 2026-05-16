import { cn } from '@/lib/cn';

const Skeleton = ({ className, ...props }) => (
  <div
    className={cn('bg-slate-200 rounded-lg animate-pulse', className)}
    {...props}
  />
);

export default Skeleton;
