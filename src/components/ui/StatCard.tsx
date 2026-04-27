import React from 'react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  borderColorClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

export const StatCard = ({ 
  icon, 
  label, 
  value, 
  subValue, 
  borderColorClass, 
  iconBgClass, 
  iconColorClass 
}: StatCardProps) => {
  return (
    <Card cornerAccents={false} className={`flex flex-row items-center gap-4 border-l-4 ${borderColorClass}`}>
      <div className={`p-2 rounded-lg ${iconBgClass} ${iconColorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-secondary-txt">{label}</p>
        <h3 className="text-xl font-mono font-bold">
          {value} {subValue && <span className="text-xs text-secondary-txt ml-1">{subValue}</span>}
        </h3>
      </div>
    </Card>
  );
};