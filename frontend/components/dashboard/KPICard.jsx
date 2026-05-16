import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '../ui/Card';

const KPICard = ({ label, value, trend, icon: IconComponent, className }) => {
  const isPositive = trend?.startsWith('+');

  return (
    <Card className={cn('', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          {trend && (
            <p className={cn('text-sm font-medium mt-2 flex items-center gap-1', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {trend}
            </p>
          )}
        </div>
        {IconComponent && (
          <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <IconComponent size={24} className="text-accent-primary" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;
