import { Card } from '@/components/ui/Card';
import { DevicesData } from '@/types'; 

interface FleetTableProps {
  devices: DevicesData[];
}

export const FleetTable = ({ devices }: FleetTableProps) => {
  return (
    <Card title="Fleet Status Overview" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead>
            {/* BRIGHTENED: Changed text-surface-3 to primary-txt/50 */}
            <tr className="text-primary-txt/50 border-b border-white/10">
              <th className="pb-3 font-bold uppercase text-[13px] tracking-wider">Device Name</th>
              <th className="pb-3 font-bold uppercase text-[13px] tracking-wider text-center">CPU Load</th>
              <th className="pb-3 font-bold uppercase text-[13px] tracking-wider text-center">Memory</th>
              <th className="pb-3 font-bold uppercase text-[13px] tracking-wider text-center">Storage</th>
              <th className="pb-3 font-bold uppercase text-[13px] tracking-wider text-right">Net Traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {devices.map((device) => (
              <tr key={device.id} className="group hover:bg-white/5 transition-colors">
                <td className="py-4 flex items-center gap-3">
                  <div className={`w-2 h-2 ml-2 rounded-full ${device.status === 'online' ? 'bg-success-green shadow-[0_0_8px_#00FF66]' : 'bg-secondary-txt'}`} />
                  <span className="text-primary-txt font-bold tracking-tight">{device.name}</span>
                </td>

                <td className="py-4 px-4 align-middle">
                  <div className="flex flex-col gap-1 w-24 mx-auto">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-primary-txt/60 font-bold uppercase">CPU</span>
                      <span className={device.cpu > 80 ? "text-error-red" : "text-primary-txt"}>{device.cpu}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${device.cpu > 80 ? 'bg-error-red shadow-[0_0_5px_#FF3333]' : 'bg-jarvis-blue'}`} 
                        style={{ width: `${device.cpu}%` }} 
                      />
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 align-middle">
                  <div className="flex flex-col gap-1 w-24 mx-auto">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-primary-txt/60 font-bold uppercase">RAM</span>
                      <span className={device.ram > 80 ? "text-error-red" : "text-primary-txt"}>{device.ram}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${device.ram > 80 ? 'bg-error-red shadow-[0_0_5px_#FF3333]' : 'bg-success-green'}`} 
                        style={{ width: `${device.ram}%` }} 
                      />
                    </div>
                  </div>
                </td>

                <td className="py-4 text-center text-primary-txt/80">{device.storage}%</td>
                <td className="py-4 text-right text-jarvis-blue font-bold pr-3">{device.network}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};