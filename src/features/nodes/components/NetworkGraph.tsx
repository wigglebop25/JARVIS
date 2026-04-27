import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { MOCK_NETWORK_DATA } from '@/lib/mockData';
import { Activity } from 'lucide-react';

export const NetworkGraph = () => {
  return (
    <Card title="Live Network Traffic (Mbps)" techBg={true} cornerAccents={true} className="h-full min-h-[300px] flex flex-col">
      <div className="flex-1 flex items-end gap-1.5 pt-6 mt-auto">
        {MOCK_NETWORK_DATA.map((val, i) => (
          <div key={i} className="flex-1 flex justify-center group relative h-full items-end">
            {/* Hover Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface-3 text-primary-txt text-[10px] py-1 px-2 rounded transition-opacity whitespace-nowrap z-20">
              {val} Mbps
            </div>
            
            {/* The Animated Bar */}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ duration: 0.8, delay: i * 0.05, type: 'spring' }}
              className={`w-full rounded-t-sm transition-colors duration-300
                ${val > 70 ? 'bg-error-red shadow-[0_0_10px_rgba(255,51,51,0.5)]' : 
                  val > 40 ? 'bg-jarvis-blue shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 
                  'bg-jarvis-blue/40'}
              `}
            />
          </div>
        ))}
      </div>
      
      {/* X-Axis labels */}
      <div className="flex justify-between text-[10px] text-surface-3 font-mono mt-4 border-t border-surface-3 pt-2">
        <span>T-60s</span>
        <span className="flex items-center gap-1 text-jarvis-blue"><Activity size={10} /> LIVE</span>
      </div>
    </Card>
  );
};