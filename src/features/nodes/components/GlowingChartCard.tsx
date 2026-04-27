import { Card } from '@/components/ui/Card';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface GlowingChartCardProps {
  title: string;
  value: string;
  subValue: string;
  bottomLeftText: string;
  bottomRightText: string;
  data: any[];
  dataKey: string;
  colorHex: string; // e.g., "#00F0FF"
  gradientId: string; // Needs to be unique per chart so gradients don't mix
}

export const GlowingChartCard = ({
  title,
  value,
  subValue,
  bottomLeftText,
  bottomRightText,
  data,
  dataKey,
  colorHex,
  gradientId
}: GlowingChartCardProps) => {
  return (
    <Card 
      className="h-64 flex flex-col relative overflow-hidden transition-all duration-500"
      style={{ 
        borderColor: `${colorHex}40`, // 40 is hex for 25% opacity
        boxShadow: `inset 0 0 20px ${colorHex}05` // extremely faint inner glow
      }}
    >
      {/* Top Header Section */}
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h3 className="font-mono font-bold text-primary-txt uppercase tracking-wider text-sm">{title}</h3>
          <p className="font-mono text-[10px] text-surface-3 mt-1">{subValue}</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-bold" style={{ color: colorHex }}>{value}</span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="flex-1 -mx-5 mt-4 relative z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            {/* Define the gradient fading down */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorHex} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colorHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            {/* Hide the Y axis but use it to keep the chart from touching the absolute top */}
            <YAxis domain={[0, 100]} hide />
            
            <Area 
              type="monotone" // This makes the line perfectly smooth/wavy
              dataKey={dataKey} 
              stroke={colorHex} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
              // The magic drop-shadow for the neon glow
              style={{ filter: `drop-shadow(0px 4px 8px ${colorHex}80)` }}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Footer Section */}
      <div className="flex justify-between items-end z-10 relative mt-2 border-t border-surface-3/30 pt-2">
        <span className="font-mono text-[10px] text-surface-3">{bottomLeftText}</span>
        <span className="font-mono text-[10px] text-surface-3">{bottomRightText}</span>
      </div>
    </Card>
  );
};