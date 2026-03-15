import { motion } from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';
import { MOCK_SYSTEM_STATS, MOCK_DEVICES } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Activity, Globe, AlertCircle, Zap } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <motion.div 
      variants={systemBootContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 h-full"
    >
      {/* Section 1: Quick System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={systemBootItem}>
          <Card className="flex flex-row items-center gap-4 border-l-4 border-l-jarvis-blue">
            <div className="p-2 bg-jarvis-blue/10 rounded-lg text-jarvis-blue">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary-txt">Network</p>
              <h3 className="text-xl font-mono font-bold">{MOCK_SYSTEM_STATS.networkStatus}</h3>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={systemBootItem}>
          <Card className="flex flex-row items-center gap-4 border-l-4 border-l-success-green">
            <div className="p-2 bg-success-green/10 rounded-lg text-success-green">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary-txt">Devices Status</p>
              <h3 className="text-xl font-mono font-bold">
                {MOCK_SYSTEM_STATS.onlineDevices} 
                <span className="text-xs text-secondary-txt ml-1">/ {MOCK_SYSTEM_STATS.totalDevices} Online</span>
              </h3>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={systemBootItem}>
          <Card className="flex flex-row items-center gap-4 border-l-4 border-l-primary-txt">
            <div className="p-2 bg-white/5 rounded-lg text-primary-txt">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary-txt">Active Automations</p>
              <h3 className="text-xl font-mono font-bold">{MOCK_SYSTEM_STATS.activeAutomations}</h3>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={systemBootItem}>
          <Card className="flex flex-row items-center gap-4 border-l-4 border-l-error-red">
            <div className="p-2 bg-error-red/10 rounded-lg text-error-red">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary-txt">System Alerts</p>
              <h3 className="text-xl font-mono font-bold">0</h3>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Section 2: Fleet Overview Table */}
      <motion.div variants={systemBootItem} className="flex-1">
        <Card title="Fleet Status Overview" className="h-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="text-secondary-txt border-b border-surface-3">
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-wider">Device Name</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-wider text-center">CPU</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-wider text-center">RAM</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-wider text-center">Storage</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-wider text-right">Net Traffic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {MOCK_DEVICES.map((device) => (
                  <tr key={device.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-success-green shadow-[0_0_8px_#00FF66]' : 'bg-secondary-txt'}`} />
                      <span className="text-primary-txt font-bold">{device.name}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={device.cpu > 80 ? "text-error-red" : "text-secondary-txt"}>{device.cpu}%</span>
                    </td>
                    <td className="py-4 text-center text-secondary-txt">{device.ram}%</td>
                    <td className="py-4 text-center text-secondary-txt">{device.storage}%</td>
                    <td className="py-4 text-right text-jarvis-blue font-bold">{device.network}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};