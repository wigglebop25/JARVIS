import { useState } from 'react';
import { motion } from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';
import { MOCK_ROUTINES } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Clock, 
  Terminal, 
  Server, 
  Play, 
  Edit2, 
  Trash2,
  Power,
  Loader2
} from 'lucide-react';
import { RoutineData } from '@/types';


export const AutomationPage = () => {
  const [routines, setRoutines] = useState(MOCK_ROUTINES);
  const [executingRoutines, setExecutingRoutines] = useState<Record<string, boolean>>({});
  const [executionLogs, setExecutionLogs] = useState<Record<string, string[]>>({});

  // Helper to render the correct icon based on trigger type
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'time': return <Clock size={18} />;
      case 'command': return <Terminal size={18} />;
      case 'device': return <Server size={18} />;
      default: return <Power size={18} />;
    }
  };

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const handleInitializeRoutine = () => {
    const templates: Omit<RoutineData, 'id'>[] = [
      {
        name: 'Database Backup Sync',
        triggerType: 'time',
        triggerValue: '02:00 AM',
        actionTarget: 'Offsite Storage',
        actionType: 'Rsync Backup',
        isActive: true,
      },
      {
        name: 'AI Agent Memory Consolidation',
        triggerType: 'command',
        triggerValue: 'memory_consolidate',
        actionTarget: 'Vector Store',
        actionType: 'Optimize Indices',
        isActive: true,
      },
      {
        name: 'Intrusion Detection Sweep',
        triggerType: 'device',
        triggerValue: 'Perimeter Breach',
        actionTarget: 'Security Cluster',
        actionType: 'Lock Access Points',
        isActive: false,
      }
    ];
    const template = templates[routines.length % templates.length];
    const newRoutine: RoutineData = {
      id: 'rt-' + (Date.now()),
      ...template
    };
    setRoutines(prev => [...prev, newRoutine]);
  };

  const forceExecute = (id: string, name: string, isActive: boolean) => {
    if (executingRoutines[id]) return;

    setExecutingRoutines(prev => ({ ...prev, [id]: true }));
    
    // Choose logs based on the routine ID or name
    let logsSeq: string[] = [];
    if (name.includes('Boot')) {
      logsSeq = [
        `[INIT] Booting Living Room Hub via WOL...`,
        `[INFO] Target MAC: 3C:A6:2F:88:B2:A1`,
        `[COMM] Sending Wake-On-LAN magic packet...`,
        `[PIND] Awaiting network response...`,
        `[PIND] Ping success (192.168.1.105): 4ms`,
        `[DONE] WOL Boot sequence complete.`
      ];
    } else if (name.includes('Throttle')) {
      logsSeq = [
        `[INIT] CPU temperature threshold exceeded.`,
        `[DIAG] Main Server CPU Core: 87°C`,
        `[COMM] Dispatching fan duty cycle -> 100%`,
        `[PHYS] Fan speed sync: 4500 RPM`,
        `[DIAG] Core temp stabilized: 71°C`,
        `[DONE] Thermal throttle guard complete.`
      ];
    } else if (name.includes('Lockdown')) {
      logsSeq = [
        `[WARN] EMERGENCY LOCKDOWN TRIGGERED!`,
        `[COMM] Halting non-essential telemetry...`,
        `[COMM] Revoking active SSH & API keys...`,
        `[PHYS] Enforcing software air-gap...`,
        `[DIAG] Status: All ports isolated.`,
        `[DONE] Air-gap lockdown sequence secure.`
      ];
    } else {
      logsSeq = [
        `[INIT] Spawning process group for "${name}"`,
        `[INFO] Target node: ${routines.find(r => r.id === id)?.actionTarget}`,
        `[COMM] Handshake established. Running action...`,
        `[DIAG] Return code: 0x00 (SUCCESS)`,
        `[DONE] Task execution complete.`
      ];
    }

    if (!isActive) {
      logsSeq.unshift(`[WARN] Routine is inactive. Overriding for manual trigger.`);
    }

    // Print logs progressively
    setExecutionLogs(prev => ({ ...prev, [id]: [] }));
    
    logsSeq.forEach((log, index) => {
      setTimeout(() => {
        setExecutionLogs(prev => ({
          ...prev,
          [id]: [...(prev[id] || []), log]
        }));
      }, index * 450);
    });

    // End execution after sequence completes
    setTimeout(() => {
      setExecutingRoutines(prev => ({ ...prev, [id]: false }));
    }, logsSeq.length * 450 + 200);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* Header Info & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary-txt tracking-tighter">
            ROUTINE_PROTOCOLS
          </h1>
          <p className="text-secondary-txt font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-theme-accent shadow-[0_0_8px_var(--theme-accent)] animate-pulse" />
            {routines.filter(r => r.isActive).length} Active Nodes
          </p>
        </div>
        
        <Button variant="primary" size="sm" onClick={handleInitializeRoutine}>
          <Plus size={14} /> Initialize Routine
        </Button>
      </div>

      {/* Routine Grid */}
      <motion.div 
        variants={systemBootContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {routines.map((routine) => (
          <motion.div key={routine.id} variants={systemBootItem}>
            <Card className="group flex flex-col h-full relative overflow-visible" glow={routine.isActive}>
              
              {/* HUD Corner Accents (Top Left & Bottom Right) */}
              <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-theme-accent/50 rounded-tl-lg pointer-events-none" />
              <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-theme-accent/50 rounded-br-lg pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 z-10 relative">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-sm ${routine.isActive ? 'bg-theme-accent shadow-[0_0_8px_var(--theme-accent)]' : 'bg-surface-3'}`} />
                  <div>
                    <h3 className="text-primary-txt font-mono font-bold tracking-wide">
                      {routine.name}
                    </h3>
                    {/* Decorative Hex Code String */}
                    <p className="text-[8px] text-surface-3 font-mono tracking-widest uppercase">
                      SYS.DEF.0x{routine.id.substring(routine.id.length - 4)}
                    </p>
                  </div>
                </div>
                
                {/* Custom Tech Toggle Switch */}
                <button 
                  onClick={() => toggleRoutine(routine.id)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 border cursor-pointer ${routine.isActive ? 'bg-theme-accent/20 border-theme-accent/50' : 'bg-surface-3/30 border-surface-3'}`}
                >
                  <motion.div 
                    initial={false}
                    animate={{ x: routine.isActive ? 20 : 2 }}
                    className={`w-4 h-4 rounded-full absolute top-0.5 shadow-lg ${routine.isActive ? 'bg-theme-accent shadow-[0_0_10px_var(--theme-accent)]' : 'bg-secondary-txt'}`}
                  />
                </button>
              </div>

              {/* UPGRADED VISUAL FLOW REPRESENTATION / EXECUTION TERMINAL */}
              {executingRoutines[routine.id] || executionLogs[routine.id] ? (
                <div className="flex-1 flex flex-col font-mono text-[10px] text-theme-accent bg-black/60 p-4 rounded-lg border border-theme-accent/30 mb-6 h-28 overflow-y-auto relative custom-scrollbar">
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-theme-accent/60">
                    {executingRoutines[routine.id] ? (
                      <>
                        <Loader2 size={8} className="animate-spin" />
                        Executing
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
                        Completed
                      </>
                    )}
                  </div>
                  <div className="space-y-1 select-none pr-12">
                    {executionLogs[routine.id]?.map((log, i) => (
                      <div key={i} className="leading-relaxed break-all">
                        {log}
                      </div>
                    ))}
                    {executingRoutines[routine.id] && (
                      <motion.span 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1.5 h-3 bg-theme-accent ml-0.5"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-stretch relative bg-surface-2/40 backdrop-blur-md p-4 rounded-lg border border-surface-3 mb-6 overflow-hidden group-hover:border-surface-3/80 transition-all">
                  
                  {/* Decorative Tech Grid Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  {/* 1. Trigger Block */}
                  <div className="flex flex-col items-center justify-center text-center w-24 shrink-0 relative z-10">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 border backdrop-blur-md transition-all duration-500
                      ${routine.triggerType === 'time' ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.1)]' : 
                        routine.triggerType === 'device' ? 'bg-error-red/10 text-error-red border-error-red/30 shadow-[0_0_15px_rgba(255,51,51,0.1)]' : 
                        'bg-success-green/10 text-success-green border-success-green/30 shadow-[0_0_15px_rgba(0,255,102,0.1)]'}
                    `}>
                      {getTriggerIcon(routine.triggerType)}
                    </div>
                    <span className="text-[9px] font-mono text-secondary-txt uppercase tracking-widest">{routine.triggerType}</span>
                    <span className="text-xs font-bold text-primary-txt mt-1 line-clamp-1" title={routine.triggerValue}>
                      {routine.triggerValue}
                    </span>
                  </div>

                  {/* 2. The Animated Circuit Connector */}
                  <div className="flex-1 relative h-full min-w-[60px] mx-2">
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      {/* Background static dashed line */}
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                      
                      {/* Animated glowing energy pulse (Only visible if active) */}
                      {routine.isActive && (
                        <motion.line 
                          x1="0" y1="50%" x2="100%" y2="50%" 
                          stroke="var(--theme-accent)"
                          strokeWidth="2"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          strokeDasharray="15 85"
                          className="drop-shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.8)]"
                        />
                      )}
                    </svg>
                  </div>

                  {/* 3. Action Block */}
                  <div className="flex flex-col items-center justify-center text-center w-24 shrink-0 relative z-10">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 border backdrop-blur-md transition-all duration-500
                      ${routine.isActive ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/50 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.2)]' : 'bg-surface-1 text-primary-txt border-surface-3'}
                    `}>
                      <Power size={20} />
                    </div>
                    <span className="text-[9px] font-mono text-secondary-txt uppercase tracking-widest line-clamp-1" title={routine.actionTarget}>
                      {routine.actionTarget}
                    </span>
                    <span className="text-xs font-bold text-primary-txt mt-1 line-clamp-1" title={routine.actionType}>
                      {routine.actionType}
                    </span>
                  </div>

                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-3 mt-auto relative z-10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => forceExecute(routine.id, routine.name, routine.isActive)}
                  disabled={executingRoutines[routine.id]}
                  className="text-theme-accent hover:text-theme-accent hover:bg-theme-accent/10 disabled:opacity-50 cursor-pointer"
                >
                  {executingRoutines[routine.id] ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> RUNNING...
                    </>
                  ) : (
                    <>
                      <Play size={14} /> FORCE_EXECUTE
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="px-2 border border-surface-3 hover:border-theme-accent cursor-pointer">
                    <Edit2 size={12} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteRoutine(routine.id)}
                    className="px-2 border border-surface-3 text-error-red hover:text-white hover:bg-error-red hover:border-error-red cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};