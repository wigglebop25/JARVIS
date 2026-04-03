import { motion } from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';
import { useSystemData } from '@/hooks/useSystemData'; 
import { FleetTable } from '@/components/dashboard/FleetTable';
import { GlowingChartCard } from '@/components/dashboard/GlowingChartCard';
import { Card } from '@/components/ui/Card';
import { EventLog } from '@/components/dashboard/EventLog';
import { CheckCircle2, Circle, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const { stats, devices, tasks, events, history, isLoading, error } = useSystemData();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-error-red font-mono">
        <AlertTriangle size={48} className="mb-4" />
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-jarvis-blue">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-mono tracking-widest">BOOTING_SYSTEM...</p>
      </div>
    );
  }

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <motion.div 
      variants={systemBootContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 h-full"
    >
      {/* STATUS TRAY */}
      <motion.div variants={systemBootItem} className="flex items-center justify-between py-2 px-4 bg-surface-1/40 backdrop-blur-md border border-white/5 rounded-lg shadow-sm">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2 text-[11px] font-mono text-primary-txt/60 uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-success-green shadow-[0_0_5px_#00FF66] animate-pulse" />
            Network: <span className="text-primary-txt font-bold">{stats.networkStatus}</span>
          </div>
          <div className="text-[11px] font-mono text-primary-txt/60 uppercase">
            Nodes: <span className="text-primary-txt font-bold">{onlineCount} / {devices.length} Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-2/50 border border-white/5 rounded text-[10px] font-mono text-primary-txt/40">
          <AlertCircle size={12} /> 0 SYSTEM ALERTS
        </div>
      </motion.div>

      {/* THE ORIGINAL TRIPLE-COLUMN SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT & CENTER: CHARTS & TABLE (2/3 Width) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={systemBootItem}>
              <GlowingChartCard title="CPU USAGE" value={`${history.cpu[history.cpu.length - 1].value}%`} subValue="Avg Load" bottomLeftText="30min history" bottomRightText="8 cores" data={history.cpu} dataKey="value" colorHex="#3b82f6" gradientId="cpuGradient" />
            </motion.div>
            <motion.div variants={systemBootItem}>
              <GlowingChartCard title="RAM USAGE" value={`${history.ram[history.ram.length - 1].value}%`} subValue="System Memory" bottomLeftText="history" bottomRightText="16GB" data={history.ram} dataKey="value" colorHex="#06b6d4" gradientId="ramGradient" />
            </motion.div>
            <motion.div variants={systemBootItem}>
              <GlowingChartCard title="NET TRAFFIC" value={`${history.net[history.net.length - 1].value} Mbps`} subValue="Live Data Rate" bottomLeftText="10m timeline" bottomRightText="Stable" data={history.net} dataKey="value" colorHex="#d946ef" gradientId="netGradient" />
            </motion.div>
          </div>

          <motion.div variants={systemBootItem} className="flex-1 min-h-[400px]">
            <FleetTable devices={devices} />
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR: TASKS & EVENT LOG (1/3 Width) */}
        <div className="flex flex-col gap-6">
          <motion.div variants={systemBootItem}>
            <Card title={`CORE TASKS (${tasks.filter(t => t.status === 'active').length})`} techBg={true}>
              <div className="flex flex-col gap-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors">
                    {task.status === 'completed' ? <CheckCircle2 size={14} className="text-success-green" /> : <Circle size={14} className="text-jarvis-blue animate-pulse" />}
                    <p className={`text-xs font-mono font-bold ${task.status === 'completed' ? 'text-primary-txt/30 line-through' : 'text-primary-txt'}`}>
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={systemBootItem} className="flex-1 min-h-[300px]">
            <EventLog events={events} />
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};