import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Play, Edit2, Trash2, Loader2 } from 'lucide-react';
import { RoutineData } from '@/types';
import { TriggerBlock } from './TriggerBlock';
import { ActionBlock } from './ActionBlock';
import { ExecutionLog } from './ExecutionLog';

interface RoutineCardProps {
  routine: RoutineData;
  isExecuting: boolean;
  executionLogs: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string, name: string, isActive: boolean) => void;
}

export const RoutineCard = ({ routine, isExecuting, executionLogs, onToggle, onDelete, onExecute }: RoutineCardProps) => {
  const showLog = isExecuting || (executionLogs && executionLogs.length > 0);

  return (
    <motion.div>
      <Card className="group flex flex-col h-full relative overflow-visible" glow={routine.isActive}>
        
        {/* HUD Corner Accents */}
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
              <p className="text-[8px] text-surface-3 font-mono tracking-widest uppercase">
                SYS.DEF.0x{routine.id.substring(routine.id.length - 4)}
              </p>
            </div>
          </div>
          
          {/* Custom Tech Toggle Switch */}
          <button 
            onClick={() => onToggle(routine.id)}
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
        {showLog ? (
          <ExecutionLog logs={executionLogs} isExecuting={isExecuting} />
        ) : (
          <div className="flex-1 flex items-stretch relative bg-surface-2/40 backdrop-blur-md p-4 rounded-lg border border-surface-3 mb-6 overflow-hidden group-hover:border-surface-3/80 transition-all">
            
            {/* Decorative Tech Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* 1. Trigger Block */}
            <TriggerBlock triggerType={routine.triggerType} triggerValue={routine.triggerValue} />

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
            <ActionBlock actionTarget={routine.actionTarget} actionType={routine.actionType} isActive={routine.isActive} />

          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-3 mt-auto relative z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onExecute(routine.id, routine.name, routine.isActive)}
            disabled={isExecuting}
            className="text-theme-accent hover:text-theme-accent hover:bg-theme-accent/10 disabled:opacity-50 cursor-pointer"
          >
            {isExecuting ? (
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
              onClick={() => onDelete(routine.id)}
              className="px-2 border border-surface-3 text-error-red hover:text-white hover:bg-error-red hover:border-error-red cursor-pointer"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

      </Card>
    </motion.div>
  );
};
